import { supabase } from '@/lib/supabase';

/**
 * Bearer 認証ヘッダを Supabase セッションから自動付与する fetch ラッパー。
 *
 * 標準の `fetch` と同じシグネチャ。 呼び出し側が明示的に Authorization を
 * セットしている場合は上書きしない。 セッションが取れない場合は付与せず
 * 通常の fetch を行う (サーバ側 requireAuth で 401 が返る = 設計通り)。
 *
 * 生成 API クライアント (customFetch) は同等の自動付与をするが、
 * カスタムエンドポイント (Stripe Connect, all-by-owner 等) を直接 fetch する
 * 場合はこのヘルパーを使うことで、 Bearer 漏れによる 401 を防ぐ。
 *
 * ★ 自動 refresh 戦略（iOS Capacitor の長時間バックグラウンド対策）:
 *   ① 期限切れ60秒前なら proactive refresh
 *   ② 401 を受けたら refreshSession() → 1 回だけ retry
 *   これで「supabase-js の自動 refresh が WKWebView スリープ中に止まり、
 *    復帰時に古い access_token を送って 401 → MyStoresContext 等が空配列扱い
 *    → 店舗データ消えた表示になる」問題を防ぐ。
 */

const REFRESH_LEEWAY_SEC = 60;

async function getFreshAccessToken(): Promise<string | undefined> {
  try {
    let { data: { session } } = await supabase.auth.getSession();
    if (!session) return undefined;

    const now = Math.floor(Date.now() / 1000);
    if (session.expires_at && session.expires_at - now < REFRESH_LEEWAY_SEC) {
      const { data: refreshed, error } = await supabase.auth.refreshSession();
      if (!error && refreshed.session) {
        session = refreshed.session;
      }
    }
    return session.access_token;
  } catch {
    return undefined;
  }
}

export async function authedFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(init.headers);
  const callerSetAuth = headers.has('authorization');

  let usedToken: string | undefined;
  if (!callerSetAuth) {
    usedToken = await getFreshAccessToken();
    if (usedToken) {
      headers.set('authorization', `Bearer ${usedToken}`);
    }
  }

  let res = await fetch(input, { ...init, headers });

  // ★ 401 を受けて、 かつ我々が付与したトークンが原因なら refresh して 1 回だけ retry
  if (res.status === 401 && !callerSetAuth && usedToken) {
    try {
      const { data: refreshed, error } = await supabase.auth.refreshSession();
      const newToken = refreshed?.session?.access_token;
      if (!error && newToken && newToken !== usedToken) {
        const retryHeaders = new Headers(init.headers);
        retryHeaders.set('authorization', `Bearer ${newToken}`);
        res = await fetch(input, { ...init, headers: retryHeaders });
      }
    } catch {
      /* refresh 失敗は元の 401 をそのまま返す */
    }
  }

  return res;
}
