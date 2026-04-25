// ──────────────────────────────────────────────────────────────────────────
// Google Maps auth error dialog suppression for Capacitor iOS builds.
// This file MUST be imported FIRST in main.tsx.
//
// Primary strategy: inject a <style> tag BEFORE Maps loads.
//   → CSS applied instantly by browser engine, no timing race.
//   → Even if Maps recreates the element, the CSS rule still applies.
// Secondary strategy: gm_authFailure + debounced MutationObserver + polling.
// ──────────────────────────────────────────────────────────────────────────

const ERROR_TEXT_FRAGMENTS = [
  'マップが正しく読み込まれませんでした',
  'did not load Google Maps correctly',
  'このウェブサイトの所有者',
  'website owner of this site',
];

const HIDE_CSS =
  'display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;';

// ── 1. CSS injection (primary, runs once at startup) ──────────────────────
const CSS_RULE = [
  '.gm-err-container',
  '.gm-err-dialog',
  '.gm-err-autocomplete',
  '.gm-err-content',
  '.gm-err-title',
  '[class*="gm-err"]',
].join(',') + `{${HIDE_CSS}}`;

function injectErrorCSS() {
  if (document.getElementById('gm-err-suppress')) return;
  const style = document.createElement('style');
  style.id = 'gm-err-suppress';
  style.textContent = CSS_RULE;
  (document.head || document.documentElement)?.appendChild(style);
}

// Run immediately (document.documentElement always exists).
if (typeof window !== 'undefined') {
  injectErrorCSS();
}

// ── 2. JavaScript fallback helpers ─────────────────────────────────────────
function _hideEl(el: Element | null) {
  if (!el) return;
  try {
    (el as HTMLElement).style.cssText =
      ((el as HTMLElement).style.cssText || '') + ';' + HIDE_CSS;
  } catch (_) { /* ignore */ }
}

// Cheap: only class-name based — safe to call from polling.
function hideByClass() {
  try {
    document.querySelectorAll<HTMLElement>(
      '[class*="gm-err"], .gm-err-container, .gm-err-dialog, .gm-err-autocomplete'
    ).forEach(_hideEl);
  } catch (_) { /* ignore */ }
}

// Expensive: text-content scan — only called when gm_authFailure fires.
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
  // ── 3. gm_authFailure — called by Maps API on auth failure ───────────────
  (window as any).gm_authFailure = function () {
    hideByTextContent();
    [50, 150, 300, 600, 1000, 2000, 4000].forEach(ms =>
      setTimeout(hideByTextContent, ms)
    );
  };

  // ── 4. MutationObserver — debounced 80ms (prevents overwhelming iOS) ─────
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

  // ── 5. Light polling — class-based only, every 500ms for first 30s ───────
  const _poll = setInterval(hideByClass, 500);
  setTimeout(() => clearInterval(_poll), 30000);
}

export {};
