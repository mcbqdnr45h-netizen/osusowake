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

/**
 * バッグが期限切れかどうかを判定する（深夜またぎ対応）
 * - pickupEnd が null → 期限なし（false）
 * - 通常バッグ（pickupEnd >= pickupStart）: 今日作成 かつ 現在時刻 > pickupEnd なら期限切れ
 * - 深夜またぎバッグ（pickupEnd < pickupStart 例: 23:00〜01:00）:
 *     今日作成 → 翌日の pickupEnd まで有効（期限切れにならない）
 *     昨日作成 → 今日の pickupEnd を過ぎたら期限切れ
 */
export function isBagExpired(bag: {
  pickupEnd: string | null;
  pickupStart: string | null;
  createdAt: Date;
}): boolean {
  if (!bag.pickupEnd) return false;

  const nowJST      = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const createdJST  = new Date(bag.createdAt.getTime() + 9 * 60 * 60 * 1000);
  const todayStr    = nowJST.toISOString().slice(0, 10);
  const yesterdayStr = new Date(nowJST.getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const createdStr  = createdJST.toISOString().slice(0, 10);
  const currentTime = nowJST.toISOString().slice(11, 16); // "HH:MM"

  const isOvernightBag = bag.pickupStart != null && bag.pickupEnd < bag.pickupStart;

  if (isOvernightBag) {
    if (createdStr === todayStr) {
      // 今日出品した深夜またぎバッグ → 翌日の pickupEnd まで有効
      return false;
    } else if (createdStr === yesterdayStr) {
      // 昨日出品した深夜またぎバッグ → 今日の pickupEnd を過ぎたら期限切れ
      return currentTime > bag.pickupEnd;
    }
    return true; // 2日以上前は期限切れ
  }

  // 通常バッグ
  if (createdStr !== todayStr) return true;
  return currentTime > bag.pickupEnd;
}

// 受取時間が過ぎていないか判定するSQL条件（JST基準）
// - pickupEnd が NULL           → 常に表示
// - 通常バッグ（同日）          → 今日作成 かつ pickupEnd >= 現在時刻
// - 深夜またぎバッグ            → pickupEnd < pickupStart のとき翌日まで表示
//   例）pickupStart=23:00, pickupEnd=01:00 → 翌1時まで表示
const notExpiredCondition = sql`(
  ${surpriseBagsTable.pickupEnd} IS NULL

  OR (
    -- 通常ケース：今日出品 かつ pickupEnd が現在時刻以降
    DATE(${surpriseBagsTable.createdAt} AT TIME ZONE 'Asia/Tokyo') = DATE(NOW() AT TIME ZONE 'Asia/Tokyo')
    AND ${surpriseBagsTable.pickupEnd} >= ${surpriseBagsTable.pickupStart}
    AND ${surpriseBagsTable.pickupEnd} >= TO_CHAR(NOW() AT TIME ZONE 'Asia/Tokyo', 'HH24:MI')
  )

  OR (
    -- 深夜またぎ（今日出品）: pickupEnd < pickupStart → 翌日の pickupEnd まで常に表示
    DATE(${surpriseBagsTable.createdAt} AT TIME ZONE 'Asia/Tokyo') = DATE(NOW() AT TIME ZONE 'Asia/Tokyo')
    AND ${surpriseBagsTable.pickupEnd} < ${surpriseBagsTable.pickupStart}
  )

  OR (
    -- 深夜またぎ（昨日出品）: 翌日の今 pickupEnd を過ぎていない
    DATE(${surpriseBagsTable.createdAt} AT TIME ZONE 'Asia/Tokyo') = DATE(NOW() AT TIME ZONE 'Asia/Tokyo') - INTERVAL '1 day'
    AND ${surpriseBagsTable.pickupEnd} < ${surpriseBagsTable.pickupStart}
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
        sql`(${storesTable.isActive} = true OR ${storesTable.status} = 'approved')`,
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

    // 受取時間チェック：期限切れなら 410 Gone（深夜またぎ対応）
    if (isBagExpired(bag)) {
      res.status(410).json({ error: "expired", message: "この商品の受取時間が過ぎています" });
      return;
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
      isActive: false,
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

// 店舗オーナーによる個別バッグ更新（公開/非公開トグルなど）
// storeId を含めることで所有権チェックを行う
router.patch("/stores/:storeId/bags/:bagId", async (req, res) => {
  try {
    const storeId = parseInt(req.params.storeId, 10);
    const bagId = parseInt(req.params.bagId, 10);
    if (isNaN(storeId) || isNaN(bagId)) {
      res.status(400).json({ error: "bad_request", message: "Invalid storeId or bagId" });
      return;
    }

    const body = UpdateBagBody.parse(req.body);

    const [updated] = await db
      .update(surpriseBagsTable)
      .set(body)
      .where(and(
        eq(surpriseBagsTable.id, bagId),
        eq(surpriseBagsTable.storeId, storeId),
      ))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "not_found", message: "Bag not found or not owned by this store" });
      return;
    }
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "bad_request", message: "Invalid update data" });
  }
});

export default router;
