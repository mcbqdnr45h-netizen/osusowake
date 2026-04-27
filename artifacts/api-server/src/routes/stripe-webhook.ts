import { Router, type Request, type Response } from "express";
import { db, pool } from "@workspace/db";
import { storesTable, notificationsTable, surpriseBagsTable, reservationsTable, cartReservationsTable } from "@workspace/db/schema";
import { eq, sql, and, ne } from "drizzle-orm";
import { Resend } from "resend";
import { sendStoreApprovalEmail } from "../utils/emails";

const router = Router();

const ADMIN_EMAIL = "hello@osusowakejapan.org";

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
  // Stripe は「お客様のアカウント」用と「連結アカウント」用で別エンドポイント・別シークレット
  // を発行するため、複数のシークレットを順に試して検証する。
  const candidateSecrets = [
    process.env.STRIPE_WEBHOOK_SECRET,
    process.env.STRIPE_WEBHOOK_SECRET_CONNECT,
    process.env.STRIPE_WEBHOOK_SECRET_2,
  ].filter((s): s is string => typeof s === "string" && s.length > 0);

  let event: any;

  if (candidateSecrets.length > 0 && sig) {
    let lastErr: any = null;
    for (const secret of candidateSecrets) {
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, secret);
        lastErr = null;
        break;
      } catch (err: any) {
        lastErr = err;
      }
    }
    if (!event) {
      console.error("[stripe-webhook] 署名検証失敗（全候補シークレットで一致せず）:", lastErr?.message);
      res.status(400).json({ error: `Webhook Error: ${lastErr?.message ?? "signature mismatch"}` });
      return;
    }
  } else {
    // 開発環境では署名なしで受け取り（シークレット未設定時）
    try {
      event = JSON.parse(req.body.toString());
    } catch {
      res.status(400).json({ error: "Invalid JSON body" });
      return;
    }
    console.warn("[stripe-webhook] ⚠️ STRIPE_WEBHOOK_SECRET 未設定 — 署名検証なし（開発環境のみ許可）");
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 🛡 安全網: payment_intent.succeeded
  // フロント (Checkout.tsx) の /api/payment/confirm 呼び出しが iOS の通信不調などで
  // 失敗した場合に備え、Stripe からの確実な webhook で予約を paid/confirmed に
  // 自動同期する。冪等（既に paid なら何もしない）。
  // ─────────────────────────────────────────────────────────────────────────
  if (event.type === "payment_intent.succeeded") {
    try {
      const intent = event.data.object as {
        id: string;
        amount: number;
        metadata?: Record<string, string>;
      };
      const reservationIdStr = intent.metadata?.reservationId;
      const reservationId = reservationIdStr ? parseInt(reservationIdStr, 10) : NaN;
      if (!reservationId || Number.isNaN(reservationId)) {
        console.warn(`[stripe-webhook] payment_intent.succeeded: metadata.reservationId なし — intent=${intent.id}`);
        res.json({ received: true, type: event.type, handled: false, reason: "no_reservation_id" });
        return;
      }

      // ★ アトミック確定（仮押さえ廃止後）: 在庫ロック → 在庫不足なら自動返金、
      //   足りていれば在庫デクリメント＋ paid 遷移。フロントの /api/payment/confirm
      //   と並行しても DB トランザクションの直列化で 1 回だけ確定する。
      type WebhookResult =
        | { kind: "not_found" }
        | { kind: "already_cancelled" }
        | { kind: "already_paid" }
        | { kind: "out_of_stock" }
        | { kind: "paid"; storeId: number; pickupCode: string | null };

      const result: WebhookResult = await db.transaction(async (tx) => {
        const [reservation] = await tx
          .select()
          .from(reservationsTable)
          .where(eq(reservationsTable.id, reservationId))
          .for("update");

        if (!reservation) return { kind: "not_found" };

        if (reservation.status === "cancelled" || reservation.paymentStatus === "refunded") {
          return { kind: "already_cancelled" };
        }

        if (reservation.paymentStatus === "paid") {
          return { kind: "already_paid" };
        }

        const [bag] = await tx
          .select()
          .from(surpriseBagsTable)
          .where(eq(surpriseBagsTable.id, reservation.bagId))
          .for("update");

        if (!bag || bag.stockCount < reservation.quantity) {
          await tx
            .update(reservationsTable)
            .set({
              paymentStatus: "refunded",
              status: "cancelled",
              paymentIntentId: intent.id,
            })
            .where(eq(reservationsTable.id, reservation.id));
          return { kind: "out_of_stock" };
        }

        const newStock = bag.stockCount - reservation.quantity;
        await tx
          .update(surpriseBagsTable)
          .set({
            stockCount: newStock,
            ...(newStock === 0 ? { isActive: false } : {}),
          })
          .where(eq(surpriseBagsTable.id, bag.id));

        const [updated] = await tx
          .update(reservationsTable)
          .set({
            paymentStatus: "paid",
            status: "confirmed",
            paymentIntentId: intent.id,
          })
          .where(eq(reservationsTable.id, reservation.id))
          .returning({ storeId: reservationsTable.storeId, pickupCode: reservationsTable.pickupCode });

        return { kind: "paid", storeId: updated.storeId, pickupCode: updated.pickupCode };
      });

      if (result.kind === "not_found") {
        console.warn(`[stripe-webhook] payment_intent.succeeded: reservation ${reservationId} 見つからず`);
        res.json({ received: true, type: event.type, handled: false, reason: "reservation_not_found" });
        return;
      }
      if (result.kind === "already_cancelled") {
        console.log(`[stripe-webhook] payment_intent.succeeded: reservation ${reservationId} は既にキャンセル済み（冪等スキップ）`);
        res.json({ received: true, type: event.type, handled: true, idempotent: true, reason: "already_cancelled" });
        return;
      }
      if (result.kind === "already_paid") {
        console.log(`[stripe-webhook] payment_intent.succeeded: reservation ${reservationId} は既に paid（冪等スキップ）`);
        res.json({ received: true, type: event.type, handled: true, idempotent: true });
        return;
      }
      if (result.kind === "out_of_stock") {
        // 在庫切れ → Stripe 自動返金
        try {
          const stripe = await getStripe();
          if (stripe) {
            await stripe.refunds.create({
              payment_intent: intent.id,
              reason: "requested_by_customer",
              metadata: {
                reservationId: String(reservationId),
                reason: "out_of_stock_after_payment",
              },
            });
            console.log(`💸 webhook 自動返金: PI ${intent.id} (reservation ${reservationId}, 在庫切れ)`);
          }
        } catch (refundErr: any) {
          console.error(`[stripe-webhook] auto-refund failed:`, refundErr?.message);
        }
        res.json({ received: true, type: event.type, handled: true, action: "refunded_oos" });
        return;
      }

      // ★ result.kind === "paid"
      const row = { id: reservationId, storeId: result.storeId, pickupCode: result.pickupCode };

      // 旧 cart_reservation テーブル（互換）— 残っていれば確定
      await db
        .update(cartReservationsTable)
        .set({ status: "confirmed" })
        .where(eq(cartReservationsTable.reservationId, reservationId))
        .catch(() => {});

      console.log(`[stripe-webhook] ✅ 安全網発動: reservation ${reservationId} を paid/confirmed に更新（intent=${intent.id}）`);

      // 店舗オーナーへの購入通知 — 実際に遷移したこのパスからのみ送信
      try {
        const [store] = await db
          .select({ ownerId: storesTable.ownerId, name: storesTable.name })
          .from(storesTable)
          .where(eq(storesTable.id, row.storeId))
          .limit(1);
        if (store?.ownerId) {
          await db.insert(notificationsTable).values({
            userId: store.ownerId,
            type: "bag_sold",
            title: "【重要】おすそわけバッグが購入されました！",
            body: `受取コード: ${row.pickupCode ?? "---"} ｜ 受取準備をご確認ください`,
            storeId: row.storeId,
          });
        }
      } catch (notifErr) {
        console.error('[stripe-webhook] 安全網からの店舗通知挿入失敗:', notifErr);
      }

      res.json({ received: true, type: event.type, handled: true, reservationId, action: "marked_paid" });
      return;
    } catch (err: any) {
      console.error('[stripe-webhook] payment_intent.succeeded handler error:', err);
      res.status(500).json({ error: "internal_error", message: err?.message });
      return;
    }
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
    requirements?: {
      past_due?: string[];
      currently_due?: string[];
      disabled_reason?: string | null;
      errors?: { code: string; reason: string; requirement: string }[];
    };
  };

  console.log(`[stripe-webhook] account.updated: ${account.id}, charges_enabled=${account.charges_enabled}, disabled_reason=${account.requirements?.disabled_reason ?? 'none'}`);

  if (!account.charges_enabled) {
    // charges 無効 → 必ずDBの stripeChargesEnabled を false に更新してから詳細処理
    try {
      // stripeChargesEnabled = false に更新
      await db
        .update(storesTable)
        .set({ stripeChargesEnabled: false })
        .where(eq(storesTable.stripeAccountId, account.id));

      // この店舗に紐づく出品中バッグを全て自動停止（客が注文しても決済できないため）
      const affectedStores = await db
        .select({ id: storesTable.id })
        .from(storesTable)
        .where(eq(storesTable.stripeAccountId, account.id));
      if (affectedStores.length > 0) {
        await db
          .update(surpriseBagsTable)
          .set({ isActive: false })
          .where(eq(surpriseBagsTable.storeId, affectedStores[0].id));
        console.log(`[stripe-webhook] 🔴 charges_enabled=false → store ${affectedStores[0].id} の出品バッグを全て停止`);
      }
    } catch (dbErr: any) {
      console.error('[stripe-webhook] stripeChargesEnabled=false 更新失敗:', dbErr?.message);
    }

    // charges 無効 + past_due がある → Stripe が本人確認エラーを検出した可能性
    const pastDue = account.requirements?.past_due ?? [];
    const disabledReason = account.requirements?.disabled_reason ?? '';
    const isRequirementsIssue = pastDue.length > 0 || disabledReason === 'requirements.past_due';

    if (isRequirementsIssue) {
      try {
        const storeRows = await db
          .select({ id: storesTable.id, name: storesTable.name, ownerId: storesTable.ownerId, status: storesTable.status })
          .from(storesTable)
          .where(eq(storesTable.stripeAccountId, account.id))
          .limit(1);

        if (storeRows.length > 0) {
          const store = storeRows[0];
          // applied 状態で KYC エラーが来た → pending に戻して再入力を促す
          if (store.status === 'applied') {
            // external_account が past_due に含まれている → 口座の再登録も必要
            const needsBankReregister = pastDue.some(f => f === 'external_account' || f.startsWith('external_account'));
            await db.update(storesTable).set({
              status: 'pending',
              stripeNeedsBankReregister: needsBankReregister || false,
            }).where(eq(storesTable.id, store.id));
            console.log(`[stripe-webhook] ⚠️  KYC requirements error — store ${store.id} reverted to pending. past_due: ${pastDue.join(', ')}`);

            // 店舗オーナーに通知
            try {
              const missingLabels = pastDue.slice(0, 5).map(f => {
                if (f.includes('address')) return '住所';
                if (f.includes('dob')) return '生年月日';
                if (f.includes('first_name') || f.includes('last_name')) return '氏名';
                if (f.includes('phone')) return '電話番号';
                if (f.includes('email')) return 'メールアドレス';
                if (f.includes('verification') || f.includes('document')) return '本人確認書類';
                return f;
              }).filter((v, i, a) => a.indexOf(v) === i);

              await db.insert(notificationsTable).values({
                userId: store.ownerId,
                type: 'store_action_required',
                title: '⚠️ 本人確認情報の再入力が必要です',
                body: `決済システムによる審査で確認が必要な項目があります（${missingLabels.join('・')}など）。店舗ダッシュボードから再登録してください。`,
                read: false,
              });
            } catch (notifErr) {
              console.error('[stripe-webhook] notification insert error:', notifErr);
            }

            res.json({ received: true, action: 'reverted_to_pending', storeId: store.id, past_due: pastDue });
            return;
          }
        }
      } catch (err: any) {
        console.error('[stripe-webhook] requirements error handling failed:', err?.message);
      }
    }

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

    // ── payouts_enabled=false の場合：DB更新 & 既存出品バッグを自動停止 ──────
    // charges_enabled=true でも payouts 停止中は新規出品ブロック済み（API側）
    // Webhook 受信時点で既に公開中のバッグも念のため全停止する
    if (!account.payouts_enabled) {
      try {
        await db
          .update(storesTable)
          .set({ stripePayoutsEnabled: false })
          .where(eq(storesTable.id, store.id));
        await db
          .update(surpriseBagsTable)
          .set({ isActive: false })
          .where(eq(surpriseBagsTable.storeId, store.id));
        console.log(`[stripe-webhook] 🟡 payouts_enabled=false → store ${store.id} の出品バッグを全て停止`);
      } catch (err: any) {
        console.error('[stripe-webhook] payouts_disabled bag stop error:', err?.message);
      }
    }

    // ── 自動承認設定を確認（デフォルトON）────────────────────────────────────
    const autoApprove = (await getSetting('auto_approve_stripe_verified', 'true')) === 'true';

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
