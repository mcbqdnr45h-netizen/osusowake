import React, { useEffect, useRef, useState } from 'react';
import { Search, MapPin, Loader2, AlertTriangle } from 'lucide-react';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

function extractCityFromNominatim(addr: any): string {
  return (
    addr?.city ||
    addr?.town ||
    addr?.village ||
    addr?.suburb ||
    addr?.county ||
    addr?.state ||
    ''
  );
}

function makePinIcon(): L.DivIcon {
  return L.divIcon({
    className: 'place-pin-icon',
    html: `
      <div style="
        width: 32px; height: 32px; border-radius: 50% 50% 50% 0;
        background: #F26419; transform: rotate(-45deg);
        border: 3px solid #fff;
        box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        display: flex; align-items: center; justify-content: center;
      ">
        <div style="
          width: 10px; height: 10px; border-radius: 50%;
          background: #fff; transform: rotate(45deg);
        "></div>
      </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });
}

export function PlaceSearchMap({ lat, lng, onPlace, onPinMove }: Props) {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [pinned, setPinned] = useState<boolean>(!!(lat && lng));

  const hasInitial = !!(lat && lng);

  function ensureMarker(map: L.Map, ll: L.LatLngExpression) {
    if (markerRef.current) {
      markerRef.current.setLatLng(ll);
    } else {
      const m = L.marker(ll, { draggable: true, icon: makePinIcon() }).addTo(map);
      m.on('dragend', () => {
        const p = m.getLatLng();
        onPinMove?.(p.lat, p.lng);
      });
      markerRef.current = m;
    }
    setPinned(true);
  }

  useEffect(() => {
    if (!mapDivRef.current) return;
    const start: [number, number] = hasInitial
      ? [lat!, lng!]
      : [OSAKA.lat, OSAKA.lng];

    const map = L.map(mapDivRef.current, {
      center: start,
      zoom: hasInitial ? 16 : 11,
      zoomControl: true,
      attributionControl: true,
    });
    mapRef.current = map;

    L.tileLayer('https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png', {
      attribution:
        '<a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank">国土地理院</a>',
      maxZoom: 18,
    }).addTo(map);

    if (hasInitial) {
      ensureMarker(map, start);
    }

    map.on('click', (e: L.LeafletMouseEvent) => {
      ensureMarker(map, e.latlng);
      onPinMove?.(e.latlng.lat, e.latlng.lng);
    });

    // 表示直後はコンテナサイズが安定しないので少し遅らせて invalidateSize
    const t1 = setTimeout(() => map.invalidateSize(), 200);
    const t2 = setTimeout(() => map.invalidateSize(), 800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = async () => {
    const q = searchQuery.trim();
    if (!q) return;
    setSearching(true);
    setSearchError('');
    try {
      const url =
        'https://nominatim.openstreetmap.org/search?format=json&limit=1' +
        '&accept-language=ja&countrycodes=jp&q=' +
        encodeURIComponent(q);
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error('検索サーバーにアクセスできません');
      const arr = await res.json();
      if (!Array.isArray(arr) || arr.length === 0) {
        setSearchError('候補が見つかりませんでした');
        return;
      }
      const best = arr[0];
      const llat = parseFloat(best.lat);
      const llng = parseFloat(best.lon);

      // 構造化住所のため逆ジオコード
      let address: string = best.display_name ?? q;
      let city = '';
      try {
        const revUrl =
          'https://nominatim.openstreetmap.org/reverse?format=json&zoom=18' +
          '&accept-language=ja&lat=' +
          llat +
          '&lon=' +
          llng;
        const revRes = await fetch(revUrl, {
          headers: { Accept: 'application/json' },
        });
        if (revRes.ok) {
          const rev = await revRes.json();
          if (rev?.display_name) address = rev.display_name;
          if (rev?.address) city = extractCityFromNominatim(rev.address);
        }
      } catch (_) {
        /* ignore — fall back to forward geocode result */
      }

      const map = mapRef.current;
      if (map) {
        map.setView([llat, llng], 17);
        ensureMarker(map, [llat, llng]);
      }

      onPlace({
        name: best.name || q,
        address,
        city,
        lat: llat,
        lng: llng,
      });
    } catch (err: any) {
      console.error('[PlaceSearchMap] search error:', err);
      setSearchError(
        '検索エラー: ' + (err?.message ?? '不明なエラー') + '（手動で住所を入力してください）'
      );
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-2">
      {/* 検索ボックス */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary pointer-events-none z-10" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSearch();
            }
          }}
          placeholder="店名や住所で検索（例: 大阪市北区梅田1-2-3）"
          className="w-full bg-white border-2 border-primary/40 rounded-xl pl-10 pr-20 py-3.5 font-medium text-base focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-all shadow-sm"
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={searching || !searchQuery.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-lg disabled:opacity-50 flex items-center gap-1"
        >
          {searching ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> 検索中
            </>
          ) : (
            '検索'
          )}
        </button>
      </div>

      {/* 検索エラー */}
      {searchError && (
        <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
          <span>{searchError}</span>
        </div>
      )}

      {/* 地図コンテナ */}
      <div
        className="relative rounded-xl border-2 border-primary/30 shadow-sm bg-secondary/30"
        style={{ width: '100%', height: 224, overflow: 'hidden' }}
      >
        <div
          ref={mapDivRef}
          style={{ width: '100%', height: '100%' }}
        />
        {!pinned && (
          <div className="absolute inset-0 flex items-end justify-center pb-3 pointer-events-none z-[400]">
            <span className="bg-black/60 text-white text-xs font-bold px-3 py-1.5 rounded-full">
              🔍 検索 or 地図をタップしてピンを置く
            </span>
          </div>
        )}
        {pinned && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs font-bold px-3 py-1.5 rounded-full pointer-events-none whitespace-nowrap z-[400]">
            📍 ピンをドラッグして微調整できます
          </div>
        )}
      </div>
    </div>
  );
}
