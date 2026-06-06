// ── ナビゲーション / 認証 診断ロガー ──────────────────────────────────────
// ログイン後の意図しないリダイレクト・iOS での「無言でログイン画面に戻る」原因を
// 追跡するための一時的な診断ヘルパー。挙動は一切変えない観測専用。原因特定後は削除してOK。

export interface NavEvent {
  t: number;
  msg: string;
  extra?: Record<string, unknown>;
}

const BUFFER_MAX = 40;
const STORAGE_KEY = "osusowake_navtrail_v1";
const buffer: NavEvent[] = [];

export function recordEvent(msg: string, extra?: Record<string, unknown>): void {
  buffer.push({ t: Date.now(), msg, extra });
  if (buffer.length > BUFFER_MAX) buffer.shift();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(buffer));
  } catch {
    /* localStorage 不可 (iOS WKWebView 等) でもメモリには残る */
  }
}

export function getNavEvents(): NavEvent[] {
  if (buffer.length) return buffer.slice();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as NavEvent[];
  } catch {
    /* ignore */
  }
  return [];
}

export function logNav(source: string, dest: string, extra?: Record<string, unknown>) {
  recordEvent(`${source} → ${dest}`, extra);
  try {
    const stack = new Error().stack?.split("\n").slice(2, 6).join("\n") ?? "";
    // eslint-disable-next-line no-console
    console.log(`[nav] ${source} → ${dest}`, extra ?? {}, "\n", stack);
  } catch {
    // eslint-disable-next-line no-console
    console.log(`[nav] ${source} → ${dest}`, extra ?? {});
  }
}
