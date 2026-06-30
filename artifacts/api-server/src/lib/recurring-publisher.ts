import { db } from "@workspace/db";
import {
  recurringListingsTable,
  surpriseBagsTable,
  storesTable,
  favoritesTable,
  notificationsTable,
} from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import { sendPushToUsers } from "./push.js";

/** 現在の JST 日付(YYYY-MM-DD)/時刻(HH:MM)/曜日(0=日..6=土) を返す。 */
function getJstNow(): { date: string; time: string; dow: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    weekday: "short",
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  let hour = get("hour");
  if (hour === "24") hour = "00"; // hour12:false で 24:xx が出る環境への保険
  const dowMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    time: `${hour}:${get("minute")}`,
    dow: dowMap[get("weekday")] ?? 0,
  };
}

/** "YYYY-MM-DD" に n 日加算した "YYYY-MM-DD"。 */
function addJstDay(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`;
}

/**
 * 公開時刻を迎えた定期出品テンプレを自動公開する（index.ts から1分ごとに呼ぶ）。
 *
 * 冪等性: lastPublishedDate により同一 JST 日付で2回出さない。
 *   インターバルの重複発火・プロセス再起動が起きても安全。
 * 取りこぼし防止: `now >= publishTime` で判定するため、 ちょうどの分を逃しても当日中に出る。
 */
// ★ 多重実行ガード: 1分ごとの setInterval が、 前回の処理がまだ走っている間に
//   重なって発火すると、 両方が「未公開」と読んで同じテンプレを二重公開しうる
//   （店・テンプレが増えて1回の処理が60秒を超えると顕在化）。 処理中は後発をスキップする。
let isPublishing = false;

export async function publishDueRecurringListings(): Promise<void> {
  if (isPublishing) return; // 前回の処理が継続中 → 今回はスキップ（次の分で再評価）
  isPublishing = true;
  try {
    await runPublish();
  } finally {
    isPublishing = false;
  }
}

async function runPublish(): Promise<void> {
  const { date: today, time: nowTime, dow } = getJstNow();

  let templates: (typeof recurringListingsTable.$inferSelect)[];
  try {
    templates = await db
      .select()
      .from(recurringListingsTable)
      .where(eq(recurringListingsTable.isActive, true));
  } catch (err) {
    console.error("[recurring] fetch error:", err);
    return;
  }

  for (const tpl of templates) {
    try {
      // daysOfWeek = 受け取り曜日。 前日出品なら「翌日の受け取り曜日」が対象。
      const targetPickupDow = tpl.pickupNextDay ? (dow + 1) % 7 : dow;
      if ((tpl.daysOfWeek & (1 << targetPickupDow)) === 0) continue; // 対象の受け取り曜日でない
      if (nowTime < tpl.publishTime) continue;             // まだ公開時刻前
      if (tpl.skipDate === today) continue;                // レガシー単日(公開日ベース)
      // 休みカレンダー: skip_dates は「店が閉める日＝受取日」ベース。 この publish が
      //   serve する受取日 (前日出品なら翌日 / 当日出品なら今日) が休みならスキップ。
      const targetPickupDate = tpl.pickupNextDay ? addJstDay(today, 1) : today;
      if (tpl.skipDates && tpl.skipDates.split(",").map((s) => s.trim()).includes(targetPickupDate)) continue;
      if (tpl.lastPublishedDate === today) continue;       // 本日公開済み（冪等）

      // 店舗が「承認済み」かつ「Stripeで決済受付可能」でなければ出品しない。
      //   （lastPublishedDate も更新しない＝条件が整い次第 自動で出せるようにする）
      //   ★ 手動出品(bags.ts)と同じガード。 これが無いと Stripe 無効の店で
      //     「決済できないバッグ」を自動公開してしまう（客がチェックアウトで詰む）。
      const [store] = await db
        .select({
          name: storesTable.name,
          status: storesTable.status,
          stripeAccountId: storesTable.stripeAccountId,
          stripeChargesEnabled: storesTable.stripeChargesEnabled,
          stripePayoutsEnabled: storesTable.stripePayoutsEnabled,
        })
        .from(storesTable)
        .where(eq(storesTable.id, tpl.storeId))
        .limit(1);
      // 手動出品(bags.ts)と完全に同じ4条件: approved + 口座あり + 課金可 + 入金可。
      //   stripeAccountId / stripePayoutsEnabled が欠けると、入金停止中の店でも
      //   「決済できるが店に振り込めない」バッグを自動公開してしまうため両方を要求する。
      if (
        !store ||
        store.status !== "approved" ||
        !store.stripeAccountId ||
        !store.stripeChargesEnabled ||
        !store.stripePayoutsEnabled
      )
        continue;

      // ── 出品する在庫数を決める ──────────────────────────────────────────────
      //   固定モード: 毎日テンプレの stockCount で出す（従来）。
      //   持ち越しモード: 前日のバッグの「残り在庫」を引き継いで出す（毎日リセットしない）。
      //     バッグは作成当日しか客に表示されないため、 毎日 再出品しないと期間中ずっと出せない。
      //     だが在庫は前日の残りを使う＝合計を超えない（過剰販売なし）。 残り0なら再出品しない。
      let stockToPublish = tpl.stockCount;
      let prevBagId: number | null = null;
      let isFirstPublish = true;
      if (tpl.carryOverStock) {
        const [prev] = await db
          .select({ id: surpriseBagsTable.id, stockCount: surpriseBagsTable.stockCount })
          .from(surpriseBagsTable)
          .where(eq(surpriseBagsTable.recurringListingId, tpl.id))
          .orderBy(desc(surpriseBagsTable.createdAt))
          .limit(1);
        if (prev) {
          stockToPublish = prev.stockCount; // 前日の残りを引き継ぐ（リセットしない）
          prevBagId = prev.id;
          isFirstPublish = false;
        }
        // 残り0=完売 → 再出品しない（勝手に補充しない）。 当日マークだけしてループを止める。
        if (stockToPublish <= 0) {
          await db.update(recurringListingsTable)
            .set({ lastPublishedDate: today, updatedAt: new Date() })
            .where(eq(recurringListingsTable.id, tpl.id));
          continue;
        }
      }
      if (!(stockToPublish >= 1)) continue; // 在庫0のテンプレは出さない（即完売バッグ防止）

      // ★ INSERT より先に当日公開済みマークを付け、 二重公開を構造的に防ぐ。
      //   （insert 失敗時はその日だけ公開漏れ→翌日復帰。 二重公開より影響が小さい方を選択）
      await db
        .update(recurringListingsTable)
        .set({ lastPublishedDate: today, updatedAt: new Date() })
        .where(eq(recurringListingsTable.id, tpl.id));

      const [bag] = await db
        .insert(surpriseBagsTable)
        .values({
          storeId: tpl.storeId,
          title: tpl.title,
          description: tpl.description,
          originalPrice: tpl.originalPrice,
          discountedPrice: tpl.discountedPrice,
          stockCount: stockToPublish,
          pickupStart: tpl.pickupStart,
          pickupEnd: tpl.pickupEnd,
          pickupStart2: tpl.pickupStart2,
          pickupEnd2: tpl.pickupEnd2,
          imageUrl: tpl.imageUrl,
          category: tpl.category,
          allergyInfo: tpl.allergyInfo,
          pickupNote: tpl.pickupNote,
          itemType: tpl.itemType ?? "bag",
          pickupNextDay: tpl.pickupNextDay,
          recurringListingId: tpl.id,
          isActive: true,
        })
        .returning();

      console.log(
        `[recurring] published bag=${bag?.id} store=${tpl.storeId} tpl=${tpl.id} stock=${stockToPublish} carryOver=${tpl.carryOverStock} @JST ${today} ${nowTime}`,
      );

      // 持ち越しモードの「前日の残りを引き継いだ再出品」では、 前日のバッグを出品停止して二重表示/二重計上を防ぐ。
      if (prevBagId !== null) {
        await db.update(surpriseBagsTable)
          .set({ isActive: false })
          .where(eq(surpriseBagsTable.id, prevBagId));
      }

      // お気に入りユーザーへ通知（手動出品 createBag と同じ挙動）。
      //   ★ 持ち越しモードの「毎日の引き継ぎ再出品」では通知しない（同じ商品で毎日通知＝スパム化を防ぐ）。
      //     初回出品時のみ通知する（固定モードは毎日が新規扱いなので従来どおり通知）。
      if (isFirstPublish) try {
        const fanRows = await db
          .select({ userId: favoritesTable.userId })
          .from(favoritesTable)
          .where(eq(favoritesTable.storeId, tpl.storeId));
        if (fanRows.length > 0) {
          const priceLabel = `¥${Number(tpl.discountedPrice).toLocaleString()}`;
          const notifTitle = `🛍️ ${store.name} が新しいおすそわけを出品`;
          const notifBodyClean = `「${tpl.title}」${priceLabel}〜 在庫: ${stockToPublish}個`;
          const notifBodyDb = bag?.id ? `${notifBodyClean} [bag:${bag.id}]` : notifBodyClean;
          await db.insert(notificationsTable).values(
            fanRows.map((f) => ({
              userId: f.userId,
              type: "new_bag",
              title: notifTitle,
              body: notifBodyDb,
              storeId: tpl.storeId,
            })),
          );
          await sendPushToUsers(
            fanRows.map((f) => f.userId),
            {
              title: notifTitle,
              body: notifBodyClean,
              tag: bag?.id ? `new-bag-${bag.id}` : `new-bag-${tpl.storeId}-${Date.now()}`,
              url: bag?.id ? `/bags/${bag.id}` : `/stores/${tpl.storeId}`,
            },
          );
        }
      } catch (notifErr) {
        console.error("[recurring] notification error (non-fatal):", notifErr);
      }
    } catch (err) {
      console.error(`[recurring] publish error tpl=${tpl.id}:`, err);
    }
  }
}
