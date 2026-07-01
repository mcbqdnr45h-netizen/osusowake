// ── 位置情報 互換ラッパー ─────────────────────────────────────────────────────
//   ネイティブ (Capacitor/iOS) では @capacitor/geolocation (ネイティブ CoreLocation) を使う。
//   理由: リモートロード WebView で navigator.geolocation を使うと、 iOS が
//         ① アプリの位置情報許可 と ② サイト (osusowakejapan.org) の位置情報許可 の
//         「2 回」許可を求める。 ネイティブ CoreLocation を直接使えば許可は ① の 1 回だけ。
//   ブラウザ / PWA では従来どおり navigator.geolocation を使う (web フォールバック)。
//
//   コールバックの形 (pos.coords.latitude / longitude) は Web も Capacitor も同一なので、
//   呼び出し側の success コールバックは一切変更不要。

interface Coords { latitude: number; longitude: number }
interface Pos { coords: Coords }
type GeoSuccess = (pos: Pos) => void;
type GeoError = (err: { code: number; message: string }) => void;
export interface GeoOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

// ★ ネイティブ Geolocation プラグインを使うのは「ネイティブ かつ プラグインが実際に
//   組み込まれている (build 156+)」時だけ。 旧ビルド (154/155) はプラグインが無いので
//   isPluginAvailable が false → navigator.geolocation にフォールバックする (壊さない)。
function useNative(): boolean {
  const cap = (window as unknown as {
    Capacitor?: { isNativePlatform?: () => boolean; isPluginAvailable?: (n: string) => boolean };
  }).Capacitor;
  return !!(cap?.isNativePlatform?.() && cap?.isPluginAvailable?.('Geolocation'));
}

/** 位置情報が利用可能か (ネイティブプラグイン or ブラウザが対応) */
export function isSupported(): boolean {
  return useNative() || (typeof navigator !== 'undefined' && !!navigator.geolocation);
}

function toErr(e: unknown): { code: number; message: string } {
  const anyE = e as { message?: unknown; code?: unknown };
  const msg = anyE?.message != null ? String(anyE.message) : String(e);
  // web の GeolocationPositionError コード互換: 1=DENIED, 2=UNAVAILABLE, 3=TIMEOUT
  if (typeof anyE?.code === 'number') return { code: anyE.code as number, message: msg };
  let code = 2;
  if (/denied|permission|許可/i.test(msg)) code = 1;
  else if (/timeout|timed out|タイムアウト/i.test(msg)) code = 3;
  return { code, message: msg };
}

/** 現在地を 1 回取得 (navigator.geolocation.getCurrentPosition 互換) */
export function getCurrentPosition(success: GeoSuccess, error?: GeoError, options?: GeoOptions): void {
  if (useNative()) {
    import('@capacitor/geolocation')
      .then(({ Geolocation }) => Geolocation.getCurrentPosition(options))
      .then((pos) => success(pos as unknown as Pos))
      .catch((e) => error?.(toErr(e)));
  } else {
    navigator.geolocation.getCurrentPosition(success as PositionCallback, error as PositionErrorCallback, options);
  }
}

// ── watchPosition: ネイティブは watch ID が Promise で返るため、 同期 ID にブリッジする ──
let seq = 0;
const natWatch = new Map<number, { capId: string | null; cleared: boolean }>();

/** 現在地を継続取得 (navigator.geolocation.watchPosition 互換)。 戻り値は clearWatch に渡す ID */
export function watchPosition(success: GeoSuccess, error?: GeoError, options?: GeoOptions): number {
  if (useNative()) {
    const myId = ++seq;
    const entry = { capId: null as string | null, cleared: false };
    natWatch.set(myId, entry);
    import('@capacitor/geolocation')
      .then(({ Geolocation }) =>
        Geolocation.watchPosition(options ?? {}, (pos, err) => {
          if (err) { error?.(toErr(err)); return; }
          if (pos) success(pos as unknown as Pos);
        }),
      )
      .then((capId) => {
        if (entry.cleared) {
          // clearWatch が ID 解決前に呼ばれていた → 即解除
          import('@capacitor/geolocation').then(({ Geolocation }) => Geolocation.clearWatch({ id: capId })).catch(() => {});
        } else {
          entry.capId = capId;
        }
      })
      .catch((e) => error?.(toErr(e)));
    return myId;
  }
  return navigator.geolocation.watchPosition(success as PositionCallback, error as PositionErrorCallback, options);
}

/** watchPosition の解除 */
export function clearWatch(id: number): void {
  if (useNative()) {
    const entry = natWatch.get(id);
    if (!entry) return;
    entry.cleared = true;
    if (entry.capId) {
      import('@capacitor/geolocation').then(({ Geolocation }) => Geolocation.clearWatch({ id: entry.capId as string })).catch(() => {});
    }
    natWatch.delete(id);
    return;
  }
  navigator.geolocation.clearWatch(id);
}
