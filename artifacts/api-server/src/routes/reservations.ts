import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  reservationsTable,
  surpriseBagsTable,
  storesTable,
  insertReservationSchema,
} from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
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
      })
      .from(reservationsTable)
      .innerJoin(surpriseBagsTable, eq(reservationsTable.bagId, surpriseBagsTable.id))
      .innerJoin(storesTable, eq(reservationsTable.storeId, storesTable.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    res.json(rows.map((r) => ({ ...r, store: { ...r.store, totalBagsAvailable: 0 } })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal_error", message: "Failed to fetch reservations" });
  }
});

router.post("/reservations", async (req, res) => {
  try {
    const body = CreateReservationBody.parse(req.body);

    const [bag] = await db
      .select()
      .from(surpriseBagsTable)
      .where(and(eq(surpriseBagsTable.id, body.bagId), eq(surpriseBagsTable.isActive, true)));

    if (!bag) {
      res.status(400).json({ error: "not_found", message: "Bag not found or inactive" });
      return;
    }

    // 受取時間チェック（深夜またぎ対応）
    if (isBagExpired(bag)) {
      res.status(410).json({ error: "expired", message: "この商品の受取時間が過ぎています" });
      return;
    }

    if (bag.stockCount < body.quantity) {
      res.status(400).json({ error: "out_of_stock", message: "Not enough stock available" });
      return;
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

    const [reservation] = await db.insert(reservationsTable).values(parsed).returning();

    const pickupCode = generatePickupCode(reservation.id);
    const [updated] = await db
      .update(reservationsTable)
      .set({ pickupCode })
      .where(eq(reservationsTable.id, reservation.id))
      .returning();

    await db
      .update(surpriseBagsTable)
      .set({ stockCount: bag.stockCount - body.quantity })
      .where(eq(surpriseBagsTable.id, body.bagId));

    const full = await getReservationWithDetails(updated.id);
    res.status(201).json(full);
  } catch (err) {
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

    await db
      .update(reservationsTable)
      .set({ status: "cancelled" })
      .where(eq(reservationsTable.id, reservationId));

    await db
      .update(surpriseBagsTable)
      .set({ stockCount: existing.quantity })
      .where(eq(surpriseBagsTable.id, existing.bagId));

    const updated = await getReservationWithDetails(reservationId);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal_error", message: "Failed to cancel reservation" });
  }
});

export default router;
