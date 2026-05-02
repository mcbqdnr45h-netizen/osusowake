import { db } from '@workspace/db';
import { reservationsTable, surpriseBagsTable, storesTable, notificationsTable } from '@workspace/db/schema';
import { eq, and, or, sql } from 'drizzle-orm';
import { sendPushToUser } from './push.js';

/**
 * 受取時間の1時間前に確定済み予約のユーザーへリマインダーを送る。
 * 5分ごとに呼び出すことを想定（index.ts の setInterval で実行）。
 */
export async function sendPickupReminders(): Promise<void> {
  const now      = new Date();
  const nowMins  = now.getHours() * 60 + now.getMinutes();
  // 60分後のHH:MM（1440分で折り返し）
  const targetMins = (nowMins + 60) % (24 * 60);

  try {
    const rows = await db
      .select({
        reservationId: reservationsTable.id,
        userId:        reservationsTable.userId,
        bagId:         reservationsTable.bagId,
        bagTitle:      surpriseBagsTable.title,
        storeName:     storesTable.name,
        pickupStart:   surpriseBagsTable.pickupStart,
      })
      .from(reservationsTable)
      .leftJoin(surpriseBagsTable, eq(reservationsTable.bagId,   surpriseBagsTable.id))
      .leftJoin(storesTable,       eq(reservationsTable.storeId, storesTable.id))
      .where(
        and(
          eq(reservationsTable.status,        'confirmed'),
          eq(reservationsTable.paymentStatus, 'paid'),
        ),
      );

    for (const row of rows) {
      if (!row.pickupStart || !row.userId) continue;

      const [sh, sm] = row.pickupStart.split(':').map(Number);
      const pickupMins = sh * 60 + sm;

      // targetMins と pickupMins の差が ±5分以内かチェック（60分前ウィンドウ）
      const diff = ((pickupMins - targetMins + 24 * 60) % (24 * 60));
      if (diff > 5) continue;

      // 同一予約にすでにリマインダーを送っていたらスキップ（重複防止）
      const [existing] = await db
        .select({ id: notificationsTable.id })
        .from(notificationsTable)
        .where(
          and(
            eq(notificationsTable.userId, row.userId),
            eq(notificationsTable.type,   'pickup_reminder'),
            // ★ 末尾に `[bag:ID]` トークンを付与するようにしたため、 末尾固定の
            //   `'%#106'` では重複検出が漏れて再送される。 両端ワイルドカード + 単語境界に
            //   なる文字 (空白 or 文字列終端) で挟むことで誤ヒット (#1060 等) も防ぐ。
            or(
              sql`body LIKE ${'%#' + row.reservationId}`,
              sql`body LIKE ${'%#' + row.reservationId + ' %'}`,
            ),
          ),
        )
        .limit(1);

      if (existing) continue;

      const title = '⏰ まもなく受取時間です';
      const body  = `${row.storeName ?? '店舗'}「${row.bagTitle ?? 'おすそわけ袋'}」の受取まであと1時間です`;

      // アプリ内通知（末尾に reservationId を埋め込んで重複チェックに使う）
      // ★ さらに [bag:ID] トークンを末尾に付与し、 フロントの「詳細を見る」 で
      //   bag detail に直接遷移できるようにする (NotificationsBell.tsx で抽出/除去)
      const bagToken = row.bagId ? ` [bag:${row.bagId}]` : '';
      await db.insert(notificationsTable).values({
        userId: row.userId,
        type:   'pickup_reminder',
        title,
        body:   `${body} #${row.reservationId}${bagToken}`,
      });

      // Web Push (本文にはトークンを入れない: アプリ外通知の見栄えを汚さないため。
      //  画面内ベルからの遷移用トークンは DB 通知本文側のみに付与済)
      await sendPushToUser(row.userId, {
        title,
        body,
        tag:  `pickup-reminder-${row.reservationId}`,
        url:  row.bagId ? `/bags/${row.bagId}` : '/my-reservations',
        data: { reservationId: row.reservationId, bagId: row.bagId ?? null },
      });

      console.log(`[pickup-reminder] sent: user=${row.userId} reservation=${row.reservationId}`);
    }
  } catch (err) {
    console.error('[pickup-reminder] error:', err);
  }
}
