import { useState, useEffect, useRef } from 'react';

export interface UserCoords {
  lat: number;
  lng: number;
}

// デフォルト位置：高槻駅（GPS 取得失敗時のフォールバック）
export const TAKATSUKI_STATION: UserCoords = { lat: 34.8456, lng: 135.6174 };

let cachedCoords: UserCoords | null = null;

/** Map の GPS ボタンなど、ユーザー操作の中から呼び出して共有キャッシュを更新する */
export function updateCachedCoords(coords: UserCoords | null) {
  cachedCoords = coords;
}

// ページ読み込み時に一度だけ GPS を試みる（非 iOS 向け）
// iOS Safari はユーザー操作なしでも permission ダイアログは出るが、
// enableHighAccuracy: false + timeout: 8000 で軽量に取得する
let autoGpsRequested = false;
function tryAutoGps(): void {
  if (autoGpsRequested || !navigator.geolocation) return;
  autoGpsRequested = true;
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const ll = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      cachedCoords = ll;
      // リスナーへ通知
      gpsListeners.forEach(fn => fn(ll));
    },
    () => { /* 拒否またはタイムアウト → 無視（フォールバックは高槻駅） */ },
    { enableHighAccuracy: false, timeout: 8000, maximumAge: 300_000 }
  );
}

type GpsListener = (coords: UserCoords) => void;
const gpsListeners = new Set<GpsListener>();

/**
 * ユーザーの現在地を返すフック。
 * - マウント時に自動で GPS を要求（初回のみ）
 * - 取得できなければ coords は null（Map 側で高槻駅フォールバックを使用）
 * - GPS ボタン等でキャッシュが更新されたら自動で再レンダリング
 */
export function useUserLocation() {
  const [coords, setCoords] = useState<UserCoords | null>(cachedCoords);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;

    // すでにキャッシュがあれば即反映
    if (cachedCoords) {
      setCoords(cachedCoords);
    } else {
      // GPS 取得完了時に setState を呼ぶリスナーを登録
      const listener: GpsListener = (ll) => {
        if (mounted.current) setCoords(ll);
      };
      gpsListeners.add(listener);
      // 自動 GPS 要求（未実行なら）
      tryAutoGps();

      return () => {
        mounted.current = false;
        gpsListeners.delete(listener);
      };
    }

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
