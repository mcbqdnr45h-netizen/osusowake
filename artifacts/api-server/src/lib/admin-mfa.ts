/**
 * 管理者 MFA(OTP) のサーバ側セッション状態。
 *
 * ★ これが無いと MFA は「フロントだけの飾り」になる: requireAdmin は JWT と
 *   DB role=admin しか見ていなかったため、 OTP を一切通さずに admin JWT を直接
 *   /admin/* に投げれば素通りできた（OTP 画面はクライアント表示のみ）。
 *   verify 成功時にここへ記録し、 requireAdmin で必須化することで MFA を実効化する。
 *
 * 単一マシン運用(min_machines_running=1)前提のインメモリ。 既存の adminOtpStore と
 * 同じ揮発性で、 再デプロイ/再起動時は再 OTP が必要（フロントは mfa_required を受けて
 * 自動で OTP を再要求する）。 TTL はフロントの管理者セッション(2h)と一致させる。
 */
const TTL_MS = 2 * 60 * 60 * 1000; // 2h（フロント ADMIN_SESSION_TIMEOUT_MS と一致）

const verifiedStore = new Map<string, number>(); // userId -> expiresAt(ms)

export function markAdminMfaVerified(userId: string): number {
  const expiresAt = Date.now() + TTL_MS;
  verifiedStore.set(userId, expiresAt);
  return expiresAt;
}

export function isAdminMfaValid(userId: string): boolean {
  const expiresAt = verifiedStore.get(userId);
  if (expiresAt == null) return false;
  if (Date.now() > expiresAt) {
    verifiedStore.delete(userId);
    return false;
  }
  return true;
}

export function clearAdminMfa(userId: string): void {
  verifiedStore.delete(userId);
}
