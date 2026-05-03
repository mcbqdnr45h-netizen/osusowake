import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  reservationsTable,
  surpriseBagsTable,
  storesTable,
  cartReservationsTable,
  reviewsTable,
  notificationsTable,
  insertReservationSchema,
} from "@workspace/db/schema";
import { eq, and, sql, lt, isNotNull, inArray } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";
import { isReviewDemoOwner } from "../lib/app-review.js";
import { supabaseAdmin } from "../lib/supabase.js";
import { getAllAdminUserIds } from "../lib/admin.js";

const HOLD_MINUTES = 5;

// ─── 収益モデル: ユーザー側 5%「システム利用料」を加算し、合計を10円単位四捨五入 ─────
// 例: merchandise=350円 → userTotal = round10(350 * 1.05) = round10(367.5) = 370円
//     merchandise=480円 → userTotal = round10(480 * 1.05) = round10(504)   = 500円
//     merchandise=120円 → userTotal = round10(120 * 1.05) = round10(126)   = 130円
const USER_SERVICE_FEE_RATE = 0.05;
function roundTo10(n: number): number {
  return Math.round(n / 10) * 10;
}
function computeUserTotal(merchandiseJpy: number): number {
  return roundTo10(merchandiseJpy * (1 + USER_SERVICE_FEE_RATE));
}

/** 再利用可能ステータス＝まだ未完了の PI。これらだけが Stripe で cancel 可能 */
const CANCELLABLE_PI_STATUSES = new Set([
  "requires_payment_method",
  "requires_capture",
  "requires_confirmation",
  "requires_action",
  "processing",
]);

/**
 * Stripe PaymentIntent を安全に cancel する。
 * - 既に成功・キャンセル済みなら no-op
 * - mock id（pi_mock_*）はスキップ
 * - エラーは握りつぶす（DB 側の cancel が主、Stripe 側は best-effort）
 */
async function cancelStripePI(piId: string | null | undefined): Promise<void> {
  if (!piId || piId.startsWith("pi_mock_")) return;
  const stripeKey = process.env["STRIPE_SECRET_KEY"];
  if (!stripeKey) return;
  try {
    const stripe = await import("stripe").then((m) => new m.default(stripeKey));
    const pi = await stripe.paymentIntents.retrieve(piId);
    if (CANCELLABLE_PI_STATUSES.has(pi.status)) {
      await stripe.paymentIntents.cancel(piId);
      console.log(`🗑️  [stripe] cancelled PI ${piId} (was ${pi.status})`);
    }
  } catch (e: any) {
    console.warn(`[stripe] cancel PI ${piId} failed:`, e?.message);
  }
}

/**
 * ★ #1: 既決済 (paymentStatus='paid') の予約を Stripe で全額返金する。
 *
 * - mock / review_bypass / 既に refunded はスキップ (idempotent)
 * - PI 実体の transfer_data / application_fee_amount を見て Connect destination
 *   charge かを判定し、 適切なオプション (reverse_transfer / refund_application_fee) を付ける
 * - 失敗してもエラー throw せず {ok: false, reason} を返す → 呼び出し側で admin 通知
 *
 * 設計判断: 「予約を cancelled にする」 のと 「Stripe 返金」 を分離。
 *   返金失敗時も予約は cancelled のまま (在庫復元済) で、 admin 通知で手動対応する。
 *   こうしないと「キャンセル UI が永遠に成功しない」 状態が発生し UX が壊れる。
 */
async function refundReservationPayment(opts: {
  reservationId: number;
  paymentIntentId: string | null;
}): Promise<{ ok: boolean; reason?: string; refundId?: string }> {
  const piId = opts.paymentIntentId;
  if (!piId) return { ok: false, reason: "no_payment_intent_id" };
  if (piId.startsWith("pi_mock_")) return { ok: true, reason: "mock_skipped" };
  if (piId.startsWith("pi_review_bypass_")) return { ok: true, reason: "review_bypass_skipped" };

  const stripeKey = process.env["STRIPE_SECRET_KEY"];
  if (!stripeKey) return { ok: false, reason: "no_stripe_key" };

  try {
    const stripe = await import("stripe").then((m) => new m.default(stripeKey));
    const intent = await stripe.paymentIntents.retrieve(piId);

    // succeeded ではない (canceled, requires_*) → cancelStripePI 側で対応 → 返金不要
    if (intent.status !== "succeeded") {
      return { ok: true, reason: `not_succeeded:${intent.status}` };
    }

    // 既存 refund を確認 (冪等性) — 全額既に返金済みならスキップ
    const existingRefunds = await stripe.refunds.list({ payment_intent: piId, limit: 10 });
    const totalRefunded = existingRefunds.data.reduce(
      (sum, r) => sum + ((r.status === "succeeded" || r.status === "pending") ? r.amount : 0),
      0,
    );
    if (totalRefunded >= intent.amount) {
      console.log(`[refund] PI ${piId} 既に全額 refunded (${totalRefunded}/${intent.amount})`);
      return { ok: true, reason: "already_refunded" };
    }

    // ★ PI 実体で Connect destination charge か判定 (stores.stripeAccountId 依存しない)
    const piAny = intent as any;
    const isDestinationCharge =
      Boolean(piAny.transfer_data?.destination) ||
      Boolean(piAny.application_fee_amount);

    const refundParams: Record<string, unknown> = {
      payment_intent: piId,
      reason: "requested_by_customer",
      metadata: {
        reservationId: String(opts.reservationId),
        cancelled_by: "user_request",
      },
    };
    if (isDestinationCharge) {
      // Connect: 店舗送金を巻き戻し + プラットフォーム手数料も返却
      refundParams.reverse_transfer = true;
      refundParams.refund_application_fee = true;
    }

    const refund = await stripe.refunds.create(refundParams as any);
    console.log(
      `💸 [refund] PI ${piId} refunded ${refund.amount}JPY ` +
      `(mode=${isDestinationCharge ? "destination" : "direct"}, refundId=${refund.id})`,
    );
    return { ok: true, refundId: refund.id };
  } catch (err: any) {
    console.error(`[refund] PI ${piId} failed:`, err?.message);
    return { ok: false, reason: err?.message ?? "unknown" };
  }
}

/**
 * 返金失敗時に admin 通知を入れる (notifications テーブル経由)。
 * admin の supabase user id を取得して notifications に insert。
 * 取得失敗・notification 失敗はログのみ (best-effort)。
 */
async function notifyAdminRefundFailed(opts: {
  reservationId: number;
  paymentIntentId: string | null;
  reason: string;
}): Promise<void> {
  try {
    // #6 フェーズ B: ハードコード email を廃止。 DB role=admin の全員に通知。
    const adminIds = await getAllAdminUserIds();
    if (adminIds.length === 0) {
      console.error("[refund-admin-notify] no admin users found in DB (users.role=admin)");
      return;
    }
    await db.insert(notificationsTable).values(
      adminIds.map((adminId) => ({
        userId: adminId,
        type: "refund_failed",
        title: "❗手動返金が必要です",
        body:
          `予約 #${opts.reservationId} の自動返金が失敗しました ` +
          `(PI: ${opts.paymentIntentId ?? "なし"}, 理由: ${opts.reason})。` +
          ` Stripe ダッシュボードで手動返金してください。`,
      })),
    );
  } catch (e: any) {
    console.error("[refund-admin-notify] failed:", e?.message);
  }
}

/**
 * 期限切れの cart_reservations を清算し、在庫を復元する
 *
 * ① 単一 UPDATE で cart_reservations を一括 expired → IDs を返却
 * ② 在庫を bag_id ごとに集計して一括 UPDATE（N+1 → O(1)）
 * ③ 紐づく reservations を一括キャンセル
 * コネクションを 1 本使い回すだけで完結する。
 */
export async function releaseExpiredCartReservations(): Promise<void> {
  try {
    // ① 期限切れレコードを active → expired に一括変更し、変更行を返す
    const expired = await db
      .update(cartReservationsTable)
      .set({ status: "expired" })
      .where(
        and(
          eq(cartReservationsTable.status, "active"),
          lt(cartReservationsTable.expiresAt, new Date())
        )
      )
      .returning();

    if (expired.length === 0) return;

    // ② bag_id ごとに返却数量を集計して在庫を一括加算
    const byBag = new Map<number, number>();
    for (const cr of expired) {
      byBag.set(cr.bagId, (byBag.get(cr.bagId) ?? 0) + cr.quantity);
    }
    await Promise.all(
      [...byBag.entries()].map(([bagId, qty]) =>
        db
          .update(surpriseBagsTable)
          .set({
            stockCount: sql`${surpriseBagsTable.stockCount} + ${qty}`,
            isActive: true,
          })
          .where(eq(surpriseBagsTable.id, bagId))
      )
    );

    // ③ 紐づく reservations を一括キャンセル
    const reservationIds = expired
      .map((cr) => cr.reservationId)
      .filter((id): id is number => id !== null);

    if (reservationIds.length > 0) {
      // 期限切れ予約に紐付く PaymentIntent を Stripe 側でも cancel する
      // → ダッシュボードの「未完了」が放置されないようにする
      const piRows = await db
        .select({
          id:              reservationsTable.id,
          paymentIntentId: reservationsTable.paymentIntentId,
        })
        .from(reservationsTable)
        .where(
          and(
            inArray(reservationsTable.id, reservationIds),
            eq(reservationsTable.status, "pending"),
            isNotNull(reservationsTable.paymentIntentId),
          )
        );

      await db
        .update(reservationsTable)
        .set({ status: "cancelled" })
        .where(
          and(
            inArray(reservationsTable.id, reservationIds),
            eq(reservationsTable.status, "pending")
          )
        );

      // Stripe 側の cancel は並列・best-effort
      await Promise.all(
        piRows
          .map((r) => r.paymentIntentId)
          .filter((pid): pid is string => !!pid)
          .map((pid) => cancelStripePI(pid))
      );
    }

    console.log(`[cart-reservations] released ${expired.length} expired holds`);
  } catch (err) {
    console.error("[cart-reservations] cleanup error:", err);
  }
}
import {
  ListReservationsQueryParams,
  CreateReservationBody,
  GetReservationParams,
  UpdateReservationStatusParams,
  UpdateReservationStatusBody,
  CancelReservationParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

/** 深夜またぎ対応の期限切れ判定（App Store 審査用デモ店舗はバイパス） */
function isBagExpired(bag: {
  pickupEnd: string | null;
  pickupStart: string | null;
  createdAt: Date;
  storeOwnerId?: string | null;
}): boolean {
  // App Store 審査用デモ店舗のバッグは常に有効
  if (isReviewDemoOwner(bag.storeOwnerId)) return false;

  if (!bag.pickupEnd) return false;

  const nowJST       = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const createdJST   = new Date(bag.createdAt.getTime() + 9 * 60 * 60 * 1000);
  const todayStr     = nowJST.toISOString().slice(0, 10);
  const yesterdayStr = new Date(nowJST.getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const createdStr   = createdJST.toISOString().slice(0, 10);
  const currentTime  = nowJST.toISOString().slice(11, 16);

  const isOvernightBag = bag.pickupStart != null && bag.pickupEnd < bag.pickupStart;

  if (isOvernightBag) {
    if (createdStr === todayStr)      return false; // 今日出品 → 翌日 pickupEnd まで有効
    if (createdStr === yesterdayStr)  return currentTime > bag.pickupEnd; // 昨日出品
    return true;
  }

  if (createdStr !== todayStr) return true;
  return currentTime > bag.pickupEnd;
}

function generatePickupCode(id: number): string {
  // 6桁のランダム風数字コード（予約IDから決定論的に生成）
  const n = ((id * 48271 + 23456) % 900000) + 100000;
  return String(n);
}

/**
 * 予約 ID から「buyer の userId」と「店舗オーナーの userId」をまとめて引く。
 * 認可チェック（自分の予約 or 自分の店舗の予約）に使う。
 */
async function loadReservationOwners(id: number): Promise<{ userId: string; storeOwnerId: string | null } | null> {
  const [row] = await db
    .select({
      userId: reservationsTable.userId,
      storeOwnerId: storesTable.ownerId,
    })
    .from(reservationsTable)
    .innerJoin(storesTable, eq(reservationsTable.storeId, storesTable.id))
    .where(eq(reservationsTable.id, id))
    .limit(1);
  return row ?? null;
}

async function getReservationWithDetails(id: number) {
  const [res] = await db
    .select({
      id: reservationsTable.id,
      userId: reservationsTable.userId,
      bagId: reservationsTable.bagId,
      storeId: reservationsTable.storeId,
      quantity: reservationsTable.quantity,
      totalPrice: reservationsTable.totalPrice,
      merchandiseAmount: reservationsTable.merchandiseAmount,
      status: reservationsTable.status,
      paymentIntentId: reservationsTable.paymentIntentId,
      paymentStatus: reservationsTable.paymentStatus,
      pickupCode: reservationsTable.pickupCode,
      createdAt: reservationsTable.createdAt,
      bag: surpriseBagsTable,
      store: storesTable,
    })
    .from(reservationsTable)
    .innerJoin(surpriseBagsTable, eq(reservationsTable.bagId, surpriseBagsTable.id))
    .innerJoin(storesTable, eq(reservationsTable.storeId, storesTable.id))
    .where(eq(reservationsTable.id, id));

  if (!res) return null;
  return {
    ...res,
    bag: res.bag,
    store: { ...res.store, totalBagsAvailable: 0 },
  };
}

router.get("/reservations", requireAuth, async (req, res) => {
  // 期限切れ仮押さえを非同期でクリーンアップ（レスポンスはブロックしない）
  releaseExpiredCartReservations().catch(() => {});

  try {
    const query = ListReservationsQueryParams.parse(req.query);

    // ★ 認可ロジック:
    //   - 通常: リクエスト者本人の予約のみ返却 (顧客側のマイ予約一覧)
    //   - 例外: storeId が指定されており、リクエスト者がその店舗のオーナーである場合は
    //     その店舗のすべての予約を返却 (店舗オーナー側の売上ダッシュボード用)
    //   これにより「店舗オーナーが自店の累計売上を確認できない (常に¥0表示) バグ」を解消。
    let isStoreOwnerView = false;
    if (query.storeId) {
      const [storeRow] = await db
        .select({ ownerId: storesTable.ownerId })
        .from(storesTable)
        .where(eq(storesTable.id, query.storeId));
      if (storeRow?.ownerId && storeRow.ownerId === req.authUser!.id) {
        isStoreOwnerView = true;
      }
    }

    const conditions = [];
    if (isStoreOwnerView) {
      // 店舗オーナー視点: 自店の全予約を取得 (userId フィルタ無し)
      conditions.push(eq(reservationsTable.storeId, query.storeId!));
    } else {
      // 通常視点: 本人の予約のみ (query.userId が指定されていても無視して認証ユーザ ID で強制)
      conditions.push(eq(reservationsTable.userId, req.authUser!.id));
      if (query.storeId) conditions.push(eq(reservationsTable.storeId, query.storeId));
    }
    if (query.status) conditions.push(eq(reservationsTable.status, query.status as "pending" | "confirmed" | "picked_up" | "cancelled"));

    const rows = await db
      .select({
        id: reservationsTable.id,
        userId: reservationsTable.userId,
        bagId: reservationsTable.bagId,
        storeId: reservationsTable.storeId,
        quantity: reservationsTable.quantity,
        totalPrice: reservationsTable.totalPrice,
        merchandiseAmount: reservationsTable.merchandiseAmount,
        status: reservationsTable.status,
        paymentIntentId: reservationsTable.paymentIntentId,
        paymentStatus: reservationsTable.paymentStatus,
        pickupCode: reservationsTable.pickupCode,
        createdAt: reservationsTable.createdAt,
        bag: surpriseBagsTable,
        store: storesTable,
        reviewId: reviewsTable.id,
      })
      .from(reservationsTable)
      .innerJoin(surpriseBagsTable, eq(reservationsTable.bagId, surpriseBagsTable.id))
      .innerJoin(storesTable, eq(reservationsTable.storeId, storesTable.id))
      .leftJoin(reviewsTable, eq(reviewsTable.reservationId, reservationsTable.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    res.json(rows.map((r) => ({
      ...r,
      hasReview: r.reviewId !== null,
      reviewId: undefined,
      store: { ...r.store, totalBagsAvailable: 0 },
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal_error", message: "Failed to fetch reservations" });
  }
});

router.post("/reservations", requireAuth, async (req, res) => {
  try {
    const body = CreateReservationBody.parse(req.body);

    // ── トランザクション内で在庫確認 + デクリメントを原子的に実行 ──
    let reservationId: number | null = null;

    await db.transaction(async (tx) => {
      // FOR UPDATE ロックで同時購入の競合を防止
      const [bag] = await tx
        .select()
        .from(surpriseBagsTable)
        .where(and(eq(surpriseBagsTable.id, body.bagId), eq(surpriseBagsTable.isActive, true)))
        .for("update");

      if (!bag) {
        throw Object.assign(new Error("not_found"), { code: "not_found" });
      }

      // 店舗オーナー ID を取得（審査用バイパス判定に使用）
      const [bagStore] = await tx
        .select({ ownerId: storesTable.ownerId })
        .from(storesTable)
        .where(eq(storesTable.id, bag.storeId));

      if (isBagExpired({ ...bag, storeOwnerId: bagStore?.ownerId ?? null })) {
        throw Object.assign(new Error("expired"), { code: "expired" });
      }

      if (bag.stockCount < body.quantity) {
        throw Object.assign(new Error("out_of_stock"), { code: "out_of_stock" });
      }

      // ── 収益モデル ─────────────────────────────────────────────────
      // merchandiseAmount = 商品代金 (店舗 25% 手数料の課金ベース)
      // totalPrice        = ユーザー支払合計 = round10(merch * 1.05)
      //                     (5% システム利用料を加算し、10円単位で四捨五入)
      const merchandiseAmount = bag.discountedPrice * body.quantity;
      const totalPrice = computeUserTotal(merchandiseAmount);
      const parsed = insertReservationSchema.parse({
        // 認可: body.userId は信用しない。常に認証ユーザの ID で予約を作る。
        userId: req.authUser!.id,
        bagId: body.bagId,
        storeId: bag.storeId,
        quantity: body.quantity,
        totalPrice,
        merchandiseAmount,
        status: "pending",
        paymentStatus: "unpaid",
      });

      const [reservation] = await tx.insert(reservationsTable).values(parsed).returning();
      const pickupCode = generatePickupCode(reservation.id);
      await tx
        .update(reservationsTable)
        .set({ pickupCode })
        .where(eq(reservationsTable.id, reservation.id));

      // ★ 仮押さえ廃止: ここで在庫は減らさない。
      //   在庫の減算は /api/payment/confirm（および Stripe webhook）が
      //   トランザクション内でアトミックに行う（早い者勝ち、在庫不足なら自動返金）。
      //   これにより「カートに入れて放置で他人が買えない」問題を解消する。

      reservationId = reservation.id;
    });

    const full = await getReservationWithDetails(reservationId!);
    res.status(201).json(full);
  } catch (err: any) {
    if (err?.code === "not_found") {
      res.status(400).json({ error: "not_found", message: "Bag not found or inactive" });
      return;
    }
    if (err?.code === "expired") {
      res.status(410).json({ error: "expired", message: "この商品の受取時間が過ぎています" });
      return;
    }
    if (err?.code === "out_of_stock") {
      res.status(400).json({ error: "out_of_stock", message: "Not enough stock available" });
      return;
    }
    console.error(err);
    res.status(400).json({ error: "bad_request", message: "Invalid reservation data" });
  }
});

router.get("/reservations/:reservationId", requireAuth, async (req, res) => {
  try {
    const { reservationId } = GetReservationParams.parse(req.params);

    // 認可: buyer 本人 or 店舗オーナー のみ閲覧可
    const owners = await loadReservationOwners(reservationId);
    if (!owners) {
      res.status(404).json({ error: "not_found", message: "Reservation not found" });
      return;
    }
    const me = req.authUser!.id;
    if (owners.userId !== me && owners.storeOwnerId !== me) {
      res.status(403).json({ error: "forbidden", message: "この予約を閲覧する権限がありません" });
      return;
    }

    const reservation = await getReservationWithDetails(reservationId);
    if (!reservation) {
      res.status(404).json({ error: "not_found", message: "Reservation not found" });
      return;
    }
    res.json(reservation);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal_error", message: "Failed to fetch reservation" });
  }
});

router.put("/reservations/:reservationId", requireAuth, async (req, res) => {
  try {
    const { reservationId } = UpdateReservationStatusParams.parse(req.params);
    const body = UpdateReservationStatusBody.parse(req.body);

    // 認可: buyer 本人のみ status 更新可
    const owners = await loadReservationOwners(reservationId);
    if (!owners) {
      res.status(404).json({ error: "not_found", message: "Reservation not found" });
      return;
    }
    if (owners.userId !== req.authUser!.id) {
      res.status(403).json({ error: "forbidden", message: "この予約を更新する権限がありません" });
      return;
    }

    await db
      .update(reservationsTable)
      .set({ status: body.status })
      .where(eq(reservationsTable.id, reservationId));

    const updated = await getReservationWithDetails(reservationId);
    if (!updated) {
      res.status(404).json({ error: "not_found", message: "Reservation not found" });
      return;
    }
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "bad_request", message: "Invalid status update" });
  }
});

// ─── Pickup confirmation (もぎり) ───────────────────────────────────────────
// 認可: buyer 本人 または 店舗オーナー のみ
router.post("/reservations/:reservationId/pickup", requireAuth, async (req, res) => {
  try {
    const id = parseInt(String(req.params.reservationId ?? ""), 10);
    if (!id) { res.status(400).json({ error: "bad_request", message: "Invalid id" }); return; }

    const owners = await loadReservationOwners(id);
    if (!owners) {
      res.status(404).json({ error: "not_found", message: "Reservation not found" });
      return;
    }
    const me = req.authUser!.id;
    if (owners.userId !== me && owners.storeOwnerId !== me) {
      res.status(403).json({ error: "forbidden", message: "この予約をもぎる権限がありません" });
      return;
    }

    const [existing] = await db
      .select()
      .from(reservationsTable)
      .where(eq(reservationsTable.id, id));

    if (!existing) {
      res.status(404).json({ error: "not_found", message: "Reservation not found" });
      return;
    }

    if (existing.status === "picked_up") {
      res.status(409).json({ error: "already_picked_up", message: "このチケットは既に使用済みです" });
      return;
    }

    if (existing.status === "cancelled") {
      res.status(400).json({ error: "cancelled", message: "キャンセル済みの予約です" });
      return;
    }

    await db
      .update(reservationsTable)
      // ★ pickedUpAt をサーバ時刻で記録 (月次ランキング集計の正確性担保)
      .set({ status: "picked_up", pickedUpAt: new Date() })
      .where(eq(reservationsTable.id, id));

    const updated = await getReservationWithDetails(id);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal_error", message: "Failed to confirm pickup" });
  }
});

router.post("/reservations/:reservationId/cancel", requireAuth, async (req, res) => {
  try {
    const { reservationId } = CancelReservationParams.parse(req.params);

    // ★ 重要: 並行する /payment/confirm や stripe-webhook の payment_intent.succeeded と
    //   レースしないよう、 トランザクション + SELECT FOR UPDATE で行ロックを取って判定する。
    //   従来は plain SELECT → plain UPDATE で wasPaid を「キャッシュ時点」で記憶していたため、
    //   webhook が後から status=confirmed に上書きしたり、 課金成立後の cancel で paymentStatus が
    //   paid のまま残る (= 返金も在庫復元もされない) 致命的レースが発生していた。
    type CancelLockResult =
      | { kind: "not_found" }
      | { kind: "forbidden"; ownerId: string }
      | { kind: "already_cancelled" }
      | {
          kind: "ok";
          existing: typeof reservationsTable.$inferSelect;
          wasPaid: boolean;
        };

    const lockResult: CancelLockResult = await db.transaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(reservationsTable)
        .where(eq(reservationsTable.id, reservationId))
        .for("update");

      if (!existing) return { kind: "not_found" };
      if (existing.userId !== req.authUser!.id) {
        return { kind: "forbidden", ownerId: existing.userId };
      }
      if (existing.status === "cancelled") {
        return { kind: "already_cancelled" };
      }

      // ロック内で実時間の paymentStatus を再判定 (webhook が並行更新済みかも)
      const wasPaid = existing.paymentStatus === "paid";

      // ① 予約ステータスを cancelled に更新 (paid → refunded も同時遷移)
      await tx
        .update(reservationsTable)
        .set({
          status: "cancelled",
          ...(wasPaid ? { paymentStatus: "refunded" as const } : {}),
        })
        .where(eq(reservationsTable.id, reservationId));

      return { kind: "ok", existing, wasPaid };
    });

    if (lockResult.kind === "not_found") {
      res.status(404).json({ error: "not_found", message: "Reservation not found" });
      return;
    }
    if (lockResult.kind === "forbidden") {
      console.warn(`[SECURITY] /reservations/${reservationId}/cancel: owner=${lockResult.ownerId} requester=${req.authUser!.id}`);
      res.status(403).json({ error: "forbidden", message: "この予約をキャンセルする権限がありません" });
      return;
    }
    if (lockResult.kind === "already_cancelled") {
      res.status(400).json({ error: "already_cancelled", message: "Reservation already cancelled" });
      return;
    }

    const { existing, wasPaid } = lockResult;
    console.log(`[cancel] ✅ reservation=${reservationId} user=${existing.userId} wasPaid=${wasPaid} pi=${existing.paymentIntentId ?? "none"}`);

    // ② Stripe 全額返金 — wasPaid だけでなく PI が存在すれば必ず試行する。
    //   ★ レース対策: cancel が DB 上 paid 化より先にロックを取り、 直後に Stripe で
    //     課金が succeeded になるケース (cancel→succeeded 順) では DB は wasPaid=false
    //     のまま記録されるが Stripe では実課金が発生する。 refundReservationPayment は
    //     PI を retrieve して succeeded のときだけ返金する冪等関数なので、 PI があれば
    //     常に呼ぶ → 課金取り残し (charged-but-cancelled) を防ぐ。
    let refundSucceeded = false;
    if (existing.paymentIntentId) {
      const refundResult = await refundReservationPayment({
        reservationId,
        paymentIntentId: existing.paymentIntentId,
      });
      refundSucceeded = refundResult.ok && Boolean(refundResult.refundId);

      if (wasPaid && !refundResult.ok) {
        console.error(
          `[cancel] ❌ refund failed reservation=${reservationId} ` +
          `pi=${existing.paymentIntentId} reason=${refundResult.reason} — admin manual refund required`,
        );
        notifyAdminRefundFailed({
          reservationId,
          paymentIntentId: existing.paymentIntentId,
          reason: refundResult.reason ?? "unknown",
        }).catch((e) => console.error("[cancel] admin notify failed:", e?.message));
      } else if (!wasPaid && refundSucceeded) {
        // ★ レース検知: DB unpaid だが Stripe では succeeded だった → 返金完了
        //   paymentStatus を refunded に揃え、 在庫も決済成立後扱いで復元する。
        console.warn(
          `[cancel] ⚠️ race detected: DB unpaid だが Stripe PI succeeded → 返金完了 ` +
          `reservation=${reservationId} pi=${existing.paymentIntentId} refundId=${refundResult.refundId}`,
        );
        try {
          await db
            .update(reservationsTable)
            .set({ paymentStatus: "refunded" as const })
            .where(eq(reservationsTable.id, reservationId));
        } catch (e: unknown) {
          console.error("[cancel] paymentStatus refunded update failed:", e instanceof Error ? e.message : String(e));
        }
      }
    }

    // ③ 在庫を戻す — wasPaid のときだけ。 仮押さえ廃止後、 在庫減算は webhook/verify が
    //   paid 遷移時に行うため、 cancel→succeeded レース (wasPaid=false + refundSucceeded)
    //   では webhook 側が already_cancelled 分岐に入って在庫減算をスキップしている。
    //   ここで復元すると在庫が水増しされるので、 wasPaid のみを条件とする。
    if (wasPaid) {
      try {
        await db
          .update(surpriseBagsTable)
          .set({ stockCount: sql`${surpriseBagsTable.stockCount} + ${existing.quantity}` })
          .where(eq(surpriseBagsTable.id, existing.bagId));
      } catch (stockErr: unknown) {
        const msg = stockErr instanceof Error ? stockErr.message : String(stockErr);
        console.error("[cancel] stock restore failed (non-critical):", msg);
      }
    }

    // ③ 旧 cart_reservation テーブル — 互換のため既存行があれば cancelled にする
    try {
      await db
        .update(cartReservationsTable)
        .set({ status: "cancelled" })
        .where(
          and(
            eq(cartReservationsTable.reservationId, reservationId),
            eq(cartReservationsTable.status, "active")
          )
        );
    } catch (crErr: unknown) {
      const msg = crErr instanceof Error ? crErr.message : String(crErr);
      console.error("[cancel] cart_reservation update failed (non-critical):", msg);
    }

    // ④ Stripe PaymentIntent を cancel（Stripe ダッシュボードの「未完了」放置防止）
    if (existing.paymentIntentId) {
      await cancelStripePI(existing.paymentIntentId);
    }

    const updated = await getReservationWithDetails(reservationId);
    res.json(updated);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const cause = (err as { cause?: unknown })?.cause;
    const causeMsg = cause instanceof Error ? cause.message : cause ? String(cause) : "";
    console.error("[cancel] reservation cancel failed:", msg, causeMsg);
    res.status(500).json({ error: "internal_error", message: "Failed to cancel reservation", detail: msg });
  }
});

export default router;
