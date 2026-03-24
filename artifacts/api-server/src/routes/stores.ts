import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { storesTable, surpriseBagsTable, reportsTable, reviewsTable, reservationsTable, notificationsTable } from "@workspace/db/schema";
import { eq, sql, and, gte, count, desc } from "drizzle-orm";
import { supabaseAdmin } from "../lib/supabase";
import {
  ListStoresQueryParams,
  CreateStoreBody,
  UpdateStoreBody,
  GetStoreParams,
  UpdateStoreParams,
} from "@workspace/api-zod";
import { Resend } from "resend";

const REPORT_TYPES = ["closed", "temp_closed", "wrong_hours", "wrong_info", "other"] as const;
type ReportType = typeof REPORT_TYPES[number];

/** 日本の電話番号を Stripe が要求する E.164 形式（+81...）に変換するサーバーサイド安全変換 */
function toE164Japan(phone: string): string {
  const digits = phone.replace(/[\s\-().]/g, '');
  if (digits.startsWith('+')) return digits;
  if (digits.startsWith('0')) return '+81' + digits.slice(1);
  return '+81' + digits;
}

const router: IRouter = Router();

const storeSelectFields = {
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
  status: storesTable.status,
  ownerId: storesTable.ownerId,
  licenseNumber: storesTable.licenseNumber,
  licenseImageUrl: storesTable.licenseImageUrl,
  idImageUrl: storesTable.idImageUrl,
  pledgeSigned: storesTable.pledgeSigned,
  createdAt: storesTable.createdAt,
  stripeAccountId: storesTable.stripeAccountId,
  holiday: storesTable.holiday,
  pickupHours: storesTable.pickupHours,
  totalBagsAvailable: sql<number>`COALESCE(SUM(CASE
    WHEN ${surpriseBagsTable.isActive} = true
      AND (
        ${surpriseBagsTable.pickupEnd} IS NULL
        OR (
          DATE(${surpriseBagsTable.createdAt} AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo') = DATE(NOW() AT TIME ZONE 'Asia/Tokyo')
          AND ${surpriseBagsTable.pickupEnd} >= ${surpriseBagsTable.pickupStart}
          AND ${surpriseBagsTable.pickupEnd} >= TO_CHAR(NOW() AT TIME ZONE 'Asia/Tokyo', 'HH24:MI')
        )
        OR (
          DATE(${surpriseBagsTable.createdAt} AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo') = DATE(NOW() AT TIME ZONE 'Asia/Tokyo')
          AND ${surpriseBagsTable.pickupEnd} < ${surpriseBagsTable.pickupStart}
        )
        OR (
          DATE(${surpriseBagsTable.createdAt} AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo') = DATE(NOW() AT TIME ZONE 'Asia/Tokyo') - INTERVAL '1 day'
          AND ${surpriseBagsTable.pickupEnd} < ${surpriseBagsTable.pickupStart}
          AND ${surpriseBagsTable.pickupEnd} >= TO_CHAR(NOW() AT TIME ZONE 'Asia/Tokyo', 'HH24:MI')
        )
      )
    THEN ${surpriseBagsTable.stockCount} ELSE 0 END), 0)`.as("totalBagsAvailable"),
};

// Public: list approved + pending_review stores (both are publicly visible)
router.get("/stores", async (req, res) => {
  try {
    ListStoresQueryParams.parse(req.query);

    const stores = await db
      .select(storeSelectFields)
      .from(storesTable)
      .leftJoin(surpriseBagsTable, eq(storesTable.id, surpriseBagsTable.storeId))
      .where(sql`${storesTable.status} IN ('approved', 'pending_review')`)
      .groupBy(storesTable.id);

    res.json(stores);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal_error", message: "Failed to fetch stores" });
  }
});

// Public: create a new store — immediately active (no manual approval needed)
router.post("/stores", async (req, res) => {
  try {
    const body = CreateStoreBody.parse(req.body);
    const [store] = await db.insert(storesTable).values({
      name: body.name,
      description: body.description ?? null,
      address: body.address,
      city: body.city,
      category: body.category,
      lat: Number(body.lat),
      lng: Number(body.lng),
      imageUrl: body.imageUrl ?? null,
      phone: body.phone ?? null,
      openTime: body.openTime ?? null,
      closeTime: body.closeTime ?? null,
      isActive: true,
      status: "approved",
    }).returning();
    res.status(201).json({ ...store, totalBagsAvailable: 0 });
  } catch (err) {
    console.error("Store creation error:", err);
    res.status(400).json({ error: "bad_request", message: "Invalid store data" });
  }
});

// Public: apply for store registration — sets status to "pending" for admin review
router.post("/stores/apply", async (req, res) => {
  try {
    const body = req.body;
    console.log("[/stores/apply] 申請受付 ownerId=", body.ownerId, "name=", body.name);

    if (!body.name || !body.address || !body.city || body.lat == null || body.lng == null) {
      console.warn("[/stores/apply] 必須フィールド不足", { name: body.name, address: body.address, city: body.city, lat: body.lat, lng: body.lng });
      return res.status(400).json({ error: "bad_request", message: "必須項目（店舗名・住所・市区町村・座標）が不足しています" });
    }
    if (!body.ownerId) {
      console.warn("[/stores/apply] ownerId が未設定。ログインが必要です。");
      return res.status(400).json({ error: "bad_request", message: "ログインが必要です（ownerId が未設定）" });
    }

    const [store] = await db.insert(storesTable).values({
      name: body.name,
      description: body.description ?? null,
      address: body.address,
      city: body.city,
      category: body.category ?? "other",
      lat: Number(body.lat),
      lng: Number(body.lng),
      imageUrl: body.imageUrl ?? null,
      phone: body.phone ?? null,
      isActive: false,
      status: "pending",
      ownerId: body.ownerId,
      licenseNumber: body.licenseNumber ?? null,
      licenseImageUrl: body.licenseImageUrl ?? null,
      idImageUrl: body.idImageUrl ?? null,
      pledgeSigned: body.pledgeSigned === true,
    }).returning();

    console.log("[/stores/apply] ✅ 店舗作成成功 id=", store.id, "ownerId=", store.ownerId);
    res.status(201).json({ ...store, totalBagsAvailable: 0 });
  } catch (err) {
    console.error("[/stores/apply] DB INSERT エラー:", err);
    res.status(500).json({ error: "internal_error", message: "店舗情報の保存に失敗しました。もう一度お試しください。" });
  }
});

// Public: upload a store document image to Supabase Storage
router.post("/stores/upload-document", async (req, res) => {
  try {
    const { imageBase64, fileType, userId } = req.body;

    if (!imageBase64 || !fileType || !userId) {
      return res.status(400).json({ error: "bad_request", message: "imageBase64, fileType, userId は必須です" });
    }

    // Extract MIME type and raw base64 data
    const match = imageBase64.match(/^data:(image\/[\w+]+);base64,(.+)$/s);
    if (!match) {
      return res.status(400).json({ error: "bad_request", message: "無効な画像データ形式です" });
    }

    const contentType = match[1];
    const ext = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
    const buffer = Buffer.from(match[2], "base64");

    const filePath = `${userId}/${Date.now()}-${fileType}.${ext}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("store-documents")
      .upload(filePath, buffer, { contentType, upsert: false });

    if (uploadError) {
      console.error("[upload-document] Storage upload error:", uploadError);
      return res.status(500).json({ error: "upload_failed", message: uploadError.message });
    }

    // Generate a long-lived signed URL (10 years) for admin review
    const { data: signedData, error: signedError } = await supabaseAdmin.storage
      .from("store-documents")
      .createSignedUrl(filePath, 60 * 60 * 24 * 365 * 10);

    if (signedError) {
      console.warn("[upload-document] Failed to create signed URL:", signedError.message);
    }

    console.log("[upload-document] ✅ Uploaded:", filePath);
    res.json({ path: filePath, url: signedData?.signedUrl ?? `storage://${filePath}` });
  } catch (err) {
    console.error("[upload-document] Error:", err);
    res.status(500).json({ error: "internal_error", message: "アップロードに失敗しました" });
  }
});

// Public: auto-review a store application — runs validation and approves if all checks pass
router.post("/stores/:storeId/auto-review", async (req, res) => {
  try {
    const storeId = parseInt(req.params.storeId);
    const [store] = await db
      .select()
      .from(storesTable)
      .where(eq(storesTable.id, storeId));

    if (!store) {
      return res.status(404).json({ error: "not_found", message: "Store not found" });
    }

    // 審査チェック項目
    const checks = [
      { key: "basic_info",   label: "基本情報",       passed: !!(store.name && store.address && store.city && store.lat && store.lng) },
      { key: "license",      label: "営業許可証番号",   passed: !!store.licenseNumber },
      { key: "license_img",  label: "営業許可証（写真）", passed: !!store.licenseImageUrl },
      { key: "id_img",       label: "本人確認書類",     passed: !!store.idImageUrl },
      { key: "pledge",       label: "誓約書への同意",   passed: store.pledgeSigned === true },
    ];

    const allPassed = checks.every(c => c.passed);

    if (allPassed) {
      // 全チェック通過 → 自動承認
      const [approved] = await db
        .update(storesTable)
        .set({ status: "approved", isActive: true })
        .where(eq(storesTable.id, storeId))
        .returning();

      console.log(`✅ Auto-approved store ${storeId}: ${store.name}`);
      return res.json({ approved: true, checks, store: approved });
    }

    // 未通過がある場合は pending のまま
    const failed = checks.filter(c => !c.passed).map(c => c.label);
    return res.json({ approved: false, checks, reason: `未記入の項目があります: ${failed.join(', ')}` });
  } catch (err) {
    console.error("Auto-review error:", err);
    res.status(500).json({ error: "internal_error", message: "Review failed" });
  }
});

// Public: get the store owned by a specific user
router.get("/stores/by-owner", async (req, res) => {
  try {
    const userId = req.query.userId as string;
    if (!userId) {
      return res.status(400).json({ error: "bad_request", message: "userId is required" });
    }
    const [store] = await db
      .select(storeSelectFields)
      .from(storesTable)
      .leftJoin(surpriseBagsTable, eq(storesTable.id, surpriseBagsTable.storeId))
      .where(eq(storesTable.ownerId, userId))
      .groupBy(storesTable.id)
      .orderBy(desc(storesTable.id))
      .limit(1);

    if (!store) {
      return res.status(404).json({ error: "not_found", message: "No store found for this user" });
    }
    res.json(store);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal_error", message: "Failed to fetch store by owner" });
  }
});

// Admin: list all pending stores awaiting approval
router.get("/admin/stores/pending", async (_req, res) => {
  try {
    const stores = await db
      .select(storeSelectFields)
      .from(storesTable)
      .leftJoin(surpriseBagsTable, eq(storesTable.id, surpriseBagsTable.storeId))
      .where(eq(storesTable.status, "pending"))
      .groupBy(storesTable.id)
      .orderBy(storesTable.createdAt);

    res.json(stores);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal_error", message: "Failed to fetch pending stores" });
  }
});

// Admin: list all stores (all statuses)
router.get("/admin/stores", async (_req, res) => {
  try {
    const stores = await db
      .select(storeSelectFields)
      .from(storesTable)
      .leftJoin(surpriseBagsTable, eq(storesTable.id, surpriseBagsTable.storeId))
      .groupBy(storesTable.id)
      .orderBy(storesTable.createdAt);

    res.json(stores);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal_error", message: "Failed to fetch stores" });
  }
});

// Admin: approve a store
router.post("/admin/stores/:storeId/approve", async (req, res) => {
  try {
    const storeId = Number(req.params.storeId);
    if (isNaN(storeId)) {
      res.status(400).json({ error: "bad_request", message: "Invalid store ID" });
      return;
    }
    const [updated] = await db
      .update(storesTable)
      .set({ status: "approved" })
      .where(eq(storesTable.id, storeId))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "not_found", message: "Store not found" });
      return;
    }
    res.json({ ...updated, totalBagsAvailable: 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal_error", message: "Failed to approve store" });
  }
});

// Admin: reject a store
router.post("/admin/stores/:storeId/reject", async (req, res) => {
  try {
    const storeId = Number(req.params.storeId);
    if (isNaN(storeId)) {
      res.status(400).json({ error: "bad_request", message: "Invalid store ID" });
      return;
    }
    const [updated] = await db
      .update(storesTable)
      .set({ status: "rejected" })
      .where(eq(storesTable.id, storeId))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "not_found", message: "Store not found" });
      return;
    }
    res.json({ ...updated, totalBagsAvailable: 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal_error", message: "Failed to reject store" });
  }
});

router.get("/stores/:storeId", async (req, res) => {
  try {
    const { storeId } = GetStoreParams.parse(req.params);
    const [store] = await db
      .select(storeSelectFields)
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

// User: report a store
router.post("/stores/:storeId/report", async (req, res) => {
  try {
    const storeId = Number(req.params.storeId);
    if (isNaN(storeId)) {
      res.status(400).json({ error: "bad_request", message: "Invalid store ID" });
      return;
    }

    const { userId, reportType, comment } = req.body as {
      userId?: string;
      reportType?: string;
      comment?: string;
    };

    if (!userId || typeof userId !== "string" || userId.trim() === "") {
      res.status(401).json({ error: "unauthorized", message: "userId is required" });
      return;
    }
    if (!reportType || !REPORT_TYPES.includes(reportType as ReportType)) {
      res.status(400).json({ error: "bad_request", message: "Invalid reportType" });
      return;
    }

    // Rate limit: reject if same user already reported this store within 24h
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [existing] = await db
      .select({ id: reportsTable.id })
      .from(reportsTable)
      .where(
        and(
          eq(reportsTable.storeId, storeId),
          eq(reportsTable.userId, userId),
          gte(reportsTable.createdAt, since)
        )
      )
      .limit(1);

    if (existing) {
      res.status(429).json({ error: "rate_limited", message: "You already reported this store recently" });
      return;
    }

    // Save the report
    const [report] = await db.insert(reportsTable).values({
      storeId,
      userId,
      reportType: reportType as ReportType,
      comment: comment?.trim() || null,
    }).returning();

    // Auto-flag: count total reports for this store
    const [{ total }] = await db
      .select({ total: count() })
      .from(reportsTable)
      .where(eq(reportsTable.storeId, storeId));

    if (Number(total) >= 3) {
      // Set store status to pending_review so admin gets notified
      await db
        .update(storesTable)
        .set({ status: "pending_review" })
        .where(
          and(
            eq(storesTable.id, storeId),
            eq(storesTable.status, "approved")
          )
        );
    }

    res.status(201).json({ success: true, report });
  } catch (err) {
    console.error("Report error:", err);
    res.status(500).json({ error: "internal_error", message: "Failed to save report" });
  }
});

// Admin: list all reports with store names
router.get("/admin/reports", async (_req, res) => {
  try {
    const reports = await db
      .select({
        id: reportsTable.id,
        storeId: reportsTable.storeId,
        storeName: storesTable.name,
        storeStatus: storesTable.status,
        userId: reportsTable.userId,
        reportType: reportsTable.reportType,
        comment: reportsTable.comment,
        createdAt: reportsTable.createdAt,
      })
      .from(reportsTable)
      .leftJoin(storesTable, eq(reportsTable.storeId, storesTable.id))
      .orderBy(reportsTable.createdAt);

    res.json(reports);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal_error", message: "Failed to fetch reports" });
  }
});

// Admin: dismiss reports for a store (reset pending_review → approved)
router.post("/admin/stores/:storeId/dismiss-reports", async (req, res) => {
  try {
    const storeId = Number(req.params.storeId);
    if (isNaN(storeId)) {
      res.status(400).json({ error: "bad_request", message: "Invalid store ID" });
      return;
    }
    const [updated] = await db
      .update(storesTable)
      .set({ status: "approved" })
      .where(eq(storesTable.id, storeId))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "not_found", message: "Store not found" });
      return;
    }
    res.json({ success: true, store: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal_error", message: "Failed to dismiss reports" });
  }
});

// Public: get reviews for a store (with avg rating + count)
router.get("/stores/:storeId/reviews", async (req, res) => {
  try {
    const storeId = Number(req.params.storeId);
    if (isNaN(storeId)) {
      res.status(400).json({ error: "bad_request", message: "Invalid store ID" });
      return;
    }
    const reviews = await db
      .select({
        id: reviewsTable.id,
        reservationId: reviewsTable.reservationId,
        userId: reviewsTable.userId,
        rating: reviewsTable.rating,
        comment: reviewsTable.comment,
        createdAt: reviewsTable.createdAt,
      })
      .from(reviewsTable)
      .where(eq(reviewsTable.storeId, storeId))
      .orderBy(desc(reviewsTable.createdAt));

    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : null;

    res.json({
      reviews,
      avgRating: avgRating !== null ? Math.round(avgRating * 10) / 10 : null,
      count: reviews.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal_error", message: "Failed to fetch reviews" });
  }
});

// User: post a review (must have a picked_up reservation for this store)
router.post("/stores/:storeId/reviews", async (req, res) => {
  try {
    const storeId = Number(req.params.storeId);
    if (isNaN(storeId)) {
      res.status(400).json({ error: "bad_request", message: "Invalid store ID" });
      return;
    }

    const { userId, reservationId, rating, comment } = req.body as {
      userId?: string;
      reservationId?: number;
      rating?: number;
      comment?: string;
    };

    if (!userId || typeof userId !== "string" || userId.trim() === "") {
      res.status(401).json({ error: "unauthorized", message: "userId is required" });
      return;
    }
    if (!reservationId || typeof reservationId !== "number") {
      res.status(400).json({ error: "bad_request", message: "reservationId is required" });
      return;
    }
    if (!rating || typeof rating !== "number" || rating < 1 || rating > 5) {
      res.status(400).json({ error: "bad_request", message: "rating must be 1-5" });
      return;
    }

    // Verify reservation is picked_up and belongs to this user + store
    const [reservation] = await db
      .select({ id: reservationsTable.id, status: reservationsTable.status })
      .from(reservationsTable)
      .where(
        and(
          eq(reservationsTable.id, reservationId),
          eq(reservationsTable.userId, userId),
          eq(reservationsTable.storeId, storeId),
          eq(reservationsTable.status, "picked_up")
        )
      )
      .limit(1);

    if (!reservation) {
      res.status(403).json({ error: "forbidden", message: "No valid picked_up reservation found" });
      return;
    }

    // Prevent duplicate reviews for the same reservation
    const [existingReview] = await db
      .select({ id: reviewsTable.id })
      .from(reviewsTable)
      .where(eq(reviewsTable.reservationId, reservationId))
      .limit(1);

    if (existingReview) {
      res.status(409).json({ error: "conflict", message: "Review already submitted for this reservation" });
      return;
    }

    const [review] = await db.insert(reviewsTable).values({
      storeId,
      reservationId,
      userId,
      rating,
      comment: comment?.trim() || null,
    }).returning();

    res.status(201).json({ success: true, review });
  } catch (err) {
    console.error("Review error:", err);
    res.status(500).json({ error: "internal_error", message: "Failed to save review" });
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

// GET /api/stores/:storeId/today-sales
// 今日の売上（手数料25%控除後の店舗受取額）を Stripe Transfers から取得
router.get("/stores/:storeId/today-sales", async (req, res) => {
  try {
    const storeId = parseInt(req.params.storeId);
    if (isNaN(storeId)) {
      res.status(400).json({ error: "bad_request", message: "Invalid storeId" });
      return;
    }

    const [store] = await db
      .select({ stripeAccountId: storesTable.stripeAccountId, name: storesTable.name })
      .from(storesTable)
      .where(eq(storesTable.id, storeId));

    if (!store) {
      res.status(404).json({ error: "not_found", message: "Store not found" });
      return;
    }

    if (!store.stripeAccountId) {
      res.json({ gross: 0, platformFee: 0, net: 0, count: 0, connected: false });
      return;
    }

    const stripeKey = process.env["STRIPE_SECRET_KEY"];
    if (!stripeKey) {
      res.json({ gross: 0, platformFee: 0, net: 0, count: 0, connected: true, noKey: true });
      return;
    }

    const stripeLib = await import("stripe");
    const stripe = new stripeLib.default(stripeKey);

    // 今日の0時（JST）のUNIXタイムスタンプを計算
    const nowJST = new Date(Date.now() + 9 * 60 * 60 * 1000);
    const todayStrJST = nowJST.toISOString().slice(0, 10); // "YYYY-MM-DD"
    const startOfDayUTC = new Date(todayStrJST + "T00:00:00+09:00");
    const startUnix = Math.floor(startOfDayUTC.getTime() / 1000);

    // 連携アカウントへの今日のTransfer一覧を取得
    const transfers = await stripe.transfers.list({
      destination: store.stripeAccountId,
      created: { gte: startUnix },
      limit: 100,
    });

    // JPY: amountは円単位
    const net = transfers.data.reduce((sum, t) => sum + t.amount, 0);
    // 店舗受取は売上の75%なので、元の総売上を逆算
    const gross = Math.round(net / 0.75);
    const platformFee = gross - net;

    res.json({
      gross,
      platformFee,
      net,
      count: transfers.data.length,
      connected: true,
    });
  } catch (err: any) {
    console.error("Today sales error:", err);
    res.status(500).json({ error: "stripe_error", message: "Failed to fetch today's sales" });
  }
});

// GET /api/stores/:storeId/connect/status
// Stripe アカウントのオンボーディング完了状況を返す
router.get("/stores/:storeId/connect/status", async (req, res) => {
  try {
    const storeId = parseInt(req.params.storeId);

    const [store] = await db
      .select({ stripeAccountId: storesTable.stripeAccountId })
      .from(storesTable)
      .where(eq(storesTable.id, storeId));

    if (!store) {
      res.status(404).json({ error: "not_found", message: "Store not found" });
      return;
    }

    if (!store.stripeAccountId) {
      res.json({ connected: false, detailsSubmitted: false, chargesEnabled: false, payoutsEnabled: false });
      return;
    }

    const stripeKey = process.env["STRIPE_SECRET_KEY"];
    if (!stripeKey) {
      // Stripe未設定でもアカウントIDがあれば connected=true として返す
      res.json({ connected: true, accountId: store.stripeAccountId, detailsSubmitted: false, chargesEnabled: false, payoutsEnabled: false });
      return;
    }

    const stripe = await import("stripe").then((m) => new m.default(stripeKey));
    const account = await stripe.accounts.retrieve(store.stripeAccountId);

    res.json({
      connected: true,
      accountId: store.stripeAccountId,
      detailsSubmitted: account.details_submitted,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      requirements: {
        currentlyDue: account.requirements?.currently_due ?? [],
        eventuallyDue: account.requirements?.eventually_due ?? [],
        errors: account.requirements?.errors ?? [],
        pendingVerification: account.requirements?.pending_verification ?? [],
        disabledReason: account.requirements?.disabled_reason ?? null,
      },
    });
  } catch (err: any) {
    // アカウントが削除されている場合など
    if (err?.code === "account_invalid" || err?.statusCode === 404) {
      res.json({ connected: false, detailsSubmitted: false, chargesEnabled: false, payoutsEnabled: false });
      return;
    }
    console.error("Stripe Connect status error:", err);
    res.status(500).json({ error: "stripe_error", message: "Failed to fetch connect status" });
  }
});

// ─── Stripe KYC 情報送信 ────────────────────────────────────────────────────
// PUT /api/stores/:storeId/connect/kyc
// 代表者情報・事業形態・事業内容を Stripe Account Update API に送信する
router.put("/stores/:storeId/connect/kyc", async (req, res) => {
  try {
    const storeId = parseInt(req.params.storeId);
    const { businessType, representative, businessProfile } = req.body as {
      businessType: "individual" | "company";
      representative: {
        firstNameKanji: string;
        lastNameKanji: string;
        firstNameKana: string;
        lastNameKana: string;
        dobYear: number;
        dobMonth: number;
        dobDay: number;
        postalCode: string;
        stateKanji: string;
        cityKanji: string;
        townKanji: string;
        line1Kanji?: string;
        stateKana: string;
        cityKana: string;
        townKana: string;
        line1Kana?: string;
        phone?: string;
        email?: string;
      };
      businessProfile: {
        productDescription?: string;
        url?: string;
      };
    };

    const stripeKey = process.env["STRIPE_SECRET_KEY"];
    if (!stripeKey) {
      res.status(503).json({ error: "stripe_not_configured", message: "Stripe が設定されていません" });
      return;
    }

    const [store] = await db
      .select({ stripeAccountId: storesTable.stripeAccountId, ownerId: storesTable.ownerId })
      .from(storesTable)
      .where(eq(storesTable.id, storeId));

    if (!store) {
      res.status(404).json({ error: "not_found", message: "店舗が見つかりません" });
      return;
    }

    if (!store.stripeAccountId) {
      res.status(400).json({ error: "no_stripe_account", message: "先に振込先口座を登録してください" });
      return;
    }

    const stripe = await import("stripe").then((m) => new m.default(stripeKey));

    // ── 住所オブジェクト（漢字）──
    const addressKanji: Record<string, string> = {
      postal_code: representative.postalCode,
      state:       representative.stateKanji,
      city:        representative.cityKanji,
      town:        representative.townKanji,
    };
    if (representative.line1Kanji) addressKanji["line1"] = representative.line1Kanji;

    // ── 住所オブジェクト（カナ）──
    const addressKana: Record<string, string> = {
      postal_code: representative.postalCode,
      state:       representative.stateKana,
      city:        representative.cityKana,
      town:        representative.townKana,
    };
    if (representative.line1Kana) addressKana["line1"] = representative.line1Kana;

    // ── 標準住所（kanji/kana と並列で送信） ──
    const addressStandard: Record<string, string> = {
      postal_code: representative.postalCode,
      country:     "JP",
      state:       representative.stateKanji,
      city:        representative.cityKanji,
      line1:       representative.townKanji + (representative.line1Kanji ? ` ${representative.line1Kanji}` : ""),
    };

    // ── 事業内容 ──
    const businessProfileUpdate: Record<string, string> = { mcc: "5812" };
    if (businessProfile.productDescription) {
      businessProfileUpdate["product_description"] = businessProfile.productDescription;
    }
    if (businessProfile.url) {
      businessProfileUpdate["url"] = businessProfile.url;
    }

    // ── Stripe Account Update パラメータを構築 ──
    const updateParams: Record<string, any> = {
      business_type: "individual",          // 常に individual に固定
      business_profile: businessProfileUpdate,
    };

    if (businessType === "individual") {
      const indiv: Record<string, any> = {
        first_name:      representative.firstNameKanji,
        last_name:       representative.lastNameKanji,
        first_name_kana: representative.firstNameKana,
        last_name_kana:  representative.lastNameKana,
        dob: {
          day:   Number(representative.dobDay),
          month: Number(representative.dobMonth),
          year:  Number(representative.dobYear),
        },
        address:       addressStandard,
        address_kanji: addressKanji,
        address_kana:  addressKana,
      };
      if (representative.phone) indiv["phone"] = toE164Japan(representative.phone);
      if (representative.email) indiv["email"] = representative.email;
      updateParams["individual"] = indiv;
    } else {
      // company: 会社情報 + 代表者情報
      const companyObj: Record<string, any> = {
        name:          `${representative.lastNameKanji}${representative.firstNameKanji}`,
        name_kana:     `${representative.lastNameKana}${representative.firstNameKana}`,
        address:       addressStandard,
        address_kanji: addressKanji,
        address_kana:  addressKana,
      };
      if (representative.phone) companyObj["phone"] = toE164Japan(representative.phone);
      updateParams["company"] = companyObj;

      const rep: Record<string, any> = {
        first_name:      representative.firstNameKanji,
        last_name:       representative.lastNameKanji,
        first_name_kana: representative.firstNameKana,
        last_name_kana:  representative.lastNameKana,
        dob: {
          day:   Number(representative.dobDay),
          month: Number(representative.dobMonth),
          year:  Number(representative.dobYear),
        },
        address:       addressStandard,
        address_kanji: addressKanji,
        address_kana:  addressKana,
        relationship: {
          representative: true,
          owner:          true,
          percent_ownership: 100,
        },
      };
      if (representative.phone) rep["phone"] = toE164Japan(representative.phone);
      if (representative.email) rep["email"] = representative.email;
      updateParams["representative"] = rep;
    }

    // ── Stripe 送信前ペイロードをフルログ ──
    console.log(`📤 [KYC] Stripe accounts.update payload for account ${store.stripeAccountId}:`);
    console.log(JSON.stringify(updateParams, null, 2));

    const account = await stripe.accounts.update(store.stripeAccountId, updateParams as any);

    // ── Stripe レスポンスをフルログ ──
    console.log(`✅ [KYC] Stripe accounts.update succeeded for store ${storeId}`);
    console.log(`   charges_enabled:  ${account.charges_enabled}`);
    console.log(`   payouts_enabled:  ${account.payouts_enabled}`);
    console.log(`   details_submitted: ${account.details_submitted}`);
    console.log(`   requirements.currently_due:  ${JSON.stringify(account.requirements?.currently_due)}`);
    console.log(`   requirements.eventually_due: ${JSON.stringify(account.requirements?.eventually_due)}`);
    console.log(`   requirements.errors:         ${JSON.stringify(account.requirements?.errors)}`);
    console.log(`   requirements.disabled_reason: ${account.requirements?.disabled_reason}`);

    // eventually_due が空 = Stripeの必要情報がすべて揃った → DBステータスを 'approved' に更新
    const eventuallyDue = account.requirements?.eventually_due ?? [];
    const currentlyDue  = account.requirements?.currently_due ?? [];
    const kycComplete   = eventuallyDue.length === 0 && currentlyDue.length === 0;

    let newStatus: string | null = null;
    if (kycComplete) {
      await db
        .update(storesTable)
        .set({ status: "approved" })
        .where(eq(storesTable.id, storeId));
      newStatus = "approved";
      console.log(`✅ Store ${storeId} status updated to 'approved' (KYC complete)`);
    }

    res.json({
      success: true,
      kycComplete,
      storeStatus: newStatus ?? "applied",
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      requirements: {
        currentlyDue:        currentlyDue,
        eventuallyDue:       eventuallyDue,
        errors:              account.requirements?.errors ?? [],
        pendingVerification: account.requirements?.pending_verification ?? [],
        disabledReason:      account.requirements?.disabled_reason ?? null,
      },
    });
  } catch (err: any) {
    console.error("❌ [KYC] Stripe accounts.update FAILED:");
    console.error("   type:      ", err?.type);
    console.error("   code:      ", err?.raw?.code ?? err?.code);
    console.error("   param:     ", err?.raw?.param ?? err?.param);
    console.error("   message:   ", err?.raw?.message ?? err?.message);
    console.error("   statusCode:", err?.statusCode);
    console.error("   raw error: ", JSON.stringify(err?.raw ?? {}, null, 2));
    res.status(500).json({
      error: "stripe_error",
      message: err?.raw?.message ?? err?.message ?? "KYC情報の送信に失敗しました",
      param: err?.raw?.param ?? null,
      stripeCode: err?.raw?.code ?? null,
      stripeType: err?.type ?? null,
    });
  }
});

// ─── Stripe Custom Account 銀行口座セットアップ ───────────────────────────────
// POST /api/stores/:storeId/connect/bank-setup
// Custom アカウントを作成（未作成なら）し、フロントエンドトークン化済みの銀行口座を紐付ける
router.post("/stores/:storeId/connect/bank-setup", async (req, res) => {
  try {
    const storeId = parseInt(req.params.storeId);
    const { bankToken, tosTimestamp } = req.body as { bankToken: string; tosTimestamp: number };

    if (!bankToken || !tosTimestamp) {
      res.status(400).json({ error: "bad_request", message: "bankToken と tosTimestamp は必須です" });
      return;
    }

    const stripeKey = process.env["STRIPE_SECRET_KEY"];
    if (!stripeKey) {
      res.status(503).json({ error: "stripe_not_configured", message: "Stripe が設定されていません" });
      return;
    }

    const [store] = await db
      .select({ id: storesTable.id, stripeAccountId: storesTable.stripeAccountId, ownerId: storesTable.ownerId })
      .from(storesTable)
      .where(eq(storesTable.id, storeId));

    if (!store) {
      res.status(404).json({ error: "not_found", message: "店舗が見つかりません" });
      return;
    }

    // オーナーのメールアドレスを Supabase Auth から取得
    let ownerEmail: string | undefined;
    if (store.ownerId) {
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(store.ownerId);
      ownerEmail = userData?.user?.email;
    }

    const stripe = await import("stripe").then((m) => new m.default(stripeKey));

    // クライアント IP 取得
    const ip =
      (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ??
      req.ip ??
      "127.0.0.1";

    // プロジェクトのビジネス URL
    const replitDomain =
      (process.env["REPLIT_DOMAINS"] ?? "").split(",")[0]?.trim() ||
      process.env["REPLIT_DEV_DOMAIN"] ||
      "tabeross.replit.app";
    const businessUrl = `https://${replitDomain}`;

    let accountId = store.stripeAccountId;

    if (!accountId) {
      // Custom アカウントを新規作成
      const account = await stripe.accounts.create({
        type: "custom",
        country: "JP",
        ...(ownerEmail ? { email: ownerEmail } : {}),
        capabilities: {
          transfers: { requested: true },
        },
        business_profile: {
          mcc: "5812",
          url: businessUrl,
        },
        tos_acceptance: {
          date: Math.floor(tosTimestamp / 1000),
          ip,
        },
      });
      accountId = account.id;

      await db
        .update(storesTable)
        .set({ stripeAccountId: accountId })
        .where(eq(storesTable.id, storeId));

      console.log(`✅ Stripe Custom Account created: ${accountId} for store ${storeId}`);
    } else {
      // 既存アカウントのビジネス情報と ToS 同意を更新
      await stripe.accounts.update(accountId, {
        business_profile: {
          mcc: "5812",
          url: businessUrl,
        },
        tos_acceptance: {
          date: Math.floor(tosTimestamp / 1000),
          ip,
        },
      });
      console.log(`ℹ️  Stripe Custom Account updated: ${accountId} for store ${storeId}`);
    }

    // 銀行口座トークンを外部アカウントとして紐付け
    await stripe.accounts.createExternalAccount(accountId, {
      external_account: bankToken,
      default_for_currency: true,
    });

    // 口座登録完了 → ステータスを 'applied'（申請済み・審査待ち）に更新
    await db
      .update(storesTable)
      .set({ status: "applied" })
      .where(eq(storesTable.id, storeId));

    console.log(`✅ Bank account attached to ${accountId}`);
    console.log(`✅ Store ${storeId} status updated to 'applied'`);
    res.json({ success: true, accountId });
  } catch (err: any) {
    console.error("Stripe bank-setup error:", err);
    res.status(500).json({
      error: "stripe_error",
      message: err?.raw?.message ?? err?.message ?? "銀行口座の登録に失敗しました",
    });
  }
});

// ── 審査承認通知（メール + アプリ内通知） ───────────────────────────────────
router.post("/stores/notify-approval", async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  try {
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }

    const [store] = await db
      .select()
      .from(storesTable)
      .where(eq(storesTable.ownerId, user.id))
      .limit(1);

    if (!store) {
      res.status(404).json({ error: "store_not_found" });
      return;
    }

    if (store.status !== "approved") {
      res.status(400).json({ error: "not_approved", message: "店舗がまだ承認されていません" });
      return;
    }

    const results: { notification: boolean; email: boolean | string } = {
      notification: false,
      email: false,
    };

    // ── アプリ内通知を作成（未読がなければ追加）────────────────────────────
    const existing = await db
      .select()
      .from(notificationsTable)
      .where(and(
        eq(notificationsTable.userId, user.id),
        eq(notificationsTable.type, "store_approved"),
      ))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(notificationsTable).values({
        userId: user.id,
        type: "store_approved",
        title: "🎉 審査が承認されました！",
        body: `${store.name} の審査が通過しました。振込先口座を登録して出品を始めましょう。`,
        read: false,
      });
      results.notification = true;
    }

    // ── メール送信（approval_email_sent が false の場合のみ）──────────────
    if (!store.approvalEmailSent) {
      const resendApiKey = process.env.RESEND_API_KEY;

      if (resendApiKey) {
        const resend = new Resend(resendApiKey);
        const fromDomain = process.env.RESEND_FROM_DOMAIN ?? "onboarding@resend.dev";
        const toEmail = user.email!;

        const { error: emailError } = await resend.emails.send({
          from: `食べロス <${fromDomain}>`,
          to: toEmail,
          subject: "【食べロス】審査完了と口座登録のお願い",
          html: `
<!DOCTYPE html>
<html lang="ja">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    
    <!-- ヘッダー -->
    <div style="background:linear-gradient(135deg,#FF8C00 0%,#FF6B00 60%,#E55A00 100%);padding:40px 32px;text-align:center;">
      <div style="font-size:48px;margin-bottom:12px;">🎉</div>
      <h1 style="color:#ffffff;font-size:24px;font-weight:900;margin:0 0 8px;">審査が通過しました！</h1>
      <p style="color:rgba(255,255,255,0.9);font-size:14px;margin:0;">おめでとうございます</p>
    </div>

    <!-- 本文 -->
    <div style="padding:32px;">
      <p style="color:#333333;font-size:15px;line-height:1.7;margin:0 0 24px;">
        <strong>${store.name}</strong> オーナー様<br><br>
        このたびは食べロスへのご登録ありがとうございます。<br>
        審査が無事に完了し、<strong>ご利用が承認</strong>されました。
      </p>

      <!-- ステップカード -->
      <div style="background:#fff8f0;border:2px solid #FF8C00;border-radius:16px;padding:24px;margin-bottom:24px;">
        <p style="color:#FF8C00;font-size:13px;font-weight:900;margin:0 0 16px;letter-spacing:0.05em;">NEXT STEP</p>
        <p style="color:#333333;font-size:15px;font-weight:bold;margin:0 0 8px;">💳 振込先口座を登録する</p>
        <p style="color:#666666;font-size:13px;line-height:1.6;margin:0;">
          売上を受け取るために、振込先の銀行口座を登録してください。<br>
          登録後すぐに「おすそ分け袋」の出品を開始できます。
        </p>
      </div>

      <!-- CTAボタン -->
      <div style="text-align:center;margin-bottom:24px;">
        <a href="${process.env.APP_URL ?? 'https://taberosu.app'}/store/bank-setup"
           style="display:inline-block;background:linear-gradient(135deg,#FF8C00,#E55A00);color:#ffffff;font-size:16px;font-weight:900;padding:16px 40px;border-radius:14px;text-decoration:none;letter-spacing:0.02em;">
          口座を登録して出品を始める →
        </a>
      </div>

      <p style="color:#999999;font-size:12px;line-height:1.6;margin:0;text-align:center;">
        ご不明な点がございましたら、アプリ内のサポートまでお問い合わせください。<br>
        食べロス運営チーム
      </p>
    </div>

    <!-- フッター -->
    <div style="background:#f5f5f0;padding:20px 32px;text-align:center;">
      <p style="color:#aaaaaa;font-size:11px;margin:0;">食べロス — お店の味を、誰かにおすそ分けしたい。</p>
    </div>
  </div>
</body>
</html>
          `.trim(),
        });

        if (!emailError) {
          await db
            .update(storesTable)
            .set({ approvalEmailSent: true })
            .where(eq(storesTable.id, store.id));
          results.email = true;
          console.log(`✅ Approval email sent to ${toEmail}`);
        } else {
          console.error("Resend error:", emailError);
          results.email = emailError.message ?? "email_failed";
        }
      } else {
        console.warn("⚠️  RESEND_API_KEY not set — メール送信をスキップしました");
        results.email = "no_api_key";
      }
    } else {
      results.email = "already_sent";
    }

    res.json({ ok: true, ...results });
  } catch (err: any) {
    console.error("[notify-approval] error:", err);
    res.status(500).json({ error: "internal_error", message: err?.message });
  }
});

// ─── 店舗オーナー向けレビュー一覧（バッグ名 join）─────────────────────────────
router.get("/stores/:storeId/owner-reviews", async (req, res) => {
  try {
    const storeId = parseInt(req.params.storeId);
    if (isNaN(storeId)) {
      res.status(400).json({ error: "bad_request", message: "Invalid storeId" });
      return;
    }

    const reviews = await db
      .select({
        id: reviewsTable.id,
        rating: reviewsTable.rating,
        comment: reviewsTable.comment,
        createdAt: reviewsTable.createdAt,
        reply: reviewsTable.reply,
        repliedAt: reviewsTable.repliedAt,
        bagTitle: surpriseBagsTable.title,
        reservationId: reviewsTable.reservationId,
      })
      .from(reviewsTable)
      .leftJoin(reservationsTable, eq(reviewsTable.reservationId, reservationsTable.id))
      .leftJoin(surpriseBagsTable, eq(reservationsTable.bagId, surpriseBagsTable.id))
      .where(eq(reviewsTable.storeId, storeId))
      .orderBy(desc(reviewsTable.createdAt));

    res.json({ reviews });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal_error", message: "Failed to fetch reviews" });
  }
});

// ─── レビューへの返信（店舗オーナー）─────────────────────────────────────────
router.patch("/stores/:storeId/reviews/:reviewId/reply", async (req, res) => {
  try {
    const storeId = parseInt(req.params.storeId);
    const reviewId = parseInt(req.params.reviewId);
    const { reply } = req.body as { reply: string };

    if (isNaN(storeId) || isNaN(reviewId)) {
      res.status(400).json({ error: "bad_request", message: "Invalid id" });
      return;
    }

    const [updated] = await db
      .update(reviewsTable)
      .set({ reply: reply || null, repliedAt: reply ? new Date() : null })
      .where(and(eq(reviewsTable.id, reviewId), eq(reviewsTable.storeId, storeId)))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "not_found", message: "Review not found" });
      return;
    }
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal_error", message: "Failed to update reply" });
  }
});

// ─── 店舗プロフィール更新（カバー写真・紹介文・営業時間等）─────────────────
router.put("/stores/:storeId/profile", async (req, res) => {
  try {
    const storeId = parseInt(req.params.storeId);
    if (isNaN(storeId)) {
      res.status(400).json({ error: "bad_request", message: "Invalid storeId" });
      return;
    }

    const allowed = ["name", "description", "imageUrl", "phone", "openTime", "closeTime", "holiday", "pickupHours"] as const;
    const body = req.body as Partial<Record<typeof allowed[number], string>>;
    const patch: Record<string, string | null> = {};
    for (const key of allowed) {
      if (key in body) patch[key] = body[key] ?? null;
    }

    const [updated] = await db
      .update(storesTable)
      .set(patch)
      .where(eq(storesTable.id, storeId))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "not_found", message: "Store not found" });
      return;
    }
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal_error", message: "Failed to update profile" });
  }
});

// ─── 特定商取引法表記 取得（公開）─────────────────────────────────────────────
router.get("/stores/:storeId/legal", async (req, res) => {
  try {
    const storeId = parseInt(req.params.storeId);
    if (isNaN(storeId)) {
      res.status(400).json({ error: "bad_request", message: "Invalid storeId" });
      return;
    }

    const [store] = await db
      .select({
        name: storesTable.name,
        legalName: storesTable.legalName,
        legalRepresentative: storesTable.legalRepresentative,
        legalAddress: storesTable.legalAddress,
        legalPhone: storesTable.legalPhone,
        legalEmail: storesTable.legalEmail,
        legalOther: storesTable.legalOther,
      })
      .from(storesTable)
      .where(eq(storesTable.id, storeId));

    if (!store) {
      res.status(404).json({ error: "not_found", message: "Store not found" });
      return;
    }
    res.json(store);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal_error", message: "Failed to fetch legal info" });
  }
});

// ─── 特定商取引法表記 更新（店舗オーナー）──────────────────────────────────────
router.put("/stores/:storeId/legal", async (req, res) => {
  try {
    const storeId = parseInt(req.params.storeId);
    if (isNaN(storeId)) {
      res.status(400).json({ error: "bad_request", message: "Invalid storeId" });
      return;
    }

    const { legalName, legalRepresentative, legalAddress, legalPhone, legalEmail, legalOther } =
      req.body as {
        legalName?: string;
        legalRepresentative?: string;
        legalAddress?: string;
        legalPhone?: string;
        legalEmail?: string;
        legalOther?: string;
      };

    const [updated] = await db
      .update(storesTable)
      .set({ legalName, legalRepresentative, legalAddress, legalPhone, legalEmail, legalOther })
      .where(eq(storesTable.id, storeId))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "not_found", message: "Store not found" });
      return;
    }
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal_error", message: "Failed to update legal info" });
  }
});

export default router;
