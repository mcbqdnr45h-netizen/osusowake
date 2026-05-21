import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { useAuth } from '@/contexts/AuthContext';
import { authedFetch } from '@/lib/authed-fetch';

// ★ iOS Capacitor では VITE_API_BASE (https://osusowakejapan.org) が必須。
//   BASE_URL だけだとリモートホスト由来の URL になり OK のはずだが、
//   将来 server.url が変わったり一時的にローカル assets に切り替わった際に
//   /api/... が WKWebView 内部スキーム capacitor:// に解決され失敗する。
//   StoreDashboard などと同じ優先順で API ベースを決定する。
const BASE = (((import.meta as any).env?.VITE_API_BASE as string) || '') ||
             (import.meta.env.BASE_URL?.replace(/\/$/, '') || '');

export function usePushNotifications() {
  const { session } = useAuth();
  const registered = useRef(false);

  useEffect(() => {
    console.log('[push] hook fired native=', Capacitor.isNativePlatform(), 'hasSession=', !!session?.access_token);
    if (!Capacitor.isNativePlatform()) return;
    if (!session?.access_token) return;
    if (registered.current) return;

    let cleanup: (() => void) | undefined;

    (async () => {
      try {
        console.log('[push] requestPermissions 開始');
        const permResult = await PushNotifications.requestPermissions();
        console.log('[push] permission result:', permResult.receive);
        if (permResult.receive !== 'granted') {
          console.warn('[push] permission not granted:', permResult.receive, '— iOS設定 > 通知 > おすそわけ を確認');
          return;
        }

        console.log('[push] PushNotifications.register() 呼び出し');
        await PushNotifications.register();

        const regListener = await PushNotifications.addListener(
          'registration',
          async (token) => {
            console.log('[push] APNs device token received:', token.value.slice(0, 10) + '...', 'POST先=', `${BASE}/api/push/device-token`);
            try {
              const res = await authedFetch(`${BASE}/api/push/device-token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deviceToken: token.value }),
              });
              if (res.ok) {
                registered.current = true;
                console.log('[push] device token registered ✅');
              } else {
                const text = await res.text().catch(() => '');
                console.warn('[push] device token registration failed:', res.status, text);
              }
            } catch (err) {
              console.warn('[push] device token POST failed:', err);
            }
          },
        );

        const errListener = await PushNotifications.addListener(
          'registrationError',
          (err) => {
            console.warn('[push] registration error:', err.error);
          },
        );

        const fgListener = await PushNotifications.addListener(
          'pushNotificationReceived',
          (notification) => {
            console.log('[push] foreground notification:', notification.title);
          },
        );

        const tapListener = await PushNotifications.addListener(
          'pushNotificationActionPerformed',
          (action) => {
            const url = (action.notification.data as Record<string, string>)?.url;
            if (url && url !== '/') {
              window.location.hash = url;
            }
          },
        );

        cleanup = () => {
          regListener.remove();
          errListener.remove();
          fgListener.remove();
          tapListener.remove();
        };
      } catch (err) {
        console.warn('[push] setup failed:', err);
      }
    })();

    return () => {
      cleanup?.();
    };
  }, [session?.access_token]);
}
