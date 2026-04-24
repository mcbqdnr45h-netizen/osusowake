// ──────────────────────────────────────────────────────────────────────────
// Google Maps auth error dialog suppression for Capacitor iOS builds.
// This file MUST be imported FIRST in main.tsx so it sets up gm_authFailure
// and the MutationObserver before any map component is rendered.
//
// Strategy:
//   - Hide by CSS class (cheap) for polling + MutationObserver.
//   - Hide by text content (expensive) ONLY when gm_authFailure fires.
//   - No aggressive querySelectorAll('div,...') on every tick — that crashed iOS.
// ──────────────────────────────────────────────────────────────────────────

const ERROR_TEXT_FRAGMENTS = [
  'マップが正しく読み込まれませんでした',
  'did not load Google Maps correctly',
  'このウェブサイトの所有者',
  'website owner of this site',
];

const HIDE_CSS =
  'display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;';

function _hideEl(el: Element | null) {
  if (!el) return;
  try {
    (el as HTMLElement).style.cssText =
      ((el as HTMLElement).style.cssText || '') + ';' + HIDE_CSS;
  } catch (_) { /* ignore */ }
}

// Cheap: only class-name based — safe to run frequently.
function hideByClass() {
  try {
    document.querySelectorAll<HTMLElement>(
      '[class*="gm-err"], .gm-err-container, .gm-err-dialog, .gm-err-autocomplete'
    ).forEach(_hideEl);
  } catch (_) { /* ignore */ }
}

// Expensive: text-content scan — called only when gm_authFailure fires.
function hideByTextContent() {
  try {
    hideByClass();
    const candidates = document.querySelectorAll('div[class], dialog, aside');
    for (const el of candidates) {
      const text = el.textContent || '';
      if (text.length === 0 || text.length > 800) continue;
      if (ERROR_TEXT_FRAGMENTS.some(t => text.includes(t))) {
        let target: Element | null = el;
        for (let i = 0; i < 6 && target && target !== document.body; i++) {
          _hideEl(target);
          target = target.parentElement;
        }
      }
    }
  } catch (_) { /* ignore */ }
}

if (typeof window !== 'undefined') {
  // 1. gm_authFailure — called by Google Maps API on auth failure.
  //    Run the expensive text scan here (not in polling).
  (window as any).gm_authFailure = function () {
    hideByTextContent();
    [50, 200, 500, 1000, 2000, 3000].forEach(ms =>
      setTimeout(hideByTextContent, ms)
    );
  };

  // 2. MutationObserver — class-based only (cheap).
  //    Debounced so rapid React re-renders don't spam it.
  if (typeof MutationObserver !== 'undefined') {
    let _debounce: ReturnType<typeof setTimeout> | null = null;
    const _obs = new MutationObserver(() => {
      if (_debounce) clearTimeout(_debounce);
      _debounce = setTimeout(hideByClass, 80);
    });
    const startObs = () =>
      _obs.observe(document.documentElement, { childList: true, subtree: true });
    if (document.documentElement) {
      startObs();
    } else {
      document.addEventListener('DOMContentLoaded', startObs);
    }
  }

  // 3. Light polling — class-based only, every 500ms for first 20s.
  //    Runs only if class-based elements are actually found (avoids extra work).
  const _poll = setInterval(hideByClass, 500);
  setTimeout(() => clearInterval(_poll), 20000);
}

export {};
