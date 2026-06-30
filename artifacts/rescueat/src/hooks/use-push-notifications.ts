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

// ★ アプリ起動直後(ログイン前)に1回だけ通知許可ダイアログを出す。
//   permission 取得は userId 不要なので、SignIn 画面より前のタイミングで OK。
//   グローバルフラグで二重実行を防ぐ。
let permissionRequested = false;

export function usePushNotifications() {
  const { session } = useAuth();
  const registered = useRef(false);

  // ── Phase 1: ログイン前に通知許可ダイアログを出す(初回起動時のみ)
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    if (permissionRequested) return;
    permissionRequested = true;

    (async () => {
      try {
        const current = await PushNotifications.checkPermissions();
        console.log('[push] 起動時 permission state:', current.receive);
        if (current.receive === 'prompt' || current.receive === 'prompt-with-rationale') {
          console.log('[push] ログイン前 requestPermissions 開始');
          const result = await PushNotifications.requestPermissions();
          console.log('[push] ログイン前 permission result:', result.receive);
        }
      } catch (err) {
        console.warn('[push] pre-login permission request failed:', err);
      }
    })();
  }, []);

  // ── Phase 2: ログイン後にデバイストークンをサーバに登録
  useEffect(() => {
    console.log('[push] hook fired native=', Capacitor.isNativePlatform(), 'hasSession=', !!session?.access_token);
    if (!Capacitor.isNativePlatform()) return;
    if (!session?.access_token) return;
    if (registered.current) return;

    let cleanup: (() => void) | undefined;

    (async () => {
      try {
        // 既に Phase 1 で許可済みのはずだが、未許可なら再度トライ
        const perm = await PushNotifications.checkPermissions();
        if (perm.receive !== 'granted') {
          console.log('[push] post-login: 未許可なので requestPermissions');
          const r = await PushNotifications.requestPermissions();
          if (r.receive !== 'granted') {
            console.warn('[push] permission not granted:', r.receive, '— iOS設定 > 通知 > おすそわけ を確認');
            return;
          }
        }

        // ★ race condition 修正: register() より先に listener を登録する。
        //   register() が即座に registration イベントを発火するケースがあり、
        //   後付けだとトークン取得を取りこぼす (実機ログで permission granted の後
        //   APNs device token received が一切出ない原因)。
        const regListener = await PushNotifications.addListener(
          'registration',
          async (token) => {
            const platform = Capacitor.getPlatform(); // 'ios' | 'android' | 'web'
            console.log(`[push] ${platform === 'android' ? 'FCM' : 'APNs'} device token received:`, token.value.slice(0, 10) + '...', 'POST先=', `${BASE}/api/push/device-token`);
            try {
              const res = await authedFetch(`${BASE}/api/push/device-token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deviceToken: token.value, platform }),
              });
              if (res.ok) {
                registered.current = true;
                console.log('[push] device token registered OK');
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
              // wouter はパスベースのルーティング。 location.hash を変えても遷移しない。
              //   pushState + popstate で実際に画面遷移させる（iOS push タップのディープリンク復活）。
              window.history.pushState(null, '', url);
              window.dispatchEvent(new PopStateEvent('popstate'));
            }
          },
        );

        console.log('[push] PushNotifications.register() 呼び出し');
        await PushNotifications.register();

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
