import webpush from 'web-push';
import { db } from '@workspace/db';
import { webPushSubscriptionsTable } from '@workspace/db/schema';
import { eq } from 'drizzle-orm';

const vapidPublicKey  = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject    = process.env.VAPID_SUBJECT ?? 'mailto:support@osusowakejapan.org';

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
  console.log('[push] VAPID configured ✅');
} else {
  console.warn('[push] VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY が未設定です – web push は無効');
}

export interface PushPayload {
  title: string;
  body:  string;
  icon?: string;
  tag?:  string;
  url?:  string;
  data?: Record<string, unknown>;
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

export async function sendWebPushToUsers(userIds: string[], payload: PushPayload): Promise<void> {
  if (userIds.length === 0) return;
  await Promise.allSettled(userIds.map((id) => sendWebPushToUser(id, payload)));
}
