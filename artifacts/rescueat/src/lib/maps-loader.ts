// In Capacitor, the domain-restricted key shows the auth error dialog.
// We use an empty key (shows "development purposes only" watermark but map works).
export const MAPS_API_KEY = (import.meta.env.VITE_IS_CAPACITOR === 'true')
  ? ''
  : ((import.meta.env.VITE_MAPS_API_KEY as string) || '');

// ─── Capacitor: Suppress Google Maps auth failure dialog ───────────────────
if (import.meta.env.VITE_IS_CAPACITOR === 'true') {

  function _removeGmErrElements() {
    try {
      document.querySelectorAll<HTMLElement>(
        '[class*="gm-err"], .gm-err-container, .gm-err-dialog, .gm-err-autocomplete'
      ).forEach(el => el.remove());

      // Also auto-click any stray OK buttons inside .gm-style
      document.querySelectorAll<HTMLButtonElement>('.gm-style button').forEach(btn => {
        if (btn.textContent?.trim() === 'OK') btn.click();
      });
    } catch (_) { /* ignore */ }
  }

  // 1. gm_authFailure hook — called by Maps API on auth failure
  (window as any).gm_authFailure = function () {
    _removeGmErrElements();
    setTimeout(_removeGmErrElements, 100);
    setTimeout(_removeGmErrElements, 500);
  };

  // 2. Preemptive CSS — hides dialog immediately before JS cleanup fires
  const _gmStyle = document.createElement('style');
  _gmStyle.textContent = [
    '.gm-err-container,.gm-err-dialog,.gm-err-autocomplete{display:none!important;pointer-events:none!important;}',
    '[class*="gm-err"]{display:none!important;pointer-events:none!important;}',
  ].join('\n');
  document.head.appendChild(_gmStyle);

  // 3. MutationObserver — removes dialog nodes as soon as they appear in DOM
  const _gmObserver = new MutationObserver(() => _removeGmErrElements());
  _gmObserver.observe(document.documentElement, { childList: true, subtree: true });

  // 4. Polling backup — every 200ms for first 30s
  const _poll = setInterval(() => {
    const found = document.querySelectorAll('[class*="gm-err"], .gm-err-container');
    if (found.length > 0) {
      _removeGmErrElements();
    }
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
