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
 */
export async function authedFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(init.headers);
  if (!headers.has('authorization')) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        headers.set('authorization', `Bearer ${session.access_token}`);
      }
    } catch {
      /* セッション取得失敗時は無認証で送信 (サーバが 401 を返す) */
    }
  }
  return fetch(input, { ...init, headers });
}
