import React, { useEffect, useMemo, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { MarkerClusterer, SuperClusterAlgorithm } from '@googlemaps/markerclusterer';
import type { Renderer, Cluster, ClusterStats } from '@googlemaps/markerclusterer';
import { Store } from '@workspace/api-client-react';
import { getCategoryIcon } from '@/lib/category-utils';
import { LocateFixed, AlertTriangle, Layers } from 'lucide-react';

import { loadGoogleMapsScript, GM_AUTH_FAILURE_EVENT } from '@/lib/maps-loader';
import { updateCachedCoords, TAKATSUKI_STATION } from '@/hooks/use-user-location';

// ── バッグ情報（ピン色判定用）────────────────────────────────────────────────
export interface BagMapInfo {
  store: { id: number };
  stockCount: number;
  pickupStart?: string | null;
  pickupEnd?: string | null;
}

// ── 受取時間内かどうかを判定（深夜またぎ対応）─────────────────────────────────
function isInPickupWindow(start?: string | null, end?: string | null): boolean {
  if (!start || !end) return true; // 時間制限なし → 常に表示
  const now      = new Date();
  const nowMins  = now.getHours() * 60 + now.getMinutes();
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const startMins = sh * 60 + sm;
  const endMins   = eh * 60 + em;
  if (endMins >= startMins) {
    // 通常ウィンドウ（例: 18:00〜20:00）
    return nowMins >= startMins && nowMins <= endMins;
  } else {
    // 深夜またぎ（例: 22:00〜02:00）
    return nowMins >= startMins || nowMins <= endMins;
  }
}

// ── Google マップ「標準スタイル」 をそのまま使う ─────────────────────────
//   ユーザ要望 (IMG_1824): 寺院アイコン / 駅名 / 高速道路シールド (171, 170 等) /
//   JR・阪急など鉄道路線、 店舗 POI まで全部出る Google デフォルトの賑やかな見た目。
//   カスタムスタイルを一切当てない (= 空配列) ことで Google 標準スタイルが復活する。
//   ★ mapId は使わない方針は維持 (iOS で道路ラベル消失バグの再発防止)。
const MAP_STYLES: google.maps.MapTypeStyle[] = [];

// ── カスタムアイコン用フレームピン (店舗 iconUrl をピンの「滴」内にはめ込む) ──
//   オレンジ枠 (active) / グレー枠 (inactive) の2バリアント。
//   <image href="..."/> でクリッピングし円形に収める。
//   セキュリティ: iconUrl は信頼できる Supabase Storage URL のみを想定するが、
//   防御的に XML 属性用エスケープ + http(s) スキーム以外を拒否する。
function safeIconHref(rawUrl: string): string | null {
  if (!rawUrl) return null;
  // http(s) と data:image/* のみ許可 (javascript:, file: 等は一律拒否)
  // ★ data: 許可は iOS Safari 対策: SVG マーカー (data:image/svg+xml) の中で
  //    外部 https 画像を <image href> 参照すると iOS WebView では描画されない既知の制限があるため、
  //    一度 fetch して base64 化したものを埋め込めるよう data:image/* も通す。
  if (!/^(https?:\/\/|data:image\/)/i.test(rawUrl)) return null;
  // XML 属性として安全になるようエスケープ
  return rawUrl
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ── iconUrl → base64 data URL キャッシュ (モジュールスコープで共有) ─────
//   iOS Safari/Capacitor の data:image/svg+xml の中で外部 image href が描画されない
//   問題への対策。同じ URL は1回だけ fetch する。
//   ★ メモリ肥大化防止のため LRU 風に最大 200 件で頭から evict する。
const __ICON_CACHE_MAX = 200;
const __iconBase64Cache = new Map<string, Promise<string | null>>();
function fetchIconAsDataUrl(rawUrl: string): Promise<string | null> {
  if (!rawUrl || !/^https?:\/\//i.test(rawUrl)) return Promise.resolve(null);
  const cached = __iconBase64Cache.get(rawUrl);
  if (cached) {
    // LRU: 既存エントリを末尾に移動 (Map の挿入順保持を活用)
    __iconBase64Cache.delete(rawUrl);
    __iconBase64Cache.set(rawUrl, cached);
    return cached;
  }
  const p = (async () => {
    try {
      const res = await fetch(rawUrl, { mode: 'cors', cache: 'force-cache' });
      if (!res.ok) return null;
      const blob = await res.blob();
      // 大きすぎる画像はスキップ (data: URL 内 svg のサイズ抑制 / マーカー過多時の OOM 回避)
      // ★ 5MB まで許容: 店舗オーナがアップロードしたアイコン (832KB 等) を確実に取り込めるよう緩和。
      //    マーカーは 1 店舗 1 アイコンのみ (cluster で重複なし) なので OOM リスクは限定的。
      if (blob.size > 5 * 1024 * 1024) return null;
      return await new Promise<string | null>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : null);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  })();
  __iconBase64Cache.set(rawUrl, p);
  // 容量超過分を先頭 (最古) から evict
  while (__iconBase64Cache.size > __ICON_CACHE_MAX) {
    const oldestKey = __iconBase64Cache.keys().next().value;
    if (oldestKey === undefined) break;
    __iconBase64Cache.delete(oldestKey);
  }
  return p;
}

function makeIconPinUrl(iconUrl: string, isActive: boolean): string | null {
  const safeHref = safeIconHref(iconUrl);
  if (!safeHref) return null;
  if (isActive) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="56" height="70" viewBox="0 0 56 70">
      <defs>
        <radialGradient id="ig1" cx="38%" cy="28%" r="72%">
          <stop offset="0%" stop-color="#FA9455"/>
          <stop offset="100%" stop-color="#D44A00"/>
        </radialGradient>
        <filter id="ids1" x="-25%" y="-10%" width="150%" height="135%">
          <feDropShadow dx="0" dy="3" stdDeviation="3.5" flood-color="rgba(160,50,0,0.42)"/>
        </filter>
        <clipPath id="clip1"><circle cx="28" cy="26" r="16"/></clipPath>
      </defs>
      <ellipse cx="28" cy="67" rx="9" ry="3" fill="rgba(0,0,0,0.16)"/>
      <path d="M28 63 Q11 45, 7 26 A21 21 0 1 1 49 26 Q45 45, 28 63 Z"
        fill="url(#ig1)" stroke="rgba(255,255,255,0.65)" stroke-width="1.8" filter="url(#ids1)"/>
      <circle cx="28" cy="26" r="17" fill="white"/>
      <image href="${safeHref}" x="12" y="10" width="32" height="32" clip-path="url(#clip1)" preserveAspectRatio="xMidYMid slice"/>
    </svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  } else {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="60" viewBox="0 0 48 60">
      <defs>
        <filter id="ids2" x="-25%" y="-10%" width="150%" height="135%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="rgba(0,0,0,0.18)"/>
        </filter>
        <clipPath id="clip2"><circle cx="24" cy="22" r="13"/></clipPath>
      </defs>
      <ellipse cx="24" cy="57" rx="7" ry="2.5" fill="rgba(0,0,0,0.10)"/>
      <path d="M24 54 Q9 38, 6 22 A18 18 0 1 1 42 22 Q39 38, 24 54 Z"
        fill="#b8c0cc" stroke="rgba(255,255,255,0.55)" stroke-width="1.5" filter="url(#ids2)"/>
      <circle cx="24" cy="22" r="14" fill="white" opacity="0.9"/>
      <image href="${safeHref}" x="11" y="9" width="26" height="26" clip-path="url(#clip2)" preserveAspectRatio="xMidYMid slice" opacity="0.78"/>
    </svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }
}

// ── オレンジピン（在庫あり・受取時間内）─────────────────────────────────────
function makeActivePinUrl(category: string): string {
  const emoji = getCategoryIcon(category);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="52" height="66" viewBox="0 0 52 66">
    <defs>
      <radialGradient id="g1" cx="38%" cy="28%" r="72%">
        <stop offset="0%" stop-color="#FA9455"/>
        <stop offset="100%" stop-color="#D44A00"/>
      </radialGradient>
      <filter id="ds1" x="-25%" y="-10%" width="150%" height="135%">
        <feDropShadow dx="0" dy="3" stdDeviation="3.5" flood-color="rgba(160,50,0,0.42)"/>
      </filter>
    </defs>
    <ellipse cx="26" cy="63" rx="8" ry="3" fill="rgba(0,0,0,0.16)"/>
    <path d="M26 59 Q11 43, 7 26 A19 19 0 1 1 45 26 Q41 43, 26 59 Z"
      fill="url(#g1)" stroke="rgba(255,255,255,0.6)" stroke-width="1.5" filter="url(#ds1)"/>
    <circle cx="26" cy="24" r="14" fill="rgba(255,255,255,0.15)"/>
    <text x="26" y="31" text-anchor="middle" font-size="18" font-family="serif">${emoji}</text>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

// ── グレーピン（在庫切れ or 受取時間外）────────────────────────────────────
function makeGrayPinUrl(category: string): string {
  const emoji = getCategoryIcon(category);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="56" viewBox="0 0 44 56">
    <defs>
      <filter id="ds2" x="-25%" y="-10%" width="150%" height="135%">
        <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="rgba(0,0,0,0.18)"/>
      </filter>
    </defs>
    <ellipse cx="22" cy="53" rx="6" ry="2.5" fill="rgba(0,0,0,0.10)"/>
    <path d="M22 50 Q9 36, 6 22 A16 16 0 1 1 38 22 Q35 36, 22 50 Z"
      fill="#b8c0cc" stroke="rgba(255,255,255,0.5)" stroke-width="1.5" filter="url(#ds2)"/>
    <circle cx="22" cy="20" r="12" fill="rgba(255,255,255,0.12)"/>
    <text x="22" y="26" text-anchor="middle" font-size="15" font-family="serif" opacity="0.7">${emoji}</text>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

// ── 現在地マーカー（テラコッタ波紋アニメーション）────────────────────────
function makeUserIconUrl(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
    <circle cx="24" cy="24" r="4" fill="none" stroke="#F26419" stroke-width="1.5" opacity="0">
      <animate attributeName="r"       values="4;22;22"   dur="2.2s" repeatCount="indefinite" keyTimes="0;0.7;1" calcMode="spline" keySplines="0.2 0 0.4 1;0 0 1 1"/>
      <animate attributeName="opacity" values="0.7;0;0"   dur="2.2s" repeatCount="indefinite" keyTimes="0;0.7;1" calcMode="spline" keySplines="0.2 0 0.4 1;0 0 1 1"/>
    </circle>
    <circle cx="24" cy="24" r="4" fill="none" stroke="#F26419" stroke-width="1" opacity="0">
      <animate attributeName="r"       values="4;16;16"   dur="2.2s" begin="0.6s" repeatCount="indefinite" keyTimes="0;0.7;1" calcMode="spline" keySplines="0.2 0 0.4 1;0 0 1 1"/>
      <animate attributeName="opacity" values="0.5;0;0"   dur="2.2s" begin="0.6s" repeatCount="indefinite" keyTimes="0;0.7;1" calcMode="spline" keySplines="0.2 0 0.4 1;0 0 1 1"/>
    </circle>
    <circle cx="24" cy="24" r="7" fill="rgba(242,100,25,0.2)"/>
    <circle cx="24" cy="24" r="5" fill="#F26419" stroke="white" stroke-width="2.5"/>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

// ── クラスターレンダラー（アクティブ店舗のみ対象）────────────────────────────
function makeClusterRenderer(gMaps: typeof google.maps): Renderer {
  return {
    render: (cluster: Cluster, stats: ClusterStats, _map: google.maps.Map) => {
      const count  = cluster.count;
      void stats; // 比率による拡大は使わず、件数の絶対値でサイズを決定

      // 件数の絶対値に応じてサイズを段階的に決定
      // 単店ピン (~40px) と近いサイズに保ち、件数が大きくなる時のみ少し拡大
      // → 全国ズームアウト時に複数地域のクラスターが並んでも大きさが破綻しない
      const size  = count < 5   ? 38
                  : count < 10  ? 42
                  : count < 25  ? 46
                  : count < 50  ? 50
                  : count < 100 ? 54
                  :               58;
      const half  = size / 2;
      const r     = half - 5;                       // ハロー分のマージン

      // 件数に応じた濃いオレンジ系（ブランドカラー寄り）
      const fillColor   = count >= 50 ? '#B83D00'
                        : count >= 10 ? '#D44A00'
                        :               '#F26419';
      const haloColor   = 'rgba(242,100,25,0.20)';
      const fontSize    = count >= 1000 ? 12 : count >= 100 ? 14 : count >= 10 ? 16 : 17;
      const labelText   = count >= 1000 ? `${Math.floor(count / 1000)}k+` : String(count);

      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <defs>
          <filter id="cs" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="2" flood-color="#000" flood-opacity="0.28"/>
          </filter>
        </defs>
        <circle cx="${half}" cy="${half}" r="${half - 1}" fill="${haloColor}"/>
        <circle cx="${half}" cy="${half}" r="${r}" fill="${fillColor}" stroke="#FFFFFF" stroke-width="3" filter="url(#cs)"/>
        <text x="${half}" y="${half + fontSize * 0.36}"
          text-anchor="middle" font-size="${fontSize}" font-family="'Noto Sans JP','Outfit',sans-serif"
          font-weight="800" fill="#FFFFFF" letter-spacing="-0.3">${labelText}</text>
      </svg>`;

      return new gMaps.Marker({
        position: cluster.position,
        icon: {
          url:        `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
          scaledSize: new gMaps.Size(size, size),
          anchor:     new gMaps.Point(half, half),
        },
        title:  `${count}店舗`,
        zIndex: Number(gMaps.Marker.MAX_ZINDEX) + count,
      });
    },
  };
}

export interface MapBounds {
  north: number; south: number; east: number; west: number;
  centerLat: number; centerLng: number;
}

export interface MapViewHandle {
  panTo: (lat: number, lng: number, zoom?: number) => void;
  fitStores: (
    locations: { lat: number; lng: number }[],
    opts?: { minZoom?: number; maxZoom?: number },
  ) => void;
}

interface MapViewProps {
  stores: Store[];
  bags?: BagMapInfo[];          // ← ピン色判定用バッグ一覧
  center?: [number, number];
  zoom?: number;
  userPosition?: [number, number] | null;
  onStoreSelect?: (store: Store) => void;
  onUserPositionChange?: (pos: { lat: number; lng: number } | null) => void;
  onMapIdle?: (bounds: MapBounds) => void;
}

export const MapView = forwardRef<MapViewHandle, MapViewProps>(function MapView(
  { stores, bags = [], center, zoom, userPosition, onStoreSelect, onUserPositionChange, onMapIdle },
  ref
) {
  const containerRef    = useRef<HTMLDivElement>(null);
  const mapRef          = useRef<google.maps.Map | null>(null);
  const userMarkerRef   = useRef<google.maps.Marker | null>(null);
  const storeMarkersRef = useRef<google.maps.Marker[]>([]);
  const clustererRef    = useRef<MarkerClusterer | null>(null);
  const onStoreSelectRef        = useRef(onStoreSelect);
  const onUserPositionChangeRef = useRef(onUserPositionChange);
  const onMapIdleRef            = useRef(onMapIdle);
  const isFirstIdleRef          = useRef(true);
  const hasUserInteractedRef    = useRef(false);
  const resizeObserverRef       = useRef<ResizeObserver | null>(null);
  const readySafetyTimerRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const watchIdRef              = useRef<number | null>(null);

  const [status,          setStatus]         = useState<'loading' | 'ready' | 'error'>(
    () => (typeof window !== 'undefined' && (window as any).__gmAuthFailed) ? 'error' : 'loading'
  );

  // ─── Maps API auth failure (RefererNotAllowedMapError 等) を検知 ──────────
  //   loadGoogleMapsScript() 自体は成功するが、 タイル取得時に 403 が返り
  //   gm_authFailure コールバックが発火する。 maps-loader が CustomEvent を
  //   dispatch してくれるので、 ここで listen して error 状態に切り替える。
  //   ★ authFailedRef は init() 中の tilesloaded / 3秒 safety timer が
  //     後から setStatus('ready') で上書きしないようガードする。
  const authFailedRef = useRef<boolean>(
    typeof window !== 'undefined' && !!(window as any).__gmAuthFailed
  );
  useEffect(() => {
    const onAuthFail = () => {
      authFailedRef.current = true;
      setStatus('error');
    };
    window.addEventListener(GM_AUTH_FAILURE_EVENT, onAuthFail);
    return () => window.removeEventListener(GM_AUTH_FAILURE_EVENT, onAuthFail);
  }, []);

  const [locating,        setLocating]       = useState(false);
  const [mapType,         setMapType]        = useState<'roadmap' | 'satellite'>('roadmap');
  const [showMapTypePick, setShowMapTypePick]= useState(false);
  const [userPos,   setUserPos] = useState<{ lat: number; lng: number } | null>(
    userPosition ? { lat: userPosition[0], lng: userPosition[1] } : null
  );
  const [visibleBounds, setVisibleBounds] = useState<{ north: number; south: number; east: number; west: number } | null>(null);

  const mapCenter = center ? { lat: center[0], lng: center[1] } : TAKATSUKI_STATION;

  useEffect(() => { onStoreSelectRef.current        = onStoreSelect;        }, [onStoreSelect]);
  useEffect(() => { onUserPositionChangeRef.current = onUserPositionChange; }, [onUserPositionChange]);
  useEffect(() => { onMapIdleRef.current            = onMapIdle;            }, [onMapIdle]);

  const prevUserPositionRef = useRef<[number, number] | null | undefined>(userPosition);
  const cleanupTouchRef     = useRef<(() => void) | null>(null);
  useEffect(() => {
    const prev = prevUserPositionRef.current;
    prevUserPositionRef.current = userPosition;
    if (!userPosition) return;
    if (prev && prev[0] === userPosition[0] && prev[1] === userPosition[1]) return;
    const ll = { lat: userPosition[0], lng: userPosition[1] };
    setUserPos(ll);
    if (mapRef.current) {
      mapRef.current.panTo(ll);
      mapRef.current.setZoom(15);
    }
  }, [userPosition]); // eslint-disable-line react-hooks/exhaustive-deps

  useImperativeHandle(ref, () => ({
    panTo: (lat: number, lng: number, z?: number) => {
      const map = mapRef.current;
      if (!map) return;
      map.panTo({ lat, lng });
      if (z !== undefined) map.setZoom(z);
    },
    fitStores: (locations: { lat: number; lng: number }[], opts?: { minZoom?: number; maxZoom?: number }) => {
      const map   = mapRef.current;
      const gMaps = (window as any).google?.maps as typeof google.maps | undefined;
      if (!map || !gMaps || locations.length === 0) return;
      const { minZoom = 12, maxZoom = 16 } = opts ?? {};
      if (locations.length === 1) {
        map.panTo(locations[0]);
        map.setZoom(Math.min(16, maxZoom));
        return;
      }
      const bounds = new gMaps.LatLngBounds();
      locations.forEach(loc => bounds.extend(loc));
      map.fitBounds(bounds, { top: 80, right: 24, bottom: 200, left: 24 });
      gMaps.event.addListenerOnce(map, 'idle', () => {
        const z = map.getZoom();
        if (z === undefined) return;
        if (z < minZoom) map.setZoom(minZoom);
        else if (z > maxZoom) map.setZoom(maxZoom);
      });
    },
  }), []);

  useEffect(() => { onUserPositionChangeRef.current?.(userPos); }, [userPos]);

  // ── マップに表示する店舗（全承認済み店舗・ID+座標で重複排除）────────────────
  // 在庫の有無にかかわらず全店舗を表示する（在庫あり→オレンジ、なし→グレー）
  // 重複排除ロジック:
  //   1. 店舗IDで重複排除（同じIDが複数来ても1ピンのみ）
  //   2. 同一座標（約11m精度）の別店舗も1ピンに統合（「2」バグの根本原因修正）
  const listingStores = useMemo(() => {
    const seenId  = new Set<number | string>();
    const seenLoc = new Set<string>();
    return stores.filter(s => {
      const ok = (s as any).status === 'approved' || !(s as any).status || (s as any).showOnMap === true || (s as any).show_on_map === true;
      if (!ok) return false;
      if (seenId.has(s.id)) return false;
      seenId.add(s.id);
      // 同一lat/lng（約11m精度）の重複ピンを排除
      const locKey = `${Math.round(s.lat * 10000)}-${Math.round(s.lng * 10000)}`;
      if (seenLoc.has(locKey)) return false;
      seenLoc.add(locKey);
      return true;
    });
  }, [stores]);

  // ── アクティブ店舗ID Set (O(店舗数 × バッグ数) を O(店舗数 + バッグ数) に短縮) ──
  //   bags を1回スキャンして「在庫あり + 受取時間内」の store.id を Set 化。
  //   以後の判定は Set.has() (O(1)) で済むため、店舗・バッグが多くても CPU を喰わない。
  const activeStoreIdSet = useMemo(() => {
    const s = new Set<number | string>();
    for (const b of bags) {
      if (b.stockCount > 0 && isInPickupWindow(b.pickupStart, b.pickupEnd)) {
        s.add(b.store.id);
      }
    }
    return s;
  }, [bags]);

  // ── アクティブ店舗（オレンジピン: 在庫あり + 受取時間内）────────────────────
  const activeListingStores = useMemo(
    () => listingStores.filter(s => activeStoreIdSet.has(s.id)),
    [listingStores, activeStoreIdSet]
  );

  // ── マーカーKey（ID:色:座標:アイコン 文字列）─────────────────────────────
  // 店舗リストや在庫・時間・座標・アイコンが変わったときだけマーカーを再描画。
  // ★ 座標 / iconUrl も含めることで、 ID と色が同じでも実質変更があれば検知。
  //   これにより effect の dep から listingStores 参照を外せる ＝ React Query の
  //   バックグラウンド refetch (window focus / staleTime 切れ) で配列の参照だけ
  //   変わっても、 内容が同じなら再描画しなくなる。
  //   旧実装は refetch のたびに全マーカーを clearInstanceListeners + setMap(null)
  //   していたため、 ちょうどその瞬間にユーザがピンをタップすると無反応になる
  //   タップ取りこぼしバグが発生していた。
  const markerKey = useMemo(() => {
    return listingStores
      .map(s => {
        const color = activeStoreIdSet.has(s.id) ? 'o' : 'g';
        const lat   = Number(s.lat).toFixed(5);
        const lng   = Number(s.lng).toFixed(5);
        // ★ iconUrl は実 URL を含める (presence だけだと URL→別 URL の変更を検知できない)。
        //   カンマは join 区切りなので除去。 長さは制限せず content hash 代わりに URL 全体を使用。
        const icon  = s.iconUrl ? s.iconUrl.replace(/,/g, '%2C') : '';
        return `${s.id}:${color}:${lat}:${lng}:${icon}`;
      })
      .join(',');
  }, [listingStores, activeStoreIdSet]);

  // ── マップ初期化 ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;

    async function init() {
      try {
        const startCenter = mapCenter;
        // ★ 高速化: スクリプトが既にロード済 (preload キャッシュヒット) なら await を完全スキップ
        //   旧実装は常に await loadGoogleMapsScript() で micro-task 1 回挟んでいた。
        if (!(window as any).google?.maps?.Map) {
          await loadGoogleMapsScript();
          if (cancelled || !containerRef.current) return;
        }

        // ★ Flexレイアウト確定を待つ (1フレーム遅延)。 ただしコンテナ高さが既に
        //   確定している場合は rAF をスキップしてさらに高速化 (preload+再訪時に効く)。
        // (TS narrow: ref.current は async 境界後に再アクセスすると null になり得るのでローカル束縛)
        const sizeProbe = containerRef.current;
        if (!sizeProbe) return;
        if (sizeProbe.clientHeight === 0 || sizeProbe.clientWidth === 0) {
          await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
          if (cancelled || !containerRef.current) return;
        }

        const gMaps = (window as any).google.maps as typeof google.maps;

        // ★ 常に inline MAP_STYLES を適用 (Cloud-based Map ID は使わない)
        //   理由: Map ID を指定すると inline styles が無視され Cloud Console 側の
        //   スタイルが適用されるが、 環境ごとに env が異なり (Web 未設定 / iOS 設定済み)
        //   表示差異が生じる。 inline 一本化で「Web もアプリも完全に同じ見た目」 を保証する。
        const mapOptions: google.maps.MapOptions = {
          center: startCenter,
          zoom: zoom ?? 14,
          disableDefaultUI: true,
          zoomControl: false,
          mapTypeControl: false,
          gestureHandling: 'greedy',
          clickableIcons: false,
          backgroundColor: '#f2f0eb',
          styles: MAP_STYLES,
        };
        const mapEl = containerRef.current;
        if (!mapEl) return;
        const map = new gMaps.Map(mapEl, mapOptions);

        mapRef.current = map;

        // ★ 初期化直後 + その後のコンテナサイズ変化を監視し、resize を発火。
        //   これでタイルが拡大表示でぼやける現象 (特に iOS / 起動直後) を解消する。
        try {
          const targetEl = containerRef.current;
          if (targetEl && typeof ResizeObserver !== 'undefined') {
            let lastW = targetEl.clientWidth;
            let lastH = targetEl.clientHeight;
            // 初回も明示的に発火 (タイル再フェッチ → 正しい解像度に戻す)
            requestAnimationFrame(() => {
              if (mapRef.current) gMaps.event.trigger(mapRef.current, 'resize');
            });
            const ro = new ResizeObserver(entries => {
              for (const e of entries) {
                const w = Math.round(e.contentRect.width);
                const h = Math.round(e.contentRect.height);
                if (w === lastW && h === lastH) continue;
                lastW = w; lastH = h;
                if (mapRef.current) gMaps.event.trigger(mapRef.current, 'resize');
              }
            });
            ro.observe(targetEl);
            resizeObserverRef.current = ro;
          }
        } catch {
          // ResizeObserver 未対応環境は無視
        }

        // ユーザーが地図を実際に動かしたかどうかを追跡
        // (プログラムによる pan/zoom ではボタンを出さない)
        map.addListener('dragstart', () => { hasUserInteractedRef.current = true; });
        // ピンチズームも検知 (touchstart で2本指以上)
        const touchHandler = (e: TouchEvent) => {
          if (e.touches.length >= 2) hasUserInteractedRef.current = true;
        };
        const touchEl = containerRef.current;
        touchEl?.addEventListener('touchstart', touchHandler, { passive: true });
        // ★ クリーンアップで touch listener を確実に外す (cancelled フラグ経由で
        //   このスコープを cleanup から参照可能にする)
        cleanupTouchRef.current = () => {
          touchEl?.removeEventListener('touchstart', touchHandler);
        };

        map.addListener('idle', () => {
          const bounds = map.getBounds();
          const c      = map.getCenter();
          if (!bounds || !c) return;
          const ne = bounds.getNorthEast();
          const sw = bounds.getSouthWest();
          const b = {
            north: ne.lat(), south: sw.lat(),
            east:  ne.lng(), west:  sw.lng(),
          };
          setVisibleBounds(b);
          if (isFirstIdleRef.current) { isFirstIdleRef.current = false; return; }
          // ユーザーがまだ地図を触ってなければ「再検索」ボタンを出さない
          if (!hasUserInteractedRef.current) return;
          onMapIdleRef.current?.({
            ...b,
            centerLat: c.lat(), centerLng: c.lng(),
          });
        });

        // ★★★ 「マップを開くと最初ぼやけて後から綺麗になる」根本対策 ★★★
        //   旧実装は tilesloaded → resize → setStatus('ready') の順だったが、
        //   resize がタイルを再フェッチするため ready 化した瞬間には
        //   まだ古い低解像度タイルが残っていて「ぼやけて → 鮮明」が発生していた。
        //
        //   修正: resize は最初の tilesloaded ハンドラ内で先に発火し、
        //         そこから「2回目」の tilesloaded (= DPR補正後の高解像度タイル
        //         が全部揃った瞬間) を待ってから ready 化する。
        //         これで初期表示が常に最終解像度のタイルで描画される。
        //
        //   セーフティ:
        //     - 2回目の tilesloaded が 400ms 来なければ強制 ready
        //       (Wi-Fi/4G では 200-300ms でタイル到着するので 400ms で十分。
        //        体感 0.5 秒短縮: 2.0s → 1.5s。 低速回線では稀にぼやけ残るが
        //        全体 safety 2.5s より前に必ず復旧する)
        //     - 全体として 2.5 秒以内に必ず ready (オフライン対策)
        let readyFired = false;
        const finalReady = () => {
          if (readyFired || cancelled) return;
          readyFired = true;
          if (!authFailedRef.current) setStatus('ready');
        };
        const onFirstTilesLoaded = () => {
          if (cancelled) return;
          // 2回目の tilesloaded (resize 後の高解像度タイル) を先にリッスン
          gMaps.event.addListenerOnce(map, 'tilesloaded', finalReady);
          // DPR (iOS Retina) 補正のため resize を発火 → タイル再フェッチ
          try { gMaps.event.trigger(map, 'resize'); } catch { /* noop */ }
          // 2回目セーフティ: 400ms 内に来なければ強制 ready (Wi-Fi/4G に最適化)
          setTimeout(finalReady, 400);
        };
        gMaps.event.addListenerOnce(map, 'tilesloaded', onFirstTilesLoaded);
        // 全体セーフティ: 2.5 秒で強制 ready (オフライン・低速回線向け)
        readySafetyTimerRef.current = setTimeout(finalReady, 2500);
      } catch (e) {
        console.error('Google Maps load error:', e);
        if (!cancelled) setStatus('error');
      }
    }

    init();
    return () => {
      cancelled = true;
      // ★ touch listener を確実に外す (リーク防止)
      if (cleanupTouchRef.current) {
        cleanupTouchRef.current();
        cleanupTouchRef.current = null;
      }
      // ★ ResizeObserver も解除 (リーク防止)
      if (resizeObserverRef.current) {
        try { resizeObserverRef.current.disconnect(); } catch { /* noop */ }
        resizeObserverRef.current = null;
      }
      // ★ tilesloaded セーフティタイマも解除 (アンマウント後の setState 警告防止)
      if (readySafetyTimerRef.current) {
        clearTimeout(readySafetyTimerRef.current);
        readySafetyTimerRef.current = null;
      }
    };
  }, []);

  // ── 店舗マーカー（オレンジ/グレー色分け + クラスタリング）──────────────────
  // クラスタリング対象はオレンジ（アクティブ）のみ。
  // グレーはクラスターに含めず、個別ピンとして常に表示する。
  useEffect(() => {
    if (status !== 'ready') return;
    const map   = mapRef.current;
    const gMaps = (window as any).google?.maps as typeof google.maps | undefined;
    if (!map || !gMaps) return;

    // 既存マーカーをすべて削除
    if (clustererRef.current) {
      clustererRef.current.clearMarkers();
      clustererRef.current = null;
    }
    storeMarkersRef.current.forEach(m => {
      gMaps.event.clearInstanceListeners(m);
      m.setMap(null);
    });
    storeMarkersRef.current = [];

    if (listingStores.length === 0) return;

    const activeMarkers: google.maps.Marker[] = [];
    const allMarkers:    google.maps.Marker[] = [];

    listingStores.forEach(store => {
      // このstoreが「アクティブ（在庫あり + 受取時間内）」かを判定
      // ★ activeStoreIdSet (上で bags を 1 回走査して構築) を使い O(1) で判定。
      //    旧実装の bags.some() は店舗ごとに全 bags を走査していたため
      //    全体で O(店舗数 × バッグ数) になり、地図表示が重くなる原因だった。
      const isActive = activeStoreIdSet.has(store.id);

      // ★ 店舗が独自アイコン (iconUrl) を設定している場合はそれを優先表示。
      //   ただし iOS Safari は data:image/svg+xml の中で外部 https 画像を描画できないため、
      //   初期表示はカテゴリ絵文字ピンで描画 → fetchIconAsDataUrl で base64 化が完了次第
      //   marker.setIcon でカスタムピンへ差し替える (中身が真っ白問題への根本対策)。
      const hasCustomIcon = !!store.iconUrl;
      const fallbackUrl   = isActive ? makeActivePinUrl(store.category) : makeGrayPinUrl(store.category);
      const [fw, fh, fax, fay] = isActive ? [52, 66, 26, 59] : [44, 56, 22, 50];

      const marker = new gMaps.Marker({
        position: { lat: store.lat, lng: store.lng },
        icon: {
          url:        fallbackUrl,
          scaledSize: new gMaps.Size(fw, fh),
          anchor:     new gMaps.Point(fax, fay),
        },
        title:  store.name,
        zIndex: isActive ? 10 : 5,
        // グレーピンはクラスタに入れないためmapを直接設定
        map: isActive ? undefined : map,
      });

      // 非同期で iconUrl を data URL 化してから差し替え (失敗時は絵文字ピンのまま)
      if (hasCustomIcon && store.iconUrl) {
        fetchIconAsDataUrl(store.iconUrl).then(dataUrl => {
          if (!dataUrl) return;
          const customPinUrl = makeIconPinUrl(dataUrl, isActive);
          if (!customPinUrl) return;
          const [cw, ch, cax, cay] = isActive ? [56, 70, 28, 63] : [48, 60, 24, 54];
          marker.setIcon({
            url:        customPinUrl,
            scaledSize: new gMaps.Size(cw, ch),
            anchor:     new gMaps.Point(cax, cay),
          });
        });
      }

      marker.addListener('click', () => {
        const pos = marker.getPosition();
        if (pos) {
          map.setZoom(15);
          map.panTo(pos);
          setTimeout(() => { map.panBy(0, 200); }, 80);
        }
        onStoreSelectRef.current?.(store);
      });

      allMarkers.push(marker);
      if (isActive) activeMarkers.push(marker);
    });

    storeMarkersRef.current = allMarkers;

    // オレンジマーカーのみクラスタリング
    if (activeMarkers.length > 0) {
      clustererRef.current = new MarkerClusterer({
        map,
        markers: activeMarkers,
        algorithm: new SuperClusterAlgorithm({
          radius:    80,
          maxZoom:   15,
          minPoints: 2,
        }),
        renderer: makeClusterRenderer(gMaps),
      });
    }
  // ★ markerKey が ID:色:座標:アイコン を全部含むので、 これだけで実質変更を検知できる。
  //   listingStores 参照の変化 (React Query refetch 等) では再描画させない ＝
  //   タップ中にマーカーが消える競合バグを根本回避。
  }, [markerKey, status]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 現在地マーカー ────────────────────────────────────────────────────────
  useEffect(() => {
    if (status !== 'ready') return;
    const gMaps = (window as any).google?.maps as typeof google.maps | undefined;
    const map   = mapRef.current;
    if (!gMaps || !map) return;

    if (userPos) {
      if (userMarkerRef.current) {
        // 既存マーカーの位置だけ更新 (remove/recreate しない → アニメが途切れない)
        userMarkerRef.current.setPosition(userPos);
      } else {
        userMarkerRef.current = new gMaps.Marker({
          position: userPos,
          map,
          icon: {
            url:        makeUserIconUrl(),
            scaledSize: new gMaps.Size(48, 48),
            anchor:     new gMaps.Point(24, 24),
          },
          title:  '現在地',
          zIndex: 999,
        });
      }
    } else {
      userMarkerRef.current?.setMap(null);
      userMarkerRef.current = null;
    }
  }, [userPos, status]);

  // ── watchPosition: マップが ready になったら継続的に現在地を追跡 ─────────────
  //   getCurrentPosition は1回取得のみ → ユーザが移動してもマーカーが動かないバグの修正。
  //   watchPosition はバックグラウンド追跡でマーカーのみ更新 (地図はパンしない)。
  //   GPS ボタンタップ時のみパンする (handleLocate) ので地図が勝手に動くことはない。
  useEffect(() => {
    if (status !== 'ready') return;
    if (!navigator.geolocation) return;

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const ll = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        updateCachedCoords(ll);
        setUserPos(ll);
      },
      (err) => {
        console.warn('[Map] watchPosition error:', err.code, err.message);
      },
      { enableHighAccuracy: false, maximumAge: 10000, timeout: 15000 },
    );
    watchIdRef.current = id;

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [status]);

  // ── GPS ── iOS Safari 対策 ─────────────────────────────────────────────────
  function handleLocate() {
    if (userPos) {
      mapRef.current?.panTo(userPos);
      mapRef.current?.setZoom(15);
      return;
    }
    if (!navigator.geolocation) {
      console.warn('[Map] geolocation not supported');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const ll = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        updateCachedCoords(ll);
        setUserPos(ll);
        mapRef.current?.panTo(ll);
        mapRef.current?.setZoom(15);
        setLocating(false);
      },
      (err) => {
        console.warn('[Map] geolocation error:', err.code, err.message);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  }

  // ── マップタイプ切替 ─────────────────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem('osusowake_map_type', mapType);
    const map = mapRef.current;
    if (!map || status !== 'ready') return;
    map.setMapTypeId(mapType);
    // roadmap でカスタムスタイル / satellite では素地を表示
    if (mapType === 'roadmap') {
      map.setOptions({ styles: MAP_STYLES });
    } else {
      map.setOptions({ styles: [] });
    }
  }, [mapType, status]);

  // ── 表示範囲内のアクティブ店舗数（凡例カウント）─────────────────────────────
  // 「おすそわけ受付中 ○店」はオレンジ（在庫あり + 受取時間内）の店舗のみ数える
  const visibleListingCount = useMemo(() => {
    if (!visibleBounds) return activeListingStores.length;
    const { north, south, east, west } = visibleBounds;
    return activeListingStores.filter(s =>
      s.lat >= south && s.lat <= north && s.lng >= west && s.lng <= east
    ).length;
  }, [activeListingStores, visibleBounds]);

  return (
    <div className="w-full h-full relative">
      <div ref={containerRef} className="w-full h-full" />

      {status === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#f2f0eb] gap-3">
          <div className="w-9 h-9 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-muted-foreground font-medium">地図を読み込んでいます...</p>
        </div>
      )}

      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#f2f0eb] gap-3 px-6 text-center">
          <AlertTriangle className="w-10 h-10 text-amber-500" />
          <p className="text-sm font-bold text-foreground">地図を表示できませんでした</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            電波状況を確認してリトライしてください。<br />
            ボタンからリスト表示に切り替えることもできます。
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-2 px-5 py-2 rounded-full bg-primary text-white text-xs font-bold active:scale-95 transition-transform"
          >
            再読み込み
          </button>
        </div>
      )}

      {status === 'ready' && (
        <>
          {/* レイヤー切替ボタン + ピッカー */}
          <div className="absolute top-3 right-3 z-20">
            <button
              onClick={() => setShowMapTypePick(v => !v)}
              aria-label="地図タイプを切替"
              className={`w-10 h-10 rounded-xl flex items-center justify-center active:scale-95 transition-all duration-150 border ${
                mapType === 'satellite'
                  ? 'bg-primary border-primary text-white'
                  : 'bg-white border-gray-200/80 text-gray-600'
              }`}
              style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
            >
              <Layers className="w-5 h-5" strokeWidth={1.8} />
            </button>

            {showMapTypePick && (
              <>
                {/* 背景クリックで閉じる */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMapTypePick(false)}
                />
                {/* ピッカーカード */}
                <div
                  className="absolute top-12 right-0 z-20 bg-white rounded-2xl p-2 flex gap-2"
                  style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.14)', minWidth: 168 }}
                >
                  {/* 地図 */}
                  <button
                    onClick={() => { setMapType('roadmap'); setShowMapTypePick(false); }}
                    className={`flex flex-col items-center gap-1.5 p-1.5 rounded-xl flex-1 transition-all ${
                      mapType === 'roadmap' ? 'ring-2 ring-primary' : 'hover:bg-gray-50'
                    }`}
                  >
                    {/* サムネイル（道路地図イメージ） */}
                    <div className="w-16 h-11 rounded-lg overflow-hidden border border-gray-100 relative bg-[#f2f0eb]">
                      <div className="absolute inset-0" style={{
                        backgroundImage: `
                          linear-gradient(#d6d0c7 1px, transparent 1px),
                          linear-gradient(90deg, #d6d0c7 1px, transparent 1px)
                        `,
                        backgroundSize: '12px 12px',
                      }} />
                      <div className="absolute top-2 left-1 right-1 h-1 rounded bg-white/80" />
                      <div className="absolute top-5 left-3 right-3 h-0.5 rounded bg-white/60" />
                      <div className="absolute top-8 left-1 right-2 h-1 rounded bg-white/70" />
                    </div>
                    <span className={`text-[11px] font-bold ${mapType === 'roadmap' ? 'text-primary' : 'text-gray-600'}`}>地図</span>
                  </button>

                  {/* 航空写真 */}
                  <button
                    onClick={() => { setMapType('satellite'); setShowMapTypePick(false); }}
                    className={`flex flex-col items-center gap-1.5 p-1.5 rounded-xl flex-1 transition-all ${
                      mapType === 'satellite' ? 'ring-2 ring-primary' : 'hover:bg-gray-50'
                    }`}
                  >
                    {/* サムネイル（航空写真イメージ） */}
                    <div className="w-16 h-11 rounded-lg overflow-hidden border border-gray-100 relative bg-[#3a5a3c]">
                      <div className="absolute inset-0" style={{
                        background: `
                          radial-gradient(circle at 30% 40%, #2d4a2e 25%, transparent 26%),
                          radial-gradient(circle at 70% 30%, #1e3d1f 20%, transparent 21%),
                          radial-gradient(circle at 50% 70%, #3a5a3c 30%, transparent 31%),
                          linear-gradient(135deg, #3a5a3c, #2a4a2c, #4a6a4e)
                        `,
                      }} />
                      <div className="absolute bottom-1 left-1 right-2 h-1 rounded-sm bg-[#8a7a5a]/60" />
                      <div className="absolute top-3 left-4 right-1 h-0.5 rounded-sm bg-[#6a5a4a]/40" />
                    </div>
                    <span className={`text-[11px] font-bold ${mapType === 'satellite' ? 'text-primary' : 'text-gray-600'}`}>航空写真</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* カスタムズームボタン */}
          <div className="absolute bottom-[64px] right-3 z-10 flex flex-col overflow-hidden rounded-2xl border border-gray-200/80"
            style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
            <button
              onClick={() => mapRef.current?.setZoom((mapRef.current.getZoom() ?? 14) + 1)}
              className="w-9 h-9 bg-white flex items-center justify-center text-gray-500 hover:bg-gray-50 active:scale-95 transition-all border-b border-gray-100 text-lg font-light"
              aria-label="ズームイン"
            >＋</button>
            <button
              onClick={() => mapRef.current?.setZoom((mapRef.current.getZoom() ?? 14) - 1)}
              className="w-9 h-9 bg-white flex items-center justify-center text-gray-500 hover:bg-gray-50 active:scale-95 transition-all text-lg font-light"
              aria-label="ズームアウト"
            >－</button>
          </div>

          {/* GPS FAB */}
          <button
            onClick={handleLocate}
            aria-label={locating ? '取得中...' : userPos ? '現在地に戻る' : '現在地を表示'}
            className={`absolute bottom-4 right-2 z-10 w-11 h-11 rounded-full flex items-center justify-center active:scale-95 transition-all duration-150
              ${userPos
                ? 'bg-white border border-primary/25 text-primary'
                : 'bg-white border border-gray-200/80 text-gray-500'
              }`}
            style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.10), 0 1px 3px rgba(0,0,0,0.06)' }}
          >
            {locating
              ? <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              : <LocateFixed className={`w-4.5 h-4.5 ${userPos ? 'text-primary' : 'text-gray-400'}`} strokeWidth={2.5} />
            }
          </button>

          {/* 凡例バッジ（オレンジ店舗のみカウント）*/}
          {(visibleListingCount > 0 || listingStores.length > 0) && (
            <div className="absolute bottom-4 left-3 z-10 bg-white/96 backdrop-blur-sm rounded-2xl px-3 py-2 flex items-center gap-2 border border-gray-100/80"
              style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ background: 'linear-gradient(135deg,#FA9455,#D44A00)' }} />
                <span className="text-[11px] font-bold text-gray-700">受付中</span>
                <span className="text-[10px] font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                  {visibleListingCount}店
                </span>
              </div>
              {listingStores.length > activeListingStores.length && (
                <div className="flex items-center gap-1 border-l border-gray-200 pl-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#b8c0cc] shrink-0" />
                  <span className="text-[10px] text-gray-400 font-medium">
                    {listingStores.length - activeListingStores.length}店 受付外
                  </span>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
});
