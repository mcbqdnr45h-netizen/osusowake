import { useState, useEffect, useRef } from 'react';

export interface UserCoords {
  lat: number;
  lng: number;
}

let cachedCoords: UserCoords | null = null;
let fetchPromise: Promise<UserCoords | null> | null = null;

export function useUserLocation() {
  const [coords, setCoords] = useState<UserCoords | null>(cachedCoords);
  const [loading, setLoading] = useState(!cachedCoords);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    if (cachedCoords) { setCoords(cachedCoords); setLoading(false); return; }
    if (!navigator.geolocation) { setLoading(false); return; }

    if (!fetchPromise) {
      fetchPromise = new Promise<UserCoords | null>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            cachedCoords = c;
            resolve(c);
          },
          () => resolve(null),
          { timeout: 8000, maximumAge: 600_000 }
        );
      });
    }

    fetchPromise.then((c) => {
      if (!mounted.current) return;
      setCoords(c);
      setLoading(false);
    });

    return () => { mounted.current = false; };
  }, []);

  return { coords, loading };
}

export function haversineMeters(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function metersToWalkMinutes(meters: number): number {
  return Math.round(meters / 67);
}

export function formatWalkTime(minutes: number): string {
  if (minutes < 1)  return '1分未満';
  if (minutes <= 60) return `徒歩${minutes}分`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}時間${m}分` : `${h}時間`;
}
