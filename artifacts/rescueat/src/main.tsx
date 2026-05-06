import { createRoot } from "react-dom/client";
import { setAuthTokenProvider, setAuthTokenRefresher } from "@workspace/api-client-react";
import App from "./App";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { supabase } from "@/lib/supabase";
import "./index.css";

// ── スクリーンショット撮影モード ──
//   App Store 提出用スクショから価格・%OFF を全消しするための切替フラグ。
//   ▼ 有効化方法 (どれでも OK):
//     1. ブラウザ: URL に `?screenshot=1` を付ける (`?screenshot=0` で解除)
//     2. 実機 (Capacitor): Safari Web Inspector → Console で
//        `toggleScreenshotMode()` を実行 (再読み込み込みで切替)
//   localStorage に保持するので一度設定すれば次回起動以降も継続。
//   価格要素には `data-sshide` を付け、 index.css の
//   `html.screenshot-mode [data-sshide]{display:none}` で隠す。
function applyScreenshotMode() {
  try {
    if (localStorage.getItem('__screenshot_mode') === '1') {
      document.documentElement.classList.add('screenshot-mode');
    } else {
      document.documentElement.classList.remove('screenshot-mode');
    }
  } catch { /* ignore */ }
}
try {
  const params = new URLSearchParams(window.location.search);
  const sp = params.get('screenshot');
  if (sp === '1') localStorage.setItem('__screenshot_mode', '1');
  else if (sp === '0') localStorage.removeItem('__screenshot_mode');
  applyScreenshotMode();
  // 実機 Web Inspector から呼び出せるグローバルヘルパ
  (window as unknown as { toggleScreenshotMode?: () => string }).toggleScreenshotMode = () => {
    const next = localStorage.getItem('__screenshot_mode') === '1' ? null : '1';
    if (next) localStorage.setItem('__screenshot_mode', '1');
    else localStorage.removeItem('__screenshot_mode');
    applyScreenshotMode();
    return next ? 'screenshot mode: ON (再読込で完全反映)' : 'screenshot mode: OFF (再読込で完全反映)';
  };
} catch { /* SSR/プライベートモード無視 */ }

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

// ★ Google Maps スクリプトを「即時」 preload (旧: idle/2.5s 待ち)。
//    旧実装ではマップタブを早めにタップすると preload 未完了で長いスピナーが出ていた。
//    現実装: app マウント直後に並列 fetch 開始 → script は async/defer なので
//    メインスレッドをブロックせず、 マップタブを開いた頃には既にキャッシュ済み。
//    initial route が /map だった場合も MapView の loadGoogleMapsScript() が
//    同じ promise を共有するため二重 fetch にはならない。
import('@/lib/maps-loader').then(m => m.loadGoogleMapsScript().catch(() => {})).catch(() => {});
