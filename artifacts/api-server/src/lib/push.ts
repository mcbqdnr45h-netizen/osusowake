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
let apnsProviderSandbox: apn.Provider | null = null;

function normalizeApnsKey(raw: string): string {
  const body = raw
    .replace(/\\n/g, '\n')
    .replace(/-----BEGIN[^-]*-----/g, '')
    .replace(/-----END[^-]*-----/g, '')
    .replace(/\s+/g, '');

  const chunks = body.match(/.{1,64}/g)?.join('\n') ?? body;
  return `-----BEGIN PRIVATE KEY-----\n${chunks}\n-----END PRIVATE KEY-----`;
}

if (process.env.APNS_PRIVATE_KEY && process.env.APNS_KEY_ID && process.env.APNS_TEAM_ID) {
  try {
    const apnsKey = normalizeApnsKey(process.env.APNS_PRIVATE_KEY);
    const tokenCfg = {
      key:    apnsKey,
      keyId:  process.env.APNS_KEY_ID,
      teamId: process.env.APNS_TEAM_ID,
    };
    apnsProvider        = new apn.Provider({ token: tokenCfg, production: true  });
    apnsProviderSandbox = new apn.Provider({ token: tokenCfg, production: false });
    console.log('[push] APNs configured ✅ (dual: production + sandbox, auto-fallback enabled)');
  } catch (err: any) {
    console.error('[push] APNs Provider 初期化失敗:', err?.message ?? err);
  }
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
  const uShort = userId.slice(0, 8);
  if (!apnsProvider) {
    console.warn(`[push] APNs provider 未初期化 (user ${uShort})`);
    return;
  }

  const allRegs = await db
    .select()
    .from(apnsRegistrationsTable)
    .where(eq(apnsRegistrationsTable.userId, userId));

  // ★ 防御的 dedup: 同じユーザーに複数行 (古いトークンが残ってる) がある場合、
  //   最新の updatedAt を持つ1行だけに送信する。これで同じ端末に2回届く事故を防ぐ。
  //   登録 API 側の掃除と二重防御。
  const regs = allRegs
    .slice()
    .sort((a, b) => {
      const ta = a.updatedAt ? new Date(a.updatedAt as any).getTime() : 0;
      const tb = b.updatedAt ? new Date(b.updatedAt as any).getTime() : 0;
      return tb - ta;
    })
    .slice(0, 1);

  console.log(`[push] APNs 送信開始 user=${uShort} regs=${regs.length}/${allRegs.length} title="${payload.title}"`);

  if (regs.length === 0) {
    console.warn(`[push] user ${uShort} のデバイストークンが DB に無い`);
    return;
  }

  const notification = new apn.Notification();
  notification.expiry     = Math.floor(Date.now() / 1000) + 3600;
  notification.badge      = 1;
  notification.sound      = 'default';
  notification.alert      = { title: payload.title, body: payload.body };
  notification.topic      = APNS_BUNDLE_ID;
  notification.payload    = { url: payload.url ?? '/', ...(payload.data ?? {}) };
  notification.pushType   = 'alert';
  // ★ apns-collapse-id: 同じ tag の通知は端末で1個に統合される。
  //   confirm / webhook / verify-session の3経路から同一 tag で push しても
  //   通知センターに重複表示されない。設定しないと別通知として並んでしまう。
  if (payload.tag) {
    notification.collapseId = payload.tag.slice(0, 64);
  }

  const tokens = regs.map((r) => r.deviceToken);

  async function trySend(provider: apn.Provider, label: 'prod' | 'sandbox', toks: string[]) {
    try {
      const r = await provider.send(notification, toks);
      console.log(`[push] APNs[${label}] 結果 user=${uShort} sent=${r.sent.length} failed=${r.failed.length}`);
      return r;
    } catch (err: any) {
      console.error(`[push] APNs[${label}] send 例外 user=${uShort}:`, err?.message ?? err);
      return null;
    }
  }

  const prodResult = await trySend(apnsProvider, 'prod', tokens);
  if (!prodResult) return;

  const envMismatchTokens: string[] = [];
  for (const fail of prodResult.failed) {
    const reason = (fail.response as any)?.reason;
    const status = (fail as any)?.status;
    const errStr = (fail as any)?.error ? String((fail as any).error) : '';
    console.warn(`[push] APNs[prod] 失敗 token=${fail.device?.slice(0, 10)}... status=${status} reason=${reason} err=${errStr}`);
    if (reason === 'BadEnvironmentKeyInToken' || reason === 'BadDeviceToken') {
      envMismatchTokens.push(fail.device);
    } else if (reason === 'Unregistered') {
      await db.delete(apnsRegistrationsTable).where(eq(apnsRegistrationsTable.deviceToken, fail.device)).catch(() => {});
      console.log('[push] 無効な APNs トークンを削除(Unregistered):', fail.device?.slice(0, 10) + '...');
    }
  }

  if (envMismatchTokens.length > 0 && apnsProviderSandbox) {
    console.log(`[push] sandbox フォールバック試行 user=${uShort} tokens=${envMismatchTokens.length}`);
    const sbResult = await trySend(apnsProviderSandbox, 'sandbox', envMismatchTokens);
    if (sbResult) {
      for (const fail of sbResult.failed) {
        const reason = (fail.response as any)?.reason;
        const status = (fail as any)?.status;
        console.warn(`[push] APNs[sandbox] 失敗 token=${fail.device?.slice(0, 10)}... status=${status} reason=${reason}`);
        if (reason === 'BadDeviceToken' || reason === 'Unregistered') {
          await db.delete(apnsRegistrationsTable).where(eq(apnsRegistrationsTable.deviceToken, fail.device)).catch(() => {});
          console.log('[push] 無効な APNs トークンを削除(sandbox失敗):', fail.device?.slice(0, 10) + '...');
        }
      }
      if (sbResult.sent.length > 0) {
        console.log(`[push] ✅ sandbox 送信成功: ${sbResult.sent.length} 件`);
      }
    }
  }

  if (prodResult.sent.length > 0) {
    console.log(`[push] ✅ prod 送信成功: ${prodResult.sent.length} 件`);
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

// ★ 重複送信防止 (in-memory dedup):
//   confirm / webhook / verify-session の3経路から同じ (userId, tag) で
//   sendPushToUser が呼ばれても、最初の1回だけ実際に送信する。
//   collapseId だけでは APNs の配信タイミングによっては端末で重複表示
//   される事があるため、送信側で完全に止める。TTL 10分。
const recentPushDedup = new Map<string, number>();
const PUSH_DEDUP_TTL_MS = 10 * 60 * 1000;

function shouldSkipDuplicate(userId: string, tag: string | undefined): boolean {
  if (!tag) return false;
  const key = `${userId}::${tag}`;
  const now = Date.now();
  // 期限切れエントリを掃除 (Map が肥大化しないように)
  for (const [k, ts] of recentPushDedup) {
    if (now - ts > PUSH_DEDUP_TTL_MS) recentPushDedup.delete(k);
  }
  const prev = recentPushDedup.get(key);
  if (prev && now - prev < PUSH_DEDUP_TTL_MS) {
    console.log(`[push] dedup skip user=${userId.slice(0, 8)} tag=${tag} (${Math.round((now - prev) / 1000)}s 前に送信済)`);
    return true;
  }
  recentPushDedup.set(key, now);
  return false;
}

export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  if (shouldSkipDuplicate(userId, payload.tag)) return;
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
