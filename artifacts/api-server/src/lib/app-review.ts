// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// App Store 審査用 — デモ店舗オーナー allowlist
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// review-store@osusowakejapan.org が所有するデモ店舗のバッグは、
// 通常の「今日作成 + pickup_end 未経過」expiry 判定をバイパスして
// **常に表示・購入可能** にする。
//
// 理由:
//   App Store 審査は不定期に行われるため、バッグが日付や時刻で消えると
//   審査担当者が再現性のあるテストを行えない。
//
// セキュリティ:
//   - 完全一致の UUID チェックのみ（部分一致禁止）
//   - 本番ユーザの店舗には一切影響しない
//   - 環境変数 APP_REVIEW_DEMO_OWNER_IDS でカンマ区切り上書き可能

const REVIEW_DEMO_OWNER_DEFAULT = "3f3a4139-207c-45a9-bcdc-5dc79bfe7c3f";

export function getReviewDemoOwnerIds(): string[] {
  const raw = process.env.APP_REVIEW_DEMO_OWNER_IDS?.trim() || REVIEW_DEMO_OWNER_DEFAULT;
  return raw.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
}

export function isReviewDemoOwner(ownerId: string | null | undefined): boolean {
  if (!ownerId) return false;
  return getReviewDemoOwnerIds().includes(ownerId.trim().toLowerCase());
}
