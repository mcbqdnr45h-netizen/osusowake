import React, { useEffect, useRef, useState } from 'react';
import { loadGoogleMapsScript, MAPS_API_KEY } from '@/lib/maps-loader';
import { Search, MapPin, Loader2, AlertTriangle } from 'lucide-react';

export interface PlaceResult {
  name?: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  phone?: string;
  website?: string;
}

interface Props {
  lat?: number;
  lng?: number;
  onPlace: (result: PlaceResult) => void;
  onPinMove?: (lat: number, lng: number) => void;
}

const OSAKA: google.maps.LatLngLiteral = { lat: 34.7856, lng: 135.4380 };

const MAP_STYLES: google.maps.MapTypeStyle[] = [
  { featureType: 'poi',       elementType: 'labels', stylers: [{ visibility: 'on'  }] },
  { featureType: 'transit',   stylers: [{ visibility: 'simplified' }] },
  { featureType: 'road',      elementType: 'geometry',         stylers: [{ color: '#f5f5f5' }] },
  { featureType: 'road',      elementType: 'labels.text.fill', stylers: [{ color: '#aaaaaa' }] },
  { featureType: 'water',     elementType: 'geometry',         stylers: [{ color: '#c9e0e8' }] },
  { featureType: 'landscape', elementType: 'geometry',         stylers: [{ color: '#f8f8f8' }] },
];

function extractCity(components: google.maps.GeocoderAddressComponent[]): string {
  const types = [
    'locality',
    'sublocality_level_1',
    'administrative_area_level_2',
    'administrative_area_level_1',
  ];
  for (const t of types) {
    const c = components.find(x => x.types.includes(t));
    if (c) return c.long_name;
  }
  return '';
}

export function PlaceSearchMap({ lat, lng, onPlace, onPinMove }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef     = useRef<HTMLInputElement>(null);
  const mapRef       = useRef<google.maps.Map | null>(null);
  const markerRef    = useRef<google.maps.Marker | null>(null);

  const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'nokey'>('loading');
  const [pinned, setPinned] = useState(false);

  const hasInitialCoords = !!(lat && lng);

  useEffect(() => {
    if (!MAPS_API_KEY) { setStatus('nokey'); return; }
    let cancelled = false;

    loadGoogleMapsScript()
      .then(() => {
        if (cancelled || !containerRef.current || !inputRef.current) return;

        const gMaps = (window as any).google.maps as typeof google.maps;
        const center = hasInitialCoords ? { lat: lat!, lng: lng! } : OSAKA;

        const map = new gMaps.Map(containerRef.current, {
          center,
          zoom: hasInitialCoords ? 16 : 12,
          disableDefaultUI: true,
          gestureHandling: 'greedy',
          styles: MAP_STYLES,
          clickableIcons: false,
        });
        mapRef.current = map;

        function makePinIcon() {
          return {
            path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
            fillColor: '#FF8C00',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2.5,
            scale: 2.2,
            anchor: new gMaps.Point(12, 22),
          };
        }

        function placeOrMoveMarker(pos: google.maps.LatLng | google.maps.LatLngLiteral) {
          if (markerRef.current) {
            markerRef.current.setPosition(pos);
          } else {
            const m = new gMaps.Marker({
              position: pos,
              map,
              draggable: true,
              icon: makePinIcon(),
              animation: gMaps.Animation.DROP,
            });
            m.addListener('dragend', () => {
              const p = m.getPosition();
              if (p) { onPinMove?.(p.lat(), p.lng()); }
            });
            markerRef.current = m;
          }
          setPinned(true);
        }

        if (hasInitialCoords) {
          placeOrMoveMarker({ lat: lat!, lng: lng! });
        }

        map.addListener('click', (e: google.maps.MapMouseEvent) => {
          if (!e.latLng) return;
          placeOrMoveMarker(e.latLng);
          onPinMove?.(e.latLng.lat(), e.latLng.lng());
        });

        if (gMaps.places?.Autocomplete) {
          const ac = new gMaps.places.Autocomplete(inputRef.current!, {
            types: ['establishment', 'geocode'],
            componentRestrictions: { country: 'jp' },
            fields: [
              'formatted_address',
              'geometry',
              'name',
              'address_components',
              'formatted_phone_number',
              'website',
            ],
          });

          ac.addListener('place_changed', () => {
            const place = ac.getPlace();
            if (!place.geometry?.location) return;

            const plat = place.geometry.location.lat();
            const plng = place.geometry.location.lng();
            const city = place.address_components
              ? extractCity(place.address_components)
              : '';

            map.panTo({ lat: plat, lng: plng });
            map.setZoom(17);
            placeOrMoveMarker({ lat: plat, lng: plng });

            onPlace({
              name:    place.name,
              address: place.formatted_address || '',
              city,
              lat: plat,
              lng: plng,
              phone:   (place as any).formatted_phone_number,
              website: (place as any).website,
            });
          });
        }

        setStatus('ready');
      })
      .catch(() => { if (!cancelled) setStatus('error'); });

    return () => { cancelled = true; };
  }, []);

  if (status === 'nokey') {
    return (
      <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex gap-3 text-sm">
        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <div className="font-bold text-amber-800 mb-0.5">Google Maps APIキー未設定</div>
          <div className="text-amber-700">住所を手動で入力し、保存後に座標を調整してください。</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary pointer-events-none z-10" />
        <input
          ref={inputRef}
          type="text"
          placeholder="店名や住所で検索（Powered by Google）"
          className="w-full bg-white border-2 border-primary/40 rounded-xl pl-10 pr-4 py-3.5 font-medium text-base focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-all shadow-sm"
          disabled={status === 'loading'}
        />
        {status === 'loading' && (
          <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary animate-spin" />
        )}
      </div>

      <div className="relative w-full h-56 rounded-xl overflow-hidden border-2 border-primary/30 shadow-sm">
        <div ref={containerRef} className="w-full h-full" />

        {status === 'loading' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted gap-2">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-muted-foreground">地図を読み込んでいます...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted gap-2 px-6 text-center">
            <MapPin className="w-8 h-8 text-muted-foreground" />
            <p className="text-sm font-bold">地図を読み込めませんでした</p>
            <p className="text-xs text-muted-foreground">住所を手動で入力してください</p>
          </div>
        )}

        {status === 'ready' && !pinned && (
          <div className="absolute inset-0 flex items-end justify-center pb-3 pointer-events-none">
            <div className="bg-black/60 text-white text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap">
              🔍 上の検索ボックスでお店を検索してください
            </div>
          </div>
        )}

        {status === 'ready' && pinned && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs font-bold px-3 py-1.5 rounded-full pointer-events-none whitespace-nowrap">
            📍 ピンをドラッグして微調整できます
          </div>
        )}
      </div>
    </div>
  );
}
