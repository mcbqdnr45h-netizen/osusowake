// In Capacitor, the domain-restricted key shows the auth error dialog.
// We use an empty key (shows "development purposes only" watermark but map works).
export const MAPS_API_KEY = (import.meta.env.VITE_IS_CAPACITOR === 'true')
  ? ''
  : ((import.meta.env.VITE_MAPS_API_KEY as string) || '');

// ─── Capacitor: Suppress Google Maps auth failure dialog ───────────────────
// IMPORTANT: We HIDE elements (display:none) rather than removing them from DOM.
// Removing with .remove() causes Google Maps to detect the missing dialog and
// immediately recreate it, resulting in an infinite loop. Hiding keeps Maps
// satisfied while making the dialog invisible to the user.
if (import.meta.env.VITE_IS_CAPACITOR === 'true') {

  function _hideGmErrElements() {
    try {
      document.querySelectorAll<HTMLElement>(
        '[class*="gm-err"], .gm-err-container, .gm-err-dialog, .gm-err-autocomplete'
      ).forEach(el => {
        el.style.setProperty('display', 'none', 'important');
        el.style.setProperty('visibility', 'hidden', 'important');
        el.style.setProperty('pointer-events', 'none', 'important');
        el.style.setProperty('opacity', '0', 'important');
      });
    } catch (_) { /* ignore */ }
  }

  // 1. gm_authFailure hook — called by Maps API on auth failure
  (window as any).gm_authFailure = function () {
    _hideGmErrElements();
    setTimeout(_hideGmErrElements, 50);
    setTimeout(_hideGmErrElements, 200);
    setTimeout(_hideGmErrElements, 500);
  };

  // 2. Preemptive CSS — hides dialog before JS cleanup fires
  const _gmStyle = document.createElement('style');
  _gmStyle.textContent = [
    '.gm-err-container,.gm-err-dialog,.gm-err-autocomplete {',
    '  display: none !important;',
    '  visibility: hidden !important;',
    '  pointer-events: none !important;',
    '  opacity: 0 !important;',
    '}',
    '[class*="gm-err"] {',
    '  display: none !important;',
    '  visibility: hidden !important;',
    '  pointer-events: none !important;',
    '  opacity: 0 !important;',
    '}',
  ].join('\n');
  document.head.appendChild(_gmStyle);

  // 3. MutationObserver — hides dialog nodes as soon as they appear in DOM
  const _gmObserver = new MutationObserver(() => _hideGmErrElements());
  _gmObserver.observe(document.documentElement, { childList: true, subtree: true });

  // 4. Polling backup — every 200ms for first 30s
  const _poll = setInterval(() => {
    const found = document.querySelectorAll<HTMLElement>('[class*="gm-err"], .gm-err-container');
    if (found.length > 0) _hideGmErrElements();
  }, 200);
  setTimeout(() => clearInterval(_poll), 30000);
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
    script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_API_KEY}&libraries=places&v=weekly&language=ja&region=JP`;
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
