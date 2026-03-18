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

function generatePickupCode(id: number): string {
  return `RES-${String(id).padStart(4, "0")}`;
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
