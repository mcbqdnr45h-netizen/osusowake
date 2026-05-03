// 全環境(Web・iOS)で同じAPIキーを使う。
// iOS WebView も capacitor.config.ts の hostname='osusowakejapan.org' により
// 同じドメインとして認識されるので、Google Cloud Console で
// referer に "https://osusowakejapan.org/*" を追加すれば動作する。
export const MAPS_API_KEY = (import.meta.env.VITE_MAPS_API_KEY as string) || '';

// ※ 旧 Cloud-based Map Style (VITE_GOOGLE_MAP_ID) は廃止。
//   理由: Map ID 指定時は inline styles が無視され、 環境ごとに env 差で見た目がズレる。
//   現在は Map.tsx の inline MAP_STYLES に一本化している。

// ─── Maps auth failure: always notify Map components (env-agnostic) ──────────
// Google Maps では RefererNotAllowedMapError 等で auth が失敗すると、
// グローバル `gm_authFailure` を呼び出す。 Web/iOS 共通で:
//   1. window に `__gmAuthFailed` フラグを立てる (後発 mount 時のために)
//   2. CustomEvent 'gm-auth-failure' を dispatch (既存の Map にエラー UI 表示)
// これにより Map.tsx が status='error' に切り替えてリスト表示にフォールバック可能。
export const GM_AUTH_FAILURE_EVENT = 'gm-auth-failure';

if (typeof window !== 'undefined') {
  const prev = (window as any).gm_authFailure as undefined | (() => void);
  (window as any).gm_authFailure = function () {
    try {
      (window as any).__gmAuthFailed = true;
      window.dispatchEvent(new Event(GM_AUTH_FAILURE_EVENT));
    } catch { /* noop */ }
    if (prev) try { prev(); } catch { /* noop */ }
  };
}

// ─── Capacitor: Suppress Google Maps auth failure dialog (triple approach) ───
if (import.meta.env.VITE_IS_CAPACITOR === 'true') {

  // 1. gm_authFailure — Capacitor 限定: ダイアログを能動的に閉じる
  //    (auth-failure event は上記で既に dispatch 済み)
  const prevAuth = (window as any).gm_authFailure as undefined | (() => void);
  (window as any).gm_authFailure = function () {
    if (prevAuth) try { prevAuth(); } catch { /* noop */ }
    try {
      // Hide all gm-err-* elements
      document.querySelectorAll<HTMLElement>(
        '[class*="gm-err"], .gm-err-container, .gm-err-dialog, .gm-err-autocomplete'
      ).forEach(el => el.style.setProperty('display', 'none', 'important'));

      // Auto-click every "OK" button that appears inside a .gm-style map container
      document.querySelectorAll('.gm-style button').forEach(btn => {
        if ((btn as HTMLElement).textContent?.trim() === 'OK') {
          (btn as HTMLButtonElement).click();
        }
      });
    } catch (_) { /* ignore */ }
  };

  // 2. Preemptive CSS — hides dialog before JS cleanup fires
  const _gmStyle = document.createElement('style');
  _gmStyle.textContent = [
    /* standard class names */
    '.gm-err-container, .gm-err-dialog, .gm-err-autocomplete { display: none !important; }',
    /* wildcard — catches renamed variants in newer weekly builds */
    '[class*="gm-err"] { display: none !important; }',
    /* z-index 1000 overlay inside gm-style (fallback) */
    'div.gm-style > div[style*="z-index: 1000"] { display: none !important; }',
    'div.gm-style > div > div[style*="z-index: 1000"] { display: none !important; }',
  ].join('\n');
  document.head.appendChild(_gmStyle);

  // 3. MutationObserver — catches dynamically inserted dialog nodes
  const _gmObserver = new MutationObserver(() => {
    try {
      // Hide gm-err-* elements
      document.querySelectorAll<HTMLElement>(
        '[class*="gm-err"], .gm-err-container'
      ).forEach(el => el.style.setProperty('display', 'none', 'important'));

      // Auto-click "OK" inside any map container
      document.querySelectorAll('.gm-style').forEach(container => {
        container.querySelectorAll<HTMLButtonElement>('button').forEach(btn => {
          if (btn.textContent?.trim() === 'OK') btn.click();
        });
      });
    } catch (_) { /* ignore */ }
  });
  _gmObserver.observe(document.documentElement, { childList: true, subtree: true });
}

const SCRIPT_ID = 'rescueat-google-maps';
let _promise: Promise<void> | null = null;

export function loadGoogleMapsScript(): Promise<void> {
  if ((window as any).google?.maps?.Map) return Promise.resolve();
  if (_promise) return _promise;

  _promise = new Promise<void>((resolve, reject) => {
    if (document.getElementById(SCRIPT_ID)) {
      const t = setInterval(() => {
        if ((window as any).google?.maps?.Map) { clearInterval(t); resolve(); }
      }, 80);
      setTimeout(() => { clearInterval(t); _promise = null; reject(new Error('Maps load timeout')); }, 20000);
      return;
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    // loading=async: Google Maps JS API の新しい非同期ロードモード opt-in。
    // これにより "loaded directly without loading=async" 警告が消え、
    // メインスレッドのブロッキングが減る。 既存の `google.maps.Map` 等の
    // グローバルアクセスは維持されるので、 呼び出し側コードの修正は不要。
    script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_API_KEY}&libraries=places&v=weekly&language=ja&region=JP&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if ((window as any).google?.maps?.Map) { resolve(); return; }
      const t = setInterval(() => {
        if ((window as any).google?.maps?.Map) { clearInterval(t); resolve(); }
      }, 80);
      setTimeout(() => { clearInterval(t); _promise = null; reject(new Error('google.maps not ready')); }, 10000);
    };
    script.onerror = (e) => {
      console.error('[Maps] script load error:', e);
      _promise = null;
      reject(new Error('Maps script load failed'));
    };
    document.head.appendChild(script);
  });

  return _promise;
}
