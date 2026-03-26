import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { reservationsTable, surpriseBagsTable, storesTable, cartReservationsTable } from "@workspace/db/schema";
import { eq, sql } from "drizzle-orm";
import {
  CreatePaymentIntentBody,
  ConfirmPaymentBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

// ─── 手数料定数 ─────────────────────────────────────────────────────────────
// プラットフォーム手数料率: 25%（固定）
const PLATFORM_FEE_RATE = 0.25;
// Stripe 決済手数料率（JPY カード平均 3.6%）※参考値。application_fee には含めない
const STRIPE_FEE_RATE = 0.036;

/**
 * application_fee_amount を計算する。
 *
 * 設計方針（on_behalf_of モデル）:
 *   application_fee_amount = floor(total × 25%)  ← Stripeダッシュボードに表示される値
 *
 * on_behalf_of + transfer_data (Destination Charge) モデルでの資金フロー（例: 600円）:
 *   ユーザー支払い               : 600円
 *   application_fee_amount       : 150円（25%）← プラットフォームが受け取る【純利益】
 *   店舗への送金（gross）         : 450円（75%）← transfer_data で自動送金
 *   Stripe 決済手数料(~3.6%=22円): 店舗（コネクトアカウント）から徴収
 *   店舗受取（net）              : 450 - 22 = 約428円
 *
 * on_behalf_of を指定することで Stripe 手数料は「コネクトアカウント（店舗）」から
 * 徴収されるため、プラットフォームの application_fee は手数料ゼロの純利益になる。
 *
 * Math.floor で端数は店舗有利
 */
function calcFees(totalAmountJpy: number): {
  platformFee: number;
  estimatedStripeFee: number;
  applicationFeeAmount: number;
  storeReceives: number;
} {
  const platformFee          = Math.floor(totalAmountJpy * PLATFORM_FEE_RATE);
  const estimatedStripeFee   = Math.round(totalAmountJpy * STRIPE_FEE_RATE);
  const applicationFeeAmount = platformFee;
  // store gross（Stripe手数料差引前）
  const storeReceives        = totalAmountJpy - applicationFeeAmount;
  return { platformFee, estimatedStripeFee, applicationFeeAmount, storeReceives };
}

/** Stripe Connect エラーかどうか判定 */
function isStripeConnectError(err: any): boolean {
  return (
    err?.code === "transfers_not_allowed" ||
    err?.code === "account_invalid" ||
    err?.code === "on_behalf_of_not_allowed" ||
    err?.code === "account_country_invalid_address" ||
    err?.type === "StripeInvalidRequestError"
  );
}

router.post("/payment/create-intent", async (req, res) => {
  try {
    const body = CreatePaymentIntentBody.parse(req.body);

    const [reservation] = await db
      .select({
        id:            reservationsTable.id,
        totalPrice:    reservationsTable.totalPrice,
        paymentStatus: reservationsTable.paymentStatus,
        bagId:         reservationsTable.bagId,
        storeId:       reservationsTable.storeId,
      })
      .from(reservationsTable)
      .where(eq(reservationsTable.id, body.reservationId));

    if (!reservation) {
      res.status(404).json({ error: "not_found", message: "Reservation not found" });
      return;
    }

    const amountInYen = Math.round(reservation.totalPrice);
    const { platformFee, estimatedStripeFee, applicationFeeAmount, storeReceives } = calcFees(amountInYen);

    const stripeKey = process.env["STRIPE_SECRET_KEY"];

    if (stripeKey) {
      // 店舗の Stripe アカウント ID を取得
      const [store] = await db
        .select({ stripeAccountId: storesTable.stripeAccountId })
        .from(storesTable)
        .where(eq(storesTable.id, reservation.storeId));

      const destinationAccountId = store?.stripeAccountId ?? null;

      try {
        const stripe = await import("stripe").then((m) => new m.default(stripeKey));

        const intentParams: Parameters<typeof stripe.paymentIntents.create>[0] = {
          amount:   amountInYen,
          currency: "jpy",
          metadata: {
            reservationId:      String(reservation.id),
            platformFee:        String(platformFee),
            estimatedStripeFee: String(estimatedStripeFee),
            applicationFee:     String(applicationFeeAmount),
            storeReceives:      String(storeReceives),
            platformFeeRate:    "25",
          },
        };

        let intent;
        let intentMode = "direct";

        if (destinationAccountId) {
          // Tier 1: on_behalf_of → 店舗が Stripe 手数料負担、プラットフォームは純益25%
          try {
            intent = await stripe.paymentIntents.create({
              ...intentParams,
              application_fee_amount: applicationFeeAmount,
              on_behalf_of:           destinationAccountId,
              transfer_data:          { destination: destinationAccountId },
            });
            intentMode = "on_behalf_of";
            console.log(
              `✅ PaymentIntent Tier1 (on_behalf_of): total=${amountInYen}JPY, ` +
              `platformNet=${platformFee}JPY (25%, 純利益), ` +
              `storeGross=${storeReceives}JPY, stripeFee≈${estimatedStripeFee}JPY (店舗負担), ` +
              `dest=${destinationAccountId}`
            );
          } catch (t1Err: any) {
            if (!isStripeConnectError(t1Err)) throw t1Err;
            console.warn(`⚠️  PaymentIntent Tier1 失敗 [${t1Err.code ?? t1Err.type}] — Tier2 へ`);
            // Tier 2: transfer_data のみ（プラットフォームが Stripe 手数料負担）
            try {
              intent = await stripe.paymentIntents.create({
                ...intentParams,
                application_fee_amount: applicationFeeAmount,
                transfer_data:          { destination: destinationAccountId },
              });
              intentMode = "destination_only";
              console.warn(`⚠️  PaymentIntent Tier2 (destination_only): total=${amountInYen}JPY, dest=${destinationAccountId}`);
            } catch (t2Err: any) {
              if (!isStripeConnectError(t2Err)) throw t2Err;
              console.warn(`⚠️  PaymentIntent Tier2 失敗 — 直接決済へ`);
              intent = await stripe.paymentIntents.create(intentParams);
              intentMode = "direct";
            }
          }
        } else {
          intent = await stripe.paymentIntents.create(intentParams);
        }

        await db
          .update(reservationsTable)
          .set({ paymentIntentId: intent.id })
          .where(eq(reservationsTable.id, reservation.id));

        res.json({
          clientSecret:        intent.client_secret,
          paymentIntentId:     intent.id,
          amount:              amountInYen,
          currency:            "jpy",
          platformFee,
          estimatedStripeFee,
          applicationFeeAmount,
          storeReceives,
          chargeMode:          intentMode,
        });
        return;
      } catch (stripeErr) {
        console.error("Stripe PaymentIntent error:", stripeErr);
      }
    }

    // Stripe 未設定時のモックフォールバック
    const mockIntentId = `pi_mock_${Date.now()}`;
    await db
      .update(reservationsTable)
      .set({ paymentIntentId: mockIntentId })
      .where(eq(reservationsTable.id, reservation.id));

    res.json({
      clientSecret:        `${mockIntentId}_secret_mock`,
      paymentIntentId:     mockIntentId,
      amount:              amountInYen,
      currency:            "jpy",
      platformFee,
      estimatedStripeFee,
      applicationFeeAmount,
      storeReceives,
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "bad_request", message: "Failed to create payment intent" });
  }
});

router.post("/payment/confirm", async (req, res) => {
  try {
    const body = ConfirmPaymentBody.parse(req.body);

    const [reservation] = await db
      .select()
      .from(reservationsTable)
      .where(eq(reservationsTable.id, body.reservationId));

    if (!reservation) {
      res.status(404).json({ error: "not_found", message: "Reservation not found" });
      return;
    }

    await db
      .update(reservationsTable)
      .set({
        paymentStatus: "paid",
        status: "confirmed",
        paymentIntentId: body.paymentIntentId,
      })
      .where(eq(reservationsTable.id, body.reservationId));

    // 仮押さえを確定（在庫は戻さない）
    await db
      .update(cartReservationsTable)
      .set({ status: "confirmed" })
      .where(eq(cartReservationsTable.reservationId, body.reservationId))
      .catch(() => {});

    const [updated] = await db
      .select({
        id: reservationsTable.id,
        userId: reservationsTable.userId,
        bagId: reservationsTable.bagId,
        storeId: reservationsTable.storeId,
        quantity: reservationsTable.quantity,
        totalPrice: reservationsTable.totalPrice,
        status: reservationsTable.status,
        paymentIntentId: reservationsTable.paymentIntentId,
        paymentStatus: reservationsTable.paymentStatus,
        pickupCode: reservationsTable.pickupCode,
        createdAt: reservationsTable.createdAt,
      })
      .from(reservationsTable)
      .where(eq(reservationsTable.id, body.reservationId));

    res.json({
      ...updated,
      bag: null,
      store: null,
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "bad_request", message: "Failed to confirm payment" });
  }
});

// ─── Stripe Checkout Session ───────────────────────────────────────────────
router.post("/checkout/session", async (req, res) => {
  try {
    const { reservationId, successUrl, cancelUrl, userId } = req.body as {
      reservationId: number;
      successUrl: string;
      cancelUrl: string;
      userId?: string;
    };

    if (!reservationId || !successUrl || !cancelUrl) {
      res.status(400).json({ error: "bad_request", message: "reservationId, successUrl, cancelUrl are required" });
      return;
    }

    const [reservation] = await db
      .select({
        id: reservationsTable.id,
        totalPrice: reservationsTable.totalPrice,
        paymentStatus: reservationsTable.paymentStatus,
        bagId: reservationsTable.bagId,
        storeId: reservationsTable.storeId,
      })
      .from(reservationsTable)
      .where(eq(reservationsTable.id, reservationId));

    if (!reservation) {
      res.status(404).json({ error: "not_found", message: "Reservation not found" });
      return;
    }

    if (reservation.paymentStatus === "paid") {
      res.status(409).json({ error: "already_paid", message: "This reservation is already paid" });
      return;
    }

    const stripeKey = process.env["STRIPE_SECRET_KEY"];
    if (!stripeKey) {
      res.status(503).json({ error: "stripe_not_configured", message: "Stripe is not configured" });
      return;
    }

    // 店舗の Stripe アカウント ID を取得
    const [store] = await db
      .select({ stripeAccountId: storesTable.stripeAccountId })
      .from(storesTable)
      .where(eq(storesTable.id, reservation.storeId));

    const stripe = await import("stripe").then((m) => new m.default(stripeKey));

    const amountInYen = Math.round(reservation.totalPrice);
    // 手数料計算: application_fee = floor(total × 25%) のみ。Stripe手数料は含めない
    const { platformFee, estimatedStripeFee, applicationFeeAmount, storeReceives } = calcFees(amountInYen);

    // 送金先: 店舗の stripeAccountId。未設定の場合はデフォルトテスト用アカウントを使用
    const destinationAccountId =
      store?.stripeAccountId ?? "acct_1TDLA9GjCxAcHQcd";

    console.log(
      `Stripe Connect 試行: total=${amountInYen}JPY, ` +
      `platformNet=${applicationFeeAmount}JPY (25%, 純利益), ` +
      `storeGross=${storeReceives}JPY (75%), ` +
      `stripeFee≈${estimatedStripeFee}JPY (店舗負担予定), ` +
      `dest=${destinationAccountId}`
    );

    // 共通の line_items / URL 設定
    const commonParams = {
      mode: "payment" as const,
      line_items: [
        {
          price_data: {
            currency: "jpy",
            product_data: {
              name: "食べロス レスキュー商品",
              description: "食品ロスを減らすサプライズバッグ",
              images: ["https://images.unsplash.com/photo-1542838132-92c53300491e?w=400"],
            },
            unit_amount: amountInYen,
          },
          quantity: 1,
        },
      ],
      success_url: successUrl.includes("{CHECKOUT_SESSION_ID}")
        ? successUrl
        : `${successUrl}${successUrl.includes("?") ? "&" : "?"}session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      metadata: { reservationId: String(reservation.id), userId: userId || '' },
      locale: "ja" as const,
    };

    // メタデータ（全フォールバック共通）
    const feeMetadata = {
      reservationId:      String(reservation.id),
      platformFee:        String(applicationFeeAmount),
      estimatedStripeFee: String(estimatedStripeFee),
      platformFeeRate:    "25",
      storeGross:         String(storeReceives),
      destinationAccount: destinationAccountId,
    };

    let session;
    let chargeMode = "unknown";

    // ── Tier 1: on_behalf_of + transfer_data ─────────────────────────────────
    // 店舗（コネクトアカウント）が Stripe 手数料を負担 → プラットフォームは 25% を純利益で受け取る
    // 要件: 店舗アカウントに card_payments capability が必要
    try {
      session = await stripe.checkout.sessions.create({
        ...commonParams,
        on_behalf_of: destinationAccountId,
        payment_intent_data: {
          application_fee_amount: applicationFeeAmount,
          on_behalf_of:           destinationAccountId,
          transfer_data:          { destination: destinationAccountId },
          metadata: { ...feeMetadata, chargeMode: "on_behalf_of" },
        },
      });
      chargeMode = "on_behalf_of";
      console.log(
        `✅ Tier1 (on_behalf_of) 成功: total=${amountInYen}JPY, ` +
        `platformNet=${applicationFeeAmount}JPY (25%, 手数料ゼロ), ` +
        `storeGross=${storeReceives}JPY, stripeFee≈${estimatedStripeFee}JPY (店舗負担), ` +
        `dest=${destinationAccountId}`
      );
    } catch (tier1Err: any) {
      if (!isStripeConnectError(tier1Err)) throw tier1Err;
      console.warn(
        `⚠️  Tier1 (on_behalf_of) 失敗 [${tier1Err.code ?? tier1Err.type}]: ${tier1Err.message} — Tier2 へフォールバック`
      );

      // ── Tier 2: transfer_data のみ（on_behalf_of なし）─────────────────────
      // プラットフォームが Stripe 手数料を負担 → プラットフォーム純益 = 25% - stripeFee
      // 要件: transfers capability のみ
      try {
        session = await stripe.checkout.sessions.create({
          ...commonParams,
          payment_intent_data: {
            application_fee_amount: applicationFeeAmount,
            transfer_data:          { destination: destinationAccountId },
            metadata: { ...feeMetadata, chargeMode: "destination_only" },
          },
        });
        chargeMode = "destination_only";
        console.warn(
          `⚠️  Tier2 (destination_only) 使用: total=${amountInYen}JPY, ` +
          `platformNet≈${applicationFeeAmount - estimatedStripeFee}JPY (Stripe手数料プラットフォーム負担), ` +
          `storeReceives=${storeReceives}JPY, dest=${destinationAccountId}`
        );
      } catch (tier2Err: any) {
        if (!isStripeConnectError(tier2Err)) throw tier2Err;
        console.warn(
          `⚠️  Tier2 (destination_only) 失敗 [${tier2Err.code ?? tier2Err.type}]: ${tier2Err.message} — Tier3 へフォールバック`
        );

        // ── Tier 3: 直接決済（Connect なし）─────────────────────────────────
        session = await stripe.checkout.sessions.create({
          ...commonParams,
          payment_intent_data: {
            metadata: { ...feeMetadata, chargeMode: "direct_no_connect" },
          },
        });
        chargeMode = "direct_no_connect";
        console.warn(`⚠️  Tier3 (direct, Connect なし) 使用: total=${amountInYen}JPY`);
      }
    }

    console.log(`Checkout session created: ${session.id} (chargeMode=${chargeMode})`);

    await db
      .update(reservationsTable)
      .set({ paymentIntentId: session.id })
      .where(eq(reservationsTable.id, reservation.id));

    res.json({ sessionId: session.id, url: session.url });
  } catch (err) {
    console.error("Stripe Checkout error:", err);
    res.status(500).json({ error: "stripe_error", message: "Failed to create checkout session" });
  }
});

// ─── Stripe Checkout Verify (after redirect) ────────────────────────────────
router.get("/checkout/verify", async (req, res) => {
  try {
    const { session_id, reservation_id } = req.query as { session_id?: string; reservation_id?: string };

    if (!session_id || !reservation_id) {
      res.status(400).json({ error: "bad_request", message: "session_id and reservation_id required" });
      return;
    }

    const reservationId = parseInt(reservation_id);
    const stripeKey = process.env["STRIPE_SECRET_KEY"];

    // ── 1. Stripe セッション確認 ────────────────────────────────
    let paymentStatus = "paid";
    let stripePaymentId: string | null = null;
    let supabaseUserId = "";

    if (stripeKey) {
      const stripe = await import("stripe").then((m) => new m.default(stripeKey));
      const session = await stripe.checkout.sessions.retrieve(session_id);
      paymentStatus = session.payment_status;
      stripePaymentId = (session.payment_intent as string) || session.id;
      supabaseUserId = session.metadata?.userId || "";

      if (session.payment_status !== "paid") {
        res.json({ status: session.payment_status, reservationId });
        return;
      }
    }

    // ── 2. 予約を取得（bag・store JOIN）──────────────────────────
    const [reservationFull] = await db
      .select({
        id: reservationsTable.id,
        userId: reservationsTable.userId,
        bagId: reservationsTable.bagId,
        storeId: reservationsTable.storeId,
        totalPrice: reservationsTable.totalPrice,
        paymentStatus: reservationsTable.paymentStatus,
        pickupCode: reservationsTable.pickupCode,
        bagTitle: surpriseBagsTable.title,
        storeName: storesTable.name,
        pickupStart: surpriseBagsTable.pickupStart,
        pickupEnd: surpriseBagsTable.pickupEnd,
        stockCount: surpriseBagsTable.stockCount,
      })
      .from(reservationsTable)
      .leftJoin(surpriseBagsTable, eq(reservationsTable.bagId, surpriseBagsTable.id))
      .leftJoin(storesTable, eq(reservationsTable.storeId, storesTable.id))
      .where(eq(reservationsTable.id, reservationId));

    if (!reservationFull) {
      res.status(404).json({ error: "not_found", message: "Reservation not found" });
      return;
    }

    // 二重処理ガード: すでに paid なら Supabase/在庫処理をスキップして既存データを返す
    const alreadyPaid = reservationFull.paymentStatus === "paid";

    // ── 3. Drizzle 予約ステータス更新 ────────────────────────────
    if (!alreadyPaid) {
      await db
        .update(reservationsTable)
        .set({
          paymentStatus: "paid",
          status: "confirmed",
          ...(stripePaymentId ? { paymentIntentId: stripePaymentId } : {}),
        })
        .where(eq(reservationsTable.id, reservationId));

      // 仮押さえを確定（在庫は戻さない）
      await db
        .update(cartReservationsTable)
        .set({ status: "confirmed" })
        .where(eq(cartReservationsTable.reservationId, reservationId))
        .catch(() => {});

      // ── 4. Supabase orders に書き込み ─────────────────────────
      // 在庫デクリメントは POST /reservations で実施済みのためここでは行わない
      const targetUserId = supabaseUserId || reservationFull.userId;
      if (targetUserId) {
        try {
          const { supabaseAdmin } = await import("../lib/supabase.js");

          // 既存の注文が存在する場合はスキップ（冪等性）
          const { data: existing } = await supabaseAdmin
            .from("orders")
            .select("id")
            .eq("reservation_id", reservationId)
            .maybeSingle();

          if (!existing) {
            const { error: insertErr } = await supabaseAdmin.from("orders").insert({
              user_id: targetUserId,
              product_id: null,
              bag_id: reservationFull.bagId,
              reservation_id: reservationId,
              final_price: reservationFull.totalPrice,
              status: "unpicked",
              stripe_payment_id: stripePaymentId,
              pickup_code: reservationFull.pickupCode,
              bag_title: reservationFull.bagTitle,
              store_name: reservationFull.storeName,
            });

            if (insertErr) {
              console.error("Supabase orders insert error:", insertErr);
            } else {
              console.log(`✅ Supabase orders 書き込み成功: reservation_id=${reservationId}, user_id=${targetUserId}`);
            }
          } else {
            console.log(`ℹ️ Supabase orders 既存レコードのためスキップ: reservation_id=${reservationId}`);
          }
        } catch (supaErr) {
          console.error("Supabase write error (non-fatal):", supaErr);
        }
      }
    }

    // ── 6. 受付票データを返す ────────────────────────────────────
    res.json({
      status: "paid",
      reservationId,
      pickupCode: reservationFull.pickupCode,
      bagTitle: reservationFull.bagTitle,
      storeName: reservationFull.storeName,
      totalPrice: reservationFull.totalPrice,
      pickupStart: reservationFull.pickupStart,
      pickupEnd: reservationFull.pickupEnd,
    });
  } catch (err) {
    console.error("Verify error:", err);
    res.status(500).json({ error: "verify_error", message: "Failed to verify session" });
  }
});

export default router;
