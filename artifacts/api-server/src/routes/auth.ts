import { Router, type IRouter, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { supabaseAdmin } from "../lib/supabase";
import { Resend } from "resend";

// ── 管理者 OTP ストア（インメモリ） ──────────────────────────────────────────
interface OtpEntry {
  code:      string;
  expiresAt: number;
  attempts:  number;
}
const adminOtpStore = new Map<string, OtpEntry>();

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function buildAdminOtpHtml(code: string): string {
  return `<!DOCTYPE html>
<html lang="ja">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>管理者ログイン確認</title></head>
<body style="margin:0;padding:0;background:#F5F5F3;font-family:'Hiragino Kaku Gothic Pro','Yu Gothic UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F3;padding:40px 16px;">
<tr><td align="center">
<table width="480" cellpadding="0" cellspacing="0"
  style="max-width:480px;width:100%;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.09);">
  <tr><td style="background:linear-gradient(135deg,#7C3AED,#4F46E5);padding:32px 40px;text-align:center;">
    <div style="font-size:28px;font-weight:900;color:#fff;letter-spacing:-0.5px;">🛡️ Osusowake</div>
    <div style="color:rgba(255,255,255,0.80);font-size:13px;margin-top:6px;">管理者ログイン確認コード</div>
  </td></tr>
  <tr><td style="padding:40px 40px 32px;">
    <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.7;">
      管理者ダッシュボード（神モード）へのログインが検出されました。<br>
      以下の確認コードを入力してください。
    </p>
    <div style="background:#F3F0FF;border:2px solid #7C3AED;border-radius:16px;padding:28px;text-align:center;margin-bottom:24px;">
      <div style="font-size:13px;color:#6B21A8;font-weight:700;letter-spacing:2px;margin-bottom:12px;">確認コード</div>
      <div style="font-size:48px;font-weight:900;color:#4F46E5;letter-spacing:12px;font-feature-settings:'tnum';">${code}</div>
    </div>
    <p style="margin:0 0 8px;color:#6B7280;font-size:13px;">⏱ このコードは <strong>10分間</strong> 有効です。</p>
    <p style="margin:0;color:#EF4444;font-size:13px;font-weight:700;">⚠️ このコードを他人と共有しないでください。</p>
  </td></tr>
  <tr><td style="background:#F9F9F7;padding:20px 40px;text-align:center;border-top:1px solid #E5E7EB;">
    <p style="margin:0;color:#9CA3AF;font-size:11px;">このメールに心当たりがない場合は、即座にパスワードを変更してください。</p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

// 管理者メールはサーバーサイドのみで保持（JS バンドルに露出させない）
const ADMIN_EMAIL_B64 = "eXV1aGkwMTI1NDE2QGljbG91ZC5jb20=";
function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  return email === Buffer.from(ADMIN_EMAIL_B64, "base64").toString();
}

const router: IRouter = Router();

// ── POST /auth/create-profile ─────────────────────────────────────────────────
// 新規ユーザーのプロフィールを Admin クライアント（RLS バイパス）で upsert する
// フロントからの supabase.from('users').upsert() は RLS でブロックされるため必須
router.post("/auth/create-profile", async (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  // JWT からユーザーを検証
  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
  if (authErr || !user) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  const { role, full_name, phone_number } = req.body as {
    role?: string;
    full_name?: string;
    phone_number?: string;
  };

  if (!role || !full_name || !phone_number) {
    res.status(400).json({ error: "role, full_name, phone_number are required" });
    return;
  }

  try {
    const { error: upsertErr } = await supabaseAdmin
      .from("users")
      .upsert({
        id: user.id,
        email: user.email!,
        role,
        full_name: full_name.trim(),
        phone_number: phone_number.trim(),
      }, { onConflict: "id" });

    if (upsertErr) {
      console.error("[auth/create-profile] upsert error:", upsertErr);
      if (upsertErr.code === "23505" || upsertErr.message?.includes("unique")) {
        res.status(409).json({ error: "phone_taken", message: "この電話番号は既に登録されています" });
      } else {
        res.status(500).json({ error: "db_error", message: upsertErr.message });
      }
      return;
    }

    res.json({ ok: true });
  } catch (err: any) {
    console.error("[auth/create-profile]", err);
    res.status(500).json({ error: "internal_error", message: err?.message });
  }
});

// ── GET /api/auth/profile ──────────────────────────────────────────────────────
// JWT を検証してプロフィールを返す（Admin クライアントで RLS バイパス）
router.get("/auth/profile", async (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) { res.status(401).json({ error: "unauthorized" }); return; }

  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
  if (authErr || !user) { res.status(401).json({ error: "unauthorized" }); return; }

  try {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("id, email, role, full_name, phone_number, display_name")
      .eq("id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      res.status(500).json({ error: "db_error", message: error.message });
      return;
    }
    res.json({ profile: data ?? null });
  } catch (err: any) {
    res.status(500).json({ error: "internal_error", message: err?.message });
  }
});

// ── PATCH /api/auth/update-role ────────────────────────────────────────────────
// サインイン後にロールを確定させる（ロール整合チェック付き）
// - store_owner タブからログイン: DB が customer(=trigger自動作成) なら store_owner に昇格
// - customer タブからログイン: DB が store_owner なら 403 を返す
router.patch("/auth/update-role", async (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) { res.status(401).json({ error: "unauthorized" }); return; }

  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
  if (authErr || !user) { res.status(401).json({ error: "unauthorized" }); return; }

  const { desiredRole } = req.body as { desiredRole?: string };
  if (desiredRole !== "store_owner" && desiredRole !== "customer") {
    res.status(400).json({ error: "invalid_role" });
    return;
  }

  try {
    // 現在の DB プロフィールを取得
    const { data: existing } = await supabaseAdmin
      .from("users")
      .select("id, role, full_name")
      .eq("id", user.id)
      .single();

    // ── ケース分岐 ──────────────────────────────────────────────────────────
    if (!existing) {
      // プロフィールなし（メール確認後の初回ログイン等）→ 新規作成
      const { error: insertErr } = await supabaseAdmin.from("users").insert({
        id: user.id,
        email: user.email!,
        role: desiredRole,
      });
      if (insertErr) {
        res.status(500).json({ error: "db_error", message: insertErr.message });
        return;
      }
      res.json({ ok: true, role: desiredRole, action: "created" });
      return;
    }

    const currentRole = existing.role as string;
    // Supabase auth メタデータの intended_role（signUpAsStore で埋め込み）
    const intendedRole = (user.user_metadata?.intended_role as string | undefined) ?? null;

    if (desiredRole === "store_owner") {
      if (currentRole === "store_owner") {
        // 既に store_owner → そのまま OK
        res.json({ ok: true, role: currentRole, action: "noop" });
        return;
      }
      // customer だが full_name が設定済み → 意図的に customer 登録したユーザー → 拒否
      if (currentRole === "customer" && existing.full_name) {
        res.status(403).json({
          error: "role_mismatch",
          message: "このアカウントは一般ユーザー用です。一般ユーザータブからログインしてください。",
        });
        return;
      }
      // customer で full_name=null（トリガー自動生成）→ store_owner に昇格
      await supabaseAdmin.from("users").update({ role: "store_owner" }).eq("id", user.id);
      res.json({ ok: true, role: "store_owner", action: "upgraded" });
      return;
    }

    // desiredRole = 'customer'
    if (currentRole === "store_owner") {
      // 店舗オーナーが一般タブでログイン → 拒否
      res.status(403).json({
        error: "role_mismatch",
        message: "このアカウントは店舗オーナー用です。「飲食店・パートナー」タブからログインしてください。",
      });
      return;
    }
    // customer で intended_role=store_owner（メール確認後に誤って user タブでログイン）→ 拒否
    if (currentRole === "customer" && !existing.full_name && intendedRole === "store_owner") {
      res.status(403).json({
        error: "role_mismatch",
        message: "店舗オーナーとして登録されています。「飲食店・パートナー」タブからログインしてください。",
      });
      return;
    }
    // customer → customer → そのまま OK
    res.json({ ok: true, role: currentRole, action: "noop" });
  } catch (err: any) {
    res.status(500).json({ error: "internal_error", message: err?.message });
  }
});

// ── POST /auth/check-phone ─────────────────────────────────────────────────────
// 電話番号の重複チェック（管理者クライアントで RLS をバイパス）
router.post("/auth/check-phone", async (req: Request, res: Response) => {
  const { phone } = req.body as { phone?: string };
  if (!phone?.trim()) {
    res.status(400).json({ error: "phone is required" });
    return;
  }
  try {
    const result = await db.execute(sql`
      SELECT id FROM users WHERE phone_number = ${phone.trim()} LIMIT 1
    `);
    res.json({ taken: result.rows.length > 0 });
  } catch (err: any) {
    console.error("[auth/check-phone]", err);
    res.status(500).json({ error: "internal_error", message: err?.message });
  }
});

// ── POST /auth/cleanup-user ────────────────────────────────────────────────────
// auth.users から孤立したユーザーを削除（DB upsert 失敗後のロールバック）
// セキュリティ: userId は Supabase auth の JWT から取得した ID のみ受け付ける
router.post("/auth/cleanup-user", async (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  // トークンからユーザーを検証（自分自身のアカウントのみ削除可能）
  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
  if (authErr || !user) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  try {
    // users テーブルの状態を確認
    const { data: existing } = await supabaseAdmin
      .from("users")
      .select("id, full_name")
      .eq("id", user.id)
      .single();

    if (existing && existing.full_name) {
      // full_name が設定済み = 正常に登録されたユーザー → 削除しない
      res.status(400).json({ error: "user_already_registered" });
      return;
    }

    // レコードが存在しない OR full_name=null（Supabase トリガーが自動生成した不完全レコード）
    // → public.users の行を先に削除してから auth.users を削除
    if (existing) {
      await supabaseAdmin.from("users").delete().eq("id", user.id);
    }
    await supabaseAdmin.auth.admin.deleteUser(user.id);
    res.json({ ok: true });
  } catch (err: any) {
    console.error("[auth/cleanup-user]", err);
    res.status(500).json({ error: "internal_error", message: err?.message });
  }
});

// ── GET /auth/is-admin ────────────────────────────────────────────────────────
router.get("/auth/is-admin", async (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) { res.json({ isAdmin: false }); return; }
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) { res.json({ isAdmin: false }); return; }
  res.json({ isAdmin: isAdminEmail(user.email) });
});

// ── POST /auth/admin-otp/send ─────────────────────────────────────────────────
// 管理者メールに 6桁 OTP を送信する
router.post("/auth/admin-otp/send", async (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) { res.status(401).json({ error: "unauthorized" }); return; }

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user || !isAdminEmail(user.email)) {
    res.status(403).json({ error: "forbidden" }); return;
  }

  const email = user.email!;

  // 前回コードが有効かつ 30秒以内の再送信はブロック
  const existing = adminOtpStore.get(email);
  if (existing && existing.expiresAt > Date.now() + (10 * 60 * 1000 - 30 * 1000)) {
    res.status(429).json({ error: "too_soon", message: "30秒後に再送信できます" }); return;
  }

  const code = generateOtp();
  adminOtpStore.set(email, { code, expiresAt: Date.now() + 10 * 60 * 1000, attempts: 0 });

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.error("[admin-otp/send] RESEND_API_KEY not set");
    res.status(500).json({ error: "mail_config" }); return;
  }

  try {
    const fromDomain = process.env.RESEND_FROM_DOMAIN ?? "onboarding@resend.dev";
    const resend = new Resend(resendKey);
    await resend.emails.send({
      from:    `Osusowake 事務局 <${fromDomain}>`,
      to:      email,
      subject: "【Osusowake管理者】ログイン確認コード",
      html:    buildAdminOtpHtml(code),
    });
    console.log(`[admin-otp/send] OTP sent to admin`);
    res.json({ ok: true });
  } catch (err: any) {
    adminOtpStore.delete(email);
    console.error("[admin-otp/send] Resend error:", err?.message);
    res.status(500).json({ error: "mail_send_failed", message: err?.message });
  }
});

// ── POST /auth/admin-otp/verify ───────────────────────────────────────────────
// OTP コードを検証する
router.post("/auth/admin-otp/verify", async (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) { res.status(401).json({ error: "unauthorized" }); return; }

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user || !isAdminEmail(user.email)) {
    res.status(403).json({ error: "forbidden" }); return;
  }

  const { code } = req.body as { code?: string };
  if (!code?.trim()) { res.status(400).json({ error: "code_required" }); return; }

  const email = user.email!;
  const entry = adminOtpStore.get(email);

  if (!entry) {
    res.status(400).json({ error: "no_otp", message: "コードが送信されていません。再送信してください" }); return;
  }
  if (Date.now() > entry.expiresAt) {
    adminOtpStore.delete(email);
    res.status(400).json({ error: "expired", message: "コードの有効期限が切れました。再送信してください" }); return;
  }

  entry.attempts++;
  if (entry.attempts > 5) {
    adminOtpStore.delete(email);
    res.status(429).json({ error: "too_many_attempts", message: "試行回数が上限を超えました。再ログインしてください" }); return;
  }

  if (entry.code !== code.trim()) {
    const left = 5 - entry.attempts;
    res.status(400).json({ error: "invalid_code", message: `コードが正しくありません（残り ${left} 回）`, attemptsLeft: left }); return;
  }

  adminOtpStore.delete(email);
  console.log("[admin-otp/verify] Admin MFA verified successfully");
  res.json({ ok: true, verifiedAt: Date.now() });
});

// ── DELETE /api/user/account ──────────────────────────────────────────────────
// App Store 必須：ログイン中ユーザーの完全削除
router.delete("/user/account", async (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
  if (authErr || !user) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  try {
    // 1. 店舗オーナーの場合：店舗データのクリーンアップ
    const { data: ownedStores } = await supabaseAdmin
      .from("stores")
      .select("id, stripe_account_id")
      .eq("owner_id", user.id);

    if (ownedStores && ownedStores.length > 0) {
      for (const store of ownedStores) {
        // 1a. 出品中バッグを全て停止
        await supabaseAdmin
          .from("surprise_bags")
          .update({ is_active: false })
          .eq("store_id", store.id);

        // 1b. Stripe Connect アカウントを削除（連携解除）
        if (store.stripe_account_id) {
          try {
            const stripeKey = process.env["STRIPE_SECRET_KEY"];
            if (stripeKey) {
              const stripe = await import("stripe").then((m) => new m.default(stripeKey));
              await stripe.accounts.del(store.stripe_account_id);
              console.log(`[user/account] Stripe account ${store.stripe_account_id} deleted`);
            }
          } catch (stripeErr: any) {
            // Stripe 削除失敗は致命的ではないのでログに留め処理続行
            console.warn(`[user/account] Stripe account delete failed (${store.stripe_account_id}):`, stripeErr?.message);
          }
        }

        // 1c. 店舗を suspended に更新（FK制約のためすぐに行は削除しない）
        await supabaseAdmin
          .from("stores")
          .update({ status: "suspended", is_active: false })
          .eq("id", store.id);
      }
    }

    // 2. 予約・お気に入り・通知など（CASCADE FK があれば自動削除されるが念のため明示）
    await supabaseAdmin.from("reservations").delete().eq("user_id", user.id);
    await supabaseAdmin.from("favorites").delete().eq("user_id", user.id);

    // 3. public.users 行を削除
    await supabaseAdmin.from("users").delete().eq("id", user.id);

    // 4. auth.users を削除（Supabase Admin API）
    const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(user.id);
    if (delErr) throw delErr;

    console.log(`[user/account] Deleted user ${user.id}${ownedStores?.length ? ` (+ ${ownedStores.length} stores)` : ''}`);
    res.json({ ok: true });
  } catch (err: any) {
    console.error("[user/account] delete error:", err);
    res.status(500).json({ error: "internal_error", message: err?.message });
  }
});

export default router;
