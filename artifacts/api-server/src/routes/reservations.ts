import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  reservationsTable,
  surpriseBagsTable,
  storesTable,
  cartReservationsTable,
  reviewsTable,
  insertReservationSchema,
} from "@workspace/db/schema";
import { eq, and, sql, lt, isNotNull } from "drizzle-orm";

const HOLD_MINUTES = 5;

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
      await db
        .update(reservationsTable)
        .set({ status: "cancelled" })
        .where(
          and(
            sql`${reservationsTable.id} = ANY(${sql.raw(`ARRAY[${reservationIds.join(",")}]::int[]`)})`,
            eq(reservationsTable.status, "pending")
          )
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

/** 深夜またぎ対応の期限切れ判定 */
function isBagExpired(bag: {
  pickupEnd: string | null;
  pickupStart: string | null;
  createdAt: Date;
}): boolean {
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

async function getReservationWithDetails(id: number) {
  const [res] = await db
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

router.get("/reservations", async (req, res) => {
  // 期限切れ仮押さえを非同期でクリーンアップ（レスポンスはブロックしない）
  releaseExpiredCartReservations().catch(() => {});

  try {
    const query = ListReservationsQueryParams.parse(req.query);

    const conditions = [];
    if (query.userId) conditions.push(eq(reservationsTable.userId, query.userId));
    if (query.storeId) conditions.push(eq(reservationsTable.storeId, query.storeId));
    if (query.status) conditions.push(eq(reservationsTable.status, query.status as "pending" | "confirmed" | "picked_up" | "cancelled"));

    const rows = await db
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

router.post("/reservations", async (req, res) => {
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

      if (isBagExpired(bag)) {
        throw Object.assign(new Error("expired"), { code: "expired" });
      }

      if (bag.stockCount < body.quantity) {
        throw Object.assign(new Error("out_of_stock"), { code: "out_of_stock" });
      }

      const totalPrice = bag.discountedPrice * body.quantity;
      const parsed = insertReservationSchema.parse({
        userId: body.userId,
        bagId: body.bagId,
        storeId: bag.storeId,
        quantity: body.quantity,
        totalPrice,
        status: "pending",
        paymentStatus: "unpaid",
      });

      const [reservation] = await tx.insert(reservationsTable).values(parsed).returning();
      const pickupCode = generatePickupCode(reservation.id);
      await tx
        .update(reservationsTable)
        .set({ pickupCode })
        .where(eq(reservationsTable.id, reservation.id));

      // 在庫を購入数だけ原子的にデクリメント（マイナスにならないよう GREATEST で保護）
      const newStock = Math.max(0, bag.stockCount - body.quantity);
      await tx
        .update(surpriseBagsTable)
        .set({
          stockCount: newStock,
          // 在庫がなくなったら自動的に非公開にする
          ...(newStock === 0 ? { isActive: false } : {}),
        })
        .where(eq(surpriseBagsTable.id, body.bagId));

      reservationId = reservation.id;

      // ── 5分仮押さえ cart_reservation を作成 ──
      const expiresAt = new Date(Date.now() + HOLD_MINUTES * 60 * 1000);
      await tx
        .insert(cartReservationsTable)
        .values({
          userId: body.userId,
          bagId: body.bagId,
          reservationId: reservation.id,
          quantity: body.quantity,
          expiresAt,
          status: "active",
        });
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

router.get("/reservations/:reservationId", async (req, res) => {
  try {
    const { reservationId } = GetReservationParams.parse(req.params);
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

router.put("/reservations/:reservationId", async (req, res) => {
  try {
    const { reservationId } = UpdateReservationStatusParams.parse(req.params);
    const body = UpdateReservationStatusBody.parse(req.body);

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
router.post("/reservations/:reservationId/pickup", async (req, res) => {
  try {
    const id = parseInt(req.params.reservationId, 10);
    if (!id) { res.status(400).json({ error: "bad_request", message: "Invalid id" }); return; }

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
      .set({ status: "picked_up" })
      .where(eq(reservationsTable.id, id));

    const updated = await getReservationWithDetails(id);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal_error", message: "Failed to confirm pickup" });
  }
});

router.post("/reservations/:reservationId/cancel", async (req, res) => {
  try {
    const { reservationId } = CancelReservationParams.parse(req.params);

    const [existing] = await db
      .select()
      .from(reservationsTable)
      .where(eq(reservationsTable.id, reservationId));

    if (!existing) {
      res.status(404).json({ error: "not_found", message: "Reservation not found" });
      return;
    }

    if (existing.status === "cancelled") {
      res.status(400).json({ error: "already_cancelled", message: "Reservation already cancelled" });
      return;
    }

    // ① 予約ステータスを cancelled に更新（最重要・失敗したら 500）
    await db
      .update(reservationsTable)
      .set({ status: "cancelled" })
      .where(eq(reservationsTable.id, reservationId));

    // ② 在庫を戻す（失敗しても cancel 自体は成功扱い）
    try {
      await db
        .update(surpriseBagsTable)
        .set({ stockCount: sql`${surpriseBagsTable.stockCount} + ${existing.quantity}` })
        .where(eq(surpriseBagsTable.id, existing.bagId));
    } catch (stockErr: unknown) {
      const msg = stockErr instanceof Error ? stockErr.message : String(stockErr);
      console.error("[cancel] stock restore failed (non-critical):", msg);
    }

    // ③ 紐付く cart_reservation を cancelled に更新（期限切れ時の二重復元を防ぐ）
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
