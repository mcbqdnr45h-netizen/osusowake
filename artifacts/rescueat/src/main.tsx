import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

import { createRoot } from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import "./index.css";

// ============================================================================
// iOS診断: 画面に直接エラーを表示するセーフティネット
// （実機でブランクになった時に何が起きているか目で見える）
// ============================================================================
function showOnScreenError(label: string, msg: string) {
  try {
    let el = document.getElementById("ios-error-overlay");
    if (!el) {
      el = document.createElement("div");
      el.id = "ios-error-overlay";
      el.style.cssText =
        "position:fixed;top:env(safe-area-inset-top,0);left:0;right:0;z-index:2147483647;" +
        "background:#dc2626;color:white;padding:12px 14px;font:600 11px monospace;" +
        "white-space:pre-wrap;word-break:break-all;max-height:60vh;overflow:auto;" +
        "border-bottom:3px solid #fff;line-height:1.45;";
      document.body.appendChild(el);
    }
    el.textContent = (el.textContent || "") + `[${label}] ${msg}\n\n`;
  } catch {}
}

window.addEventListener("error", (e) => {
  showOnScreenError(
    "ERROR",
    `${e.message}\n@ ${e.filename}:${e.lineno}:${e.colno}\n${e.error?.stack || ""}`,
  );
});
window.addEventListener("unhandledrejection", (e) => {
  showOnScreenError("PROMISE", String(e.reason?.stack || e.reason || e));
});

// 画面の高さを CSS 変数として設定（iOS の dvh 不具合の保険）
function setVh() {
  document.documentElement.style.setProperty("--app-vh", `${window.innerHeight}px`);
}
setVh();
window.addEventListener("resize", setVh);
window.addEventListener("orientationchange", setVh);

// ============================================================================
// #root のスタイル乗っ取り防止 + 犯人特定
// 何者かが #root に display:none などを設定するバグの対策
// ============================================================================
(() => {
  const r = document.getElementById("root");
  if (!r) return;
  const obs = new MutationObserver(() => {
    const s = r.getAttribute("style");
    if (s && /display\s*:\s*none|visibility\s*:\s*hidden|opacity\s*:\s*0/i.test(s)) {
      const stack = new Error().stack || "(no stack)";
      console.warn("[ROOT-STYLE-INTERCEPTED]", s);
      console.warn("[ROOT-STYLE-STACK]", stack);
      showOnScreenError("ROOT-HIDDEN", `style=${s}\nstack=${stack.substring(0, 800)}`);
      r.removeAttribute("style");
    }
  });
  obs.observe(r, { attributes: true, attributeFilter: ["style"] });
})();

// ============================================================================
// Reactレンダー（try-catch で同期エラーも拾う）
// ============================================================================
try {
  const rootEl = document.getElementById("root");
  if (!rootEl) {
    showOnScreenError("FATAL", "#root element not found");
  } else {
    createRoot(rootEl).render(
      <ErrorBoundary>
        <App />
      </ErrorBoundary>,
    );
  }
} catch (e: any) {
  showOnScreenError("RENDER", e?.stack || String(e));
}
