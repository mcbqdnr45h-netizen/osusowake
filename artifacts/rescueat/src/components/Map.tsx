import React, { useEffect, useMemo, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster';
import { Store } from '@workspace/api-client-react';
import { getCategoryIcon } from '@/lib/category-utils';
import { LocateFixed, AlertTriangle, Layers } from 'lucide-react';

import { updateCachedCoords, TAKATSUKI_STATION } from '@/hooks/use-user-location';

const MAP_BUILD_TAG = 'leaflet-osm-v3';

// ── バッグ情報（ピン色判定用）────────────────────────────────────────────────
export interface BagMapInfo {
  store: { id: number };
  stockCount: number;
  pickupStart?: string | null;
  pickupEnd?: string | null;
}

function isInPickupWindow(start?: string | null, end?: string | null): boolean {
  if (!start || !end) return true;
  const now      = new Date();
  const nowMins  = now.getHours() * 60 + now.getMinutes();
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const startMins = sh * 60 + sm;
  const endMins   = eh * 60 + em;
  if (endMins >= startMins) return nowMins >= startMins && nowMins <= endMins;
  return nowMins >= startMins || nowMins <= endMins;
}

// ── タイルプロバイダ（国土地理院 - 日本語表記・日本最適化・無料・無認証）─────
const TILE_ROADMAP = {
  url: 'https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png',
  attribution: '&copy; <a href="https://maps.gsi.go.jp/development/ichiran.html">国土地理院</a>',
  maxZoom: 18,
};
const TILE_SATELLITE = {
  url: 'https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg',
  attribution: '&copy; <a href="https://maps.gsi.go.jp/development/ichiran.html">国土地理院</a>',
  maxZoom: 18,
};

function makeActivePinUrl(category: string): string {
  const emoji = getCategoryIcon(category);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="52" height="66" viewBox="0 0 52 66">
    <defs>
      <radialGradient id="g1" cx="38%" cy="28%" r="72%">
        <stop offset="0%" stop-color="#FA9455"/>
        <stop offset="100%" stop-color="#D44A00"/>
      </radialGradient>
    </defs>
    <ellipse cx="26" cy="63" rx="8" ry="3" fill="rgba(0,0,0,0.16)"/>
    <path d="M26 59 Q11 43, 7 26 A19 19 0 1 1 45 26 Q41 43, 26 59 Z"
      fill="url(#g1)" stroke="rgba(255,255,255,0.6)" stroke-width="1.5"/>
    <circle cx="26" cy="24" r="14" fill="rgba(255,255,255,0.15)"/>
    <text x="26" y="31" text-anchor="middle" font-size="18" font-family="serif">${emoji}</text>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function makeGrayPinUrl(category: string): string {
  const emoji = getCategoryIcon(category);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="56" viewBox="0 0 44 56">
    <ellipse cx="22" cy="53" rx="6" ry="2.5" fill="rgba(0,0,0,0.10)"/>
    <path d="M22 50 Q9 36, 6 22 A16 16 0 1 1 38 22 Q35 36, 22 50 Z"
      fill="#b8c0cc" stroke="rgba(255,255,255,0.5)" stroke-width="1.5"/>
    <circle cx="22" cy="20" r="12" fill="rgba(255,255,255,0.12)"/>
    <text x="22" y="26" text-anchor="middle" font-size="15" font-family="serif" opacity="0.7">${emoji}</text>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function makeUserIconUrl(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
    <circle cx="18" cy="18" r="6" fill="rgba(242,100,25,0.25)"/>
    <circle cx="18" cy="18" r="5" fill="#F26419" stroke="white" stroke-width="2.5"/>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function makeActiveIcon(category: string): L.Icon {
  return L.icon({
    iconUrl: makeActivePinUrl(category),
    iconSize: [52, 66], iconAnchor: [26, 59], popupAnchor: [0, -59],
  });
}
function makeGrayIcon(category: string): L.Icon {
  return L.icon({
    iconUrl: makeGrayPinUrl(category),
    iconSize: [44, 56], iconAnchor: [22, 50], popupAnchor: [0, -50],
  });
}
function makeUserIcon(): L.Icon {
  return L.icon({
    iconUrl: makeUserIconUrl(),
    iconSize: [36, 36], iconAnchor: [18, 18],
  });
}

function clusterIconCreate(cluster: any): L.DivIcon {
  const count = cluster.getChildCount();
  const size  = Math.min(40, Math.round(30 + Math.log2(Math.max(count, 1)) * 2.5));
  const half  = size / 2;
  const r     = half - 2.5;
  const stroke = count >= 10 ? '#D44A00' : '#F26419';
  const fillA  = count >= 10 ? 0.20 : 0.13;
  const txtCol = count >= 10 ? '#B83D00' : '#D44A00';
  const fs     = count >= 100 ? 9 : count >= 10 ? 10 : 11;
  const html = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${half}" cy="${half}" r="${r}" fill="rgba(242,100,25,${fillA})" stroke="${stroke}" stroke-width="1.5"/>
    <text x="${half}" y="${half + fs * 0.38}"
      text-anchor="middle" font-size="${fs}" font-family="sans-serif"
      font-weight="700" fill="${txtCol}">${count}</text>
  </svg>`;
  return L.divIcon({ html, className: 'rescueat-cluster', iconSize: [size, size], iconAnchor: [half, half] });
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
  bags?: BagMapInfo[];
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
  const mapRef          = useRef<L.Map | null>(null);
  const tileLayerRef    = useRef<L.TileLayer | null>(null);
  const userMarkerRef   = useRef<L.Marker | null>(null);
  const storeMarkersRef = useRef<L.Marker[]>([]);
  const clusterRef      = useRef<any | null>(null);
  const grayLayerRef    = useRef<L.LayerGroup | null>(null);
  const onStoreSelectRef        = useRef(onStoreSelect);
  const onUserPositionChangeRef = useRef(onUserPositionChange);
  const onMapIdleRef            = useRef(onMapIdle);
  const isFirstIdleRef          = useRef(true);

  const [status,   setStatus]   = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [tilesLoaded, setTilesLoaded] = useState(0);
  const [tilesError,  setTilesError]  = useState(0);
  const [locating,        setLocating]       = useState(false);
  const [mapType,         setMapType]        = useState<'roadmap' | 'satellite'>(
    () => {
      try { return (localStorage.getItem('osusowake_map_type') as any) ?? 'roadmap'; }
      catch { return 'roadmap'; }
    }
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
      try { mapRef.current.panTo([ll.lat, ll.lng]); mapRef.current.setZoom(15); } catch {}
    }
  }, [userPosition]); // eslint-disable-line react-hooks/exhaustive-deps

  useImperativeHandle(ref, () => ({
    panTo: (lat, lng, z) => {
      const map = mapRef.current; if (!map) return;
      try { map.panTo([lat, lng]); if (z !== undefined) map.setZoom(z); } catch (e) { console.warn('[Map] panTo error:', e); }
    },
    fitStores: (locations, opts) => {
      const map = mapRef.current; if (!map || locations.length === 0) return;
      const { minZoom = 12, maxZoom = 16 } = opts ?? {};
      try {
        if (locations.length === 1) {
          map.panTo([locations[0].lat, locations[0].lng]);
          map.setZoom(Math.min(16, maxZoom));
          return;
        }
        const bounds = L.latLngBounds(locations.map(loc => [loc.lat, loc.lng] as [number, number]));
        map.fitBounds(bounds, { padding: [80, 24] });
        map.once('moveend', () => {
          const z = map.getZoom();
          if (z < minZoom) map.setZoom(minZoom);
          else if (z > maxZoom) map.setZoom(maxZoom);
        });
      } catch (e) { console.warn('[Map] fitStores error:', e); }
    },
  }), []);

  useEffect(() => { onUserPositionChangeRef.current?.(userPos); }, [userPos]);

  const listingStores = useMemo(() => {
    const seenId  = new Set<number | string>();
    const seenLoc = new Set<string>();
    return stores.filter(s => {
      const ok = (s as any).status === 'approved' || !(s as any).status;
      if (!ok) return false;
      if (seenId.has(s.id)) return false;
      seenId.add(s.id);
      const locKey = `${Math.round(s.lat * 10000)}-${Math.round(s.lng * 10000)}`;
      if (seenLoc.has(locKey)) return false;
      seenLoc.add(locKey);
      return true;
    });
  }, [stores]);

  const activeListingStores = useMemo(() => {
    return listingStores.filter(s =>
      bags.some(b =>
        b.store.id === s.id &&
        b.stockCount > 0 &&
        isInPickupWindow(b.pickupStart, b.pickupEnd)
      )
    );
  }, [listingStores, bags]);

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
    if (!containerRef.current) {
      console.error('[Map] container ref is null at mount');
      setStatus('error');
      setErrorMsg('container ref null');
      return;
    }
    let cancelled = false;
    let map: L.Map | null = null;

    // コンテナのサイズが 0 の場合に備えて、マウント直後に少し待つ
    const initMap = () => {
      if (cancelled || !containerRef.current) return;

      const w = containerRef.current.offsetWidth;
      const h = containerRef.current.offsetHeight;
      console.log(`[Map] init: container=${w}x${h}, build=${MAP_BUILD_TAG}`);

      try {
        map = L.map(containerRef.current, {
          center:           [mapCenter.lat, mapCenter.lng],
          zoom:             zoom ?? 14,
          zoomControl:      false,
          attributionControl: true,
          preferCanvas:     false, // Canvas は iOS WebView で問題になる場合あり
          worldCopyJump:    true,
          tap:              true,
        });

        const tileCfg = mapType === 'satellite' ? TILE_SATELLITE : TILE_ROADMAP;
        const tile = L.tileLayer(tileCfg.url, {
          attribution: tileCfg.attribution,
          maxZoom:     tileCfg.maxZoom,
          crossOrigin: false,
        });
        tile.on('tileload',      () => setTilesLoaded(c => c + 1));
        tile.on('tileerror',     (e: any) => {
          console.warn('[Map] tile error:', e?.tile?.src);
          setTilesError(c => c + 1);
        });
        tile.addTo(map);
        tileLayerRef.current = tile;

        mapRef.current = map;

        map.on('moveend', () => {
          if (cancelled || !map) return;
          try {
            const b = map.getBounds();
            const c = map.getCenter();
            const bounds = {
              north: b.getNorth(), south: b.getSouth(),
              east:  b.getEast(),  west:  b.getWest(),
            };
            setVisibleBounds(bounds);
            if (isFirstIdleRef.current) { isFirstIdleRef.current = false; return; }
            onMapIdleRef.current?.({ ...bounds, centerLat: c.lat, centerLng: c.lng });
          } catch (e) { console.warn('[Map] moveend handler error:', e); }
        });

        // 初期 bounds
        try {
          const initBounds = map.getBounds();
          setVisibleBounds({
            north: initBounds.getNorth(), south: initBounds.getSouth(),
            east:  initBounds.getEast(),  west:  initBounds.getWest(),
          });
        } catch {}

        // コンテナサイズが変わった時に再描画
        setTimeout(() => { try { map?.invalidateSize(); } catch {} }, 100);
        setTimeout(() => { try { map?.invalidateSize(); } catch {} }, 500);

        setStatus('ready');
      } catch (e: any) {
        console.error('[Map] init error:', e);
        if (!cancelled) {
          setStatus('error');
          setErrorMsg(e?.message ?? String(e));
        }
      }
    };

    // requestAnimationFrame で次フレームに実行（コンテナサイズが確定した後）
    const raf = requestAnimationFrame(initMap);

    // ResizeObserver でコンテナサイズ変更を検知して invalidateSize
    let ro: ResizeObserver | null = null;
    try {
      ro = new ResizeObserver(() => {
        if (mapRef.current) {
          try { mapRef.current.invalidateSize(); } catch {}
        }
      });
      ro.observe(containerRef.current);
    } catch {}

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      ro?.disconnect();
      if (mapRef.current) {
        try { mapRef.current.remove(); } catch {}
        mapRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 店舗マーカー ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (status !== 'ready') return;
    const map = mapRef.current;
    if (!map) return;

    try {
      if (clusterRef.current)   { map.removeLayer(clusterRef.current);   clusterRef.current = null; }
      if (grayLayerRef.current) { map.removeLayer(grayLayerRef.current); grayLayerRef.current = null; }
      storeMarkersRef.current = [];

      if (listingStores.length === 0) return;

      const Lany = L as any;
      const cluster = Lany.markerClusterGroup
        ? Lany.markerClusterGroup({
            maxClusterRadius:    80,
            disableClusteringAtZoom: 16,
            spiderfyOnMaxZoom:   true,
            showCoverageOnHover: false,
            iconCreateFunction:  clusterIconCreate,
          })
        : L.layerGroup(); // フォールバック：プラグインがロードされていない場合
      const grayLayer = L.layerGroup();

      listingStores.forEach(store => {
        const isActive = bags.some(b =>
          b.store.id === store.id &&
          b.stockCount > 0 &&
          isInPickupWindow(b.pickupStart, b.pickupEnd)
        );
        const icon = isActive ? makeActiveIcon(store.category) : makeGrayIcon(store.category);
        const marker = L.marker([store.lat, store.lng], {
          icon, title: store.name,
          zIndexOffset: isActive ? 100 : 0,
        });
        marker.on('click', () => {
          try {
            map.setView([store.lat, store.lng], Math.max(map.getZoom(), 15), { animate: true });
            onStoreSelectRef.current?.(store);
          } catch (e) { console.warn('[Map] marker click error:', e); }
        });
        storeMarkersRef.current.push(marker);
        if (isActive) (cluster as any).addLayer(marker);
        else grayLayer.addLayer(marker);
      });

      map.addLayer(cluster as L.Layer);
      map.addLayer(grayLayer);
      clusterRef.current = cluster;
      grayLayerRef.current = grayLayer;
    } catch (e) {
      console.error('[Map] marker render error:', e);
    }
  }, [markerKey, status, listingStores]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 現在地マーカー ────────────────────────────────────────────────────────
  useEffect(() => {
    if (status !== 'ready') return;
    const map = mapRef.current; if (!map) return;
    try {
      if (userMarkerRef.current) { map.removeLayer(userMarkerRef.current); userMarkerRef.current = null; }
      if (userPos) {
        const m = L.marker([userPos.lat, userPos.lng], {
          icon: makeUserIcon(), zIndexOffset: 1000, title: '現在地',
        });
        m.addTo(map);
        userMarkerRef.current = m;
      }
    } catch (e) { console.warn('[Map] user marker error:', e); }
  }, [userPos, status]);

  // ── マップタイプ切替 ─────────────────────────────────────────────────────
  useEffect(() => {
    try { localStorage.setItem('osusowake_map_type', mapType); } catch {}
    const map = mapRef.current; if (!map || status !== 'ready') return;
    try {
      if (tileLayerRef.current) { map.removeLayer(tileLayerRef.current); tileLayerRef.current = null; }
      const tileCfg = mapType === 'satellite' ? TILE_SATELLITE : TILE_ROADMAP;
      const tile = L.tileLayer(tileCfg.url, { attribution: tileCfg.attribution, maxZoom: tileCfg.maxZoom });
      tile.on('tileload',  () => setTilesLoaded(c => c + 1));
      tile.on('tileerror', () => setTilesError(c => c + 1));
      tile.addTo(map);
      tileLayerRef.current = tile;
    } catch (e) { console.warn('[Map] tile switch error:', e); }
  }, [mapType, status]);

  // ── GPS ───────────────────────────────────────────────────────────────────
  function handleLocate() {
    if (userPos) {
      try { mapRef.current?.panTo([userPos.lat, userPos.lng]); mapRef.current?.setZoom(15); } catch {}
      return;
    }
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const ll = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        updateCachedCoords(ll);
        setUserPos(ll);
        try { mapRef.current?.panTo([ll.lat, ll.lng]); mapRef.current?.setZoom(15); } catch {}
        setLocating(false);
      },
      (err) => { console.warn('[Map] geolocation error:', err.code, err.message); setLocating(false); },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  }

  const visibleListingCount = useMemo(() => {
    if (!visibleBounds) return activeListingStores.length;
    const { north, south, east, west } = visibleBounds;
    return activeListingStores.filter(s =>
      s.lat >= south && s.lat <= north && s.lng >= west && s.lng <= east
    ).length;
  }, [activeListingStores, visibleBounds]);

  const showDebug = (
    typeof window !== 'undefined' &&
    (
      // 開発時 OR Capacitor内 OR URLに ?debug=1
      (import.meta as any).env?.DEV === true ||
      (window as any).Capacitor !== undefined ||
      new URLSearchParams(window.location.search).get('debug') === '1'
    )
  );

  return (
    <div className="w-full h-full relative" style={{ minHeight: '300px', background: '#e8e6e0' }}>
      {/* 地図コンテナ - 明示的な寸法で必ず可視 */}
      <div
        ref={containerRef}
        className="leaflet-host"
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          width: '100%',
          height: '100%',
          background: '#e8e6e0',
        }}
      />

      {/* デバッグ：常に左上に状態表示（iOSで何が起きているか目で確認） */}
      {showDebug && (
        <div style={{
          position: 'absolute', top: 6, left: 6, zIndex: 9999,
          background: 'rgba(0,0,0,0.78)', color: 'white',
          fontSize: 10, padding: '5px 8px', borderRadius: 8,
          fontFamily: 'monospace', lineHeight: 1.4,
          maxWidth: 'calc(100% - 60px)',
        }}>
          <div>MAP[{MAP_BUILD_TAG}]: {status}</div>
          <div>tiles ✓{tilesLoaded} ✗{tilesError}</div>
          <div>stores: {listingStores.length}</div>
          {errorMsg && <div style={{ color: '#fca5a5' }}>err: {errorMsg.slice(0, 80)}</div>}
        </div>
      )}

      {status === 'loading' && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 400,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: '#f2f0eb', gap: 12,
        }}>
          <div className="w-9 h-9 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
          <p style={{ fontSize: 12, color: '#888', fontWeight: 500 }}>地図を読み込んでいます...</p>
        </div>
      )}

      {status === 'error' && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 400,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: '#fff3e0', gap: 12, padding: '0 24px', textAlign: 'center',
        }}>
          <AlertTriangle style={{ width: 40, height: 40, color: '#f59e0b' }} />
          <p style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>地図を読み込めませんでした</p>
          <p style={{ fontSize: 11, color: '#666', maxWidth: 280, wordBreak: 'break-all' }}>{errorMsg || '時間をおいて再度お試しください'}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#F26419', color: 'white', border: 'none',
              padding: '10px 24px', borderRadius: 12, fontWeight: 700, fontSize: 13,
            }}
          >
            再読み込み
          </button>
        </div>
      )}

      {status === 'ready' && (
        <>
          {/* レイヤー切替ボタン */}
          <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 500 }}>
            <button
              onClick={() => setShowMapTypePick(v => !v)}
              aria-label="地図タイプを切替"
              style={{
                width: 40, height: 40, borderRadius: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: mapType === 'satellite' ? '#F26419' : 'white',
                border: `1px solid ${mapType === 'satellite' ? '#F26419' : 'rgba(0,0,0,0.1)'}`,
                color: mapType === 'satellite' ? 'white' : '#666',
                boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
              }}
            >
              <Layers style={{ width: 20, height: 20 }} strokeWidth={1.8} />
            </button>

            {showMapTypePick && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 490 }} onClick={() => setShowMapTypePick(false)} />
                <div style={{
                  position: 'absolute', top: 48, right: 0, zIndex: 500,
                  background: 'white', borderRadius: 16, padding: 8, display: 'flex', gap: 8,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.14)', minWidth: 168,
                }}>
                  <button
                    onClick={() => { setMapType('roadmap'); setShowMapTypePick(false); }}
                    style={{
                      flex: 1, padding: 6, borderRadius: 12, border: 'none',
                      background: mapType === 'roadmap' ? 'rgba(242,100,25,0.08)' : 'white',
                      color: mapType === 'roadmap' ? '#F26419' : '#666',
                      fontSize: 11, fontWeight: 700,
                    }}
                  >地図</button>
                  <button
                    onClick={() => { setMapType('satellite'); setShowMapTypePick(false); }}
                    style={{
                      flex: 1, padding: 6, borderRadius: 12, border: 'none',
                      background: mapType === 'satellite' ? 'rgba(242,100,25,0.08)' : 'white',
                      color: mapType === 'satellite' ? '#F26419' : '#666',
                      fontSize: 11, fontWeight: 700,
                    }}
                  >航空写真</button>
                </div>
              </>
            )}
          </div>

          {/* ズーム */}
          <div style={{
            position: 'absolute', bottom: 60, right: 12, zIndex: 500,
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            borderRadius: 16, border: '1px solid rgba(0,0,0,0.1)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          }}>
            <button
              onClick={() => { try { mapRef.current?.setZoom((mapRef.current.getZoom() ?? 14) + 1); } catch {} }}
              style={{ width: 36, height: 36, background: 'white', border: 'none', borderBottom: '1px solid #f0f0f0', fontSize: 18, color: '#666' }}
              aria-label="ズームイン"
            >＋</button>
            <button
              onClick={() => { try { mapRef.current?.setZoom((mapRef.current.getZoom() ?? 14) - 1); } catch {} }}
              style={{ width: 36, height: 36, background: 'white', border: 'none', fontSize: 18, color: '#666' }}
              aria-label="ズームアウト"
            >－</button>
          </div>

          {/* GPS */}
          <button
            onClick={handleLocate}
            aria-label={locating ? '取得中' : userPos ? '現在地に戻る' : '現在地を表示'}
            style={{
              position: 'absolute', bottom: 12, right: 8, zIndex: 500,
              width: 44, height: 44, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'white',
              border: `1px solid ${userPos ? 'rgba(242,100,25,0.25)' : 'rgba(0,0,0,0.1)'}`,
              boxShadow: '0 4px 12px rgba(0,0,0,0.10)',
              color: userPos ? '#F26419' : '#9ca3af',
            }}
          >
            {locating
              ? <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              : <LocateFixed style={{ width: 18, height: 18 }} strokeWidth={2.5} />
            }
          </button>

          {/* 凡例 */}
          {(visibleListingCount > 0 || listingStores.length > 0) && (
            <div style={{
              position: 'absolute', bottom: 12, left: 12, zIndex: 500,
              background: 'rgba(255,255,255,0.96)', borderRadius: 16,
              padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8,
              border: '1px solid rgba(0,0,0,0.08)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'linear-gradient(135deg,#FA9455,#D44A00)' }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#444' }}>受付中</span>
                <span style={{ fontSize: 10, fontWeight: 900, color: '#F26419', background: 'rgba(242,100,25,0.1)', padding: '2px 6px', borderRadius: 999 }}>
                  {visibleListingCount}店
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
});
