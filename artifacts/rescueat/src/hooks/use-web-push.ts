import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '@/contexts/AuthContext';
import { authedFetch } from '@/lib/authed-fetch';

// Web版(Android Chrome / PC / ホーム追加したiOS PWA)向けの Webプッシュ購読登録。
//   ネイティブアプリ(iOS/Android)は Capacitor の usePushNotifications が担当するので、
//   ここは !isNativePlatform() のときだけ動く。 受信SW(sw.js)と送信側(VAPID web-push)は既存。
const BASE = (((import.meta as unknown as { env?: { VITE_API_BASE?: string } }).env?.VITE_API_BASE) || '') ||
             (import.meta.env.BASE_URL?.replace(/\/$/, '') || '');

// VAPID公開鍵(base64url) → Uint8Array (pushManager.subscribe 用)
function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export function useWebPush() {
  const { session } = useAuth();
  const done = useRef(false);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) return;          // ネイティブは Capacitor push を使う
    if (!session?.user?.id) return;                     // ログイン後のみ
    if (done.current) return;
    // Web Push 非対応環境(iOS Safari の通常タブ等)は早期 return
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || typeof Notification === 'undefined') return;
    done.current = true;

    (async () => {
      try {
        // 通知許可（未決定なら1回だけプロンプト）
        let perm = Notification.permission;
        if (perm === 'default') perm = await Notification.requestPermission();
        if (perm !== 'granted') return;

        // VAPID公開鍵を取得
        const r = await fetch(`${BASE}/api/push/vapid-public-key`);
        const { key } = (await r.json()) as { key: string | null };
        if (!key) return;

        // SW がアクティブになるのを待ってから購読（既存購読があれば再利用）
        const reg = await navigator.serviceWorker.ready;
        let sub = await reg.pushManager.getSubscription();
        if (!sub) {
          sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(key) as unknown as BufferSource,
          });
        }
        const json = sub.toJSON();
        if (!json.keys?.p256dh || !json.keys?.auth) return;

        // バックエンドに登録（endpoint で upsert）
        await authedFetch(`${BASE}/api/web-push/subscribe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint: sub.endpoint,
            p256dh: json.keys.p256dh,
            auth: json.keys.auth,
          }),
        });
        console.log('[webpush] subscribed ✅');
      } catch (err) {
        console.warn('[webpush] subscribe failed:', err);
        done.current = false; // 失敗時は次回再試行できるように戻す
      }
    })();
  }, [session]);
}
