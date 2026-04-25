// ──────────────────────────────────────────────────────────────────────────
// Google Maps auth error dialog suppression for Capacitor iOS builds.
// Import this FIRST in main.tsx (before anything else).
//
// CRITICAL RULES (learned from blank-map bugs):
//   - NEVER hide el.parentElement — parent of .gm-err-container is .gm-style
//     which is the ENTIRE map rendering layer. Hiding it = blank map.
//   - NEVER use [class*="gm-err"] — matches tile elements on empty key.
//   - NEVER walk more than 0 levels up from .gm-err-container / .gm-err-dialog.
//   - NEVER do text-content scan and walk up to parents — too risky.
//   - Only hide the specific known dialog elements themselves.
// ──────────────────────────────────────────────────────────────────────────

const HIDE_STYLE =
  'display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;';

function _hideEl(el: Element | null) {
  if (!el) return;
  try { (el as HTMLElement).style.cssText += ';' + HIDE_STYLE; } catch (_) {}
}

// Only hides the specific known error DIALOG elements themselves.
// Does NOT hide parents — parent of .gm-err-container is .gm-style (the map).
function hideErrorDialog() {
  try {
    ['.gm-err-container', '.gm-err-dialog', '.gm-err-autocomplete'].forEach(sel => {
      document.querySelectorAll<HTMLElement>(sel).forEach(el => {
        _hideEl(el);
        // DO NOT hide el.parentElement — that's .gm-style = the whole map layer
      });
    });
  } catch (_) {}
}

if (typeof window !== 'undefined') {
  // ── 1. gm_authFailure — called by Maps API when auth fails ───────────────
  //    Must be defined BEFORE Maps script loads.
  (window as any).gm_authFailure = function () {
    // Schedule a few retries only — no infinite loop
    [0, 50, 200, 500, 1000, 2000].forEach(ms =>
      setTimeout(hideErrorDialog, ms)
    );
  };

  // ── 2. MutationObserver — debounced, only watches for dialog appearing ────
  //    Debounced at 150ms so iOS is not overwhelmed.
  if (typeof MutationObserver !== 'undefined') {
    let _debounce: ReturnType<typeof setTimeout> | null = null;
    const _obs = new MutationObserver(() => {
      if (_debounce) clearTimeout(_debounce);
      _debounce = setTimeout(hideErrorDialog, 150);
    });
    const startObs = () =>
      _obs.observe(document.documentElement, { childList: true, subtree: true });
    document.documentElement
      ? startObs()
      : document.addEventListener('DOMContentLoaded', startObs);
  }
}

export {};
