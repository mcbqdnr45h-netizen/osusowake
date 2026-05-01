import webpush from 'web-push';
import apn from '@parse/node-apn';
import { db } from '@workspace/db';
import { webPushSubscriptionsTable, apnsRegistrationsTable } from '@workspace/db/schema';
import { eq } from 'drizzle-orm';

const vapidPublicKey  = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject    = process.env.VAPID_SUBJECT ?? 'mailto:hello@osusowakejapan.org';

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
  console.log('[push] VAPID configured ✅');
} else {
  console.warn('[push] VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY が未設定です – web push は無効');
}

const APNS_BUNDLE_ID = 'com.yuhi.osusowake';
let apnsProvider: apn.Provider | null = null;

if (process.env.APNS_PRIVATE_KEY && process.env.APNS_KEY_ID && process.env.APNS_TEAM_ID) {
  apnsProvider = new apn.Provider({
    token: {
      key:    process.env.APNS_PRIVATE_KEY,
      keyId:  process.env.APNS_KEY_ID,
      teamId: process.env.APNS_TEAM_ID,
    },
    production: process.env.NODE_ENV === 'production',
  });
  console.log('[push] APNs configured ✅ (production:', process.env.NODE_ENV === 'production', ')');
} else {
  console.warn('[push] APNS_PRIVATE_KEY / APNS_KEY_ID / APNS_TEAM_ID が未設定 – APNs は無効');
}

export interface PushPayload {
  title: string;
  body:  string;
  icon?: string;
  tag?:  string;
  url?:  string;
  data?: Record<string, unknown>;
}

async function sendApnsPushToUser(userId: string, payload: PushPayload): Promise<void> {
  if (!apnsProvider) return;

  const regs = await db
    .select()
    .from(apnsRegistrationsTable)
    .where(eq(apnsRegistrationsTable.userId, userId));

  if (regs.length === 0) return;

  const notification = new apn.Notification();
  notification.expiry     = Math.floor(Date.now() / 1000) + 3600;
  notification.badge      = 1;
  notification.sound      = 'default';
  notification.alert      = { title: payload.title, body: payload.body };
  notification.topic      = APNS_BUNDLE_ID;
  notification.payload    = { url: payload.url ?? '/', ...(payload.data ?? {}) };
  notification.pushType   = 'alert';

  const tokens = regs.map((r) => r.deviceToken);
  const result = await apnsProvider.send(notification, tokens);

  if (result.failed.length > 0) {
    for (const fail of result.failed) {
      const reason = (fail.response as any)?.reason;
      console.warn('[push] APNs send failed:', fail.device?.slice(0, 10), reason);
      if (reason === 'BadDeviceToken' || reason === 'Unregistered') {
        await db
          .delete(apnsRegistrationsTable)
          .where(eq(apnsRegistrationsTable.deviceToken, fail.device))
          .catch(() => {});
        console.log('[push] 無効な APNs トークンを削除:', fail.device?.slice(0, 10) + '...');
      }
    }
  }
  if (result.sent.length > 0) {
    console.log(`[push] APNs 送信成功: ${result.sent.length} 件`);
  }
}

export async function sendWebPushToUser(userId: string, payload: PushPayload): Promise<void> {
  if (!vapidPublicKey || !vapidPrivateKey) return;

  const subs = await db
    .select()
    .from(webPushSubscriptionsTable)
    .where(eq(webPushSubscriptionsTable.userId, userId));

  if (subs.length === 0) return;

  const notification = JSON.stringify({
    title: payload.title,
    body:  payload.body,
    icon:  payload.icon ?? '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    tag:   payload.tag,
    data:  { url: payload.url ?? '/', ...payload.data },
  });

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          notification,
        );
      } catch (err: any) {
        if (err?.statusCode === 410 || err?.statusCode === 404) {
          await db
            .delete(webPushSubscriptionsTable)
            .where(eq(webPushSubscriptionsTable.id, sub.id))
            .catch(() => {});
          console.log(`[push] 期限切れサブスクリプションを削除: ${sub.endpoint.slice(0, 50)}...`);
        } else {
          console.warn('[push] sendNotification error:', err?.statusCode, String(err?.body ?? '').slice(0, 80));
        }
      }
    }),
  );
}

export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  await Promise.allSettled([
    sendWebPushToUser(userId, payload),
    sendApnsPushToUser(userId, payload),
  ]);
}

export async function sendWebPushToUsers(userIds: string[], payload: PushPayload): Promise<void> {
  if (userIds.length === 0) return;
  await Promise.allSettled(userIds.map((id) => sendWebPushToUser(id, payload)));
}

export async function sendPushToUsers(userIds: string[], payload: PushPayload): Promise<void> {
  if (userIds.length === 0) return;
  await Promise.allSettled(userIds.map((id) => sendPushToUser(id, payload)));
}
