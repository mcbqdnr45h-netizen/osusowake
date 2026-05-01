// ── ナビゲーション診断ロガー ──────────────────────────────────────────
// ログイン後の意図しないリダイレクト原因を追跡するための一時的な診断ヘルパー。
// 本番に出ても害はないが、原因特定後は削除してOK。
export function logNav(source: string, dest: string, extra?: Record<string, unknown>) {
  try {
    const stack = new Error().stack?.split('\n').slice(2, 6).join('\n') ?? '';
    // eslint-disable-next-line no-console
    console.log(`[nav] ${source} → ${dest}`, extra ?? {}, '\n', stack);
  } catch {
    // eslint-disable-next-line no-console
    console.log(`[nav] ${source} → ${dest}`, extra ?? {});
  }
}
