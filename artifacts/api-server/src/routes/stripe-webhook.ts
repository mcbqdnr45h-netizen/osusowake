import { Router, type Request, type Response } from "express";
import { db, pool } from "@workspace/db";
import { storesTable, notificationsTable } from "@workspace/db/schema";
import { eq, sql } from "drizzle-orm";
import { Resend } from "resend";
import { sendStoreApprovalEmail } from "../utils/emails";

const router = Router();

const ADMIN_EMAIL = "yuuhi0125416@icloud.com";

// ── Stripe インスタンスを返すヘルパー（ESM 対応 dynamic import）────────────────
async function getStripe() {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return null;
  const stripeLib = await import("stripe");
  const Stripe = stripeLib.default;
  return new Stripe(stripeKey, { apiVersion: "2024-11-20.acacia" as any });
}

// ── app_settings から値を取得するヘルパー ─────────────────────────────────────
async function getSetting(key: string, defaultValue: string = 'false'): Promise<string> {
  try {
    const result = await db.execute(sql`SELECT value FROM app_settings WHERE key = ${key}`);
    const row = result.rows[0] as { value: string } | undefined;
    return row?.value ?? defaultValue;
  } catch {
    return defaultValue;
  }
}

// ── 管理者へのStripe KYC完了通知メール ────────────────────────────────────────
async function sendAdminKycEmail(store: {
  id: number;
  name: string;
  imageUrl: string | null;
  address: string;
  city: string | null;
  stripeAccountId: string | null;
  chargesEnabled: boolean;
  detailsSubmitted: boolean;
  payoutsEnabled: boolean;
  ownerId: string;
}) {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.warn("[stripe-webhook] RESEND_API_KEY not set — スキップ");
    return false;
  }

  const resend = new Resend(resendApiKey);
  const fromDomain = process.env.RESEND_FROM_DOMAIN ?? "onboarding@resend.dev";
  const appUrl = process.env.APP_URL ?? `https://${process.env.REPLIT_DEV_DOMAIN ?? 'localhost'}`;
  const crypto = await import('node:crypto');
  const secret = process.env.ADMIN_APPROVAL_SECRET ?? "osusowake-admin-secret";
  const token = crypto.createHmac('sha256', secret).update(String(store.id)).digest('hex');
  const approveUrl = `${appUrl}/api/admin/approve-store?storeId=${store.id}&token=${token}`;
  const adminUrl = `${appUrl}/admin`;

  const imageHtml = store.imageUrl
    ? `<img src="${store.imageUrl}" alt="${store.name}" style="width:100%;max-height:200px;object-fit:cover;display:block;border-radius:12px;margin-bottom:16px;" />`
    : `<div style="width:100%;height:120px;background:#f5e9df;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:40px;margin-bottom:16px;">🏪</div>`;

  const stripeStatusHtml = `
    <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:12px;padding:16px;margin-bottom:16px;">
      <p style="color:#15803d;font-size:13px;font-weight:900;margin:0 0 10px;letter-spacing:0.05em;">✅ STRIPE 審査状況</p>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="color:#555;font-size:13px;padding:3px 0;">決済受付 (charges_enabled)</td><td style="color:${store.chargesEnabled ? '#15803d' : '#dc2626'};font-weight:bold;font-size:13px;text-align:right;">${store.chargesEnabled ? '✅ OK' : '❌ 未完了'}</td></tr>
        <tr><td style="color:#555;font-size:13px;padding:3px 0;">情報提出 (details_submitted)</td><td style="color:${store.detailsSubmitted ? '#15803d' : '#dc2626'};font-weight:bold;font-size:13px;text-align:right;">${store.detailsSubmitted ? '✅ OK' : '❌ 未完了'}</td></tr>
        <tr><td style="color:#555;font-size:13px;padding:3px 0;">振込可能 (payouts_enabled)</td><td style="color:${store.payoutsEnabled ? '#15803d' : '#dc2626'};font-weight:bold;font-size:13px;text-align:right;">${store.payoutsEnabled ? '✅ OK' : '⏳ 処理中'}</td></tr>
        <tr><td style="color:#555;font-size:13px;padding:3px 0;">Stripeアカウント ID</td><td style="color:#555;font-size:11px;text-align:right;font-family:monospace;">${store.stripeAccountId ?? '—'}</td></tr>
      </table>
    </div>
  `;

  const { error } = await resend.emails.send({
    from: `Osusowake <${fromDomain}>`,
    to: ADMIN_EMAIL,
    subject: `【Osusowake】🎉 Stripe KYC完了 — 承認依頼: ${store.name}`,
    html: `
<!DOCTYPE html>
<html lang="ja">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

    <div style="background:linear-gradient(135deg,#F26419 0%,#d44a00 100%);padding:40px 32px;text-align:center;">
      <div style="font-size:48px;margin-bottom:12px;">🎉</div>
      <h1 style="color:#ffffff;font-size:22px;font-weight:900;margin:0 0 6px;">Stripe KYC 審査が完了しました</h1>
      <p style="color:rgba(255,255,255,0.9);font-size:14px;margin:0;">管理者承認をお願いします</p>
    </div>

    <div style="padding:32px;">
      <p style="color:#333333;font-size:15px;line-height:1.7;margin:0 0 20px;">
        勇飛さん、以下の店舗が Stripe の本人確認（KYC）を完了し、<strong>決済を受け取れる状態</strong>になりました。<br>
        内容を確認の上、承認をお願いします。
      </p>

      ${imageHtml}

      <div style="background:#fff8f0;border:2px solid #F26419;border-radius:16px;padding:20px;margin-bottom:16px;">
        <h2 style="color:#F26419;font-size:18px;font-weight:900;margin:0 0 8px;">${store.name}</h2>
        <p style="color:#666;font-size:13px;margin:0;">${store.address}${store.city ? `、${store.city}` : ''}</p>
        <p style="color:#999;font-size:12px;margin:6px 0 0;font-family:monospace;">店舗ID: ${store.id}</p>
      </div>

      ${stripeStatusHtml}

      <div style="text-align:center;margin-bottom:16px;">
        <a href="${approveUrl}"
           style="display:inline-block;background:linear-gradient(135deg,#22c55e,#16a34a);color:#ffffff;font-size:16px;font-weight:900;padding:16px 40px;border-radius:14px;text-decoration:none;letter-spacing:0.02em;">
          ✅ ワンクリックで承認する
        </a>
      </div>

      <div style="text-align:center;margin-bottom:24px;">
        <a href="${adminUrl}"
           style="display:inline-block;background:#f5f5f0;color:#333;font-size:13px;font-weight:700;padding:10px 24px;border-radius:10px;text-decoration:none;border:1px solid #ddd;">
          🛡 管理者ダッシュボードを開く
        </a>
      </div>

      <p style="color:#999999;font-size:12px;line-height:1.6;margin:0;text-align:center;">
        このメールは Osusowake システムから自動送信されています。<br>
        承認リンクはセキュリティのため1回限り有効です。
      </p>
    </div>

    <div style="background:#f5f5f0;padding:20px 32px;text-align:center;">
      <p style="color:#aaaaaa;font-size:11px;margin:0;">Osusowake — おいしいものを、もっとみんなへ。</p>
    </div>
  </div>
</body>
</html>
    `.trim(),
  });

  if (error) {
    console.error("[stripe-webhook] admin KYC email error:", error);
    return false;
  }
  console.log(`[stripe-webhook] ✅ admin KYC email sent for store ${store.id} (${store.name})`);
  return true;
}

// ── POST /stripe-webhook ───────────────────────────────────────────────────────
router.post("/stripe-webhook", async (req: Request, res: Response) => {
  const stripe = await getStripe();
  if (!stripe) {
    console.warn("[stripe-webhook] STRIPE_SECRET_KEY not set — スキップ");
    res.json({ received: true, skipped: "no_stripe_key" });
    return;
  }

  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: any;

  if (webhookSecret && sig) {
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
      console.error("[stripe-webhook] 署名検証失敗:", err.message);
      res.status(400).json({ error: `Webhook Error: ${err.message}` });
      return;
    }
  } else {
    // 開発環境では署名なしで受け取り（STRIPE_WEBHOOK_SECRET未設定時）
    try {
      event = JSON.parse(req.body.toString());
    } catch {
      res.status(400).json({ error: "Invalid JSON body" });
      return;
    }
    console.warn("[stripe-webhook] ⚠️ STRIPE_WEBHOOK_SECRET未設定 — 署名検証なし（開発環境のみ許可）");
  }

  // ── account.updated イベントのみ処理 ────────────────────────────────────────
  if (event.type !== "account.updated") {
    res.json({ received: true, type: event.type, handled: false });
    return;
  }

  const account = event.data.object as {
    id: string;
    charges_enabled: boolean;
    details_submitted: boolean;
    payouts_enabled: boolean;
  };

  console.log(`[stripe-webhook] account.updated: ${account.id}, charges_enabled=${account.charges_enabled}`);

  if (!account.charges_enabled) {
    res.json({ received: true, charges_enabled: false, handled: false });
    return;
  }

  try {
    // ── 対応する店舗を検索 ────────────────────────────────────────────────────
    const storeRows = await db
      .select()
      .from(storesTable)
      .where(eq(storesTable.stripeAccountId, account.id))
      .limit(1);

    if (storeRows.length === 0) {
      console.log(`[stripe-webhook] stripe_account_id=${account.id} の店舗が見つかりません`);
      res.json({ received: true, store: null });
      return;
    }

    const store = storeRows[0];

    // ── 自動承認設定を確認 ────────────────────────────────────────────────────
    const autoApprove = (await getSetting('auto_approve_stripe_verified')) === 'true';

    // ── 自動承認モード ON → 審査待ちなら即承認 ──────────────────────────────
    // 'applied' = 口座登録済みでStripe審査待ち（最も一般的なケース）
    // 'pending' / 'pending_review' = 旧ステータス互換
    if (autoApprove && (store.status === 'applied' || store.status === 'pending_review' || store.status === 'pending')) {
      await db
        .update(storesTable)
        .set({ status: 'approved' as any, isActive: true, stripeChargesEnabled: true })
        .where(eq(storesTable.id, store.id));

      console.log(`[stripe-webhook] ✅ 自動承認: store ${store.id} (${store.name})`);

      // 店舗オーナーに通知
      try {
        await db.insert(notificationsTable).values({
          userId: store.ownerId,
          type: "store_approved",
          title: "🎉 店舗が承認されました！",
          body: `${store.name} がOsusowakeに公開されました。おすそわけバッグを出品しましょう！`,
          read: false,
        });
      } catch (e) {
        console.error("[stripe-webhook] notification insert error:", e);
      }

      // ── 店舗オーナーに承認メール送信（approval_email_sent フラグで重複防止）──
      if (!(store as any).approvalEmailSent) {
        try {
          const ownerRow = await pool.query<{ email: string }>(
            `SELECT email FROM users WHERE id = $1 LIMIT 1`,
            [store.ownerId],
          );
          const ownerEmail = ownerRow.rows[0]?.email;
          if (ownerEmail) {
            const sent = await sendStoreApprovalEmail({ ownerEmail, storeName: store.name });
            if (sent) {
              await db.execute(sql`UPDATE stores SET approval_email_sent = true WHERE id = ${store.id}`);
            }
          }
        } catch (e) {
          console.error("[stripe-webhook] 店舗承認メール送信エラー:", e);
        }
      }

      // 自動承認の場合でも管理者にメール送信（KYC完了記録として）
      if (!(store as any).stripeKycAdminEmailSent) {
        await sendAdminKycEmail({
          id: store.id,
          name: store.name,
          imageUrl: store.imageUrl,
          address: store.address,
          city: store.city,
          stripeAccountId: store.stripeAccountId,
          chargesEnabled: account.charges_enabled,
          detailsSubmitted: account.details_submitted,
          payoutsEnabled: account.payouts_enabled,
          ownerId: store.ownerId,
        });
        await db.execute(sql`UPDATE stores SET stripe_kyc_admin_email_sent = true WHERE id = ${store.id}`);
      }

      res.json({ received: true, action: "auto_approved", storeId: store.id });
      return;
    }

    // ── charges_enabled を DB に反映（自動承認ON/OFF共通） ─────────────────
    await db
      .update(storesTable)
      .set({ stripeChargesEnabled: true })
      .where(eq(storesTable.id, store.id));

    // ── 自動承認 OFF → 管理者に承認依頼メール（重複送信防止）───────────────
    const alreadySent = (store as any).stripeKycAdminEmailSent === true;

    if (!alreadySent) {
      const ok = await sendAdminKycEmail({
        id: store.id,
        name: store.name,
        imageUrl: store.imageUrl,
        address: store.address,
        city: store.city,
        stripeAccountId: store.stripeAccountId,
        chargesEnabled: account.charges_enabled,
        detailsSubmitted: account.details_submitted,
        payoutsEnabled: account.payouts_enabled,
        ownerId: store.ownerId,
      });

      if (ok) {
        await db.execute(sql`UPDATE stores SET stripe_kyc_admin_email_sent = true WHERE id = ${store.id}`);
      }

      res.json({ received: true, action: "admin_email_sent", storeId: store.id, ok });
    } else {
      console.log(`[stripe-webhook] 既に管理者メール送信済み: store ${store.id}`);
      res.json({ received: true, action: "already_notified", storeId: store.id });
    }

  } catch (err: any) {
    console.error("[stripe-webhook] error:", err);
    res.status(500).json({ error: "internal_error", message: err?.message });
  }
});

export default router;
