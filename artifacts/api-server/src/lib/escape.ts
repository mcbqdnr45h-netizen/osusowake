/**
 * HTML / 属性文脈で安全に挿入するためのエスケープ関数。
 *
 * 用途: メールテンプレートや /admin/approve-store の HTML レスポンスで
 * 店舗名・拒否理由などユーザ入力を埋め込む際に、HTML 構造の破壊や
 * 受信側のメールクライアントによる潜在的な誤レンダリングを防ぐ。
 */
export function escapeHtml(input: string | null | undefined): string {
  if (input == null) return "";
  return String(input)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
