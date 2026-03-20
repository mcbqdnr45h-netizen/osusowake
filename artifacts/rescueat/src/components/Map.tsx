import React, { useEffect, useRef, useState } from 'react';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { Store } from '@workspace/api-client-react';
import { getCategoryIcon } from '@/lib/category-utils';
import { LocateFixed, AlertTriangle } from 'lucide-react';

const OSAKA_CENTER = { lat: 34.7856, lng: 135.4380 };
const API_KEY = (import.meta.env.VITE_MAPS_API_KEY as string) || '';
const MAPS_SCRIPT_ID = 'rescueat-google-maps';

// ── スクリプトタグを直接挿入してAPIキーをURLに埋め込む ──
function loadGoogleMapsScript(apiKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // すでに読み込み済み
    if ((window as any).google?.maps?.Map) { resolve(); return; }

    // スクリプトタグがすでにある場合はロード完了を待つ
    if (document.getElementById(MAPS_SCRIPT_ID)) {
      const t = setInterval(() => {
        if ((window as any).google?.maps?.Map) { clearInterval(t); resolve(); }
      }, 80);
      setTimeout(() => { clearInterval(t); reject(new Error('timeout')); }, 15000);
      return;
    }

    // スクリプトタグを生成してAPIキーをURLに直接埋め込む
    const script = document.createElement('script');
    script.id = MAPS_SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=maps,places&v=weekly&language=ja&region=JP`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = (e) => reject(new Error(`Maps script load failed: ${e}`));
    document.head.appendChild(script);
  });
}

const MAP_STYLES: google.maps.MapTypeStyle[] = [
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'simplified' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#aaaaaa' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9e0e8' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#f8f8f8' }] },
  { featureType: 'administrative', elementType: 'labels.text.fill', stylers: [{ color: '#888888' }] },
];

function makeStoreIconUrl(category: string, isPending: boolean): string {
  const emoji = getCategoryIcon(category);
  const bg = isPending ? '#F59E0B' : '#2D5A51';
  const border = isPending ? '#D97706' : '#1E3F38';
  const warn = isPending
    ? `<circle cx="30" cy="9" r="8" fill="#EF4444" stroke="white" stroke-width="1.5"/>
       <text x="30" y="13.5" text-anchor="middle" font-size="9" font-family="sans-serif" fill="white" font-weight="bold">!</text>`
    : '';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="48" viewBox="0 0 40 48">
    <ellipse cx="20" cy="45" rx="7" ry="2.5" fill="rgba(0,0,0,0.18)"/>
    <circle cx="20" cy="20" r="18" fill="${bg}" stroke="${border}" stroke-width="2.5"/>
    <text x="20" y="26" text-anchor="middle" font-size="17" font-family="serif">${emoji}</text>
    ${warn}
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function makePlaceIconUrl(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="32" viewBox="0 0 26 32">
    <ellipse cx="13" cy="29" rx="5" ry="2" fill="rgba(0,0,0,0.1)"/>
    <circle cx="13" cy="13" r="11" fill="#E8F4F2" stroke="#9CC4BC" stroke-width="2"/>
    <text x="13" y="18" text-anchor="middle" font-size="12" font-family="serif">🍽</text>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
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
}

export function MapView({ stores, center, zoom, userPosition }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const userMarkerRef = useRef<google.maps.Marker | null>(null);
  const placeMarkersRef = useRef<google.maps.Marker[]>([]);
  const storeMarkersRef = useRef<google.maps.Marker[]>([]);
  const storesPropRef = useRef<Store[]>(stores);

  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [locating, setLocating] = useState(false);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(
    userPosition ? { lat: userPosition[0], lng: userPosition[1] } : null
  );

  const mapCenter = center ? { lat: center[0], lng: center[1] } : OSAKA_CENTER;

  useEffect(() => { storesPropRef.current = stores; }, [stores]);

  // ── Initialize Google Maps ──
  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;

    async function init() {
      try {
        // まず現在地を取得してからマップを初期化
        const startCenter: { lat: number; lng: number } = await new Promise((resolve) => {
          if (!navigator.geolocation) { resolve(mapCenter); return; }
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const latlng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
              if (!cancelled) setUserPos(latlng);
              resolve(latlng);
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

        const infoWindow = new gMaps.InfoWindow();
        mapRef.current = map;
        infoWindowRef.current = infoWindow;
        clustererRef.current = new MarkerClusterer({ map });

        setStatus('ready');

        const center0 = map.getCenter();
        if (center0) fetchNearbyPlaces(map, infoWindow, center0);

        map.addListener('idle', () => {
          const c = map.getCenter();
          if (c) fetchNearbyPlaces(map, infoWindow, c);
        });

      } catch (e) {
        console.error('Google Maps load error:', e);
        if (!cancelled) setStatus('error');
      }
    }

    init();
    return () => { cancelled = true; };
  }, []);

  // ── Place registered store markers ──
  useEffect(() => {
    if (status !== 'ready') return;
    const map = mapRef.current;
    const gMaps = (window as any).google?.maps as typeof google.maps | undefined;
    if (!map || !gMaps) return;

    storeMarkersRef.current.forEach(m => m.setMap(null));
    if (clustererRef.current) clustererRef.current.clearMarkers();
    storeMarkersRef.current = [];

    const markers: google.maps.Marker[] = stores.map(store => {
      const isPending = (store as any).status === 'pending_review';

      const marker = new gMaps.Marker({
        position: { lat: store.lat, lng: store.lng },
        icon: {
          url: makeStoreIconUrl(store.category, isPending),
          scaledSize: new gMaps.Size(40, 48),
          anchor: new gMaps.Point(20, 46),
        },
        title: store.name,
        zIndex: isPending ? 10 : 5,
      });

      marker.addListener('click', () => {
        const iw = infoWindowRef.current;
        if (!iw) return;

        const pendingBanner = isPending
          ? `<div style="display:flex;align-items:center;gap:6px;background:#FEF3C7;border:1px solid #F59E0B;border-radius:8px;padding:5px 8px;margin-bottom:8px">
               <span>⚠️</span>
               <span style="font-size:11px;color:#92400E;font-weight:bold">情報を確認中です</span>
             </div>`
          : '';
        const hasBags = store.totalBagsAvailable > 0;
        iw.setContent(`
          <div style="font-family:'Noto Sans JP',sans-serif;min-width:195px;padding:6px 4px">
            ${pendingBanner}
            <strong style="font-size:14px;display:block;margin-bottom:3px;line-height:1.4">
              ${getCategoryIcon(store.category)} ${store.name}
            </strong>
            <div style="font-size:11px;color:#888;margin-bottom:8px">${store.address}</div>
            <div style="font-size:12px;font-weight:bold;color:white;background:${hasBags ? '#2D5A51' : '#999'};padding:7px 10px;border-radius:8px;text-align:center">
              ${hasBags ? `🛍 バッグ ${store.totalBagsAvailable}個あり` : '現在完売中'}
            </div>
          </div>
        `);
        iw.open(map, marker);
      });

      return marker;
    });

    storeMarkersRef.current = markers;
    clustererRef.current?.addMarkers(markers);
  }, [stores, status]);

  // ── User marker ──
  useEffect(() => {
    if (status !== 'ready') return;
    const gMaps = (window as any).google?.maps as typeof google.maps | undefined;
    const map = mapRef.current;
    if (!gMaps || !map) return;

    userMarkerRef.current?.setMap(null);
    if (userPos) {
      userMarkerRef.current = new gMaps.Marker({
        position: userPos,
        map,
        icon: { url: makeUserIconUrl(), scaledSize: new gMaps.Size(22, 22), anchor: new gMaps.Point(11, 11) },
        title: '現在地',
        zIndex: 999,
      });
    }
  }, [userPos, status]);

  // ── Nearby Places ──
  function fetchNearbyPlaces(
    map: google.maps.Map,
    infoWindow: google.maps.InfoWindow,
    center: google.maps.LatLng
  ) {
    const gMaps = (window as any).google?.maps as typeof google.maps | undefined;
    if (!gMaps?.places?.PlacesService) return;

    const service = new gMaps.places.PlacesService(map);
    service.nearbySearch(
      { location: center, radius: 1500, type: 'restaurant' },
      (results: google.maps.places.PlaceResult[] | null, statusCode: google.maps.places.PlacesServiceStatus) => {
        if (statusCode !== gMaps.places.PlacesServiceStatus.OK || !results) return;

        placeMarkersRef.current.forEach(m => m.setMap(null));
        placeMarkersRef.current = [];

        const registered = new Set(
          storesPropRef.current.map(s => `${s.lat.toFixed(4)},${s.lng.toFixed(4)}`)
        );

        placeMarkersRef.current = results
          .filter(r => r.geometry?.location)
          .filter(r => {
            const key = `${r.geometry!.location!.lat().toFixed(4)},${r.geometry!.location!.lng().toFixed(4)}`;
            return !registered.has(key);
          })
          .slice(0, 15)
          .map(r => {
            const marker = new gMaps.Marker({
              position: r.geometry!.location!,
              map,
              icon: { url: makePlaceIconUrl(), scaledSize: new gMaps.Size(26, 32), anchor: new gMaps.Point(13, 30) },
              title: r.name,
              zIndex: 1,
              opacity: 0.7,
            });
            marker.addListener('click', () => {
              infoWindow.setContent(`
                <div style="font-family:'Noto Sans JP',sans-serif;min-width:165px;padding:4px 2px">
                  <div style="background:#E8F4F2;color:#2D5A51;font-size:10px;font-weight:bold;border-radius:5px;padding:2px 7px;margin-bottom:6px;display:inline-block">Google Places</div>
                  <strong style="font-size:13px;display:block;margin-bottom:2px">🍽 ${r.name}</strong>
                  <div style="font-size:11px;color:#777">${r.vicinity ?? ''}</div>
                  <div style="font-size:10px;color:#aaa;margin-top:4px">食べロスに登録していない店舗</div>
                </div>
              `);
              infoWindow.open(map, marker);
            });
            return marker;
          });
      }
    );
  }

  // ── GPS locate ──
  function handleLocate() {
    // すでに現在地が取得済みなら即座にパン
    if (userPos) {
      mapRef.current?.panTo(userPos);
      mapRef.current?.setZoom(15);
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latlng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserPos(latlng);
        mapRef.current?.panTo(latlng);
        mapRef.current?.setZoom(15);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

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
          <p className="text-xs text-muted-foreground">Google Maps APIキーを確認してください（Maps_API_KEY）</p>
        </div>
      )}

      {status === 'ready' && (
        <>
          <button
            onClick={handleLocate}
            className={`absolute bottom-24 right-2 z-10 h-12 bg-white rounded-full shadow-lg flex items-center gap-2 px-4 border active:scale-95 transition-all
              ${userPos
                ? 'border-primary/30 hover:bg-primary/5 text-primary'
                : 'border-gray-200 hover:bg-gray-50 text-gray-600'
              }`}
          >
            {locating
              ? <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              : <LocateFixed className={`w-5 h-5 ${userPos ? 'text-primary' : 'text-gray-500'}`} />
            }
            <span className="text-sm font-bold whitespace-nowrap">
              {locating ? '取得中...' : userPos ? '現在地に戻る' : '現在地'}
            </span>
          </button>

          <div className="absolute bottom-6 left-4 z-10 bg-white/90 backdrop-blur-sm rounded-xl shadow-md px-3 py-2.5 flex flex-col gap-1.5 border border-gray-100">
            <div className="flex items-center gap-2 text-xs text-gray-700">
              <div className="w-3 h-3 rounded-full bg-[#2D5A51] shrink-0" />
              <span className="font-medium">登録店舗</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-amber-700">
              <div className="w-3 h-3 rounded-full bg-amber-400 shrink-0" />
              <span className="font-medium">確認中</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className="w-3 h-3 rounded-full bg-[#E8F4F2] border border-[#9CC4BC] shrink-0" />
              <span>Google Places</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
