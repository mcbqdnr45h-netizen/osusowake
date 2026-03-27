import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { surpriseBagsTable, storesTable, reservationsTable, favoritesTable, notificationsTable, reviewsTable } from "@workspace/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { releaseExpiredCartReservations } from "./reservations";
import { sendWebPushToUsers } from "../lib/push.js";
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
//
// 方針：バッグは「当日（JST）に作成されたもの」だけを表示する。
//       過去日付の出品は絶対に表示しない。
//       ただし深夜またぎバッグ（pickupEnd < pickupStart, 例: 22:00〜02:00）は
//       前日に作成されたものも翌日の pickupEnd まで表示継続する。
//
// ┌─────────────────────────────────────────────────────────────────────────┐
// │ CASE 1: pickupEnd IS NULL                                               │
// │   → 受取時間制限なし。今日作成 (JST) なら常に表示。                         │
// ├─────────────────────────────────────────────────────────────────────────┤
// │ CASE 2: 通常バッグ (pickupEnd >= pickupStart, 例: 09:00〜20:00)          │
// │   → 今日作成 (JST) かつ pickupEnd が現在時刻以降ならば表示。                │
// ├─────────────────────────────────────────────────────────────────────────┤
// │ CASE 3: 深夜またぎバッグ (pickupEnd < pickupStart, 例: 22:00〜02:00)     │
// │   a) 今日作成 (JST): 現在時刻に関わらず表示（pickupEnd になるまで）          │
// │   b) 昨日作成 (JST): pickupEnd がまだ来ていないなら表示（翌日02:00まで等）   │
// └─────────────────────────────────────────────────────────────────────────┘
const TODAY_JST  = sql`DATE(NOW() AT TIME ZONE 'Asia/Tokyo')`;
const NOW_TIME   = sql`TO_CHAR(NOW() AT TIME ZONE 'Asia/Tokyo', 'HH24:MI')`;
const CREATED_JST = sql`DATE(${surpriseBagsTable.createdAt} AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo')`;

const notExpiredCondition = sql`(
  (
    -- CASE 1: 受取時間制限なし → 今日作成 (JST) なら表示
    ${surpriseBagsTable.pickupEnd} IS NULL
    AND ${CREATED_JST} = ${TODAY_JST}
  )

  OR (
    -- CASE 2: 通常バッグ → 今日作成 (JST) かつ pickupEnd が現在時刻以降
    ${surpriseBagsTable.pickupEnd} IS NOT NULL
    AND ${surpriseBagsTable.pickupEnd} >= ${surpriseBagsTable.pickupStart}
    AND ${CREATED_JST} = ${TODAY_JST}
    AND ${surpriseBagsTable.pickupEnd} >= ${NOW_TIME}
  )

  OR (
    -- CASE 3a: 深夜またぎ・今日作成 → 常に表示（pickupEnd 到達まで翌日も継続）
    ${surpriseBagsTable.pickupEnd} IS NOT NULL
    AND ${surpriseBagsTable.pickupEnd} < ${surpriseBagsTable.pickupStart}
    AND ${CREATED_JST} = ${TODAY_JST}
  )

  OR (
    -- CASE 3b: 深夜またぎ・昨日作成 → 今日の pickupEnd がまだ来ていないなら表示
    ${surpriseBagsTable.pickupEnd} IS NOT NULL
    AND ${surpriseBagsTable.pickupEnd} < ${surpriseBagsTable.pickupStart}
    AND ${CREATED_JST} = ${TODAY_JST} - INTERVAL '1 day'
    AND ${surpriseBagsTable.pickupEnd} >= ${NOW_TIME}
  )
)`;

router.get("/bags", async (_req, res) => {
  // 期限切れ仮押さえを非同期で清算（レスポンスはブロックしない）
  releaseExpiredCartReservations().catch(() => {});
  try {
    const bags = await db
      .select({
        id: surpriseBagsTable.id,
        storeId: surpriseBagsTable.storeId,
        title: surpriseBagsTable.title,
        description: surpriseBagsTable.description,
        allergyInfo: surpriseBagsTable.allergyInfo,
        pickupNote: surpriseBagsTable.pickupNote,
        originalPrice: surpriseBagsTable.originalPrice,
        discountedPrice: surpriseBagsTable.discountedPrice,
        stockCount: surpriseBagsTable.stockCount,
        pickupStart: surpriseBagsTable.pickupStart,
        pickupEnd: surpriseBagsTable.pickupEnd,
        imageUrl: surpriseBagsTable.imageUrl,
        category: surpriseBagsTable.category,
        isActive: surpriseBagsTable.isActive,
        createdAt: surpriseBagsTable.createdAt,
        store: storesTable,
        storeAvgRating: sql<number | null>`(SELECT ROUND(AVG(r.rating)::numeric, 1) FROM reviews r WHERE r.store_id = ${storesTable.id})`,
        storeReviewCount: sql<number>`(SELECT COUNT(*)::integer FROM reviews r WHERE r.store_id = ${storesTable.id})`,
      })
      .from(surpriseBagsTable)
      .innerJoin(storesTable, eq(surpriseBagsTable.storeId, storesTable.id))
      .where(and(
        eq(surpriseBagsTable.isActive, true),
        sql`${storesTable.status} = 'approved' AND ${storesTable.isActive} = true`,
        notExpiredCondition,
      ));

    const result = bags.map(({ storeAvgRating, storeReviewCount, ...b }) => ({
      ...b,
      store: { ...b.store, totalBagsAvailable: b.stockCount, avgRating: storeAvgRating, reviewCount: storeReviewCount },
    }));
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal_error", message: "Failed to fetch bags" });
  }
});

router.get("/bags/:bagId", async (req, res) => {
  releaseExpiredCartReservations().catch(() => {});
  try {
    const { bagId } = GetBagParams.parse(req.params);
    const [bag] = await db
      .select({
        id: surpriseBagsTable.id,
        storeId: surpriseBagsTable.storeId,
        title: surpriseBagsTable.title,
        description: surpriseBagsTable.description,
        allergyInfo: surpriseBagsTable.allergyInfo,
        pickupNote: surpriseBagsTable.pickupNote,
        originalPrice: surpriseBagsTable.originalPrice,
        discountedPrice: surpriseBagsTable.discountedPrice,
        stockCount: surpriseBagsTable.stockCount,
        pickupStart: surpriseBagsTable.pickupStart,
        pickupEnd: surpriseBagsTable.pickupEnd,
        imageUrl: surpriseBagsTable.imageUrl,
        category: surpriseBagsTable.category,
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
    if (!body.pickupEnd || body.pickupEnd.trim() === '') {
      return res.status(400).json({ error: "bad_request", message: "受取終了時間（pickupEnd）は必須です" });
    }
    const [bag] = await db.insert(surpriseBagsTable).values({
      storeId,
      title: body.title,
      description: body.description ?? null,
      originalPrice: Number(body.originalPrice),
      discountedPrice: Number(body.discountedPrice),
      stockCount: Number(body.stockCount),
      pickupStart: body.pickupStart ?? null,
      pickupEnd: body.pickupEnd ?? null,
      imageUrl: body.imageUrl ?? null,
      category: body.category ?? null,
      allergyInfo: body.allergyInfo ?? null,
      pickupNote: body.pickupNote ?? null,
      isActive: true,
    }).returning();

    res.status(201).json(bag);

    // お気に入りユーザーへの通知（非同期・レスポンス後）
    try {
      const [store] = await db
        .select({ name: storesTable.name })
        .from(storesTable)
        .where(eq(storesTable.id, storeId))
        .limit(1);

      const fanRows = await db
        .select({ userId: favoritesTable.userId })
        .from(favoritesTable)
        .where(eq(favoritesTable.storeId, storeId));

      if (fanRows.length > 0 && store) {
        const priceLabel = `¥${Number(body.discountedPrice).toLocaleString()}`;
        const notifTitle = `🛍️ ${store.name} が新しいおすそ分けを出品`;
        const notifBody  = `「${body.title}」${priceLabel}〜 在庫: ${body.stockCount}個`;
        await db.insert(notificationsTable).values(
          fanRows.map(f => ({
            userId: f.userId,
            type:   "new_bag",
            title:  notifTitle,
            body:   notifBody,
          }))
        );
        // Web Push（アプリ外通知）
        await sendWebPushToUsers(fanRows.map(f => f.userId), {
          title: notifTitle,
          body:  notifBody,
          tag:   `new-bag-${storeId}`,
          url:   `/stores/${storeId}`,
        });
        console.log(`[bags] notified ${fanRows.length} favorite users for store ${storeId}`);
      }
    } catch (notifErr) {
      console.error("[bags] notification error (non-fatal):", notifErr);
    }
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

// 非公開バッグの削除（isActive=false のものだけ削除可能）
router.delete("/stores/:storeId/bags/:bagId", async (req, res) => {
  try {
    const storeId = parseInt(req.params.storeId, 10);
    const bagId = parseInt(req.params.bagId, 10);
    if (isNaN(storeId) || isNaN(bagId)) {
      res.status(400).json({ error: "bad_request", message: "Invalid storeId or bagId" });
      return;
    }

    // 対象バッグを取得して所有権・公開状態を確認
    const [bag] = await db
      .select()
      .from(surpriseBagsTable)
      .where(and(
        eq(surpriseBagsTable.id, bagId),
        eq(surpriseBagsTable.storeId, storeId),
      ));

    if (!bag) {
      res.status(404).json({ error: "not_found", message: "Bag not found or not owned by this store" });
      return;
    }
    if (bag.isActive) {
      res.status(409).json({ error: "conflict", message: "公開中の商品は削除できません。先に非公開にしてください。" });
      return;
    }

    // トランザクション内で関連予約を先に削除 → バッグを削除
    await db.transaction(async (tx) => {
      await tx
        .delete(reservationsTable)
        .where(eq(reservationsTable.bagId, bagId));

      await tx
        .delete(surpriseBagsTable)
        .where(eq(surpriseBagsTable.id, bagId));
    });

    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal_error", message: "Failed to delete bag" });
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
