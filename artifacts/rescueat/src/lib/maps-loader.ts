// In Capacitor builds, the domain-restricted key causes a blocking error dialog.
// We intentionally skip the key (shows "development purposes only" watermark but
// the map functions correctly). In web builds the full key is used.
export const MAPS_API_KEY = (import.meta.env.VITE_IS_CAPACITOR === 'true')
  ? ''
  : ((import.meta.env.VITE_MAPS_API_KEY as string) || '');

// In Capacitor: suppress the Google Maps authentication failure dialog.
// gm_authFailure is the official Google Maps API callback for auth errors.
// Setting it to a no-op prevents the blocking error dialog from appearing.
if (import.meta.env.VITE_IS_CAPACITOR === 'true') {
  (window as any).gm_authFailure = function () { /* suppress auth dialog */ };

  // Also inject CSS as belt-and-suspenders defense
  const style = document.createElement('style');
  style.textContent = [
    '.gm-err-container { display: none !important; }',
    '.gm-err-autocomplete { display: none !important; }',
    'div.gm-style > div[style*="z-index: 1000"] { display: none !important; }',
  ].join('\n');
  document.head.appendChild(style);
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
