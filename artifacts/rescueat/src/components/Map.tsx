import React, { useEffect, useMemo, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { MarkerClusterer, SuperClusterAlgorithm } from '@googlemaps/markerclusterer';
import type { Renderer, Cluster, ClusterStats } from '@googlemaps/markerclusterer';
import { Store } from '@workspace/api-client-react';
import { getCategoryIcon } from '@/lib/category-utils';
import { LocateFixed, AlertTriangle, Layers } from 'lucide-react';

import { loadGoogleMapsScript } from '@/lib/maps-loader';
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

// ── プロ仕様・超ミニマル Silver マップスタイル ────────────────────────────
const MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry',          stylers: [{ color: '#f2f0eb' }] },
  { elementType: 'labels.text.fill',  stylers: [{ color: '#b0a898' }] },
  { elementType: 'labels.text.stroke',stylers: [{ color: '#f2f0eb' }] },
  { featureType: 'poi',     stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'road',                elementType: 'geometry',          stylers: [{ color: '#ffffff' }] },
  { featureType: 'road',                elementType: 'geometry.stroke',   stylers: [{ color: '#e8e4de' }] },
  { featureType: 'road',                elementType: 'labels.text.fill',  stylers: [{ color: '#c8c0b8' }] },
  { featureType: 'road',                elementType: 'labels.text.stroke',stylers: [{ color: '#f2f0eb' }] },
  { featureType: 'road.highway',        elementType: 'geometry',          stylers: [{ color: '#f0ebe2' }] },
  { featureType: 'road.highway',        elementType: 'geometry.stroke',   stylers: [{ color: '#ddd8cf' }] },
  { featureType: 'road.arterial',       elementType: 'labels',            stylers: [{ visibility: 'off' }] },
  { featureType: 'road.local',          elementType: 'labels',            stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry',stylers: [{ color: '#d8e4ec' }] },
  { featureType: 'water', elementType: 'labels',  stylers: [{ visibility: 'off' }] },
  { featureType: 'landscape',       elementType: 'geometry',stylers: [{ color: '#f2f0eb' }] },
  { featureType: 'landscape.natural',elementType: 'geometry',stylers: [{ color: '#e8ede0' }] },
  { featureType: 'administrative',             elementType: 'labels',            stylers: [{ visibility: 'simplified' }] },
  { featureType: 'administrative',             elementType: 'labels.text.fill',  stylers: [{ color: '#c0b8b0' }] },
  { featureType: 'administrative.locality',    elementType: 'labels.text.fill',  stylers: [{ color: '#a8a098' }] },
  { featureType: 'administrative.neighborhood',elementType: 'labels',            stylers: [{ visibility: 'off' }] },
];

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
      const maxVal = stats.clusters.markers.max;

      const ratio = Math.min(count / Math.max(maxVal, 1), 1);
      const size  = Math.round(30 + ratio * 10);
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

  const [status,          setStatus]         = useState<'loading' | 'ready' | 'error'>('loading');
  const [locating,        setLocating]       = useState(false);
  const [mapType,         setMapType]        = useState<'roadmap' | 'satellite'>(
    () => (localStorage.getItem('osusowake_map_type') as 'roadmap' | 'satellite') ?? 'roadmap'
  );
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
      const ok = (s as any).status === 'approved' || !(s as any).status;
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

  // ── アクティブ店舗（オレンジピン: 在庫あり + 受取時間内）────────────────────
  const activeListingStores = useMemo(() => {
    return listingStores.filter(s =>
      bags.some(b =>
        b.store.id === s.id &&
        b.stockCount > 0 &&
        isInPickupWindow(b.pickupStart, b.pickupEnd)
      )
    );
  }, [listingStores, bags]);

  // ── マーカーKey（ID:色 文字列）─────────────────────────────────────────────
  // 店舗リストや在庫・時間が変わったときだけマーカーを再描画
  const markerKey = useMemo(() => {
    return listingStores.map(s => {
      const isActive = bags.some(b =>
        b.store.id === s.id &&
        b.stockCount > 0 &&
        isInPickupWindow(b.pickupStart, b.pickupEnd)
      );
      return `${s.id}:${isActive ? 'orange' : 'gray'}`;
    }).join(',');
  }, [listingStores, bags]);

  // ── マップ初期化 ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;

    async function init() {
      try {
        const startCenter = mapCenter;
        await loadGoogleMapsScript();
        if (cancelled || !containerRef.current) return;

        const gMaps = (window as any).google.maps as typeof google.maps;

        const map = new gMaps.Map(containerRef.current, {
          center: startCenter,
          zoom: zoom ?? 14,
          disableDefaultUI: true,
          zoomControl: false,
          mapTypeControl: false,
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
      const isActive = bags.some(b =>
        b.store.id === store.id &&
        b.stockCount > 0 &&
        isInPickupWindow(b.pickupStart, b.pickupEnd)
      );

      const pinUrl = isActive ? makeActivePinUrl(store.category) : makeGrayPinUrl(store.category);
      const [w, h, ax, ay] = isActive ? [52, 66, 26, 59] : [44, 56, 22, 50];

      const marker = new gMaps.Marker({
        position: { lat: store.lat, lng: store.lng },
        icon: {
          url:        pinUrl,
          scaledSize: new gMaps.Size(w, h),
          anchor:     new gMaps.Point(ax, ay),
        },
        title:  store.name,
        zIndex: isActive ? 10 : 5,
        // グレーピンはクラスタに入れないためmapを直接設定
        map: isActive ? undefined : map,
      });

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
  // listingStores を直接依存に追加: stores が変化したとき markerKey が
  // 変わらなかった稀なケース（空→空など）でも確実に再描画するための防御策
  }, [markerKey, status, listingStores]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 現在地マーカー ────────────────────────────────────────────────────────
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
    // satellite では styles が無効化されるので、roadmap 復帰時のみスタイルを再適用
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
          <p className="text-sm font-bold text-foreground">地図を読み込めませんでした</p>
          <p className="text-xs text-muted-foreground">Google Maps APIキーを確認してください</p>
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
