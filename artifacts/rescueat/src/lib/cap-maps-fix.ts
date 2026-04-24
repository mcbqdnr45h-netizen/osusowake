// ──────────────────────────────────────────────────────────────────────────
// Google Maps auth error dialog suppression for Capacitor iOS builds.
// This file MUST be imported FIRST in main.tsx so it sets up gm_authFailure
// and the MutationObserver before any map component is rendered.
//
// Strategy: Match dialog by TEXT CONTENT (not class names) so it works even
// if Google changes the dialog DOM structure. Hide elements (don't remove)
// to prevent Maps from recreating them.
// ──────────────────────────────────────────────────────────────────────────

const ERROR_TEXT_FRAGMENTS = [
  'マップが正しく読み込まれませんでした',
  'did not load Google Maps correctly',
  'このウェブサイトの所有者',
  'website owner of this site',
];

const HIDE_STYLE = 'display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;';

function _hide(el: Element | null) {
  if (!el) return;
  try {
    (el as HTMLElement).style.cssText = ((el as HTMLElement).style.cssText || '') + ';' + HIDE_STYLE;
  } catch (_) { /* ignore */ }
}

function findAndHideMapsError() {
  try {
    // Strategy 1: Hide by class name (covers gm-err-container, gm-err-dialog, etc.)
    document.querySelectorAll('[class*="gm-err"]').forEach(_hide);

    // Strategy 2: Find by TEXT CONTENT — works even if class names changed
    const candidates = document.querySelectorAll('div, dialog, section, aside, article');
    for (const el of candidates) {
      const text = el.textContent || '';
      // Skip very long texts (the entire body) and empty texts
      if (text.length === 0 || text.length > 1000) continue;
      // Match if any of the error text fragments are in this element
      if (ERROR_TEXT_FRAGMENTS.some(t => text.includes(t))) {
        // Hide this element AND walk up the DOM to hide its container
        let target: Element | null = el;
        for (let i = 0; i < 6 && target && target !== document.body; i++) {
          _hide(target);
          target = target.parentElement;
        }
      }
    }
  } catch (_) { /* ignore */ }
}

if (typeof window !== 'undefined') {
  // 1. gm_authFailure — called by Google Maps API on auth failure
  (window as any).gm_authFailure = function () {
    findAndHideMapsError();
    // Run repeatedly because Maps may render the dialog AFTER calling gm_authFailure
    [10, 50, 100, 200, 500, 1000, 2000, 3000].forEach(ms =>
      setTimeout(findAndHideMapsError, ms)
    );
  };

  // 2. MutationObserver — catch dialog as soon as it's added to DOM
  if (typeof MutationObserver !== 'undefined') {
    const _obs = new MutationObserver(() => findAndHideMapsError());
    if (document.documentElement) {
      _obs.observe(document.documentElement, { childList: true, subtree: true });
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        _obs.observe(document.documentElement, { childList: true, subtree: true });
      });
    }
  }

  // 3. Aggressive polling for first 30 seconds — catches anything the observer misses
  const _poll = setInterval(findAndHideMapsError, 100);
  setTimeout(() => clearInterval(_poll), 30000);
}

export {};
