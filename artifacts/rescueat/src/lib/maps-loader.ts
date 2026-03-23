export const MAPS_API_KEY = (import.meta.env.VITE_MAPS_API_KEY as string) || '';

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
      setTimeout(() => { clearInterval(t); reject(new Error('timeout')); }, 15000);
      return;
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_API_KEY}&libraries=maps,places&v=weekly&language=ja&region=JP`;
    script.async = true;
    script.defer = true;
    script.onload  = () => resolve();
    script.onerror = () => { _promise = null; reject(new Error('Maps script load failed')); };
    document.head.appendChild(script);
  });

  return _promise;
}
