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
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 送金額の明示的計算ロジック（プログラム直接制御）
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Step 1. PlatformRevenue（プラットフォーム純利益・固定）
 *         = Math.floor(TotalAmount × 0.25)
 *
 * Step 2. StripeFee（Stripe決済手数料の事前計算）
 *         = Math.round(TotalAmount × 0.036)  ← JPYカード平均 3.6%
 *
 * Step 3. ShopTransferAmount（店舗への実送金額）
 *         = (TotalAmount - PlatformRevenue) - StripeFee
 *
 *  例（TotalAmount = 350円）:
 *   PlatformRevenue    = floor(350 × 0.25)        =  87円  ← Netとして受け取る金額
 *   StripeFee          = round(350 × 0.036)        =  13円
 *   ShopTransferAmount = (350 - 87) - 13           = 250円  ← transfer_data.amount に直接指定
 *
 *  Stripe上の資金移動:
 *   顧客支払い         350円
 *   Stripe手数料       − 13円（プラットフォームアカウントから徴収）
 *   店舗送金           − 250円（transfer_data.amount で明示指定）
 *   ─────────────────────────
 *   プラットフォームNet  87円（= PlatformRevenue、1円の減額なし）
 */
function calcFees(totalAmountJpy: number): {
  platformRevenue: number;     // プラットフォーム純利益（25%固定）
  stripeFee: number;           // Stripe手数料（事前計算）
  shopTransferAmount: number;  // 店舗への実送金額（transfer_data.amount に指定する値）
} {
  const platformRevenue    = Math.floor(totalAmountJpy * PLATFORM_FEE_RATE);          // Step 1
  const stripeFee          = Math.round(totalAmountJpy * STRIPE_FEE_RATE);            // Step 2
  const shopTransferAmount = (totalAmountJpy - platformRevenue) - stripeFee;          // Step 3
  return { platformRevenue, stripeFee, shopTransferAmount };
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
    // ── 送金額の明示的計算 ─────────────────────────────────────
    // Step 1: PlatformRevenue = floor(total × 25%)
    // Step 2: StripeFee       = round(total × 3.6%)
    // Step 3: ShopTransfer    = (total - PlatformRevenue) - StripeFee
    const { platformRevenue, stripeFee, shopTransferAmount } = calcFees(total);

    const stripeKey = process.env["STRIPE_SECRET_KEY"];

    if (stripeKey) {
      const [store] = await db
        .select({ stripeAccountId: storesTable.stripeAccountId })
        .from(storesTable)
        .where(eq(storesTable.id, reservation.storeId));

      const destinationAccountId = store?.stripeAccountId ?? null;

      try {
        const stripe = await import("stripe").then((m) => new m.default(stripeKey));

        // Stripeダッシュボードのメタデータで計算内訳を確認可能
        const feeMetadata = {
          reservationId:      String(reservation.id),
          platformFeeRate:    "25%",
          platformRevenue:    String(platformRevenue),     // = floor(total × 0.25)
          stripeFee:          String(stripeFee),           // = round(total × 0.036)
          shopTransferAmount: String(shopTransferAmount),  // = (total - platformRevenue) - stripeFee
        };

        const baseParams: Parameters<typeof stripe.paymentIntents.create>[0] = {
          amount:   total,
          currency: "jpy",
          metadata: feeMetadata,
        };

        let intent;
        let chargeMode = "direct";

        if (destinationAccountId) {
          // ── Tier 1: ShopTransferAmount を transfer_data.amount に直接指定 ──
          // = (total - PlatformRevenue) - StripeFee
          // プラットフォームNet = total - stripeFee - shopTransferAmount = PlatformRevenue
          try {
            intent = await stripe.paymentIntents.create({
              ...baseParams,
              transfer_data: {
                destination: destinationAccountId,
                amount:      shopTransferAmount, // ← ShopTransferAmount を直接指定
              },
            });
            chargeMode = "explicit_transfer_amount";
            console.log(
              `✅ PaymentIntent Tier1: ` +
              `total=${total}JPY | ` +
              `PlatformRevenue=${platformRevenue}JPY (25%) | ` +
              `StripeFee≈${stripeFee}JPY | ` +
              `ShopTransfer=${shopTransferAmount}JPY (明示) | ` +
              `Net=${platformRevenue}JPY ✓`
            );
          } catch (t1Err: any) {
            if (!isStripeConnectError(t1Err)) throw t1Err;
            console.warn(`⚠️  Tier1 失敗 [${t1Err.code ?? t1Err.type}] — Tier2 へ`);

            // ── Tier 2: application_fee_amount フォールバック ────────────────
            try {
              intent = await stripe.paymentIntents.create({
                ...baseParams,
                application_fee_amount: platformRevenue,
                transfer_data:          { destination: destinationAccountId },
              });
              chargeMode = "application_fee_amount";
              console.warn(`⚠️  Tier2: total=${total}JPY, dest=${destinationAccountId}`);
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
          clientSecret:       intent.client_secret,
          paymentIntentId:    intent.id,
          amount:             total,
          currency:           "jpy",
          platformRevenue,
          stripeFee,
          shopTransferAmount,
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
      clientSecret:       `${mockIntentId}_secret_mock`,
      paymentIntentId:    mockIntentId,
      amount:             total,
      currency:           "jpy",
      platformRevenue,
      stripeFee,
      shopTransferAmount,
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
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Separate Charges and Transfers（分離チャージ&送金方式）
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Step 1. チャージ全額をプラットフォームアカウントで受け取る（transfer_data なし）
    // Step 2. Stripe手数料がプラットフォームから引かれる: total - stripeFee = 残高
    // Step 3. 残高から shopTransferAmount を店舗に手動Transfer（/checkout/verify で実行）
    // Step 4. プラットフォームNet = total - stripeFee - shopTransferAmount = platformRevenue
    //
    // 例（350円）:
    //   チャージ        350円 → プラットフォームへ着金
    //   Stripe手数料  -  13円
    //   店舗Transfer  - 250円（/checkout/verify で stripe.transfers.create()）
    //   ─────────────────────────
    //   プラットフォームNet  87円 ✓（= 25%、自動計算なし）
    const { platformRevenue, stripeFee, shopTransferAmount } = calcFees(total);

    const destinationAccountId = store?.stripeAccountId ?? null;

    console.log(
      `[Checkout] Separate C&T: ` +
      `total=${total}JPY | ` +
      `PlatformRevenue=${platformRevenue}JPY | ` +
      `StripeFee≈${stripeFee}JPY | ` +
      `ShopTransfer=${shopTransferAmount}JPY (支払い確認後に送金)`
    );

    // Stripeダッシュボードのメタデータに計算内訳を記録
    // ※ storeStripeAccountId は Transfer 時に参照する
    const feeMetadata: Record<string, string> = {
      reservationId:        String(reservation.id),
      chargeMode:           "separate_charges_and_transfers",
      platformRevenue:      String(platformRevenue),
      stripeFeeEstimate:    String(stripeFee),
      shopTransferAmount:   String(shopTransferAmount),
    };
    if (destinationAccountId) {
      feeMetadata["storeStripeAccountId"] = destinationAccountId;
    }

    // ── ブループリント準拠: application_fee_amount + transfer_data.destination ──
    // 店舗が Stripe Connect アカウントを持っている場合は直接送金方式
    // 持っていない場合は Separate Charges & Transfers にフォールバック
    const baseSessionParams: Parameters<typeof stripe.checkout.sessions.create>[0] = {
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "jpy",
            product_data: {
              name: "おすそわけバッグ",
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
      locale: "ja",
    };

    let session;
    let chargeMode: string;

    if (destinationAccountId) {
      // ── 方式 A: 直接送金（ブループリント準拠） ──
      // application_fee_amount = プラットフォーム手数料（25%固定）
      // transfer_data.destination = 店舗 Stripe アカウント
      try {
        session = await stripe.checkout.sessions.create({
          ...baseSessionParams,
          payment_intent_data: {
            application_fee_amount: platformRevenue,  // 25% をプラットフォームが受け取る
            transfer_data: {
              destination: destinationAccountId,       // 残額が店舗へ自動送金される
            },
            metadata: feeMetadata,
          },
        });
        chargeMode = "direct_transfer";
        console.log(
          `[Checkout] 方式A 直接送金: total=${total}JPY | ` +
          `platformFee(25%)=${platformRevenue}JPY → OsusOwake | ` +
          `shopTransfer≈${shopTransferAmount}JPY → ${destinationAccountId}`
        );
      } catch (directErr: any) {
        // Stripe Connect エラー（charges_enabled でないなど）→ 方式 B にフォールバック
        if (isStripeConnectError(directErr)) {
          console.warn(`⚠️  方式A 失敗 [${directErr.code ?? directErr.type}] → 方式B へフォールバック`);
          session = await stripe.checkout.sessions.create({
            ...baseSessionParams,
            payment_intent_data: { metadata: feeMetadata },
          });
          chargeMode = "separate_charges_and_transfers";
        } else {
          throw directErr;
        }
      }
    } else {
      // ── 方式 B: Separate Charges & Transfers（Connect 未連携時） ──
      session = await stripe.checkout.sessions.create({
        ...baseSessionParams,
        payment_intent_data: { metadata: feeMetadata },
      });
      chargeMode = "separate_charges_and_transfers";
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
    // Transfer用（Separate C&T方式）
    let piMetadata: Record<string, string> = {};
    let chargeIdForTransfer: string | null = null;

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

      // PaymentIntent を取得してメタデータとcharge IDを確保
      if (stripePaymentId && stripePaymentId.startsWith("pi_")) {
        try {
          const pi = await stripe.paymentIntents.retrieve(stripePaymentId, {
            expand: ["latest_charge"],
          });
          piMetadata = (pi.metadata as Record<string, string>) || {};
          const lc = pi.latest_charge;
          chargeIdForTransfer = typeof lc === "string" ? lc : (lc as any)?.id ?? null;
        } catch (piErr) {
          console.warn("PaymentIntent retrieve error (non-fatal):", piErr);
        }
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

      // ── 4. 店舗への Transfer（Separate Charges and Transfers）─────
      // チャージ完了後に手動でTransferを作成。これがプラットフォームNet = 87円を保証する
      // piMetadata.storeStripeAccountId と chargeIdForTransfer は Step 1 で取得済み
      if (stripeKey && chargeIdForTransfer && piMetadata["storeStripeAccountId"]) {
        try {
          const stripe = await import("stripe").then((m) => new m.default(stripeKey));
          const transferAmount = parseInt(piMetadata["shopTransferAmount"] ?? "0", 10);
          const storeAccountId = piMetadata["storeStripeAccountId"];

          if (transferAmount > 0 && storeAccountId) {
            const transfer = await stripe.transfers.create({
              amount:             transferAmount,            // ShopTransferAmount（例: 250円）
              currency:           "jpy",
              destination:        storeAccountId,            // 店舗のStripeアカウント
              source_transaction: chargeIdForTransfer,       // このチャージと紐付け
              metadata: {
                reservationId:   String(reservationId),
                platformRevenue: piMetadata["platformRevenue"] ?? "",
                stripeFee:       piMetadata["stripeFeeEstimate"] ?? "",
                shopTransfer:    String(transferAmount),
              },
            });
            console.log(
              `✅ Transfer成功: ${transferAmount}JPY → ${storeAccountId} ` +
              `(transfer_id=${transfer.id}, charge=${chargeIdForTransfer}) | ` +
              `platformNet≈${piMetadata["platformRevenue"]}JPY`
            );
          }
        } catch (transferErr: any) {
          // Transfer失敗は非致命的（手動対応可能）—— 決済確認フローは継続
          console.error("⚠️ Transfer error (non-fatal, manual action may be required):", transferErr?.message ?? transferErr);
        }
      } else if (stripeKey && stripePaymentId) {
        // 送金先アカウント未設定の場合はスキップ（プラットフォームに全額留保）
        console.log(`ℹ️ Transfer スキップ: 送金先アカウント未設定 (reservation=${reservationId})`);
      }

      // ── 5. Supabase orders に書き込み ─────────────────────────
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
