// In Capacitor builds, the domain-restricted key causes a blocking error dialog.
// We intentionally skip the key (shows "development purposes only" watermark but
// the map functions correctly). In web builds the full key is used.
export const MAPS_API_KEY = (import.meta.env.VITE_IS_CAPACITOR === 'true')
  ? ''
  : ((import.meta.env.VITE_MAPS_API_KEY as string) || '');

// In Capacitor: suppress the Google Maps error dialog (appears even with empty key).
// Inject CSS to hide it, and use a MutationObserver to auto-click OK if it appears.
if (import.meta.env.VITE_IS_CAPACITOR === 'true') {
  const style = document.createElement('style');
  style.textContent = '.gm-err-container, .gm-err-autocomplete { display: none !important; }';
  document.head.appendChild(style);

  const observer = new MutationObserver(() => {
    const errBox = document.querySelector<HTMLElement>('.gm-err-container');
    if (errBox) {
      errBox.style.display = 'none';
      const btn = errBox.querySelector<HTMLElement>('button, [role="button"]');
      if (btn) btn.click();
    }
    // Also hide any iframe-based error overlays Google Maps injects
    document.querySelectorAll<HTMLElement>('div[style*="z-index: 1000"] > div > div').forEach(el => {
      if (el.textContent?.includes('Google マップ') && el.textContent?.includes('正しく読み込まれ')) {
        const parent = el.closest<HTMLElement>('div[style*="z-index"]');
        if (parent) parent.style.display = 'none';
      }
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

const SCRIPT_ID = 'rescueat-google-maps';
let _promise: Promise<void> | null = null;

export function loadGoogleMapsScript(): Promise<void> {
  if ((window as any).google?.maps?.Map) {
    return Promise.resolve();
  }
  if (_promise) return _promise;

  _promise = new Promise<void>((resolve, reject) => {
    if (document.getElementById(SCRIPT_ID)) {
      const t = setInterval(() => {
        if ((window as any).google?.maps?.Map) {
          clearInterval(t);
          resolve();
        }
      }, 80);
      setTimeout(() => {
        clearInterval(t);
        _promise = null;
        reject(new Error('Google Maps load timeout'));
      }, 20000);
      return;
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_API_KEY}&libraries=places&v=weekly&language=ja&region=JP`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if ((window as any).google?.maps?.Map) {
        resolve();
      } else {
        const t = setInterval(() => {
          if ((window as any).google?.maps?.Map) {
            clearInterval(t);
            resolve();
          }
        }, 80);
        setTimeout(() => { clearInterval(t); _promise = null; reject(new Error('google.maps not ready')); }, 10000);
      }
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
