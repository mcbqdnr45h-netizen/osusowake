import { db } from '@workspace/db';
import {
  surpriseBagsTable,
  storesTable,
  webPushSubscriptionsTable,
  apnsRegistrationsTable,
} from '@workspace/db/schema';
import { eq, gt, and, sql } from 'drizzle-orm';
import { sendPushToUsers } from './push.js';
import { supabaseAdmin } from './supabase.js';

/**
 * 毎日2回（昼前 11:30・夕方 17:30 JST）全登録ユーザーにエンゲージメント通知を送る。
 *   ※ 食事を決める直前(ランチ/ディナー前)に当てて反応率を上げる狙い。
 * - 出品中バッグが1件以上ある場合のみ送信（空振り通知防止）
 * - 重複防止: セッション内の lastSentSlot で管理（サーバー再起動時はリセット）
 */

// JST = UTC+9
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

// 送信スロット定義
const SLOTS: { hour: number; minute: number; key: string; makeMessage: (count: number) => { title: string; body: string } }[] = [
  {
    hour: 11, minute: 30, key: 'morning',
    makeMessage: (count) => ({
      title: '🍱 今日のランチ、おすそわけがお得です',
      body:  `${count}件のバッグが出品中。今日のランチや夕食をお得に！`,
    }),
  },
  {
    hour: 17, minute: 30, key: 'evening',
    makeMessage: (count) => ({
      title: '🌙 夕方のおすそわけ、まだ間に合います',
      body:  `${count}件のバッグが残っています。今夜の食事はおすそわけで決めよう！`,
    }),
  },
];

// 「今日の日付(JST) + スロットキー」を記録して重複送信を防ぐ
const sentLog = new Set<string>();

/** 現在の JST 時刻を返す */
function nowJST() {
  const nowUtcMs = Date.now() + JST_OFFSET_MS;
  const d = new Date(nowUtcMs);
  return { hour: d.getUTCHours(), minute: d.getUTCMinutes(), dateStr: d.toISOString().slice(0, 10) };
}

/** 現在アクティブな出品バッグ数を返す */
async function countActiveBags(): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(surpriseBagsTable)
    .leftJoin(storesTable, eq(surpriseBagsTable.storeId, storesTable.id))
    .where(
      and(
        eq(surpriseBagsTable.isActive, true),
        gt(surpriseBagsTable.stockCount, 0),
        eq(storesTable.status, 'approved'),
      ),
    );
  return result[0]?.count ?? 0;
}

/** デイリー通知をOPT-INしているユーザーIDセットを返す（デフォルト: 全員 ON）*/
async function getOptInUserIds(): Promise<Set<string>> {
  const { data } = await supabaseAdmin
    .from('users')
    .select('id')
    .neq('notif_daily_engagement', false); // NULL または true → 通知あり
  const ids = new Set<string>();
  for (const row of data ?? []) {
    if (row.id) ids.add(row.id as string);
  }
  return ids;
}

/** プッシュ登録済み かつ opt-in のユーザーIDを重複なしで返す */
async function getAllSubscribedUserIds(): Promise<string[]> {
  const [[webRows, apnsRows], optInIds] = await Promise.all([
    Promise.all([
      db.select({ userId: webPushSubscriptionsTable.userId }).from(webPushSubscriptionsTable),
      db.select({ userId: apnsRegistrationsTable.userId }).from(apnsRegistrationsTable),
    ]),
    getOptInUserIds(),
  ]);
  const ids = new Set<string>();
  for (const r of [...webRows, ...apnsRows]) {
    if (r.userId && optInIds.has(r.userId)) ids.add(r.userId);
  }
  return [...ids];
}

/**
 * 1分ごとに呼び出す。
 * 現在時刻が送信スロットに一致 & まだ未送信なら全ユーザーへ通知を送る。
 */
export async function runDailyEngagementNotifications(): Promise<void> {
  const { hour, minute, dateStr } = nowJST();

  for (const slot of SLOTS) {
    if (slot.hour !== hour || slot.minute !== minute) continue;

    const logKey = `${dateStr}:${slot.key}`;
    if (sentLog.has(logKey)) continue; // 今日このスロットは送済み
    sentLog.add(logKey);

    try {
      const [count, userIds] = await Promise.all([countActiveBags(), getAllSubscribedUserIds()]);
      if (count === 0 || userIds.length === 0) {
        console.log(`[daily-engagement] ${slot.key}: 出品バッグ0件 or 登録者0人のためスキップ`);
        continue;
      }

      const { title, body } = slot.makeMessage(count);
      console.log(`[daily-engagement] ${slot.key}: ${userIds.length}人へ送信 (バッグ${count}件)`);
      await sendPushToUsers(userIds, { title, body, tag: `daily-${slot.key}`, url: '/' });
    } catch (err) {
      console.error(`[daily-engagement] ${slot.key} 送信エラー:`, err);
      sentLog.delete(logKey); // 失敗した場合は再試行できるようリセット
    }
  }
}
