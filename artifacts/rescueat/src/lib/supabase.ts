import { createClient } from '@supabase/supabase-js';

// ★ ハードコード fallback を撤去 (gitleaks/SAST 警告解消)。
//    URL / ANON_KEY は build 時に Vite が埋め込む。
//    - Web (dev/prod): artifacts/rescueat/.env.local の VITE_SUPABASE_*
//    - iOS Capacitor build: vite.config.cap.ts が process.env から注入
//    値が無い場合は明示的に throw し、 silent 起動失敗を防ぐ。
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY が未設定です。 .env.local または build 環境変数を確認してください。',
  );
}

// ★ iPadOS 26 (WKWebView) 対策: localStorage が throw しても落ちない堅牢ストレージ。
//   - iPadOS 26.4+ の WKWebView では一部の状況 (Privacy/ITP/低ストレージ) で
//     localStorage.setItem が QuotaExceededError や SecurityError を投げる事象が
//     確認されている。 素の window.localStorage を渡すと Supabase 内部で例外が
//     伝播し、 セッションが保存されず「ログインしたのに即ログアウト」状態になる。
//   - メモリ内フォールバックを併用して、 永続化に失敗してもセッションは維持。
//   - read もガードし、 corrupted JSON / 取得例外でも null を返す。
const memoryStore: Record<string, string> = {};
function safeLocalStorage(): Storage | null {
  try {
    if (typeof window === 'undefined') return null;
    const ls = window.localStorage;
    const probeKey = '__osusowake_probe__';
    ls.setItem(probeKey, '1');
    ls.removeItem(probeKey);
    return ls;
  } catch {
    return null;
  }
}
const _ls = safeLocalStorage();
const resilientStorage = {
  getItem(key: string): string | null {
    // ★ メモリ優先: setItem 中に localStorage 書き込み失敗 → メモリのみ更新
    //   というケースで、 古い localStorage 値が新しいメモリ値より優先される
    //   バグを防ぐ (stale token precedence 回避)。
    if (key in memoryStore) return memoryStore[key];
    try {
      if (_ls) return _ls.getItem(key);
    } catch { /* ignore */ }
    return null;
  },
  setItem(key: string, value: string): void {
    memoryStore[key] = value;       // ★ 必ずメモリにも保持 (即時に読み戻せる)
    try { _ls?.setItem(key, value); } catch { /* localStorage 失敗時はメモリのみ */ }
  },
  removeItem(key: string): void {
    delete memoryStore[key];
    try { _ls?.removeItem(key); } catch { /* ignore */ }
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'rescueat-auth-token',
    storage: resilientStorage,
  },
});

export type UserRole = 'customer' | 'store_owner';

export interface PublicUser {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
  full_name: string | null;
  phone_number: string | null;
  display_name: string | null;
}
