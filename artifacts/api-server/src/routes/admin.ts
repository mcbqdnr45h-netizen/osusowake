import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { db } from "@workspace/db";
import { storesTable, announcementsTable, webPushSubscriptionsTable, notificationsTable } from "@workspace/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { supabaseAdmin } from "../lib/supabase";
import { Resend } from "resend";
import crypto from "node:crypto";

const router: IRouter = Router();

const ADMIN_EMAIL = "yuuhi0125416@icloud.com";
const APPROVAL_SECRET = process.env.ADMIN_APPROVAL_SECRET ?? "osusowake-admin-secret";

// ── ヘルパー: Supabase token からユーザー情報を取得 ────────────────────────────
async function getAuthUser(req: Request) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return null;
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

// ── 管理者専用ミドルウェア ──────────────────────────────────────────────────────
async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = await getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  if (user.email !== ADMIN_EMAIL) {
    res.status(403).json({ error: "forbidden", message: "管理者権限が必要です" });
    return;
  }
  (req as any).adminUser = user;
  next();
}

// ── GET /admin/metrics ─────────────────────────────────────────────────────────
// GMV、手数料、アクティブユーザー数、登録店舗数
router.get("/admin/metrics", requireAdmin, async (_req, res) => {
  try {
    // 総売上（GMV）= 全完了予約の合計金額
    const gmvResult = await db.execute(sql`
      SELECT
        COALESCE(SUM(r.total_price), 0)::numeric AS gmv,
        COUNT(DISTINCT r.user_id)::int            AS active_users
      FROM reservations r
      WHERE r.status IN ('confirmed', 'picked_up', 'completed')
    `);
    const gmv = Number((gmvResult.rows[0] as any)?.gmv ?? 0);
    const activeUsers = Number((gmvResult.rows[0] as any)?.active_users ?? 0);
    const platformFee = Math.round(gmv * 0.25);

    // 店舗統計
    const storeStats = await db.execute(sql`
      SELECT
        COUNT(*)::int                                                     AS total_stores,
        COUNT(*) FILTER (WHERE status = 'approved' AND is_active = true)::int AS approved_stores,
        COUNT(*) FILTER (WHERE status = 'pending_review')::int            AS pending_stores,
        COUNT(*) FILTER (WHERE status = 'suspended' OR (status = 'approved' AND is_active = false))::int AS suspended_stores
      FROM stores
    `);
    const storeRow = storeStats.rows[0] as any;

    res.json({
      gmv,
      platformFee,
      activeUsers,
      totalStores: storeRow.total_stores,
      approvedStores: storeRow.approved_stores,
      pendingStores: storeRow.pending_stores,
      suspendedStores: storeRow.suspended_stores,
    });
  } catch (err: any) {
    console.error("[admin/metrics]", err);
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
        COUNT(DISTINCT b.id)::int AS bag_count,
        COUNT(DISTINCT r.id)::int AS reservation_count,
        COALESCE(SUM(r.total_price) FILTER (WHERE r.status IN ('confirmed','picked_up','completed')), 0)::numeric AS revenue
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

// ── POST /admin/stores/:storeId/approve ───────────────────────────────────────
router.post("/admin/stores/:storeId/approve", requireAdmin, async (req, res) => {
  const storeId = Number(req.params.storeId);
  if (isNaN(storeId)) { res.status(400).json({ error: "bad_request" }); return; }
  try {
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

      // オーナーへの承認メール
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
              from: `OsusOwake <${fromDomain}>`,
              to: ownerEmail,
              subject: `【OsusOwake】${updated.name}の審査が完了しました`,
              html: `
<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:'Helvetica Neue',Arial,sans-serif;">
<div style="max-width:560px;margin:32px auto;background:#fff;border-radius:20px;overflow:hidden;">
<div style="background:linear-gradient(135deg,#F26419,#d44a00);padding:40px 32px;text-align:center;">
  <div style="font-size:48px;margin-bottom:12px;">🎉</div>
  <h1 style="color:#fff;font-size:22px;font-weight:900;margin:0;">審査が完了しました！</h1>
</div>
<div style="padding:32px;">
  <p style="font-size:15px;line-height:1.7;color:#333;margin:0 0 24px;">
    <strong>${updated.name}</strong> オーナー様<br><br>
    おすそわけの審査が完了しました。今すぐバッグを出品して、食品ロス削減に貢献しましょう！
  </p>
  <div style="text-align:center;">
    <a href="${appUrl}/store/dashboard" style="display:inline-block;background:linear-gradient(135deg,#F26419,#d44a00);color:#fff;font-size:16px;font-weight:900;padding:16px 48px;border-radius:14px;text-decoration:none;">
      ダッシュボードへ →
    </a>
  </div>
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
  try {
    const [updated] = await db
      .update(storesTable)
      .set({ status: "rejected", isActive: false })
      .where(eq(storesTable.id, storesTable.id))
      .returning();
    res.json({ ok: true, store: updated });
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

export default router;
