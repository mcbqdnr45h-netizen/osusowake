import { createRoot } from "react-dom/client";
import { setAuthTokenProvider, setAuthTokenRefresher } from "@workspace/api-client-react";
import App from "./App";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { supabase } from "@/lib/supabase";
import "./index.css";

// 生成 API クライアント (customFetch) に Supabase access_token を自動付与する。
// これにより `requireAuth` が必要な全エンドポイントが、 個々の Hook で
// 手動 Bearer 設定不要になり、 401 の取りこぼし・回帰を防げる。
//
// ★ proactive refresh: 期限切れ60秒前なら refreshSession を先に走らせる。
//    iOS Capacitor の WKWebView でバックグラウンド中に supabase-js のタイマーが止まり、
//    復帰直後に古い access_token を送って 401 になる問題を防ぐ。
const REFRESH_LEEWAY_SEC = 60;
setAuthTokenProvider(async () => {
  try {
    let { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;
    const now = Math.floor(Date.now() / 1000);
    if (session.expires_at && session.expires_at - now < REFRESH_LEEWAY_SEC) {
      const { data: refreshed, error } = await supabase.auth.refreshSession();
      if (!error && refreshed.session) session = refreshed.session;
    }
    return session.access_token ?? null;
  } catch {
    return null;
  }
});

// ★ reactive refresh: 401 を受けた customFetch が呼ぶフォールバック。
//    refresh 失敗 (refresh token も失効) なら null を返し、 元の 401 をそのまま伝える。
setAuthTokenRefresher(async () => {
  try {
    const { data, error } = await supabase.auth.refreshSession();
    if (error || !data.session) return null;
    return data.session.access_token ?? null;
  } catch {
    return null;
  }
});

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

// ★ Google Maps スクリプトをアイドル中に先読みしてキャッシュ温存。
//    地図ページを開いた瞬間に既にダウンロード済み → 体感ロード時間を大幅短縮。
//    requestIdleCallback が無い環境 (Safari) では setTimeout でフォールバック。
const __preloadMaps = () => {
  import('@/lib/maps-loader').then(m => m.loadGoogleMapsScript().catch(() => {})).catch(() => {});
};
if ('requestIdleCallback' in window) {
  (window as any).requestIdleCallback(__preloadMaps, { timeout: 4000 });
} else {
  setTimeout(__preloadMaps, 2500);
}
