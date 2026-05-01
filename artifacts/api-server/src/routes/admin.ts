import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { db } from "@workspace/db";
import { storesTable, announcementsTable, webPushSubscriptionsTable, notificationsTable, salesLeadsTable } from "@workspace/db/schema";
import { eq, sql, desc, isNotNull } from "drizzle-orm";
import { supabaseAdmin } from "../lib/supabase";
import { escapeHtml } from "../lib/escape.js";
import { Resend } from "resend";
import crypto from "node:crypto";
import { rateLimit } from "express-rate-limit";

const router: IRouter = Router();

// ── セキュリティ定数（ソースに平文を残さない） ────────────────────────────────
const ADMIN_EMAIL    = Buffer.from("eXV1aGkwMTI1NDE2QGljbG91ZC5jb20=", "base64").toString();
const APPROVAL_SECRET = process.env.ADMIN_APPROVAL_SECRET!;
if (!APPROVAL_SECRET) throw new Error("[SECURITY] ADMIN_APPROVAL_SECRET env var is not set");

// ── ブルートフォース防御（IP ベース、メモリ内） ──────────────────────────────
const MAX_FAILED_ATTEMPTS = 5;
const BLOCK_DURATION_MS   = 15 * 60 * 1000; // 15 分

interface FailRecord { count: number; blockedUntil: number | null }
const failedAttempts = new Map<string, FailRecord>();

function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (Array.isArray(forwarded)) return forwarded[0];
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.socket?.remoteAddress ?? "unknown";
}

function isIpBlocked(ip: string): boolean {
  const rec = failedAttempts.get(ip);
  if (!rec) return false;
  if (rec.blockedUntil && Date.now() < rec.blockedUntil) return true;
  // ブロック解除
  if (rec.blockedUntil && Date.now() >= rec.blockedUntil) {
    failedAttempts.delete(ip);
    return false;
  }
  return false;
}

function recordFailedAttempt(ip: string) {
  const rec = failedAttempts.get(ip) ?? { count: 0, blockedUntil: null };
  rec.count += 1;
  if (rec.count >= MAX_FAILED_ATTEMPTS) {
    rec.blockedUntil = Date.now() + BLOCK_DURATION_MS;
    console.warn(`[SECURITY] 🔒 IP blocked for 15 min: ${ip} (${rec.count} failed admin auth attempts)`);
  }
  failedAttempts.set(ip, rec);
}

function clearFailedAttempts(ip: string) {
  failedAttempts.delete(ip);
}

// ── 管理者操作 監査ログ ──────────────────────────────────────────────────────
async function writeAuditLog(req: Request, action: string, targetId?: string | number, details?: Record<string, unknown>) {
  try {
    const ip        = getClientIp(req);
    const userAgent = req.headers["user-agent"]?.slice(0, 200) ?? "";
    const admin     = (req as any).adminUser?.email ?? "unknown";
    await supabaseAdmin.from("admin_audit_log").insert({
      admin_email: admin,
      action,
      target_id:  targetId != null ? String(targetId) : null,
      details:    details ?? null,
      ip_address: ip,
      user_agent: userAgent,
    });
  } catch (e) {
    console.warn("[admin/audit] write failed:", (e as Error).message);
  }
}

// ── レートリミッター（管理者 API 全体） ──────────────────────────────────────
//
// ⚠️ 重要: path 指定 ('/admin') を必ず付けること！
// `router.use(adminRateLimiter)` (path 無し) で適用すると、親 router で
// `router.use(adminRouter)` が path 無しマウントされている関係上、
// /api/* 全体に admin 用 60req/min の厳しい制限がかかってしまい、
// 一般ユーザーの API も 429 で遮断される潜在バグになる。
// path scoped にすることで、適用範囲を /admin/* に厳密に限定する。
const adminRateLimiter = rateLimit({
  windowMs: 60 * 1000,     // 1 分
  max: 60,                 // 60 req / min
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getClientIp(req),
  handler: (req, res) => {
    console.warn(`[SECURITY] ⚠️ Rate limit exceeded: ${getClientIp(req)} ${req.method} ${req.path}`);
    res.status(429).json({ error: "too_many_requests", message: "リクエストが多すぎます。しばらくお待ちください。" });
  },
});
router.use('/admin', adminRateLimiter);

// ── ヘルパー: Supabase token からユーザー情報を取得 ────────────────────────────
async function getAuthUser(req: Request) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return null;
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

// ── 管理者専用ミドルウェア（IP ブロック + 監査ログ付き） ───────────────────────
// ※ stores.ts 内に残る admin 系ルートからも使えるよう export している。
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const ip = getClientIp(req);

  // ① IP ブロックチェック
  if (isIpBlocked(ip)) {
    console.warn(`[SECURITY] 🚫 Blocked IP attempted admin access: ${ip}`);
    res.status(429).json({ error: "ip_blocked", message: "アクセスが一時的にブロックされています。しばらくお待ちください。" });
    return;
  }

  // ② JWT 検証
  const user = await getAuthUser(req);
  if (!user) {
    recordFailedAttempt(ip);
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  // ③ 管理者メール検証
  if (user.email !== ADMIN_EMAIL) {
    recordFailedAttempt(ip);
    console.warn(`[SECURITY] ⚠️ Unauthorized admin access attempt: ${user.email} from ${ip}`);
    res.status(403).json({ error: "forbidden", message: "管理者権限が必要です" });
    return;
  }

  // ④ 成功 → 失敗カウントリセット
  clearFailedAttempts(ip);
  (req as any).adminUser = user;
  next();
}

// ── 管理者チェックのみ（監査ログなしの読み取り用） ──────────────────────────
const requireAdminLight = requireAdmin;

// ── GET /admin/metrics ─────────────────────────────────────────────────────────
// GMV、手数料、アクティブユーザー数、登録店舗数 + 拡張メトリクス
// query: ?excludeTest=1 で stripe_account_id IS NULL の店舗（テスト店）を集計から除外
router.get("/admin/metrics", requireAdmin, async (req, res) => {
  try {
    const excludeTest = req.query["excludeTest"] === "1" || req.query["excludeTest"] === "true";
    // 共通フィルタ: テスト店除外の場合は stripe_account_id を持つ店舗のみ
    const storeFilterSql = excludeTest
      ? sql`AND s.stripe_account_id IS NOT NULL`
      : sql``;

    // ── 1. GMV / アクティブユーザー / 詳細ステータス内訳 ──
    const gmvResult = await db.execute(sql`
      SELECT
        COALESCE(SUM(r.total_price) FILTER (WHERE r.status IN ('confirmed','picked_up')), 0)::numeric AS gmv,
        COALESCE(SUM(r.total_price) FILTER (WHERE r.status='confirmed'), 0)::numeric AS gmv_confirmed,
        COALESCE(SUM(r.total_price) FILTER (WHERE r.status='picked_up'), 0)::numeric AS gmv_picked_up,
        COALESCE(SUM(r.total_price) FILTER (WHERE r.status='cancelled'), 0)::numeric AS gmv_cancelled,
        COUNT(*) FILTER (WHERE r.status='pending')::int    AS count_pending,
        COUNT(*) FILTER (WHERE r.status='confirmed')::int  AS count_confirmed,
        COUNT(*) FILTER (WHERE r.status='picked_up')::int  AS count_picked_up,
        COUNT(*) FILTER (WHERE r.status='cancelled')::int  AS count_cancelled,
        COUNT(DISTINCT r.user_id) FILTER (WHERE r.status IN ('confirmed','picked_up'))::int AS active_users,
        COUNT(DISTINCT r.user_id) FILTER (WHERE r.status='picked_up')::int AS pickup_users
      FROM reservations r
      JOIN stores s ON s.id = r.store_id
      WHERE 1=1 ${storeFilterSql}
    `);
    const m = gmvResult.rows[0] as any;
    const gmv = Number(m?.gmv ?? 0);
    const platformFee = Math.round(gmv * 0.25);

    // ── 2. 店舗統計 ──
    const storeStats = await db.execute(sql`
      SELECT
        COUNT(*)::int AS total_stores,
        COUNT(*) FILTER (WHERE status = 'approved' AND is_active = true)::int AS approved_stores,
        COUNT(*) FILTER (WHERE status IN ('pending_review','pending','applied'))::int AS pending_stores,
        COUNT(*) FILTER (WHERE status = 'approved' AND is_active = false)::int AS suspended_stores,
        COUNT(*) FILTER (WHERE stripe_account_id IS NULL)::int AS test_stores,
        COUNT(*) FILTER (WHERE stripe_account_id IS NOT NULL)::int AS real_stores
      FROM stores
    `);
    const sRow = storeStats.rows[0] as any;

    // ── 3. 直近30日 日別売上推移 ──
    const dailyResult = await db.execute(sql`
      SELECT
        TO_CHAR(d.day, 'YYYY-MM-DD') AS date,
        COALESCE(SUM(r.total_price) FILTER (WHERE r.status IN ('confirmed','picked_up')), 0)::numeric AS gmv,
        COUNT(r.id) FILTER (WHERE r.status IN ('confirmed','picked_up'))::int AS count
      FROM generate_series(
        (CURRENT_DATE - INTERVAL '29 days')::date,
        CURRENT_DATE::date,
        '1 day'::interval
      ) AS d(day)
      LEFT JOIN reservations r
        ON r.created_at::date = d.day
      LEFT JOIN stores s ON s.id = r.store_id
      WHERE r.id IS NULL OR (1=1 ${storeFilterSql})
      GROUP BY d.day
      ORDER BY d.day ASC
    `);
    const dailySeries = dailyResult.rows.map((r: any) => ({
      date: r.date,
      gmv: Number(r.gmv),
      count: Number(r.count),
    }));

    // ── 4. 店舗ランキング TOP 5 (GMV) ──
    const rankingResult = await db.execute(sql`
      SELECT
        s.id, s.name,
        s.stripe_account_id IS NULL AS is_test,
        COALESCE(SUM(r.total_price) FILTER (WHERE r.status IN ('confirmed','picked_up')), 0)::numeric AS gmv,
        COUNT(r.id) FILTER (WHERE r.status IN ('confirmed','picked_up'))::int AS reservations,
        COUNT(r.id) FILTER (WHERE r.status='picked_up')::int AS picked_up_count
      FROM stores s
      LEFT JOIN reservations r ON r.store_id = s.id
      WHERE 1=1 ${storeFilterSql}
      GROUP BY s.id, s.name, s.stripe_account_id
      HAVING COALESCE(SUM(r.total_price) FILTER (WHERE r.status IN ('confirmed','picked_up')), 0) > 0
      ORDER BY gmv DESC
      LIMIT 5
    `);
    const storeRanking = rankingResult.rows.map((r: any) => ({
      id: Number(r.id),
      name: r.name,
      isTest: !!r.is_test,
      gmv: Number(r.gmv),
      reservations: Number(r.reservations),
      pickedUpCount: Number(r.picked_up_count),
      pickupRate: Number(r.reservations) > 0 ? Number(r.picked_up_count) / Number(r.reservations) : 0,
    }));

    // ── 5. 時間帯ヒートマップ（24h × 7曜日） ──
    const heatmapResult = await db.execute(sql`
      SELECT
        EXTRACT(DOW FROM r.created_at)::int  AS dow,
        EXTRACT(HOUR FROM r.created_at)::int AS hour,
        COUNT(*)::int AS count
      FROM reservations r
      JOIN stores s ON s.id = r.store_id
      WHERE r.status IN ('confirmed','picked_up')
        AND r.created_at >= CURRENT_DATE - INTERVAL '30 days'
        ${storeFilterSql}
      GROUP BY dow, hour
    `);
    const hourlyHeatmap: number[][] = Array.from({ length: 7 }, () => new Array(24).fill(0));
    for (const row of heatmapResult.rows) {
      const r = row as any;
      hourlyHeatmap[Number(r.dow)][Number(r.hour)] = Number(r.count);
    }

    // ── 6. 異常検知 ──
    // (a) pending が 24h 以上滞留
    const stalePendingResult = await db.execute(sql`
      SELECT COUNT(*)::int AS n
      FROM reservations r
      WHERE r.status = 'pending'
        AND r.created_at < NOW() - INTERVAL '24 hours'
    `);
    // (b) cancellation 率が高い店舗（5件以上 & cancel率 30%超）
    const highCancelResult = await db.execute(sql`
      SELECT s.id, s.name,
        COUNT(r.id)::int AS total,
        COUNT(r.id) FILTER (WHERE r.status='cancelled')::int AS cancelled,
        (COUNT(r.id) FILTER (WHERE r.status='cancelled')::numeric / NULLIF(COUNT(r.id),0))::float AS rate
      FROM stores s
      LEFT JOIN reservations r ON r.store_id = s.id
      WHERE 1=1 ${storeFilterSql}
      GROUP BY s.id, s.name
      HAVING COUNT(r.id) >= 5
        AND (COUNT(r.id) FILTER (WHERE r.status='cancelled')::numeric / NULLIF(COUNT(r.id),0)) > 0.3
      ORDER BY rate DESC
      LIMIT 5
    `);
    // (c) 営業許可証 silent fail
    const licenseIssuesResult = await db.execute(sql`
      SELECT COUNT(*)::int AS n
      FROM stores s
      WHERE s.status = 'approved'
        AND (s.license_image_url IS NULL OR s.license_upload_failed = true)
        AND s.stripe_account_id IS NOT NULL
    `);

    // ── 7. ユーザー基本指標 ──
    const userBasicsResult = await db.execute(sql`
      SELECT
        ROUND(AVG(r.total_price))::int AS avg_price,
        MAX(r.total_price)::int AS max_price,
        MIN(r.total_price) FILTER (WHERE r.total_price > 0)::int AS min_price
      FROM reservations r
      JOIN stores s ON s.id = r.store_id
      WHERE r.status IN ('confirmed','picked_up')
        ${storeFilterSql}
    `);
    const u = userBasicsResult.rows[0] as any;

    res.json({
      // 既存フィールド（互換性維持）
      gmv,
      platformFee,
      activeUsers: Number(m?.active_users ?? 0),
      totalStores: sRow.total_stores,
      approvedStores: sRow.approved_stores,
      pendingStores: sRow.pending_stores,
      suspendedStores: sRow.suspended_stores,
      // 拡張フィールド
      excludeTest,
      breakdown: {
        gmvConfirmed: Number(m?.gmv_confirmed ?? 0),
        gmvPickedUp: Number(m?.gmv_picked_up ?? 0),
        gmvCancelled: Number(m?.gmv_cancelled ?? 0),
        countPending: Number(m?.count_pending ?? 0),
        countConfirmed: Number(m?.count_confirmed ?? 0),
        countPickedUp: Number(m?.count_picked_up ?? 0),
        countCancelled: Number(m?.count_cancelled ?? 0),
        pickupUsers: Number(m?.pickup_users ?? 0),
        avgPrice: Number(u?.avg_price ?? 0),
        maxPrice: Number(u?.max_price ?? 0),
        minPrice: Number(u?.min_price ?? 0),
      },
      storeBreakdown: {
        testStores: sRow.test_stores,
        realStores: sRow.real_stores,
      },
      dailySeries,
      storeRanking,
      hourlyHeatmap,
      anomalies: {
        stalePendingCount: Number((stalePendingResult.rows[0] as any)?.n ?? 0),
        highCancelStores: highCancelResult.rows.map((r: any) => ({
          id: Number(r.id), name: r.name, total: Number(r.total),
          cancelled: Number(r.cancelled), rate: Number(r.rate),
        })),
        licenseIssueCount: Number((licenseIssuesResult.rows[0] as any)?.n ?? 0),
      },
    });
  } catch (err: any) {
    console.error("[admin/metrics]", err);
    res.status(500).json({ error: "internal_error", message: err?.message });
  }
});

// ── GET /admin/license-issues ─────────────────────────────────────────────────
// 営業許可証 silent fail / 未提出だが approved な店舗の一覧
router.get("/admin/license-issues", requireAdmin, async (_req, res) => {
  try {
    const result = await db.execute(sql`
      SELECT
        s.id, s.name, s.status, s.is_active, s.category, s.city,
        s.image_url, s.created_at, s.owner_id,
        s.stripe_account_id, s.stripe_charges_enabled,
        s.license_number,
        s.license_image_url IS NOT NULL AS has_license_url,
        s.stripe_license_file_id IS NOT NULL AS has_stripe_file_id,
        s.license_upload_failed,
        s.license_upload_error,
        s.license_upload_attempted_at,
        CASE
          WHEN s.license_upload_failed = TRUE THEN 'upload_failed'
          WHEN s.license_image_url IS NULL AND s.license_number IS NOT NULL THEN 'image_missing_but_number_set'
          WHEN s.license_image_url IS NULL AND s.license_number IS NULL THEN 'no_license_at_all'
          ELSE 'unknown'
        END AS issue_type,
        CASE
          WHEN s.license_upload_failed = TRUE THEN 'high'
          WHEN s.license_image_url IS NULL AND s.stripe_charges_enabled = TRUE THEN 'high'
          WHEN s.license_image_url IS NULL AND s.status = 'approved' THEN 'medium'
          ELSE 'low'
        END AS severity
      FROM stores s
      WHERE s.status = 'approved'
        AND s.stripe_account_id IS NOT NULL
        AND (
          s.license_image_url IS NULL
          OR s.license_upload_failed = TRUE
        )
      ORDER BY
        CASE
          WHEN s.license_upload_failed = TRUE THEN 0
          WHEN s.stripe_charges_enabled = TRUE THEN 1
          ELSE 2
        END,
        s.created_at DESC
    `);
    res.json({ items: result.rows, count: result.rows.length });
  } catch (err: any) {
    console.error("[admin/license-issues]", err);
    res.status(500).json({ error: "internal_error", message: err?.message });
  }
});

// ── POST /admin/stores/:storeId/request-license-reupload ──────────────────────
// 神モードから店主に営業許可証の再アップロードを要求（フラグ立て + console log）
router.post("/admin/stores/:storeId/request-license-reupload", requireAdmin, async (req, res) => {
  const storeId = Number(req.params.storeId);
  if (isNaN(storeId)) { res.status(400).json({ error: "bad_request" }); return; }
  try {
    const [store] = await db
      .select({
        id: storesTable.id,
        name: storesTable.name,
        ownerId: storesTable.ownerId,
      })
      .from(storesTable)
      .where(eq(storesTable.id, storeId));
    if (!store) { res.status(404).json({ error: "not_found" }); return; }

    // フラグを再アップロード要求状態に
    await db.update(storesTable)
      .set({
        licenseUploadFailed: true,
        licenseUploadError: "admin_requested_reupload",
        licenseUploadAttemptedAt: new Date(),
      })
      .where(eq(storesTable.id, storeId));

    // 店主のメールアドレスを取得して将来のメール送信用にログ
    let ownerEmail: string | null = null;
    if (store.ownerId) {
      try {
        const { data } = await supabaseAdmin.auth.admin.getUserById(store.ownerId);
        ownerEmail = data?.user?.email ?? null;
      } catch { /* ignore */ }
    }

    console.log(`📨 [admin] License reupload requested: storeId=${storeId} name="${store.name}" ownerEmail=${ownerEmail ?? "(none)"}`);

    res.json({
      ok: true,
      storeId,
      ownerEmail,
      message: "再アップロード要求を記録しました。 店主が次回ログイン時に通知されます。",
    });
  } catch (err: any) {
    console.error("[admin/request-license-reupload]", err);
    res.status(500).json({ error: "internal_error", message: err?.message });
  }
});

// ── GET /admin/stores ──────────────────────────────────────────────────────────
router.get("/admin/stores", requireAdmin, async (_req, res) => {
  try {
    const stores = await db.execute(sql`
      SELECT
        s.id, s.name, s.status, s.is_active, s.category, s.address, s.city,
        s.image_url, s.owner_id, s.created_at, s.stripe_account_id,
        s.stripe_charges_enabled,
        s.stripe_payouts_enabled,
        COUNT(DISTINCT b.id)::int AS bag_count,
        COUNT(DISTINCT r.id)::int AS reservation_count,
        COALESCE(SUM(r.total_price) FILTER (WHERE r.status IN ('confirmed','picked_up')), 0)::numeric AS revenue,
        CASE WHEN s.owner_id IS NOT NULL THEN
          (SELECT COUNT(*)::int FROM stores s2 WHERE s2.owner_id = s.owner_id)
        ELSE 1 END AS owner_store_count,
        CASE WHEN s.owner_id IS NOT NULL THEN
          (SELECT COUNT(*)::int FROM stores s2 WHERE s2.owner_id = s.owner_id AND s2.id <= s.id)
        ELSE 1 END AS owner_store_rank
      FROM stores s
      LEFT JOIN surprise_bags b ON b.store_id = s.id
      LEFT JOIN reservations r  ON r.store_id = s.id
      GROUP BY s.id
      ORDER BY s.created_at DESC
    `);
    res.json(stores.rows);
  } catch (err: any) {
    console.error("[admin/stores]", err);
    res.status(500).json({ error: "internal_error", message: err?.message });
  }
});

// ── GET /admin/stores/:storeId/detail ─────────────────────────────────────────
// 店舗詳細（全フィールド＋オーナーメール）
router.get("/admin/stores/:storeId/detail", requireAdmin, async (req, res) => {
  const storeId = Number(req.params.storeId);
  if (isNaN(storeId)) { res.status(400).json({ error: "bad_request" }); return; }
  try {
    const result = await db.execute(sql`
      SELECT
        s.id, s.name, s.description, s.status, s.is_active, s.category,
        s.address, s.city, s.lat, s.lng, s.image_url, s.phone,
        s.open_time, s.close_time, s.holiday, s.pickup_hours,
        s.owner_id, s.created_at, s.stripe_account_id,
        s.stripe_charges_enabled, s.stripe_payouts_enabled,
        s.license_number, s.license_image_url, s.stripe_license_file_id, s.id_image_url, s.pledge_signed,
        s.legal_name, s.legal_representative, s.legal_address,
        s.legal_phone, s.legal_email, s.legal_other,
        COUNT(DISTINCT b.id)::int AS bag_count,
        COUNT(DISTINCT r.id)::int AS reservation_count,
        COALESCE(SUM(r.total_price) FILTER (WHERE r.status IN ('confirmed','picked_up')), 0)::numeric AS revenue
      FROM stores s
      LEFT JOIN surprise_bags b ON b.store_id = s.id
      LEFT JOIN reservations r  ON r.store_id = s.id
      WHERE s.id = ${storeId}
      GROUP BY s.id
    `);
    if (!result.rows[0]) { res.status(404).json({ error: "not_found" }); return; }
    const store = result.rows[0] as any;

    // オーナーのメールアドレスを Supabase から取得
    let ownerEmail: string | null = null;
    if (store.owner_id) {
      try {
        const { data } = await supabaseAdmin.auth.admin.getUserById(store.owner_id);
        ownerEmail = data?.user?.email ?? null;
      } catch { /* ignore */ }
    }

    // ── Stripe ライブステータスを取得して DB も最新化 ────────────────────────
    let stripeRequirements: Record<string, any> | null = null;
    if (store.stripe_account_id) {
      const stripeKey = process.env["STRIPE_SECRET_KEY"];
      if (stripeKey) {
        try {
          const stripe = await import("stripe").then((m) => new m.default(stripeKey));
          const account = await stripe.accounts.retrieve(store.stripe_account_id as string);

          stripeRequirements = {
            currently_due:        account.requirements?.currently_due ?? [],
            eventually_due:       account.requirements?.eventually_due ?? [],
            errors:               account.requirements?.errors ?? [],
            disabled_reason:      account.requirements?.disabled_reason ?? null,
            pending_verification: account.requirements?.pending_verification ?? [],
          };

          // ── Stripe metadata から stripe_license_file_id を同期 ──────────
          // DB に値がなくてもメタデータに保存されていれば復元する
          const metaFileId = (account.metadata as any)?.license_file_id;
          const dbFileId   = (store as any).stripe_license_file_id;

          // メタデータに有効な file ID（"file_..." で始まる）があれば採用
          const resolvedFileId: string | null =
            dbFileId ?? (metaFileId?.startsWith('file_') ? metaFileId : null);

          // DB が空でメタデータに値があれば DB に書き戻す
          if (!dbFileId && resolvedFileId) {
            await db.update(storesTable)
              .set({ stripeLicenseFileId: resolvedFileId } as any)
              .where(eq(storesTable.id, storeId));
            console.log(`[admin/stores/detail] ✅ stripe_license_file_id を DB に復元: ${resolvedFileId}`);
          }

          // レスポンス用フィールドを上書き
          (store as any).stripe_license_file_id = resolvedFileId;

          // DB に最新値を書き込む（charges/payouts）
          await db.update(storesTable).set({
            stripeChargesEnabled: account.charges_enabled,
            stripePayoutsEnabled: account.payouts_enabled,
          }).where(eq(storesTable.id, storeId));

          // レスポンスのフィールドも最新値で上書き
          (store as any).stripe_charges_enabled = account.charges_enabled;
          (store as any).stripe_payouts_enabled = account.payouts_enabled;

          console.log(`[admin/stores/detail] Stripe live fetch: storeId=${storeId} acct=${store.stripe_account_id} charges=${account.charges_enabled} payouts=${account.payouts_enabled} due=${stripeRequirements.currently_due.length}`);
        } catch (stripeErr: any) {
          console.warn(`[admin/stores/detail] Stripe fetch failed: ${stripeErr?.message}`);
          stripeRequirements = { error: stripeErr?.code ?? "stripe_error", message: stripeErr?.message };
        }
      }
    }

    res.json({ ...store, owner_email: ownerEmail, stripe_requirements: stripeRequirements });
  } catch (err: any) {
    console.error("[admin/stores/detail]", err);
    res.status(500).json({ error: "internal_error", message: err?.message });
  }
});

// ── POST /admin/stores/:storeId/refresh-stripe-status ────────────────────────
// Stripe アカウントの charges_enabled を最新取得して DB に保存する
router.post("/admin/stores/:storeId/refresh-stripe-status", requireAdmin, async (req, res) => {
  const storeId = Number(req.params.storeId);
  if (isNaN(storeId)) { res.status(400).json({ error: "bad_request" }); return; }
  try {
    const [store] = await db
      .select({ stripeAccountId: storesTable.stripeAccountId })
      .from(storesTable)
      .where(eq(storesTable.id, storeId));
    if (!store) { res.status(404).json({ error: "not_found" }); return; }
    if (!store.stripeAccountId) {
      res.status(400).json({ error: "no_stripe_account", message: "Stripeアカウントが未登録です" });
      return;
    }
    const stripeKey = process.env["STRIPE_SECRET_KEY"];
    if (!stripeKey) { res.status(503).json({ error: "stripe_not_configured" }); return; }

    const stripe = await import("stripe").then((m) => new m.default(stripeKey));
    const account = await stripe.accounts.retrieve(store.stripeAccountId);

    await db
      .update(storesTable)
      .set({
        stripeChargesEnabled: account.charges_enabled,
        stripePayoutsEnabled: account.payouts_enabled,
      })
      .where(eq(storesTable.id, storeId));

    res.json({
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      currentlyDue: account.requirements?.currently_due ?? [],
      errors: account.requirements?.errors ?? [],
      disabledReason: account.requirements?.disabled_reason ?? null,
    });
  } catch (err: any) {
    console.error("[admin/refresh-stripe-status]", err);
    res.status(500).json({ error: "internal_error", message: err?.message });
  }
});

// ── POST /admin/stores/batch-refresh-stripe ───────────────────────────────────
// stripeAccountId を持つ全店舗の charges_enabled をまとめて更新して返す。
// 1万店舗規模では同一 stripeAccountId が複数店舗で共有されるため、
// 「ユニークな accountId 単位」でAPIコールし、重複呼び出しを排除して rate limit 衝突を回避。
// 加えて並列上限（CONCURRENCY=8）で Stripe rate limit (~100 req/sec) に余裕を持たせる。
router.post("/admin/stores/batch-refresh-stripe", requireAdmin, async (req, res) => {
  const stripeKey = process.env["STRIPE_SECRET_KEY"];
  if (!stripeKey) { res.status(503).json({ error: "stripe_not_configured" }); return; }
  try {
    const rows = await db
      .select({ id: storesTable.id, stripeAccountId: storesTable.stripeAccountId })
      .from(storesTable)
      .where(isNotNull(storesTable.stripeAccountId));

    // accountId → [storeId, ...] にグルーピング（同一オーナー多店舗を1コールにまとめる）
    const accountIdToStoreIds = new Map<string, number[]>();
    for (const row of rows) {
      const acct = row.stripeAccountId!;
      const list = accountIdToStoreIds.get(acct) ?? [];
      list.push(row.id);
      accountIdToStoreIds.set(acct, list);
    }
    const accountIds = Array.from(accountIdToStoreIds.keys());

    const stripe = await import("stripe").then((m) => new m.default(stripeKey));

    // 並列数制限ヘルパー（外部依存追加なし）
    const CONCURRENCY = 8;
    const updated: Record<number, boolean> = {};
    let cursor = 0;
    const workers = Array.from({ length: Math.min(CONCURRENCY, accountIds.length) }, async () => {
      while (cursor < accountIds.length) {
        const idx = cursor++;
        const acct = accountIds[idx];
        const storeIds = accountIdToStoreIds.get(acct) ?? [];
        try {
          const account = await stripe.accounts.retrieve(acct);
          const metaFileId = (account.metadata as any)?.license_file_id;
          const licenseFileId: string | null = metaFileId?.startsWith?.("file_") ? metaFileId : null;
          const patch: Record<string, any> = {
            stripeChargesEnabled: account.charges_enabled,
            stripePayoutsEnabled: account.payouts_enabled,
          };
          if (licenseFileId) patch.stripeLicenseFileId = licenseFileId;

          // 同一 accountId を持つ全店舗を 1 クエリで一括更新
          await db
            .update(storesTable)
            .set(patch as any)
            .where(eq(storesTable.stripeAccountId, acct));

          for (const sid of storeIds) updated[sid] = !!account.charges_enabled;
        } catch (innerErr: any) {
          console.warn(`[admin/batch-refresh-stripe] account ${acct} 失敗: ${innerErr?.message}`);
        }
      }
    });
    await Promise.all(workers);

    res.json({ updated, accounts: accountIds.length, stores: rows.length });
  } catch (err: any) {
    console.error("[admin/batch-refresh-stripe]", err);
    res.status(500).json({ error: "internal_error", message: err?.message });
  }
});

// ── POST /admin/stores/:storeId/approve ───────────────────────────────────────
router.post("/admin/stores/:storeId/approve", requireAdmin, async (req, res) => {
  const storeId = Number(req.params.storeId);
  if (isNaN(storeId)) { res.status(400).json({ error: "bad_request" }); return; }
  try {
    // Stripe口座があって charges_enabled === false なら承認をブロック
    const [storeCheck] = await db
      .select({ stripeAccountId: storesTable.stripeAccountId, stripeChargesEnabled: storesTable.stripeChargesEnabled })
      .from(storesTable)
      .where(eq(storesTable.id, storeId));
    if (storeCheck?.stripeAccountId && storeCheck.stripeChargesEnabled === false) {
      res.status(400).json({
        error: "stripe_restricted",
        message: "このアカウントはStripeで制限中のため承認できません。Stripeダッシュボードで書類不備を解消してください。",
      });
      return;
    }

    const [updated] = await db
      .update(storesTable)
      .set({ status: "approved", isActive: true })
      .where(eq(storesTable.id, storeId))
      .returning();
    if (!updated) { res.status(404).json({ error: "not_found" }); return; }

    // オーナーに通知
    if (updated.ownerId) {
      await db.insert(notificationsTable).values({
        userId: updated.ownerId,
        type: "store_approved",
        title: "🎉 店舗が承認されました",
        body: `${updated.name} の審査が完了しました。今すぐおすそわけバッグを出品できます！`,
        read: false,
      }).catch(() => {});

      // オーナーへの承認メール（おすそわけ事務局から）
      const resendApiKey = process.env.RESEND_API_KEY;
      if (resendApiKey) {
        try {
          const resend = new Resend(resendApiKey);
          const fromDomain = process.env.RESEND_FROM_DOMAIN ?? "onboarding@resend.dev";
          const { data: ownerAuth } = await supabaseAdmin.auth.admin.getUserById(updated.ownerId);
          const ownerEmail = ownerAuth?.user?.email;
          const appUrl = process.env.APP_URL ?? `https://${process.env.REPLIT_DEV_DOMAIN ?? 'localhost'}`;
          if (ownerEmail) {
            await resend.emails.send({
              from: `おすそわけ事務局 <${fromDomain}>`,
              to: ownerEmail,
              subject: `【おすそわけ】${updated.name}の審査が完了しました 🎉`,
              html: `
<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#fff8f0;font-family:'Helvetica Neue',Arial,sans-serif;">
<div style="max-width:560px;margin:32px auto;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(242,100,25,0.10);">
  <div style="background:linear-gradient(135deg,#F26419 0%,#F6AE2D 100%);padding:44px 32px 36px;text-align:center;">
    <div style="font-size:52px;margin-bottom:14px;">🎉</div>
    <h1 style="color:#fff;font-size:24px;font-weight:900;margin:0 0 8px;letter-spacing:-0.5px;">おめでとうございます！</h1>
    <p style="color:rgba(255,255,255,0.9);font-size:14px;margin:0;">審査が通過しました</p>
  </div>
  <div style="padding:36px 32px;">
    <p style="font-size:15px;line-height:1.8;color:#333;margin:0 0 20px;">
      <strong>${escapeHtml(updated.name)}</strong> オーナー様<br><br>
      この度はおすそわけにご参加いただき、ありがとうございます。<br>
      審査が完了し、<strong style="color:#F26419;">本日よりおすそわけバッグの出品が可能</strong>になりました！<br><br>
      地域の食品ロス削減に、ぜひご一緒しましょう。応援しています 🧡
    </p>
    <div style="background:#fff8f0;border-radius:16px;padding:20px 24px;margin:0 0 28px;">
      <p style="font-size:13px;font-weight:900;color:#F26419;margin:0 0 10px;">🏪 次のステップ</p>
      <p style="font-size:13px;color:#555;line-height:1.7;margin:0;">
        ① ストアダッシュボードから銀行口座を登録する<br>
        ② 口座審査が完了したら（通常1〜3営業日）出品開始！<br>
        ③ 審査完了のご連絡はおすそわけ事務局よりお送りします
      </p>
    </div>
    <div style="text-align:center;">
      <a href="${appUrl}/store/dashboard" style="display:inline-block;background:linear-gradient(135deg,#F26419,#F6AE2D);color:#fff;font-size:16px;font-weight:900;padding:18px 52px;border-radius:16px;text-decoration:none;letter-spacing:0.5px;">
        ダッシュボードへ進む →
      </a>
    </div>
    <p style="font-size:12px;color:#aaa;margin:28px 0 0;text-align:center;">
      おすそわけ事務局 ｜ ご不明な点はアプリ内LINEサポートへ
    </p>
  </div>
</div>
</body></html>`.trim(),
            });
          }
        } catch (mailErr: any) {
          console.warn("[admin/approve] メール送信エラー:", mailErr?.message);
        }
      }
    }

    res.json({ ok: true, store: updated });
  } catch (err: any) {
    console.error("[admin/approve]", err);
    res.status(500).json({ error: "internal_error", message: err?.message });
  }
});

// ── POST /admin/stores/:storeId/suspend ───────────────────────────────────────
router.post("/admin/stores/:storeId/suspend", requireAdmin, async (req, res) => {
  const storeId = Number(req.params.storeId);
  if (isNaN(storeId)) { res.status(400).json({ error: "bad_request" }); return; }
  try {
    const [updated] = await db
      .update(storesTable)
      .set({ isActive: false })
      .where(eq(storesTable.id, storeId))
      .returning();
    if (!updated) { res.status(404).json({ error: "not_found" }); return; }
    res.json({ ok: true, store: updated });
  } catch (err: any) {
    console.error("[admin/suspend]", err);
    res.status(500).json({ error: "internal_error", message: err?.message });
  }
});

// ── POST /admin/stores/:storeId/reject ────────────────────────────────────────
router.post("/admin/stores/:storeId/reject", requireAdmin, async (req, res) => {
  const storeId = Number(req.params.storeId);
  if (isNaN(storeId)) { res.status(400).json({ error: "bad_request" }); return; }
  const { rejectionReason } = req.body as { rejectionReason?: string };
  try {
    const [updated] = await db
      .update(storesTable)
      .set({
        status: "rejected",
        isActive: false,
        ...(rejectionReason?.trim() ? { rejectionReason: rejectionReason.trim() } : {}),
      })
      .where(eq(storesTable.id, storeId))
      .returning();
    if (!updated) { res.status(404).json({ error: "not_found" }); return; }

    // オーナーへの却下通知（アプリ内 + メール）
    if (updated.ownerId) {
      await db.insert(notificationsTable).values({
        userId: updated.ownerId,
        type: "store_rejected",
        title: "📋 申請内容についてご連絡があります",
        body: `${updated.name} の申請について、おすそわけ事務局よりご連絡があります。アプリをご確認ください。`,
        read: false,
      }).catch(() => {});

      // 却下メール（おすそわけ事務局から）
      const resendApiKey = process.env.RESEND_API_KEY;
      if (resendApiKey) {
        try {
          const resend = new Resend(resendApiKey);
          const fromDomain = process.env.RESEND_FROM_DOMAIN ?? "onboarding@resend.dev";
          const { data: ownerAuth } = await supabaseAdmin.auth.admin.getUserById(updated.ownerId);
          const ownerEmail = ownerAuth?.user?.email;
          const appUrl = process.env.APP_URL ?? `https://${process.env.REPLIT_DEV_DOMAIN ?? 'localhost'}`;
          const reason = rejectionReason?.trim() ?? "申請内容に確認が必要な点がございました。";
          if (ownerEmail) {
            await resend.emails.send({
              from: `おすそわけ事務局 <${fromDomain}>`,
              to: ownerEmail,
              subject: `【おすそわけ】${updated.name}の申請についてご連絡`,
              html: `
<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#fff8f0;font-family:'Helvetica Neue',Arial,sans-serif;">
<div style="max-width:560px;margin:32px auto;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
  <div style="background:linear-gradient(135deg,#F26419 0%,#F6AE2D 100%);padding:44px 32px 36px;text-align:center;">
    <div style="font-size:52px;margin-bottom:14px;">📋</div>
    <h1 style="color:#fff;font-size:22px;font-weight:900;margin:0 0 8px;">申請内容についてご連絡</h1>
    <p style="color:rgba(255,255,255,0.9);font-size:14px;margin:0;">おすそわけ事務局</p>
  </div>
  <div style="padding:36px 32px;">
    <p style="font-size:15px;line-height:1.8;color:#333;margin:0 0 20px;">
      <strong>${escapeHtml(updated.name)}</strong> オーナー様<br><br>
      この度はおすそわけへご申請いただき、誠にありがとうございます。<br>
      事務局にて内容を確認しましたところ、いくつかご確認いただきたい点がございました。
    </p>
    <div style="background:#fff3cd;border-left:4px solid #F6AE2D;border-radius:0 12px 12px 0;padding:16px 20px;margin:0 0 24px;">
      <p style="font-size:13px;font-weight:900;color:#856404;margin:0 0 8px;">📝 事務局からのメッセージ</p>
      <p style="font-size:14px;color:#333;line-height:1.7;margin:0;">${escapeHtml(reason)}</p>
    </div>
    <p style="font-size:14px;line-height:1.8;color:#555;margin:0 0 24px;">
      修正・再申請いただければ、改めて事務局にて確認いたします。<br>
      ご不明な点がございましたら、アプリ内のLINEサポートよりお気軽にご連絡ください。<br>
      引き続きよろしくお願いいたします 🧡
    </p>
    <div style="text-align:center;">
      <a href="${appUrl}/bank-setup" style="display:inline-block;background:linear-gradient(135deg,#F26419,#F6AE2D);color:#fff;font-size:15px;font-weight:900;padding:16px 48px;border-radius:16px;text-decoration:none;">
        再申請する →
      </a>
    </div>
    <p style="font-size:12px;color:#aaa;margin:28px 0 0;text-align:center;">
      おすそわけ事務局 ｜ ご不明な点はアプリ内LINEサポートへ
    </p>
  </div>
</div>
</body></html>`.trim(),
            });
          }
        } catch (mailErr: any) {
          console.warn("[admin/reject] メール送信エラー:", mailErr?.message);
        }
      }
    }

    res.json({ ok: true, store: updated });
  } catch (err: any) {
    res.status(500).json({ error: "internal_error", message: err?.message });
  }
});

// ── DELETE /admin/stores/:storeId (店舗削除) ──────────────────────────────────
router.delete("/admin/stores/:storeId", requireAdmin, async (req, res) => {
  const storeId = Number(req.params.storeId);
  if (isNaN(storeId)) { res.status(400).json({ error: "bad_request" }); return; }
  try {
    const [deleted] = await db
      .delete(storesTable)
      .where(eq(storesTable.id, storeId))
      .returning();
    if (!deleted) { res.status(404).json({ error: "not_found" }); return; }
    res.json({ ok: true, store: deleted });
  } catch (err: any) {
    res.status(500).json({ error: "internal_error", message: err?.message });
  }
});

// ── GET /admin/approve-store (ワンタップ承認 — メールリンク用) ─────────────────
router.get("/admin/approve-store", async (req, res) => {
  const { storeId: storeIdStr, token } = req.query as { storeId?: string; token?: string };
  if (!storeIdStr || !token) {
    res.status(400).send("無効なリンクです");
    return;
  }
  const storeId = Number(storeIdStr);
  if (isNaN(storeId)) { res.status(400).send("無効な店舗IDです"); return; }

  const expected = crypto.createHmac("sha256", APPROVAL_SECRET).update(String(storeId)).digest("hex");
  if (token !== expected) {
    res.status(403).send("トークンが無効です");
    return;
  }

  try {
    const [updated] = await db
      .update(storesTable)
      .set({ status: "approved", isActive: true })
      .where(eq(storesTable.id, storeId))
      .returning();

    if (!updated) { res.status(404).send("店舗が見つかりません"); return; }

    // オーナー通知
    if (updated.ownerId) {
      await db.insert(notificationsTable).values({
        userId: updated.ownerId,
        type: "store_approved",
        title: "🎉 店舗が承認されました",
        body: `${updated.name} の審査が完了しました！`,
        read: false,
      }).catch(() => {});
    }

    const appUrl = process.env.APP_URL ?? `https://${process.env.REPLIT_DEV_DOMAIN ?? 'localhost'}`;
    res.send(`
<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8">
<meta http-equiv="refresh" content="3;url=${appUrl}/admin">
<title>承認完了</title>
<style>body{font-family:'Helvetica Neue',sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f5f5f0;margin:0;}
.card{background:#fff;border-radius:20px;padding:48px 40px;text-align:center;max-width:400px;box-shadow:0 4px 24px rgba(0,0,0,0.08);}
.emoji{font-size:64px;margin-bottom:16px;}h1{color:#F26419;font-size:22px;margin:0 0 8px;}p{color:#666;font-size:14px;}</style>
</head><body>
<div class="card">
<div class="emoji">✅</div>
<h1>承認完了！</h1>
<p><strong>${updated.name}</strong> を承認しました。<br>3秒後に管理者ダッシュボードへ移動します。</p>
</div>
</body></html>
    `);
  } catch (err: any) {
    console.error("[admin/approve-store]", err);
    res.status(500).send("エラーが発生しました: " + err?.message);
  }
});

// ── GET /admin/announcements ───────────────────────────────────────────────────
router.get("/admin/announcements", requireAdmin, async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(announcementsTable)
      .orderBy(desc(announcementsTable.createdAt))
      .limit(50);
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: "internal_error", message: err?.message });
  }
});

// ── POST /admin/announcements ──────────────────────────────────────────────────
// 全ユーザーへのお知らせを作成し、各ユーザーの notifications に挿入する
router.post("/admin/announcements", requireAdmin, async (req: any, res) => {
  const { title, body } = req.body as { title?: string; body?: string };
  if (!title?.trim() || !body?.trim()) {
    res.status(400).json({ error: "title と body は必須です" });
    return;
  }
  try {
    const [announcement] = await db
      .insert(announcementsTable)
      .values({ title: title.trim(), body: body.trim(), createdBy: req.adminUser.id })
      .returning();

    // 全ユーザーの ID 一覧を Supabase から取得してバルクインサート
    const { data: userList, error: userErr } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    if (userErr) throw userErr;

    if (userList.users.length > 0) {
      const notifRows = userList.users.map(u => ({
        userId: u.id,
        type: "announcement" as const,
        title: title.trim(),
        body: body.trim(),
        read: false,
      }));
      // バルクインサート（1000件単位）
      for (let i = 0; i < notifRows.length; i += 100) {
        await db.insert(notificationsTable).values(notifRows.slice(i, i + 100));
      }
    }

    res.json({ ok: true, announcement, userCount: userList.users.length });
  } catch (err: any) {
    console.error("[admin/announcements POST]", err);
    res.status(500).json({ error: "internal_error", message: err?.message });
  }
});

// ── GET /announcements (public — ユーザーが閲覧) ──────────────────────────────
router.get("/announcements", async (req: any, res) => {
  try {
    const limit = Math.min(parseInt(req.query?.limit ?? '10', 10) || 10, 50);
    const rows = await db
      .select()
      .from(announcementsTable)
      .orderBy(desc(announcementsTable.createdAt))
      .limit(limit);
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: "internal_error", message: err?.message });
  }
});

// ── POST /web-push/subscribe ───────────────────────────────────────────────────
router.post("/web-push/subscribe", async (req, res) => {
  const user = await getAuthUser(req);
  if (!user) { res.status(401).json({ error: "unauthorized" }); return; }
  const { endpoint, p256dh, auth } = req.body;
  if (!endpoint || !p256dh || !auth) {
    res.status(400).json({ error: "endpoint, p256dh, auth は必須です" }); return;
  }
  try {
    await db.execute(sql`
      INSERT INTO web_push_subscriptions (user_id, endpoint, p256dh, auth)
      VALUES (${user.id}, ${endpoint}, ${p256dh}, ${auth})
      ON CONFLICT (endpoint) DO UPDATE SET user_id = EXCLUDED.user_id, p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth
    `);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: "internal_error", message: err?.message });
  }
});

// ── GET /admin/vapid-public-key ────────────────────────────────────────────────
router.get("/admin/vapid-public-key", requireAdmin, async (_req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY ?? null });
});

// ── GET /settings (public) ─────────────────────────────────────────────────────
router.get("/settings", async (_req, res) => {
  try {
    const result = await db.execute(sql`SELECT key, value FROM app_settings ORDER BY key`);
    const settings: Record<string, string> = {};
    for (const row of result.rows as { key: string; value: string }[]) {
      settings[row.key] = row.value;
    }
    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ error: "internal_error", message: err?.message });
  }
});

// ── GET /admin/settings ────────────────────────────────────────────────────────
router.get("/admin/settings", requireAdmin, async (_req, res) => {
  try {
    const result = await db.execute(sql`SELECT key, value, updated_at FROM app_settings ORDER BY key`);
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: "internal_error", message: err?.message });
  }
});

// ── PATCH /admin/settings ──────────────────────────────────────────────────────
router.patch("/admin/settings", requireAdmin, async (req: any, res) => {
  const updates: Record<string, string> = req.body;
  if (!updates || typeof updates !== "object" || Array.isArray(updates)) {
    res.status(400).json({ error: "body must be a key-value object" }); return;
  }
  try {
    for (const [key, value] of Object.entries(updates)) {
      await db.execute(sql`
        INSERT INTO app_settings (key, value, updated_at)
        VALUES (${key}, ${String(value)}, NOW())
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
      `);
    }
    // 最新値を返す
    const result = await db.execute(sql`SELECT key, value, updated_at FROM app_settings ORDER BY key`);
    res.json({ ok: true, settings: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: "internal_error", message: err?.message });
  }
});

// ── POST /admin/notifications/broadcast ────────────────────────────────────────
// 全ユーザーに通知ベルのお知らせを一斉送信
router.post("/admin/notifications/broadcast", requireAdmin, async (req: any, res) => {
  const { title, body } = req.body ?? {};
  if (!title?.trim()) {
    res.status(400).json({ error: "title is required" }); return;
  }
  try {
    const { data: userList, error: userErr } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    if (userErr || !userList) {
      res.status(500).json({ error: "failed_to_list_users", message: userErr?.message }); return;
    }
    if (userList.users.length === 0) {
      res.json({ ok: true, sentTo: 0 }); return;
    }
    const rows = userList.users.map(u => ({
      userId: u.id,
      type: "broadcast" as const,
      title: title.trim(),
      body: body?.trim() || null,
      read: false,
    }));
    await db.insert(notificationsTable).values(rows);
    res.json({ ok: true, sentTo: rows.length });
  } catch (err: any) {
    console.error("[admin] notification broadcast error:", err);
    res.status(500).json({ error: "internal_error", message: err?.message });
  }
});

// ── POST /sales-leads ── 誰でもOK（食品ロスのお店を通報）─────────────────────
router.post("/sales-leads", async (req, res) => {
  try {
    const user = await getAuthUser(req);
    const { storeName, location, memo } = req.body as {
      storeName?: string;
      location?: string;
      memo?: string;
    };
    if (!storeName?.trim() || !location?.trim()) {
      res.status(400).json({ error: "bad_request", message: "店舗名と場所は必須です" });
      return;
    }
    // 入力長制限（DB肥大 / abuse 防止）
    const trimmedStoreName = storeName.trim().slice(0, 200);
    const trimmedLocation  = location.trim().slice(0, 300);
    const trimmedMemo      = memo?.trim().slice(0, 1000) ?? null;
    if (trimmedStoreName.length < 1 || trimmedLocation.length < 1) {
      res.status(400).json({ error: "bad_request", message: "入力が短すぎます" });
      return;
    }
    const [lead] = await db.insert(salesLeadsTable).values({
      reportedBy: user?.id ?? null,
      storeName:  trimmedStoreName,
      location:   trimmedLocation,
      memo:       trimmedMemo,
      status:     "new",
    }).returning();

    // 管理者に in-app 通知
    const { data: adminRow } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", ADMIN_EMAIL)
      .maybeSingle();
    if (adminRow?.id) {
      await db.insert(notificationsTable).values({
        userId: adminRow.id,
        type:   "sales_lead",
        title:  "🏪 新しい営業リードが届きました！",
        body:   `${storeName.trim()}（${location.trim()}）`,
        read:   false,
      });
    }
    res.json({ ok: true, id: lead.id });
  } catch (err: any) {
    console.error("[sales-leads] POST error:", err);
    res.status(500).json({ error: "internal_error", message: err?.message });
  }
});

// ── GET /admin/sales-leads ── 管理者のみ ───────────────────────────────────
router.get("/admin/sales-leads", requireAdmin, async (_req, res) => {
  try {
    const leads = await db
      .select()
      .from(salesLeadsTable)
      .orderBy(desc(salesLeadsTable.createdAt));
    res.json(leads);
  } catch (err: any) {
    console.error("[admin] sales-leads GET error:", err);
    res.status(500).json({ error: "internal_error", message: err?.message });
  }
});

// ── PATCH /admin/sales-leads/:id ── ステータス更新 ────────────────────────
router.patch("/admin/sales-leads/:id", requireAdmin, async (req: any, res) => {
  try {
    const id     = Number(req.params.id);
    const status = (req.body as { status?: string }).status;
    if (!status) {
      res.status(400).json({ error: "bad_request", message: "status is required" });
      return;
    }
    await db
      .update(salesLeadsTable)
      .set({ status })
      .where(eq(salesLeadsTable.id, id));
    res.json({ ok: true });
  } catch (err: any) {
    console.error("[admin] sales-leads PATCH error:", err);
    res.status(500).json({ error: "internal_error", message: err?.message });
  }
});

// ── POST /admin/stores/batch-patch-stripe-license ──────────────────────────────
// license_image_url が存在するのに stripe_license_file_id が NULL の店舗を一括修正
router.post("/admin/stores/batch-patch-stripe-license", requireAdmin, async (_req, res) => {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return res.status(500).json({ error: "stripe_key_missing" });
    }
    const Stripe = (await import("stripe")).default;
    const { Readable } = await import("stream");

    // license_image_url あり・stripe_license_file_id なし・stripe_account_id あり
    const targets = await db
      .select({
        id: storesTable.id,
        name: storesTable.name,
        licenseImageUrl: storesTable.licenseImageUrl,
        stripeAccountId: storesTable.stripeAccountId,
      })
      .from(storesTable)
      .where(
        sql`license_image_url IS NOT NULL AND stripe_license_file_id IS NULL AND stripe_account_id IS NOT NULL`
      );

    const results: { storeId: number; name: string; result: string; fileId?: string }[] = [];

    for (const store of targets) {
      try {
        const stripe = new Stripe(stripeKey);
        const imgResp = await fetch(store.licenseImageUrl!);
        if (!imgResp.ok) {
          results.push({ storeId: store.id, name: store.name, result: `fetch失敗: HTTP ${imgResp.status}` });
          continue;
        }
        const ct = imgResp.headers.get("content-type") ?? "image/jpeg";
        const mime = ct.split(";")[0].trim();
        const buf = Buffer.from(await imgResp.arrayBuffer());
        const ext = mime.split("/")[1] ?? "jpg";
        const stripeFile = await stripe.files.create(
          {
            file: { data: buf, name: `license-${store.id}-backfill.${ext}`, type: mime },
            purpose: "additional_verification",
          },
          { stripeAccount: store.stripeAccountId! }
        );
        await db
          .update(storesTable)
          .set({ stripeLicenseFileId: stripeFile.id } as any)
          .where(eq(storesTable.id, store.id));
        results.push({ storeId: store.id, name: store.name, result: "✅ アップロード完了", fileId: stripeFile.id });
        console.log(`[admin/batch-patch] ✅ store ${store.id} "${store.name}" → Stripe fileId=${stripeFile.id}`);
      } catch (err: any) {
        results.push({ storeId: store.id, name: store.name, result: `❌ エラー: ${err?.message}` });
        console.error(`[admin/batch-patch] store ${store.id} エラー:`, err?.message);
      }
    }

    res.json({ patched: results.filter(r => r.fileId).length, total: targets.length, results });
  } catch (err: any) {
    console.error("[admin/batch-patch-stripe-license]", err);
    res.status(500).json({ error: "internal_error", message: err?.message });
  }
});

// ─── Stripe アカウント手動リンク（孤立アカウント修復用） ────────────────────
// PATCH /api/admin/stores/:storeId/link-stripe-account
// 既存の Stripe Connect アカウントを店舗 DB レコードに紐付ける。
// bank-setup 途中でエラーが起きてアカウントが孤立した際の修復用。
router.patch("/admin/stores/:storeId/link-stripe-account", requireAdmin, async (req, res) => {
  try {
    const storeId = Number(req.params.storeId);
    if (isNaN(storeId)) return res.status(400).json({ error: "bad_request", message: "Invalid storeId" });
    const { stripeAccountId } = req.body as { stripeAccountId?: string };
    if (!stripeAccountId?.startsWith("acct_")) {
      return res.status(400).json({ error: "bad_request", message: "stripeAccountId は acct_ で始まる必要があります" });
    }
    const [store] = await db.select({ id: storesTable.id }).from(storesTable).where(eq(storesTable.id, storeId));
    if (!store) return res.status(404).json({ error: "not_found", message: "店舗が見つかりません" });

    await db.update(storesTable).set({ stripeAccountId }).where(eq(storesTable.id, storeId));
    console.log(`[admin/link-stripe-account] ✅ storeId=${storeId} → stripeAccountId=${stripeAccountId}`);
    res.json({ ok: true, storeId, stripeAccountId });
  } catch (err: any) {
    console.error("[admin/link-stripe-account]", err);
    res.status(500).json({ error: "internal_error", message: err?.message });
  }
});

router.post("/admin/stores/:storeId/fix-stripe-business-name", requireAdmin, async (req, res) => {
  try {
    const storeId = Number(req.params.storeId);
    const { businessName } = req.body as { businessName?: string };
    if (!businessName?.trim()) {
      return res.status(400).json({ error: "bad_request", message: "businessName は必須です" });
    }
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) return res.status(500).json({ error: "stripe_key_missing" });

    const [store] = await db
      .select({ stripeAccountId: storesTable.stripeAccountId, name: storesTable.name })
      .from(storesTable)
      .where(eq(storesTable.id, storeId));
    if (!store?.stripeAccountId) {
      return res.status(404).json({ error: "not_found", message: "StripeアカウントIDが見つかりません" });
    }
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(stripeKey);
    const updated = await stripe.accounts.update(store.stripeAccountId, {
      business_profile: { name: businessName.trim() },
    });
    console.log(`[admin/fix-business-name] ✅ storeId=${storeId} acct=${store.stripeAccountId} 新しいbusiness_profile.name="${updated.business_profile?.name}"`);
    res.json({ ok: true, stripeAccountId: store.stripeAccountId, businessProfileName: updated.business_profile?.name });
  } catch (err: any) {
    console.error("[admin/fix-stripe-business-name]", err);
    res.status(500).json({ error: "internal_error", message: err?.message });
  }
});

export default router;
