import { Router, type IRouter } from "express";
import healthRouter from "./health";
import storesRouter from "./stores";
import bagsRouter from "./bags";
import reservationsRouter from "./reservations";
import paymentRouter from "./payment";
import supabaseTestRouter from "./supabase-test";
import uploadRouter from "./upload";
import notificationsRouter from "./notifications";
import classifyRouter from "./classify";
import favoritesRouter from "./favorites";
import adminRouter from "./admin";
import authRouter from "./auth";
import stripeWebhookRouter from "./stripe-webhook";
import { supabaseAdmin, supabaseAnon } from "../lib/supabase.js";
import { Resend } from "resend";

const router: IRouter = Router();

router.use(adminRouter);
router.use(authRouter);
router.use(stripeWebhookRouter);
router.use(healthRouter);
router.use(storesRouter);
router.use(bagsRouter);
router.use(reservationsRouter);
router.use(paymentRouter);
router.use(supabaseTestRouter);
router.use(uploadRouter);
router.use(notificationsRouter);
router.use(classifyRouter);
router.use(favoritesRouter);

// ── POST /auth/forgot-password ── ブランドメール送信（Resend 経由）──────────
router.post("/auth/forgot-password", async (req, res) => {
  try {
    const { email, redirectTo } = req.body as { email?: string; redirectTo?: string };
    if (!email?.trim()) {
      res.status(400).json({ error: "bad_request", message: "メールアドレスは必須です" });
      return;
    }

    // redirectTo を確定: フロントから来た値 → 環境変数 → fallback
    const appDomain = process.env.APP_DOMAIN ?? process.env.REPLIT_DEV_DOMAIN ?? "";
    const finalRedirectTo =
      redirectTo ||
      (appDomain ? `https://${appDomain}/rescueat/reset-password` : "");

    console.log("[forgot-password] redirectTo:", finalRedirectTo);

    // Supabase Admin でリカバリーリンクを生成（メールは送信しない）
    const linkOpts: Record<string, unknown> = {
      type: "recovery",
      email: email.trim(),
      options: { redirectTo: finalRedirectTo },
    };
    const { data, error: genErr } = await supabaseAdmin.auth.admin.generateLink(
      linkOpts as Parameters<typeof supabaseAdmin.auth.admin.generateLink>[0],
    );

    if (genErr || !data?.properties?.action_link) {
      // ユーザーが存在しない場合もセキュリティ上 ok を返す
      console.warn("[forgot-password] generateLink warn:", genErr?.message);
      res.json({ ok: true });
      return;
    }

    const resetLink = data.properties.action_link;

    // Resend でブランドメールを送信
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      console.error("[forgot-password] RESEND_API_KEY not set");
      res.status(500).json({ error: "config_error", message: "メール設定が不完全です" });
      return;
    }
    const fromDomain = process.env.RESEND_FROM_DOMAIN ?? "onboarding@resend.dev";
    const resend = new Resend(resendKey);

    await resend.emails.send({
      from:    `OsusOwake 事務局 <${fromDomain}>`,
      to:      email.trim(),
      subject: "【OsusOwake】パスワード再設定のご案内",
      html:    buildPasswordResetHtml(resetLink),
    });

    res.json({ ok: true });
  } catch (err: any) {
    console.error("[forgot-password] error:", err);
    res.status(500).json({ error: "internal_error", message: err?.message });
  }
});

function buildPasswordResetHtml(resetLink: string): string {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>パスワード再設定 — OsusOwake</title>
</head>
<body style="margin:0;padding:0;background-color:#F5F5F3;font-family:'Hiragino Kaku Gothic Pro','Hiragino Sans','Yu Gothic UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#F5F5F3;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" role="presentation"
          style="max-width:560px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- ── ヘッダー（グラデーション） ── -->
          <tr>
            <td style="background:linear-gradient(135deg,#F26419 0%,#F6AE2D 100%);padding:36px 40px;text-align:center;">
              <p style="margin:0 0 4px;font-size:32px;font-weight:900;color:#ffffff;letter-spacing:-1px;line-height:1;">
                OsusOwake
              </p>
              <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.8);font-weight:600;letter-spacing:0.5px;">
                食品ロスをなくす、おすそわけマーケット
              </p>
            </td>
          </tr>

          <!-- ── 本文 ── -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <p style="margin:0 0 8px;font-size:22px;font-weight:900;color:#1A1A1A;line-height:1.3;">
                パスワード再設定のご案内
              </p>
              <div style="width:40px;height:4px;background:linear-gradient(90deg,#F26419,#F6AE2D);border-radius:2px;margin:0 0 24px;"></div>

              <p style="margin:0 0 12px;font-size:15px;color:#555;line-height:1.8;">
                OsusOwakeをご利用いただきありがとうございます。
              </p>
              <p style="margin:0 0 32px;font-size:15px;color:#555;line-height:1.8;">
                以下のボタンをタップして、新しいパスワードを設定してください。<br/>
                ボタンが表示されない場合は、末尾のURLを直接ブラウザに貼り付けてください。
              </p>

              <!-- ── CTAボタン ── -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td align="center" style="padding-bottom:32px;">
                    <a href="${resetLink}"
                      style="display:inline-block;background:linear-gradient(135deg,#F26419 0%,#F6AE2D 100%);color:#ffffff;font-size:16px;font-weight:900;text-decoration:none;padding:18px 48px;border-radius:100px;box-shadow:0 6px 20px rgba(242,100,25,0.4);letter-spacing:0.3px;">
                      パスワードを再設定する
                    </a>
                  </td>
                </tr>
              </table>

              <!-- ── 補足テキスト ── -->
              <div style="background:#FFF8F0;border-radius:12px;padding:16px 20px;border-left:4px solid #F26419;">
                <p style="margin:0;font-size:13px;color:#777;line-height:1.7;">
                  ⚠️ このメールに心当たりがない場合は、そのまま破棄してください。<br/>
                  リンクの有効期限は <strong>24時間</strong> です。
                </p>
              </div>

              <!-- URLテキスト -->
              <p style="margin:20px 0 0;font-size:11px;color:#aaa;line-height:1.6;word-break:break-all;">
                リンク: <a href="${resetLink}" style="color:#F26419;text-decoration:none;">${resetLink}</a>
              </p>
            </td>
          </tr>

          <!-- ── フッター ── -->
          <tr>
            <td style="background:#F8F8F7;padding:20px 40px;text-align:center;border-top:1px solid #EBEBEA;">
              <p style="margin:0 0 4px;font-size:13px;font-weight:900;color:#888;">OsusOwake</p>
              <p style="margin:0;font-size:11px;color:#bbb;">© 2026 OsusOwake. All rights reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

router.put("/user/display-name", async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) { res.status(401).json({ error: "unauthorized" }); return; }

  const { displayName } = req.body as { displayName?: string };
  if (!displayName || typeof displayName !== "string" || displayName.trim().length === 0) {
    res.status(400).json({ error: "display_name is required" }); return;
  }
  const trimmed = displayName.trim().slice(0, 40);

  try {
    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
    if (authErr || !user) { res.status(401).json({ error: "unauthorized" }); return; }

    const { error } = await supabaseAdmin
      .from("users")
      .update({ display_name: trimmed })
      .eq("id", user.id);

    if (error) throw error;
    res.json({ ok: true, display_name: trimmed });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[/user/display-name] error:", msg);
    res.status(500).json({ error: msg });
  }
});

router.get("/me", async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: "unauthorized", message: "No token provided" });
    return;
  }

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) {
      res.status(401).json({ error: "unauthorized", message: "Invalid token" });
      return;
    }
    const meta = (user.user_metadata ?? {}) as Record<string, string>;
    res.json({
      id: user.id,
      name: meta.full_name || meta.name || user.email?.split("@")[0] || "ユーザー",
      email: user.email ?? "",
      role: meta.role ?? "user",
      createdAt: user.created_at,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[/me] error:", msg);
    res.status(500).json({ error: "internal_error", message: msg });
  }
});

export default router;
