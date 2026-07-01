import { sql, type SQL } from "drizzle-orm";
import { surpriseBagsTable } from "@workspace/db/schema";

/**
 * 「今まさに客に表示中(notExpired)」の純粋な可視条件。 審査用バイパス(CASE 0)は含まない。
 *
 * ★ 単一の真実: この条件を bags.ts(/api/bags) / stores.ts(マップ集計) /
 *   recurring.ts(店ダッシュボード) / daily-engagement.ts(通知件数) の全てで共有する。
 *   以前は各所にコピペされており、 stores.ts で pickupNextDay が欠落して
 *   「前日出品の店がマップで現在出品なし」になるドリフトバグを出した。 ここに一本化して再発防止。
 *
 * ★ 2部制(受取2枠)対応: 受取期限は「最後の枠の終わり」= COALESCE(pickup_end_2, pickup_end)。
 *   2枠目が無いバッグ(既存全て)は COALESCE が pickup_end を返すため、 従来と完全に同一挙動。
 *
 * 判定(JST):
 *   CASE 1: 受取時間なし・今日作成
 *   CASE 2: 通常・今日作成・最終受取時刻(END)未到達
 *   CASE 3a: 深夜またぎ(END < pickup_start)・今日作成
 *   CASE 3b: 深夜またぎ・昨日作成・今日のEND未到達
 *   CASE 4a: 翌日受け取り(pickup_next_day)・今日作成
 *   CASE 4b: 翌日受け取り・昨日作成・今日のEND未到達
 *
 * ★ 深夜またぎ判定は END(=最後の枠の終わり) 基準。 2部制で2枠目が日跨ぎ
 *   (例: 11:00-14:00, 22:00-02:00) でも END < pickup_start で正しく検出する。
 *   slot1 の pickup_end だけで判定すると2枠目の日跨ぎを取りこぼし、 同日に消えるバグになる。
 */
const END = sql`COALESCE(${surpriseBagsTable.pickupEnd2}, ${surpriseBagsTable.pickupEnd})`;
const CREATED = sql`DATE(${surpriseBagsTable.createdAt} AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo')`;
const TODAY = sql`DATE(NOW() AT TIME ZONE 'Asia/Tokyo')`;
const NOWT = sql`TO_CHAR(NOW() AT TIME ZONE 'Asia/Tokyo','HH24:MI')`;

export const bagVisibleSql: SQL = sql`(
  (${surpriseBagsTable.pickupEnd} IS NULL AND ${CREATED} = ${TODAY})
  OR (${surpriseBagsTable.pickupEnd} IS NOT NULL AND ${END} >= ${surpriseBagsTable.pickupStart} AND ${CREATED} = ${TODAY} AND ${END} >= ${NOWT})
  OR (${surpriseBagsTable.pickupEnd} IS NOT NULL AND ${END} < ${surpriseBagsTable.pickupStart} AND ${CREATED} = ${TODAY})
  OR (${surpriseBagsTable.pickupEnd} IS NOT NULL AND ${END} < ${surpriseBagsTable.pickupStart} AND ${CREATED} = ${TODAY} - INTERVAL '1 day' AND ${END} >= ${NOWT})
  OR (${surpriseBagsTable.pickupNextDay} = true AND ${CREATED} = ${TODAY})
  OR (${surpriseBagsTable.pickupNextDay} = true AND ${CREATED} = ${TODAY} - INTERVAL '1 day' AND (${surpriseBagsTable.pickupEnd} IS NULL OR ${END} >= ${NOWT}))
)`;
