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
// Stripe 決済手数料率（JPY カード平均 3.6%）
// ※ この率を使って「店舗への送金額」を事前計算し transfer_data.amount に直接指定する
const STRIPE_FEE_RATE = 0.036;

/**
 * 送金額をプログラムで直接制御する手数料計算。
 *
 * 【設計方針 — 明示的送金額モデル】
 *   プラットフォームの純利益を 25% に固定するため、
 *   Stripeの自動計算（application_fee_amount）に頼らず
 *   transfer_data.amount に店舗送金額を直接指定する。
 *
 * 【資金フロー例（総額 600円）】
 *   Step 1: applicationFee    = floor(600 × 0.25)          = 150円（プラットフォーム取り分・固定）
 *   Step 2: transferBase      = 600 - 150                   = 450円（店舗の75%分）
 *   Step 3: estimatedStripeFee= round(600 × 0.036)          = 22円（Stripe手数料）
 *   Step 4: storeTransferAmt  = 450 - 22                    = 428円（店舗への実送金額）
 *
 * 【Stripe上の実際の資金移動】
 *   顧客からの収受     :  600円
 *   Stripe手数料       : -  22円（プラットフォームアカウントから徴収）
 *   店舗への送金       : - 428円（transfer_data.amount で明示指定）
 *   ─────────────────────────────
 *   プラットフォーム純益:   150円（= 25%、1円も引かれない）
 *   店舗受取           :   428円（= 75% - Stripe手数料）
 *
 * ※ Stripe手数料の見積もりは 3.6% を使用。実際の手数料がわずかに異なる場合、
 *   その差額はプラットフォームの損益として吸収される（通常 ±数円以内）。
 */
function calcFees(totalAmountJpy: number): {
  applicationFee: number;
  transferBase: number;
  estimatedStripeFee: number;
  storeTransferAmount: number;
} {
  const applicationFee      = Math.floor(totalAmountJpy * PLATFORM_FEE_RATE);  // 150円
  const transferBase        = totalAmountJpy - applicationFee;                  // 450円
  const estimatedStripeFee  = Math.round(totalAmountJpy * STRIPE_FEE_RATE);    // 22円
  const storeTransferAmount = transferBase - estimatedStripeFee;                // 428円
  return { applicationFee, transferBase, estimatedStripeFee, storeTransferAmount };
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

    const total = Math.round(reservation.totalPrice);
    const { applicationFee, transferBase, estimatedStripeFee, storeTransferAmount } = calcFees(total);

    const stripeKey = process.env["STRIPE_SECRET_KEY"];

    if (stripeKey) {
      const [store] = await db
        .select({ stripeAccountId: storesTable.stripeAccountId })
        .from(storesTable)
        .where(eq(storesTable.id, reservation.storeId));

      const destinationAccountId = store?.stripeAccountId ?? null;

      try {
        const stripe = await import("stripe").then((m) => new m.default(stripeKey));

        // 共通メタデータ（Stripeダッシュボードで確認可能）
        const feeMetadata = {
          reservationId:      String(reservation.id),
          platformFeeRate:    "25",
          applicationFee:     String(applicationFee),     // 150円
          transferBase:       String(transferBase),        // 450円
          estimatedStripeFee: String(estimatedStripeFee), // 22円
          storeTransferAmount:String(storeTransferAmount), // 428円
        };

        const baseParams: Parameters<typeof stripe.paymentIntents.create>[0] = {
          amount:   total,
          currency: "jpy",
          metadata: feeMetadata,
        };

        let intent;
        let chargeMode = "direct";

        if (destinationAccountId) {
          // ── Tier 1: 送金額を明示的に指定（メインロジック）──────────────────
          // transfer_data.amount = 428円 を直接指定することで、
          // Stripeの自動計算に依存せずプラットフォーム純益を正確に25%に固定する。
          // 資金フロー: 600円収受 → Stripe手数料22円徴収 → 428円送金 → 残150円が純益
          try {
            intent = await stripe.paymentIntents.create({
              ...baseParams,
              transfer_data: {
                destination: destinationAccountId,
                amount:      storeTransferAmount, // ← 428円を明示指定（プログラム制御）
              },
            });
            chargeMode = "explicit_transfer_amount";
            console.log(
              `✅ PaymentIntent (explicit_transfer_amount): ` +
              `total=${total}JPY | ` +
              `applicationFee=${applicationFee}JPY (25%固定) | ` +
              `transferBase=${transferBase}JPY | ` +
              `stripeFee≈${estimatedStripeFee}JPY | ` +
              `→ storeTransfer=${storeTransferAmount}JPY | ` +
              `platformNet=${applicationFee}JPY ✓`
            );
          } catch (t1Err: any) {
            if (!isStripeConnectError(t1Err)) throw t1Err;
            console.warn(`⚠️  Tier1 失敗 [${t1Err.code ?? t1Err.type}] — Tier2 (application_fee_amount) へ`);

            // ── Tier 2: application_fee_amount フォールバック ────────────────
            // Connect の transfer_data.amount が使えない場合のフォールバック
            try {
              intent = await stripe.paymentIntents.create({
                ...baseParams,
                application_fee_amount: applicationFee,
                transfer_data:          { destination: destinationAccountId },
              });
              chargeMode = "application_fee_amount";
              console.warn(`⚠️  Tier2 (application_fee_amount): total=${total}JPY, dest=${destinationAccountId}`);
            } catch (t2Err: any) {
              if (!isStripeConnectError(t2Err)) throw t2Err;
              console.warn(`⚠️  Tier2 失敗 — 直接決済へ`);
              intent = await stripe.paymentIntents.create(baseParams);
              chargeMode = "direct";
            }
          }
        } else {
          intent = await stripe.paymentIntents.create(baseParams);
        }

        await db
          .update(reservationsTable)
          .set({ paymentIntentId: intent.id })
          .where(eq(reservationsTable.id, reservation.id));

        res.json({
          clientSecret:        intent.client_secret,
          paymentIntentId:     intent.id,
          amount:              total,
          currency:            "jpy",
          applicationFee,
          transferBase,
          estimatedStripeFee,
          storeTransferAmount,
          chargeMode,
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
      amount:              total,
      currency:            "jpy",
      applicationFee,
      transferBase,
      estimatedStripeFee,
      storeTransferAmount,
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

    const total = Math.round(reservation.totalPrice);
    const { applicationFee, transferBase, estimatedStripeFee, storeTransferAmount } = calcFees(total);

    // 送金先: 店舗の stripeAccountId。未設定の場合はデフォルトテスト用アカウントを使用
    const destinationAccountId =
      store?.stripeAccountId ?? "acct_1TDLA9GjCxAcHQcd";

    console.log(
      `決済開始 — 明示的送金額モデル: ` +
      `total=${total}JPY | ` +
      `applicationFee=${applicationFee}JPY (25%固定) | ` +
      `transferBase=${transferBase}JPY | ` +
      `stripeFee≈${estimatedStripeFee}JPY | ` +
      `→ storeTransfer=${storeTransferAmount}JPY | ` +
      `platformNet=${applicationFee}JPY`
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
            unit_amount: total,
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

    // 全フォールバック共通メタデータ（Stripeダッシュボードで確認可能）
    const feeMetadata = {
      reservationId:       String(reservation.id),
      platformFeeRate:     "25",
      applicationFee:      String(applicationFee),      // 150円
      transferBase:        String(transferBase),         // 450円
      estimatedStripeFee:  String(estimatedStripeFee),  // 22円
      storeTransferAmount: String(storeTransferAmount),  // 428円
      destinationAccount:  destinationAccountId,
    };

    let session;
    let chargeMode = "unknown";

    // ── Tier 1: 送金額を明示的に指定（メインロジック）──────────────────────────
    // transfer_data.amount = 428円 を直接指定することで、Stripeの自動計算に依存せず
    // プラットフォーム純益を正確に25%（150円）に固定する。
    //
    // 資金フロー（600円の場合）:
    //   顧客支払い 600円 → Stripe手数料22円徴収 → 428円送金 → 残150円が純益
    try {
      session = await stripe.checkout.sessions.create({
        ...commonParams,
        payment_intent_data: {
          transfer_data: {
            destination: destinationAccountId,
            amount:      storeTransferAmount, // ← 428円を明示指定（プログラム制御）
          },
          metadata: { ...feeMetadata, chargeMode: "explicit_transfer_amount" },
        },
      });
      chargeMode = "explicit_transfer_amount";
      console.log(
        `✅ Tier1 (explicit_transfer_amount) 成功: ` +
        `total=${total}JPY | storeTransfer=${storeTransferAmount}JPY (明示) | ` +
        `platformNet=${applicationFee}JPY (25%, 純利益確定)`
      );
    } catch (tier1Err: any) {
      if (!isStripeConnectError(tier1Err)) throw tier1Err;
      console.warn(
        `⚠️  Tier1 (explicit_transfer_amount) 失敗 [${tier1Err.code ?? tier1Err.type}] — Tier2 へ`
      );

      // ── Tier 2: application_fee_amount フォールバック ────────────────────────
      // explicit amount が使えない場合の代替。プラットフォーム純益は Stripe手数料分だけ減少する可能性あり
      try {
        session = await stripe.checkout.sessions.create({
          ...commonParams,
          payment_intent_data: {
            application_fee_amount: applicationFee,
            transfer_data:          { destination: destinationAccountId },
            metadata: { ...feeMetadata, chargeMode: "application_fee_amount" },
          },
        });
        chargeMode = "application_fee_amount";
        console.warn(`⚠️  Tier2 (application_fee_amount): total=${total}JPY, dest=${destinationAccountId}`);
      } catch (tier2Err: any) {
        if (!isStripeConnectError(tier2Err)) throw tier2Err;
        console.warn(`⚠️  Tier2 失敗 — Tier3 (直接決済) へ`);

        // ── Tier 3: 直接決済（Connect なし）──────────────────────────────────
        session = await stripe.checkout.sessions.create({
          ...commonParams,
          payment_intent_data: {
            metadata: { ...feeMetadata, chargeMode: "direct_no_connect" },
          },
        });
        chargeMode = "direct_no_connect";
        console.warn(`⚠️  Tier3 (direct, Connect なし): total=${total}JPY`);
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
