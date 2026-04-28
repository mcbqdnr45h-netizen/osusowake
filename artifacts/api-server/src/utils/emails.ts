import { Resend } from "resend";

function getResend(): { resend: Resend; from: string } | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return {
    resend: new Resend(key),
    from:   process.env.RESEND_FROM_DOMAIN ?? "onboarding@resend.dev",
  };
}

/**
 * 店舗承認完了メールをオーナーに送信する。
 * 冪等ではないので呼び出し元で approvalEmailSent フラグを確認すること。
 *
 * @returns true = 送信成功, false = APIキー未設定 or 送信失敗
 */
export async function sendStoreApprovalEmail(params: {
  ownerEmail: string;
  storeName:  string;
}): Promise<boolean> {
  const r = getResend();
  if (!r) {
    console.warn("[email] RESEND_API_KEY not set — 店舗承認メールをスキップ");
    return false;
  }

  const appUrl = process.env.APP_URL ?? "https://osusowake.app";

  const { error } = await r.resend.emails.send({
    from:    `おすそわけ <${r.from}>`,
    to:      params.ownerEmail,
    subject: "【おすそわけ】店舗が公開されました🎉",
    html: `
<!DOCTYPE html>
<html lang="ja">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

    <!-- ヘッダー -->
    <div style="background:linear-gradient(135deg,#F26419 0%,#E04E00 100%);padding:40px 32px;text-align:center;">
      <div style="font-size:48px;margin-bottom:12px;">🎉</div>
      <h1 style="color:#ffffff;font-size:24px;font-weight:900;margin:0 0 8px;">店舗が公開されました！</h1>
      <p style="color:rgba(255,255,255,0.9);font-size:14px;margin:0;">おめでとうございます</p>
    </div>

    <!-- 本文 -->
    <div style="padding:32px;">
      <p style="color:#333333;font-size:15px;line-height:1.8;margin:0 0 24px;">
        <strong>${params.storeName}</strong> オーナー様<br><br>
        おすそわけ へのご登録ありがとうございます。<br>
        Stripe 本人確認（KYC）が完了し、<strong>店舗がおすそわけに公開</strong>されました。<br>
        さっそく「おすそわけバッグ」を出品して、食品ロスを一緒に減らしましょう！
      </p>

      <!-- ステップカード -->
      <div style="background:#fff8f3;border:2px solid #F26419;border-radius:16px;padding:24px;margin-bottom:24px;">
        <p style="color:#F26419;font-size:12px;font-weight:900;margin:0 0 14px;letter-spacing:0.08em;text-transform:uppercase;">Next Step</p>
        <p style="color:#333333;font-size:15px;font-weight:bold;margin:0 0 6px;">🛍️ おすそわけバッグを出品する</p>
        <p style="color:#666666;font-size:13px;line-height:1.7;margin:0;">
          店舗ダッシュボードからバッグを作成し、<br>
          在庫数・価格・受取時間を設定して出品できます。<br>
          出品後すぐにユーザーに表示されます。
        </p>
      </div>

      <!-- CTAボタン -->
      <div style="text-align:center;margin-bottom:28px;">
        <a href="${appUrl}/store"
           style="display:inline-block;background:linear-gradient(135deg,#F26419,#E04E00);color:#ffffff;font-size:16px;font-weight:900;padding:16px 40px;border-radius:14px;text-decoration:none;letter-spacing:0.02em;">
          店舗ダッシュボードへ →
        </a>
      </div>

      <p style="color:#999999;font-size:12px;line-height:1.7;margin:0;text-align:center;">
        ご不明な点はアプリ内のサポート（マイページ → ヘルプ）からご連絡ください。<br>
        おすそわけ 運営チーム
      </p>
    </div>

    <!-- フッター -->
    <div style="background:#f5f5f0;padding:20px 32px;text-align:center;">
      <p style="color:#aaaaaa;font-size:11px;margin:0;">おすそわけ — お店の余ったおいしさを、あなたへ。</p>
    </div>
  </div>
</body>
</html>
    `.trim(),
  });

  if (error) {
    console.error("[email] 店舗承認メール送信失敗:", error);
    return false;
  }

  console.log(`[email] ✅ 店舗承認メール送信: ${params.ownerEmail} (${params.storeName})`);
  return true;
}
