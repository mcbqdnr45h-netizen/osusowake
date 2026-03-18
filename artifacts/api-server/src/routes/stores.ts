import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { storesTable, surpriseBagsTable, insertStoreSchema } from "@workspace/db/schema";
import { eq, sql } from "drizzle-orm";
import {
  ListStoresQueryParams,
  CreateStoreBody,
  UpdateStoreBody,
  GetStoreParams,
  UpdateStoreParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/stores", async (req, res) => {
  try {
    const query = ListStoresQueryParams.parse(req.query);

    const stores = await db
      .select({
        id: storesTable.id,
        name: storesTable.name,
        description: storesTable.description,
        address: storesTable.address,
        city: storesTable.city,
        category: storesTable.category,
        lat: storesTable.lat,
        lng: storesTable.lng,
        imageUrl: storesTable.imageUrl,
        phone: storesTable.phone,
        openTime: storesTable.openTime,
        closeTime: storesTable.closeTime,
        rating: storesTable.rating,
        isActive: storesTable.isActive,
        ownerId: storesTable.ownerId,
        createdAt: storesTable.createdAt,
        totalBagsAvailable: sql<number>`COALESCE(SUM(CASE WHEN ${surpriseBagsTable.isActive} = true THEN ${surpriseBagsTable.stockCount} ELSE 0 END), 0)`.as("totalBagsAvailable"),
      })
      .from(storesTable)
      .leftJoin(surpriseBagsTable, eq(storesTable.id, surpriseBagsTable.storeId))
      .where(eq(storesTable.isActive, true))
      .groupBy(storesTable.id);

    res.json(stores);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal_error", message: "Failed to fetch stores" });
  }
});

router.post("/stores", async (req, res) => {
  try {
    const body = CreateStoreBody.parse(req.body);
    const parsed = insertStoreSchema.parse(body);
    const [store] = await db.insert(storesTable).values(parsed).returning();
    res.status(201).json({ ...store, totalBagsAvailable: 0 });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "bad_request", message: "Invalid store data" });
  }
});

router.get("/stores/:storeId", async (req, res) => {
  try {
    const { storeId } = GetStoreParams.parse(req.params);
    const [store] = await db
      .select({
        id: storesTable.id,
        name: storesTable.name,
        description: storesTable.description,
        address: storesTable.address,
        city: storesTable.city,
        category: storesTable.category,
        lat: storesTable.lat,
        lng: storesTable.lng,
        imageUrl: storesTable.imageUrl,
        phone: storesTable.phone,
        openTime: storesTable.openTime,
        closeTime: storesTable.closeTime,
        rating: storesTable.rating,
        isActive: storesTable.isActive,
        ownerId: storesTable.ownerId,
        createdAt: storesTable.createdAt,
        totalBagsAvailable: sql<number>`COALESCE(SUM(CASE WHEN ${surpriseBagsTable.isActive} = true THEN ${surpriseBagsTable.stockCount} ELSE 0 END), 0)`.as("totalBagsAvailable"),
      })
      .from(storesTable)
      .leftJoin(surpriseBagsTable, eq(storesTable.id, surpriseBagsTable.storeId))
      .where(eq(storesTable.id, storeId))
      .groupBy(storesTable.id);

    if (!store) {
      res.status(404).json({ error: "not_found", message: "Store not found" });
      return;
    }
    res.json(store);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal_error", message: "Failed to fetch store" });
  }
});

router.put("/stores/:storeId", async (req, res) => {
  try {
    const { storeId } = UpdateStoreParams.parse(req.params);
    const body = UpdateStoreBody.parse(req.body);

    const [updated] = await db
      .update(storesTable)
      .set(body)
      .where(eq(storesTable.id, storeId))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "not_found", message: "Store not found" });
      return;
    }
    res.json({ ...updated, totalBagsAvailable: 0 });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "bad_request", message: "Invalid update data" });
  }
});

export default router;
