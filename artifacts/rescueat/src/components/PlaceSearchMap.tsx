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

const OSAKA = { lat: 34.7856, lng: 135.4380 };

function extractCity(components: google.maps.GeocoderAddressComponent[]): string {
  const priority = ['locality', 'sublocality_level_1', 'administrative_area_level_2', 'administrative_area_level_1'];
  for (const t of priority) {
    const c = components.find(x => x.types.includes(t));
    if (c) return c.long_name;
  }
  return '';
}

type Status = 'loading' | 'ready' | 'error' | 'nokey';

export function PlaceSearchMap({ lat, lng, onPlace, onPinMove }: Props) {
  const mapDivRef   = useRef<HTMLDivElement>(null);
  const inputRef    = useRef<HTMLInputElement>(null);
  const mapRef      = useRef<google.maps.Map | null>(null);
  const markerRef   = useRef<google.maps.Marker | null>(null);

  const [status, setStatus] = useState<Status>('loading');
  const [pinned, setPinned]  = useState(false);
  const [manualInput, setManualInput] = useState('');

  const hasInitial = !!(lat && lng);

  useEffect(() => {
    if (!MAPS_API_KEY) {
      console.warn('[PlaceSearchMap] MAPS_API_KEY is empty → nokey state');
      setStatus('nokey');
      return;
    }

    let alive = true;
    console.log('[PlaceSearchMap] loading Google Maps script…');

    loadGoogleMapsScript()
      .then(() => {
        if (!alive) return;
        console.log('[PlaceSearchMap] script ready, google.maps available:', !!(window as any).google?.maps);

        const gm = (window as any).google.maps as typeof google.maps;
        if (!gm || !mapDivRef.current || !inputRef.current) {
          console.error('[PlaceSearchMap] refs or google.maps not available');
          setStatus('error');
          return;
        }

        const center = hasInitial ? { lat: lat!, lng: lng! } : OSAKA;
        const map = new gm.Map(mapDivRef.current, {
          center,
          zoom: hasInitial ? 16 : 12,
          disableDefaultUI: true,
          gestureHandling: 'greedy',
          clickableIcons: false,
          styles: [
            { featureType: 'poi',       stylers: [{ visibility: 'off' }] },
            { featureType: 'transit',   stylers: [{ visibility: 'simplified' }] },
            { featureType: 'road',      elementType: 'geometry',         stylers: [{ color: '#f5f5f5' }] },
            { featureType: 'road',      elementType: 'labels.text.fill', stylers: [{ color: '#aaaaaa' }] },
            { featureType: 'water',     elementType: 'geometry',         stylers: [{ color: '#c9e0e8' }] },
            { featureType: 'landscape', elementType: 'geometry',         stylers: [{ color: '#f8f8f8' }] },
          ],
        });
        mapRef.current = map;

        const pinIcon = {
          path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
          fillColor: '#FF8C00',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2.5,
          scale: 2.2,
          anchor: new gm.Point(12, 22),
        };

        function upsertMarker(pos: google.maps.LatLng | { lat: number; lng: number }) {
          if (markerRef.current) {
            markerRef.current.setPosition(pos);
          } else {
            const m = new gm.Marker({
              position: pos,
              map,
              draggable: true,
              icon: pinIcon,
              animation: gm.Animation.DROP,
            });
            m.addListener('dragend', () => {
              const p = m.getPosition();
              if (p) onPinMove?.(p.lat(), p.lng());
            });
            markerRef.current = m;
          }
          setPinned(true);
        }

        if (hasInitial) upsertMarker({ lat: lat!, lng: lng! });

        map.addListener('click', (e: google.maps.MapMouseEvent) => {
          if (!e.latLng) return;
          upsertMarker(e.latLng);
          onPinMove?.(e.latLng.lat(), e.latLng.lng());
        });

        if (gm.places?.Autocomplete) {
          console.log('[PlaceSearchMap] Places.Autocomplete available ✅');
          const ac = new gm.places.Autocomplete(inputRef.current!, {
            types: ['establishment', 'geocode'],
            componentRestrictions: { country: 'jp' },
            fields: ['formatted_address', 'geometry', 'name', 'address_components', 'formatted_phone_number', 'website'],
          });
          ac.addListener('place_changed', () => {
            const place = ac.getPlace();
            if (!place.geometry?.location) return;
            const plat = place.geometry.location.lat();
            const plng = place.geometry.location.lng();
            const city = place.address_components ? extractCity(place.address_components) : '';
            map.panTo({ lat: plat, lng: plng });
            map.setZoom(17);
            upsertMarker({ lat: plat, lng: plng });
            onPlace({
              name: place.name,
              address: place.formatted_address || '',
              city,
              lat: plat,
              lng: plng,
              phone: (place as any).formatted_phone_number,
              website: (place as any).website,
            });
          });
        } else {
          console.warn('[PlaceSearchMap] Places.Autocomplete NOT available (Places API may not be enabled)');
        }

        setStatus('ready');
      })
      .catch((err) => {
        if (!alive) return;
        console.error('[PlaceSearchMap] Maps load failed:', err);
        setStatus('error');
      });

    return () => { alive = false; };
  }, []);

  if (status === 'nokey') {
    return (
      <div className="space-y-3">
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex gap-3 text-sm">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-amber-800 mb-0.5">Google Maps APIキー未設定</div>
            <div className="text-amber-700">住所を手動で入力し、緯度経度を後から調整できます。</div>
          </div>
        </div>
        <input
          type="text"
          value={manualInput}
          onChange={e => setManualInput(e.target.value)}
          placeholder="住所を手動で入力（例: 大阪市北区梅田1-2-3）"
          className="w-full bg-white border-2 border-input rounded-xl px-4 py-3.5 font-medium text-base focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-all"
        />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* 検索ボックス */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary pointer-events-none z-10" />
        <input
          ref={inputRef}
          type="text"
          placeholder={status === 'loading' ? '地図を読み込み中...' : '店名や住所で検索（Powered by Google）'}
          className="w-full bg-white border-2 border-primary/40 rounded-xl pl-10 pr-10 py-3.5 font-medium text-base focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-all shadow-sm"
          disabled={status === 'loading'}
        />
        {status === 'loading' && (
          <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary animate-spin pointer-events-none" />
        )}
      </div>

      {/* 地図コンテナ — 常に h-56 (224px) を確保 */}
      <div
        className="relative rounded-xl border-2 border-primary/30 shadow-sm bg-secondary/30"
        style={{ width: '100%', height: 224, overflow: 'hidden' }}
      >
        {/* Google Map がマウントする div */}
        <div ref={mapDivRef} style={{ width: '100%', height: '100%' }} />

        {/* ローディングオーバーレイ */}
        {status === 'loading' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-secondary/60 gap-2 z-20">
            <div className="w-8 h-8 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-muted-foreground font-medium">地図を読み込んでいます...</p>
          </div>
        )}

        {/* エラーオーバーレイ */}
        {status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-secondary gap-2 px-6 text-center z-20">
            <MapPin className="w-8 h-8 text-muted-foreground" />
            <p className="text-sm font-bold text-foreground">地図を読み込めませんでした</p>
            <p className="text-xs text-muted-foreground">住所フィールドに直接入力してください</p>
          </div>
        )}

        {/* ヒント（ピン未設置時） */}
        {status === 'ready' && !pinned && (
          <div className="absolute inset-0 flex items-end justify-center pb-3 pointer-events-none z-10">
            <span className="bg-black/60 text-white text-xs font-bold px-3 py-1.5 rounded-full">
              🔍 上の検索ボックスでお店を検索
            </span>
          </div>
        )}

        {/* ヒント（ピン設置済み） */}
        {status === 'ready' && pinned && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs font-bold px-3 py-1.5 rounded-full pointer-events-none whitespace-nowrap z-10">
            📍 ピンをドラッグして微調整できます
          </div>
        )}
      </div>
    </div>
  );
}
