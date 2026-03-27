import React, { useEffect, useMemo, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { MarkerClusterer, SuperClusterAlgorithm } from '@googlemaps/markerclusterer';
import type { Renderer, Cluster, ClusterStats } from '@googlemaps/markerclusterer';
import { Store } from '@workspace/api-client-react';
import { getCategoryIcon } from '@/lib/category-utils';
import { LocateFixed, AlertTriangle } from 'lucide-react';

import { loadGoogleMapsScript } from '@/lib/maps-loader';
import { updateCachedCoords, TAKATSUKI_STATION } from '@/hooks/use-user-location';

// ── プロ仕様・超ミニマル Silver マップスタイル ────────────────────────────
const MAP_STYLES: google.maps.MapTypeStyle[] = [
  // 全要素をシルバーグレーに統一
  { elementType: 'geometry',          stylers: [{ color: '#f2f0eb' }] },
  { elementType: 'labels.text.fill',  stylers: [{ color: '#b0a898' }] },
  { elementType: 'labels.text.stroke',stylers: [{ color: '#f2f0eb' }] },
  // POI・交通機関 — 完全非表示
  { featureType: 'poi',     stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  // 道路 — 細い白線、ラベルは最小限
  { featureType: 'road',                elementType: 'geometry',          stylers: [{ color: '#ffffff' }] },
  { featureType: 'road',                elementType: 'geometry.stroke',   stylers: [{ color: '#e8e4de' }] },
  { featureType: 'road',                elementType: 'labels.text.fill',  stylers: [{ color: '#c8c0b8' }] },
  { featureType: 'road',                elementType: 'labels.text.stroke',stylers: [{ color: '#f2f0eb' }] },
  { featureType: 'road.highway',        elementType: 'geometry',          stylers: [{ color: '#f0ebe2' }] },
  { featureType: 'road.highway',        elementType: 'geometry.stroke',   stylers: [{ color: '#ddd8cf' }] },
  { featureType: 'road.arterial',       elementType: 'labels',            stylers: [{ visibility: 'off' }] },
  { featureType: 'road.local',          elementType: 'labels',            stylers: [{ visibility: 'off' }] },
  // 水域 — ペールグレーブルー
  { featureType: 'water', elementType: 'geometry',stylers: [{ color: '#d8e4ec' }] },
  { featureType: 'water', elementType: 'labels',  stylers: [{ visibility: 'off' }] },
  // 景観 — ウォームシルバー
  { featureType: 'landscape',       elementType: 'geometry',stylers: [{ color: '#f2f0eb' }] },
  { featureType: 'landscape.natural',elementType: 'geometry',stylers: [{ color: '#e8ede0' }] },
  // 行政区画 — 市区名のみ、非常に薄く
  { featureType: 'administrative',             elementType: 'labels',            stylers: [{ visibility: 'simplified' }] },
  { featureType: 'administrative',             elementType: 'labels.text.fill',  stylers: [{ color: '#c0b8b0' }] },
  { featureType: 'administrative.locality',    elementType: 'labels.text.fill',  stylers: [{ color: '#a8a098' }] },
  { featureType: 'administrative.neighborhood',elementType: 'labels',            stylers: [{ visibility: 'off' }] },
];

// ── 出品中ピン（テラコッタ テアドロップ）────────────────────────────────
function makeListingPinUrl(category: string): string {
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
    <!-- 影 -->
    <ellipse cx="26" cy="63" rx="8" ry="3" fill="rgba(0,0,0,0.16)"/>
    <!-- ピン本体（テアドロップ） -->
    <path d="M26 59 Q11 43, 7 26 A19 19 0 1 1 45 26 Q41 43, 26 59 Z"
      fill="url(#g1)" stroke="rgba(255,255,255,0.6)" stroke-width="1.5" filter="url(#ds1)"/>
    <!-- 内側ハイライト -->
    <circle cx="26" cy="24" r="14" fill="rgba(255,255,255,0.15)"/>
    <!-- 絵文字 -->
    <text x="26" y="31" text-anchor="middle" font-size="18" font-family="serif">${emoji}</text>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

// ── 現在地マーカー（テラコッタ波紋アニメーション）────────────────────────
function makeUserIconUrl(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
    <!-- 外側波紋（遅延なし） -->
    <circle cx="24" cy="24" r="4" fill="none" stroke="#F26419" stroke-width="1.5" opacity="0">
      <animate attributeName="r"       values="4;22;22"   dur="2.2s" repeatCount="indefinite" keyTimes="0;0.7;1" calcMode="spline" keySplines="0.2 0 0.4 1;0 0 1 1"/>
      <animate attributeName="opacity" values="0.7;0;0"   dur="2.2s" repeatCount="indefinite" keyTimes="0;0.7;1" calcMode="spline" keySplines="0.2 0 0.4 1;0 0 1 1"/>
    </circle>
    <!-- 中間波紋（0.6s 遅延） -->
    <circle cx="24" cy="24" r="4" fill="none" stroke="#F26419" stroke-width="1" opacity="0">
      <animate attributeName="r"       values="4;16;16"   dur="2.2s" begin="0.6s" repeatCount="indefinite" keyTimes="0;0.7;1" calcMode="spline" keySplines="0.2 0 0.4 1;0 0 1 1"/>
      <animate attributeName="opacity" values="0.5;0;0"   dur="2.2s" begin="0.6s" repeatCount="indefinite" keyTimes="0;0.7;1" calcMode="spline" keySplines="0.2 0 0.4 1;0 0 1 1"/>
    </circle>
    <!-- 中心ドット -->
    <circle cx="24" cy="24" r="7" fill="rgba(242,100,25,0.2)"/>
    <circle cx="24" cy="24" r="5" fill="#F26419" stroke="white" stroke-width="2.5"/>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

// ── クラスターレンダラー（出品中のみ・テラコッタ繊細デザイン）────────────
function makeClusterRenderer(gMaps: typeof google.maps): Renderer {
  return {
    render: (cluster: Cluster, stats: ClusterStats, _map: google.maps.Map) => {
      const count  = cluster.count;
      const maxVal = stats.clusters.markers.max;

      const ratio = Math.min(count / Math.max(maxVal, 1), 1);
      const size  = Math.round(30 + ratio * 10); // 30〜40px
      const half  = size / 2;
      const r     = half - 2.5;

      const strokeColor = count >= 10 ? '#D44A00' : '#F26419';
      const fillAlpha   = count >= 10 ? 0.20 : 0.13;
      const textColor   = count >= 10 ? '#B83D00' : '#D44A00';
      const fontSize    = count >= 100 ? 9 : count >= 10 ? 10 : 11;

      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <circle cx="${half}" cy="${half}" r="${r + 3.5}" fill="rgba(242,100,25,0.06)"/>
        <circle cx="${half}" cy="${half}" r="${r}" fill="rgba(242,100,25,${fillAlpha})" stroke="${strokeColor}" stroke-width="1.5"/>
        <text x="${half}" y="${half + fontSize * 0.38}"
          text-anchor="middle" font-size="${fontSize}" font-family="'Noto Sans JP','Outfit',sans-serif"
          font-weight="500" fill="${textColor}">${count}</text>
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
  center?: [number, number];
  zoom?: number;
  userPosition?: [number, number] | null;
  onStoreSelect?: (store: Store) => void;
  onUserPositionChange?: (pos: { lat: number; lng: number } | null) => void;
  onMapIdle?: (bounds: MapBounds) => void;
}

export const MapView = forwardRef<MapViewHandle, MapViewProps>(function MapView(
  { stores, center, zoom, userPosition, onStoreSelect, onUserPositionChange, onMapIdle },
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

  const [status,    setStatus]  = useState<'loading' | 'ready' | 'error'>('loading');
  const [locating,  setLocating]= useState(false);
  const [userPos,   setUserPos] = useState<{ lat: number; lng: number } | null>(
    userPosition ? { lat: userPosition[0], lng: userPosition[1] } : null
  );
  const [visibleBounds, setVisibleBounds] = useState<{ north: number; south: number; east: number; west: number } | null>(null);

  const mapCenter = center ? { lat: center[0], lng: center[1] } : TAKATSUKI_STATION;

  useEffect(() => { onStoreSelectRef.current        = onStoreSelect;        }, [onStoreSelect]);
  useEffect(() => { onUserPositionChangeRef.current = onUserPositionChange; }, [onUserPositionChange]);
  useEffect(() => { onMapIdleRef.current            = onMapIdle;            }, [onMapIdle]);

  // 外部から userPosition が渡されたときにマップをパンする
  const prevUserPositionRef = useRef<[number, number] | null | undefined>(userPosition);
  useEffect(() => {
    const prev = prevUserPositionRef.current;
    prevUserPositionRef.current = userPosition;
    if (!userPosition) return;
    // 同じ位置なら何もしない
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

  // 【重要】出品中（在庫あり）の店舗のみをマップに表示
  const listingStores = useMemo(() => {
    const seen = new Set<number | string>();
    return stores.filter(s => {
      const ok       = (s as any).status === 'approved' || !(s as any).status;
      const bagCount = s.totalBagsAvailable ?? 0;
      if (!ok || bagCount === 0 || seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });
  }, [stores]);

  // ── マップ初期化 ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;

    async function init() {
      try {
        // ⚠️ Safari iOS: geolocationはユーザー操作（ボタンタップ）の中でのみ呼び出す。
        // 初期化時に呼ぶとSafariのプライバシー制限でパーミッションダイアログが出ない場合がある。
        // 現在地取得はhandleLocate()に委ねる。
        const startCenter = mapCenter;

        await loadGoogleMapsScript();
        if (cancelled || !containerRef.current) return;

        const gMaps = (window as any).google.maps as typeof google.maps;

        const map = new gMaps.Map(containerRef.current, {
          center: startCenter,
          zoom: zoom ?? 14,
          disableDefaultUI: true,
          zoomControl: false,
          gestureHandling: 'greedy',
          styles: MAP_STYLES,
          clickableIcons: false,
          backgroundColor: '#f2f0eb',
        });

        mapRef.current = map;

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
          onMapIdleRef.current?.({
            ...b,
            centerLat: c.lat(), centerLng: c.lng(),
          });
        });

        setStatus('ready');
      } catch (e) {
        console.error('Google Maps load error:', e);
        if (!cancelled) setStatus('error');
      }
    }

    init();
    return () => { cancelled = true; };
  }, []);

  // ── 出品中マーカー（クラスタリング）────────────────────────────────────
  useEffect(() => {
    if (status !== 'ready') return;
    const map   = mapRef.current;
    const gMaps = (window as any).google?.maps as typeof google.maps | undefined;
    if (!map || !gMaps) return;

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

    const markers: google.maps.Marker[] = listingStores.map(store => {
      const marker = new gMaps.Marker({
        position: { lat: store.lat, lng: store.lng },
        icon: {
          url:        makeListingPinUrl(store.category),
          scaledSize: new gMaps.Size(52, 66),
          anchor:     new gMaps.Point(26, 59),
        },
        title:  store.name,
        zIndex: 10,
      });

      marker.addListener('click', () => {
        const pos = marker.getPosition();
        if (pos) {
          // zoom 15 に設定してから中心をピンに合わせ、下へオフセットしてピンを画面上部に表示
          map.setZoom(15);
          map.panTo(pos);
          // 下方向に200pxパンすることで、60%ボトムシート表示時もピンが上半分に映る
          setTimeout(() => { map.panBy(0, 200); }, 80);
        }
        onStoreSelectRef.current?.(store);
      });

      return marker;
    });

    storeMarkersRef.current = markers;

    clustererRef.current = new MarkerClusterer({
      map,
      markers,
      algorithm: new SuperClusterAlgorithm({
        radius:    80,
        maxZoom:   15,
        minPoints: 2,
      }),
      renderer: makeClusterRenderer(gMaps),
    });
  }, [listingStores.map(s => `${s.id}`).join(','), status]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 現在地マーカー（テラコッタ波紋）────────────────────────────────────
  useEffect(() => {
    if (status !== 'ready') return;
    const gMaps = (window as any).google?.maps as typeof google.maps | undefined;
    const map   = mapRef.current;
    if (!gMaps || !map) return;

    userMarkerRef.current?.setMap(null);
    if (userPos) {
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
  }, [userPos, status]);

  // ── GPS ── iOS Safari 対策: getCurrentPosition は必ずクリックハンドラ内で同期呼び出し
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
    // ⚠️ Safari iOS: async/await や Promise chain を挟まず、
    //    onClick から直接 getCurrentPosition を呼ぶことで
    //    権限ダイアログが確実に表示される。
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const ll = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        updateCachedCoords(ll);   // 共有キャッシュ更新 → SearchPage の距離ソートにも反映
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

  const visibleListingCount = useMemo(() => {
    if (!visibleBounds) return listingStores.length;
    const { north, south, east, west } = visibleBounds;
    return listingStores.filter(s =>
      s.lat >= south && s.lat <= north && s.lng >= west && s.lng <= east
    ).length;
  }, [listingStores, visibleBounds]);

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
          <p className="text-sm font-bold text-foreground">地図を読み込めませんでした</p>
          <p className="text-xs text-muted-foreground">Google Maps APIキーを確認してください</p>
        </div>
      )}

      {status === 'ready' && (
        <>
          {/* カスタムズームボタン */}
          <div className="absolute bottom-[140px] right-3 z-10 flex flex-col overflow-hidden rounded-2xl border border-gray-200/80"
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

          {/* GPS FAB ボタン（洗練されたフローティングボタン） */}
          <button
            onClick={handleLocate}
            aria-label={locating ? '取得中...' : userPos ? '現在地に戻る' : '現在地を表示'}
            className={`absolute bottom-24 right-3 z-10 w-11 h-11 rounded-full flex items-center justify-center active:scale-95 transition-all duration-150
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

          {/* 凡例（出品中のみ） */}
          {visibleListingCount > 0 && (
            <div className="absolute bottom-[76px] left-3 z-10 bg-white/96 backdrop-blur-sm rounded-2xl px-3 py-2 flex items-center gap-2 border border-gray-100/80"
              style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
              <div className="w-3 h-3 rounded-full shrink-0" style={{ background: 'linear-gradient(135deg,#FA9455,#D44A00)' }} />
              <span className="text-[11px] font-bold text-gray-700">おすそわけ受付中</span>
              <span className="text-[10px] font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                {visibleListingCount}店
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
});
