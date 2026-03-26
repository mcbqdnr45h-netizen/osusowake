import { useState, useEffect, useRef } from 'react';

export interface UserCoords {
  lat: number;
  lng: number;
}

let cachedCoords: UserCoords | null = null;

/** Map の GPS ボタンなど、ユーザー操作の中から呼び出して共有キャッシュを更新する */
export function updateCachedCoords(coords: UserCoords | null) {
  cachedCoords = coords;
}

/**
 * キャッシュ済みの位置情報を返すだけのフック。
 * ⚠️ iOS Safari 対策: useEffect 内で getCurrentPosition を呼ぶと
 * ユーザーのジェスチャー外となり権限ダイアログが出ない場合があるため、
 * 自動取得は行わない。位置取得は必ずボタンクリックから行う。
 */
export function useUserLocation() {
  const [coords, setCoords] = useState<UserCoords | null>(cachedCoords);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    if (cachedCoords) setCoords(cachedCoords);
    return () => { mounted.current = false; };
  }, []);

  const refresh = () => {
    if (cachedCoords && mounted.current) setCoords(cachedCoords);
  };

  return { coords, loading: false, refresh };
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

/**
 * メートルから表示ラベルを生成する統合関数。
 * - 1分未満    → 「すぐそこ」
 * - 60分以内   → 「徒歩X分」
 * - 60分超     → km 距離表示（非現実的な徒歩時間を防止）
 */
export function formatDistanceLabel(meters: number): string {
  const minutes = metersToWalkMinutes(meters);
  if (minutes < 1)   return 'すぐそこ';
  if (minutes <= 60) return `徒歩${minutes}分`;
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}
