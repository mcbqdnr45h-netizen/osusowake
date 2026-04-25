// ──────────────────────────────────────────────────────────────────────────
// Google Maps auth error dialog suppression for Capacitor iOS builds.
// This file MUST be imported FIRST in main.tsx.
//
// Strategy:
//   - Set gm_authFailure BEFORE Maps loads → triggered when auth fails.
//   - On auth failure, run text-content scan to find and hide the dialog.
//   - MutationObserver watches for dialog appearing (debounced, cheap).
//   - NO broad CSS injection — [class*="gm-err"] hides map tiles on empty key.
// ──────────────────────────────────────────────────────────────────────────

const ERROR_TEXT_FRAGMENTS = [
  'マップが正しく読み込まれませんでした',
  'did not load Google Maps correctly',
  'このウェブサイトの所有者',
  'website owner of this site',
];

const HIDE_STYLE =
  'display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;';

function _hideEl(el: Element | null) {
  if (!el) return;
  try { (el as HTMLElement).style.cssText += ';' + HIDE_STYLE; } catch (_) {}
}

// Scan for the error dialog by known exact class names (NOT [class*="gm-err"]).
function hideErrorDialog() {
  try {
    // 1. Known exact error container classes (safe — not used on tile elements).
    ['.gm-err-container', '.gm-err-dialog', '.gm-err-autocomplete'].forEach(sel => {
      document.querySelectorAll<HTMLElement>(sel).forEach(el => {
        _hideEl(el);
        _hideEl(el.parentElement);
      });
    });

    // 2. Text-content scan as fallback.
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
  } catch (_) {}
}

if (typeof window !== 'undefined') {
  // ── 1. gm_authFailure — called by Maps API when auth fails ───────────────
  //    Must be defined BEFORE Maps script loads.
  (window as any).gm_authFailure = function () {
    hideErrorDialog();
    [50, 150, 300, 600, 1000, 2000, 4000].forEach(ms =>
      setTimeout(hideErrorDialog, ms)
    );
  };

  // ── 2. MutationObserver — debounced, watches for dialog appearing ─────────
  if (typeof MutationObserver !== 'undefined') {
    let _debounce: ReturnType<typeof setTimeout> | null = null;
    const _obs = new MutationObserver(() => {
      if (_debounce) clearTimeout(_debounce);
      _debounce = setTimeout(hideErrorDialog, 120);
    });
    const startObs = () =>
      _obs.observe(document.documentElement, { childList: true, subtree: true });
    document.documentElement
      ? startObs()
      : document.addEventListener('DOMContentLoaded', startObs);
  }

  // ── 3. Polling fallback — every 600ms for first 20s ──────────────────────
  const _poll = setInterval(hideErrorDialog, 600);
  setTimeout(() => clearInterval(_poll), 20000);
}

export {};
