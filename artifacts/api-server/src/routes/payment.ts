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
 * 設計方針:
 *   application_fee_amount = floor(total × 25%)  ← Stripeダッシュボードに表示される値
 *
 * Destination Charge (transfer_data) モデルでの資金フロー（例: 600円）:
 *   ユーザー支払い          : 600円
 *   application_fee_amount  : 150円（25%）← プラットフォームが受け取る
 *   店舗への送金            : 450円（75%）← transfer_data で自動送金
 *   Stripe 決済手数料(~3.6%): 約22円 ← プラットフォーム口座から別途徴収
 *   プラットフォーム純益    : 150 - 22 = 約128円
 *
 * Math.floor で端数は店舗有利（ユーザー要件通り）
 */
function calcFees(totalAmountJpy: number): {
  platformFee: number;
  estimatedStripeFee: number;
  applicationFeeAmount: number;
  storeReceives: number;
} {
  const platformFee          = Math.floor(totalAmountJpy * PLATFORM_FEE_RATE);
  const estimatedStripeFee   = Math.round(totalAmountJpy * STRIPE_FEE_RATE);
  // application_fee = プラットフォーム25%のみ（Stripe手数料は含めない）
  const applicationFeeAmount = platformFee;
  const storeReceives        = totalAmountJpy - applicationFeeAmount;
  return { platformFee, estimatedStripeFee, applicationFeeAmount, storeReceives };
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

        // Destination Charge: application_fee_amount = プラットフォーム25%のみ
        // Stripe手数料はプラットフォーム口座から別途徴収される
        if (destinationAccountId) {
          intentParams.application_fee_amount = applicationFeeAmount;
          intentParams.transfer_data = { destination: destinationAccountId };
          console.log(
            `PaymentIntent Connect: total=${amountInYen}JPY, platformFee=${platformFee}JPY (25%), ` +
            `storeReceives=${storeReceives}JPY (75%), stripeFee≈${estimatedStripeFee}JPY, dest=${destinationAccountId}`
          );
        }

        const intent = await stripe.paymentIntents.create(intentParams);

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
      `Stripe Connect: total=${amountInYen}JPY, ` +
      `platformFee(appFee)=${applicationFeeAmount}JPY (25%), ` +
      `storeReceives=${storeReceives}JPY (75%), ` +
      `stripeFee≈${estimatedStripeFee}JPY (プラットフォーム負担), ` +
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

    // Stripe Connect: Destination Charge モード
    // - on_behalf_of は card_payments capability が必要なため使用しない
    // - transfer_data.destination のみ指定 → transfers capability だけで動作
    // - application_fee_amount で 25% をプラットフォームが受け取り、残額を店舗へ自動送金
    let session;
    let connectUsed = false;
    try {
      session = await stripe.checkout.sessions.create({
        ...commonParams,
        payment_intent_data: {
          // application_fee_amount = プラットフォーム25%のみ（Stripe手数料は含めない）
          // 店舗には total - applicationFee = 75% が自動送金される
          application_fee_amount: applicationFeeAmount,
          transfer_data: { destination: destinationAccountId },
          metadata: {
            reservationId:      String(reservation.id),
            platformFee:        String(platformFee),
            estimatedStripeFee: String(estimatedStripeFee),
            applicationFee:     String(applicationFeeAmount),
            platformFeeRate:    "25",
            storeReceives:      String(storeReceives),
            destinationAccount: destinationAccountId,
          },
        },
      });
      connectUsed = true;
      console.log(
        `✅ Stripe Destination Charge 成功: total=${amountInYen}JPY, ` +
        `platformFee(appFee)=${applicationFeeAmount}JPY (25%), ` +
        `storeReceives=${storeReceives}JPY (75%), ` +
        `stripeFee≈${estimatedStripeFee}JPY (プラットフォーム負担), ` +
        `dest=${destinationAccountId}`
      );
    } catch (connectErr: any) {
      // Connect が使えない場合はプラットフォーム直接決済にフォールバック
      const isConnectError =
        connectErr?.code === "transfers_not_allowed" ||
        connectErr?.code === "account_invalid" ||
        connectErr?.type === "StripeInvalidRequestError";
      if (isConnectError) {
        console.warn(
          `⚠️  Stripe Connect フォールバック (${connectErr.code ?? connectErr.type}): ${connectErr.message}`
        );
        session = await stripe.checkout.sessions.create({
          ...commonParams,
          payment_intent_data: {
            metadata: {
              reservationId:      String(reservation.id),
              platformFee:        String(platformFee),
              estimatedStripeFee: String(estimatedStripeFee),
              applicationFee:     String(applicationFeeAmount),
              platformFeeRate:    "25",
              stripeFeeRate:      "3.6",
              destinationAccount: destinationAccountId,
              connectStatus:      "fallback",
            },
          },
        });
      } else {
        throw connectErr;
      }
    }

    console.log(`Checkout session created: ${session.id} (Connect=${connectUsed})`);

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
