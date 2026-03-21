import React, { useEffect, useRef, useState } from 'react';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { Store } from '@workspace/api-client-react';
import { getCategoryIcon } from '@/lib/category-utils';
import { LocateFixed, AlertTriangle } from 'lucide-react';

const OSAKA_CENTER = { lat: 34.7856, lng: 135.4380 };
const API_KEY = (import.meta.env.VITE_MAPS_API_KEY as string) || '';
const MAPS_SCRIPT_ID = 'rescueat-google-maps';

function loadGoogleMapsScript(apiKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).google?.maps?.Map) { resolve(); return; }
    if (document.getElementById(MAPS_SCRIPT_ID)) {
      const t = setInterval(() => {
        if ((window as any).google?.maps?.Map) { clearInterval(t); resolve(); }
      }, 80);
      setTimeout(() => { clearInterval(t); reject(new Error('timeout')); }, 15000);
      return;
    }
    const script = document.createElement('script');
    script.id = MAPS_SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=maps&v=weekly&language=ja&region=JP`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = (e) => reject(new Error(`Maps script load failed: ${e}`));
    document.head.appendChild(script);
  });
}

const MAP_STYLES: google.maps.MapTypeStyle[] = [
  { featureType: 'poi',            stylers: [{ visibility: 'off' }] },
  { featureType: 'transit',        stylers: [{ visibility: 'simplified' }] },
  { featureType: 'road',           elementType: 'geometry',          stylers: [{ color: '#f5f5f5' }] },
  { featureType: 'road',           elementType: 'labels.text.fill',  stylers: [{ color: '#aaaaaa' }] },
  { featureType: 'water',          elementType: 'geometry',          stylers: [{ color: '#c9e0e8' }] },
  { featureType: 'landscape',      elementType: 'geometry',          stylers: [{ color: '#f8f8f8' }] },
  { featureType: 'administrative', elementType: 'labels.text.fill',  stylers: [{ color: '#888888' }] },
];

function makeStoreIconUrl(category: string, isListing: boolean, bagCount: number): string {
  const emoji = getCategoryIcon(category);

  if (isListing) {
    const badge = bagCount > 0
      ? `<rect x="22" y="2" width="20" height="15" rx="7.5" fill="#F59E0B"/>
         <text x="32" y="13.5" text-anchor="middle" font-size="9" font-family="sans-serif" fill="white" font-weight="bold">${bagCount}</text>`
      : '';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="52" viewBox="0 0 44 52">
      <defs>
        <radialGradient id="g1" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#4AAF96"/>
          <stop offset="100%" stop-color="#1E3F38"/>
        </radialGradient>
      </defs>
      <ellipse cx="22" cy="49" rx="8" ry="3" fill="rgba(0,0,0,0.2)"/>
      <circle cx="22" cy="21" r="19" fill="url(#g1)" stroke="#1E3F38" stroke-width="2.5"/>
      <text x="22" y="27.5" text-anchor="middle" font-size="19" font-family="serif">${emoji}</text>
      ${badge}
    </svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  } else {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44">
      <defs>
        <radialGradient id="g2" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#D1D5DB"/>
          <stop offset="100%" stop-color="#9CA3AF"/>
        </radialGradient>
      </defs>
      <ellipse cx="18" cy="41" rx="6" ry="2" fill="rgba(0,0,0,0.12)"/>
      <circle cx="18" cy="18" r="16" fill="url(#g2)" stroke="#6B7280" stroke-width="2"/>
      <text x="18" y="23.5" text-anchor="middle" font-size="15" font-family="serif">${emoji}</text>
    </svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }
}

function makeUserIconUrl(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22">
    <circle cx="11" cy="11" r="10" fill="rgba(59,130,246,0.25)"/>
    <circle cx="11" cy="11" r="6" fill="#3B82F6" stroke="white" stroke-width="2.5"/>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

interface MapViewProps {
  stores: Store[];
  center?: [number, number];
  zoom?: number;
  userPosition?: [number, number] | null;
  onStoreSelect?: (store: Store) => void;
  onUserPositionChange?: (pos: { lat: number; lng: number } | null) => void;
}

export function MapView({ stores, center, zoom, userPosition, onStoreSelect, onUserPositionChange }: MapViewProps) {
  const containerRef    = useRef<HTMLDivElement>(null);
  const mapRef          = useRef<google.maps.Map | null>(null);
  const clustererRef    = useRef<MarkerClusterer | null>(null);
  const userMarkerRef   = useRef<google.maps.Marker | null>(null);
  const storeMarkersRef = useRef<google.maps.Marker[]>([]);
  const onStoreSelectRef        = useRef(onStoreSelect);
  const onUserPositionChangeRef = useRef(onUserPositionChange);

  const [status,   setStatus]  = useState<'loading' | 'ready' | 'error'>('loading');
  const [locating, setLocating] = useState(false);
  const [userPos,  setUserPos] = useState<{ lat: number; lng: number } | null>(
    userPosition ? { lat: userPosition[0], lng: userPosition[1] } : null
  );

  const mapCenter = center ? { lat: center[0], lng: center[1] } : OSAKA_CENTER;

  // コールバックを常に最新に保つ
  useEffect(() => { onStoreSelectRef.current        = onStoreSelect;        }, [onStoreSelect]);
  useEffect(() => { onUserPositionChangeRef.current = onUserPositionChange; }, [onUserPositionChange]);

  // userPos が変化したら親に通知
  useEffect(() => { onUserPositionChangeRef.current?.(userPos); }, [userPos]);

  // 承認済み店舗のみ
  const approvedStores = stores.filter(s => (s as any).status === 'approved' || !(s as any).status);

  // ── マップ初期化 ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;

    async function init() {
      try {
        const startCenter: { lat: number; lng: number } = await new Promise((resolve) => {
          if (!navigator.geolocation) { resolve(mapCenter); return; }
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const ll = { lat: pos.coords.latitude, lng: pos.coords.longitude };
              if (!cancelled) setUserPos(ll);
              resolve(ll);
            },
            () => resolve(mapCenter),
            { enableHighAccuracy: true, timeout: 6000 }
          );
        });

        await loadGoogleMapsScript(API_KEY);
        if (cancelled || !containerRef.current) return;

        const gMaps = (window as any).google.maps as typeof google.maps;

        const map = new gMaps.Map(containerRef.current, {
          center: startCenter,
          zoom: zoom ?? 14,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: 'greedy',
          styles: MAP_STYLES,
          clickableIcons: false,
        });

        mapRef.current = map;
        clustererRef.current = new MarkerClusterer({ map });
        setStatus('ready');
      } catch (e) {
        console.error('Google Maps load error:', e);
        if (!cancelled) setStatus('error');
      }
    }

    init();
    return () => { cancelled = true; };
  }, []);

  // ── 登録店舗マーカー ────────────────────────────────────────────────────
  useEffect(() => {
    if (status !== 'ready') return;
    const map   = mapRef.current;
    const gMaps = (window as any).google?.maps as typeof google.maps | undefined;
    if (!map || !gMaps) return;

    storeMarkersRef.current.forEach(m => m.setMap(null));
    clustererRef.current?.clearMarkers();
    storeMarkersRef.current = [];

    const markers: google.maps.Marker[] = approvedStores.map(store => {
      const bagCount  = store.totalBagsAvailable ?? 0;
      const isListing = bagCount > 0;

      const marker = new gMaps.Marker({
        position: { lat: store.lat, lng: store.lng },
        icon: {
          url: makeStoreIconUrl(store.category, isListing, bagCount),
          scaledSize: new gMaps.Size(isListing ? 44 : 36, isListing ? 52 : 44),
          anchor:     new gMaps.Point(isListing ? 22 : 18, isListing ? 50 : 42),
        },
        title:  store.name,
        zIndex: isListing ? 10 : 3,
      });

      marker.addListener('click', () => {
        // マップを少し上にパンしてボトムシートに隠れないよう調整
        const pos = marker.getPosition();
        if (pos) {
          const projection = map.getProjection();
          if (projection) {
            const point = projection.fromLatLngToPoint(pos);
            if (point) {
              const offsetPoint = new (window as any).google.maps.Point(point.x, point.y + 0.006);
              const newLatLng = projection.fromPointToLatLng(offsetPoint);
              if (newLatLng) map.panTo(newLatLng);
            }
          }
        }
        onStoreSelectRef.current?.(store);
      });

      return marker;
    });

    storeMarkersRef.current = markers;
    clustererRef.current?.addMarkers(markers);
  }, [approvedStores.map(s => `${s.id}-${s.totalBagsAvailable}`).join(','), status]);

  // ── 現在地マーカー ────────────────────────────────────────────────────
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
        icon: { url: makeUserIconUrl(), scaledSize: new gMaps.Size(22, 22), anchor: new gMaps.Point(11, 11) },
        title:  '現在地',
        zIndex: 999,
      });
    }
  }, [userPos, status]);

  // ── GPS ──────────────────────────────────────────────────────────────
  function handleLocate() {
    if (userPos) {
      mapRef.current?.panTo(userPos);
      mapRef.current?.setZoom(15);
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const ll = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserPos(ll);
        mapRef.current?.panTo(ll);
        mapRef.current?.setZoom(15);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  const listingCount  = approvedStores.filter(s => (s.totalBagsAvailable ?? 0) > 0).length;
  const registedCount = approvedStores.filter(s => (s.totalBagsAvailable ?? 0) === 0).length;

  return (
    <div className="w-full h-full relative">
      <div ref={containerRef} className="w-full h-full" />

      {status === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-muted-foreground font-medium">地図を読み込んでいます...</p>
        </div>
      )}

      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted gap-3 px-6 text-center">
          <AlertTriangle className="w-10 h-10 text-amber-500" />
          <p className="text-sm font-bold text-foreground">地図を読み込めませんでした</p>
          <p className="text-xs text-muted-foreground">Google Maps APIキーを確認してください</p>
        </div>
      )}

      {status === 'ready' && (
        <>
          {/* GPS ボタン */}
          <button
            onClick={handleLocate}
            className={`absolute bottom-24 right-2 z-10 h-12 bg-white rounded-full shadow-lg flex items-center gap-2 px-4 border active:scale-95 transition-all
              ${userPos ? 'border-primary/30 hover:bg-primary/5 text-primary' : 'border-gray-200 hover:bg-gray-50 text-gray-600'}`}
          >
            {locating
              ? <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              : <LocateFixed className={`w-5 h-5 ${userPos ? 'text-primary' : 'text-gray-500'}`} />
            }
            <span className="text-sm font-bold whitespace-nowrap">
              {locating ? '取得中...' : userPos ? '現在地に戻る' : '現在地'}
            </span>
          </button>

          {/* 凡例 */}
          <div className="absolute bottom-[76px] left-4 z-10 bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg px-3.5 py-2.5 flex flex-col gap-2 border border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-full shrink-0" style={{ background: 'linear-gradient(135deg,#4AAF96,#1E3F38)' }} />
              <span className="text-xs font-bold text-gray-700">出品中</span>
              {listingCount > 0 && <span className="ml-auto text-[10px] font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">{listingCount}</span>}
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-full shrink-0" style={{ background: 'linear-gradient(135deg,#D1D5DB,#9CA3AF)' }} />
              <span className="text-xs font-medium text-gray-500">登録店舗</span>
              {registedCount > 0 && <span className="ml-auto text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{registedCount}</span>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
