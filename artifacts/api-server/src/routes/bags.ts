import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { surpriseBagsTable, storesTable } from "@workspace/db/schema";
import { eq, and, sql } from "drizzle-orm";
import {
  ListStoreBagsParams,
  CreateBagParams,
  CreateBagBody,
  GetBagParams,
  UpdateBagParams,
  UpdateBagBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

// 受取時間が過ぎていないか判定するSQL条件（JST基準）
// - pickupEnd が NULL → 制限なし（常に表示）
// - 出品された日が今日 かつ pickupEnd が現在時刻以降 → 表示
// - 出品された日が今日ではない（昨日以前） → 非表示（期限切れ）
const notExpiredCondition = sql`(
  ${surpriseBagsTable.pickupEnd} IS NULL
  OR (
    DATE(${surpriseBagsTable.createdAt} AT TIME ZONE 'Asia/Tokyo') = DATE(NOW() AT TIME ZONE 'Asia/Tokyo')
    AND ${surpriseBagsTable.pickupEnd} >= TO_CHAR(NOW() AT TIME ZONE 'Asia/Tokyo', 'HH24:MI')
  )
)`;

router.get("/bags", async (_req, res) => {
  try {
    const bags = await db
      .select({
        id: surpriseBagsTable.id,
        storeId: surpriseBagsTable.storeId,
        title: surpriseBagsTable.title,
        description: surpriseBagsTable.description,
        originalPrice: surpriseBagsTable.originalPrice,
        discountedPrice: surpriseBagsTable.discountedPrice,
        stockCount: surpriseBagsTable.stockCount,
        pickupStart: surpriseBagsTable.pickupStart,
        pickupEnd: surpriseBagsTable.pickupEnd,
        isActive: surpriseBagsTable.isActive,
        createdAt: surpriseBagsTable.createdAt,
        store: storesTable,
      })
      .from(surpriseBagsTable)
      .innerJoin(storesTable, eq(surpriseBagsTable.storeId, storesTable.id))
      .where(and(
        eq(surpriseBagsTable.isActive, true),
        eq(storesTable.isActive, true),
        notExpiredCondition,
      ));

    const result = bags.map((b) => ({
      ...b,
      store: { ...b.store, totalBagsAvailable: b.stockCount },
    }));
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal_error", message: "Failed to fetch bags" });
  }
});

router.get("/bags/:bagId", async (req, res) => {
  try {
    const { bagId } = GetBagParams.parse(req.params);
    const [bag] = await db
      .select({
        id: surpriseBagsTable.id,
        storeId: surpriseBagsTable.storeId,
        title: surpriseBagsTable.title,
        description: surpriseBagsTable.description,
        originalPrice: surpriseBagsTable.originalPrice,
        discountedPrice: surpriseBagsTable.discountedPrice,
        stockCount: surpriseBagsTable.stockCount,
        pickupStart: surpriseBagsTable.pickupStart,
        pickupEnd: surpriseBagsTable.pickupEnd,
        isActive: surpriseBagsTable.isActive,
        createdAt: surpriseBagsTable.createdAt,
        store: storesTable,
      })
      .from(surpriseBagsTable)
      .innerJoin(storesTable, eq(surpriseBagsTable.storeId, storesTable.id))
      .where(eq(surpriseBagsTable.id, bagId));

    if (!bag) {
      res.status(404).json({ error: "not_found", message: "Bag not found" });
      return;
    }

    // 受取時間チェック：期限切れなら 410 Gone を返す
    if (bag.pickupEnd) {
      const nowJST = new Date(Date.now() + 9 * 60 * 60 * 1000);
      const createdJST = new Date(bag.createdAt.getTime() + 9 * 60 * 60 * 1000);
      const isToday =
        nowJST.toISOString().slice(0, 10) === createdJST.toISOString().slice(0, 10);
      const currentTime = nowJST.toISOString().slice(11, 16); // "HH:MM"

      if (!isToday || currentTime > bag.pickupEnd) {
        res.status(410).json({ error: "expired", message: "この商品の受取時間が過ぎています" });
        return;
      }
    }

    res.json({ ...bag, store: { ...bag.store, totalBagsAvailable: bag.stockCount } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal_error", message: "Failed to fetch bag" });
  }
});

router.get("/stores/:storeId/bags", async (req, res) => {
  try {
    const { storeId } = ListStoreBagsParams.parse(req.params);
    const bags = await db
      .select()
      .from(surpriseBagsTable)
      .where(eq(surpriseBagsTable.storeId, storeId));
    res.json(bags);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal_error", message: "Failed to fetch store bags" });
  }
});

router.post("/stores/:storeId/bags", async (req, res) => {
  try {
    const { storeId } = CreateBagParams.parse(req.params);
    const body = CreateBagBody.parse(req.body);
    const [bag] = await db.insert(surpriseBagsTable).values({
      storeId,
      title: body.title,
      description: body.description ?? null,
      originalPrice: Number(body.originalPrice),
      discountedPrice: Number(body.discountedPrice),
      stockCount: Number(body.stockCount),
      pickupStart: body.pickupStart ?? null,
      pickupEnd: body.pickupEnd ?? null,
      isActive: true,
    }).returning();
    res.status(201).json(bag);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "bad_request", message: "Invalid bag data" });
  }
});

router.put("/bags/:bagId", async (req, res) => {
  try {
    const { bagId } = UpdateBagParams.parse(req.params);
    const body = UpdateBagBody.parse(req.body);

    const [updated] = await db
      .update(surpriseBagsTable)
      .set(body)
      .where(eq(surpriseBagsTable.id, bagId))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "not_found", message: "Bag not found" });
      return;
    }
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "bad_request", message: "Invalid update data" });
  }
});

export default router;
