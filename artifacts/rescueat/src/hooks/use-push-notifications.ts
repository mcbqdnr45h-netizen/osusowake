import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { useAuth } from '@/contexts/AuthContext';
import { authedFetch } from '@/lib/authed-fetch';

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, '') || '';

export function usePushNotifications() {
  const { session } = useAuth();
  const registered = useRef(false);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    if (!session?.access_token) return;
    if (registered.current) return;

    let cleanup: (() => void) | undefined;

    (async () => {
      try {
        const permResult = await PushNotifications.requestPermissions();
        if (permResult.receive !== 'granted') {
          console.log('[push] permission not granted:', permResult.receive);
          return;
        }

        await PushNotifications.register();

        const regListener = await PushNotifications.addListener(
          'registration',
          async (token) => {
            console.log('[push] APNs device token received:', token.value.slice(0, 10) + '...');
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
                console.warn('[push] device token registration failed:', res.status);
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
