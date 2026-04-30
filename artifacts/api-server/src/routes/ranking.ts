/**
 * 「今月のおすそわけランキング」 API
 *
 * 仕様 (ASC 提出版):
 *   - JST 当月分の picked_up 取引を user 単位で COUNT(*) → ランキング化
 *   - 月初境界: JST の毎月 1 日 00:00 (= UTC で前月末日 15:00 相当)
 *   - 集計対象列: pickedUpAt (status 遷移時刻)。 NULL のレガシー行は createdAt にフォールバック。
 *   - レスポンス:
 *       topUsers:          上位 N 件 (default 10)、 各 { userId, displayName, count, rank }
 *       myRank:            ログインユーザの { userId, displayName, count, rank } または null
 *       totalParticipants: 当月に 1 回以上おすそわけしたユーザ総数
 *       nextRankDelta:     上位ユーザに追いつくのに必要な追加回数 (1 位なら 0)
 *
 * セキュリティ: requireAuth 必須 (display_name 漏洩防止)
 *
 * パフォーマンス: 単一 SQL で集計 → supabase.users から display_name バッチ取得。
 *   現状ユーザ規模 (~52名) なら N+1 にならない単発 IN クエリで十分。
 *   将来 1万人規模になっても CTE + LEFT JOIN public.users で 1 クエリに変更可能。
 */
import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";
import { supabaseAdmin } from "../lib/supabase.js";

const router: IRouter = Router();

/**
 * JST の当月初日 00:00 を UTC instant として返す。
 * 例: JST 2026-04-30 23:00 → 戻り値は 2026-04-01 00:00 JST = 2026-03-31 15:00 UTC。
 *
 * Intl.DateTimeFormat で「現在の JST 日付」を取り出し、 ISO 文字列で +09:00 を明示して
 * Date を構築するアプローチ。 サーバが UTC で動いていても DST が無いタイムゾーンでも
 * 確実に正しい境界を返す。
 */
function startOfMonthJST(): Date {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = Object.fromEntries(
    fmt.formatToParts(now).map((p) => [p.type, p.value])
  );
  const year = parseInt(parts.year ?? "1970", 10);
  const month = parseInt(parts.month ?? "01", 10);
  // JST 月初を ISO 文字列で構築 → Date が UTC instant に変換
  const iso = `${year}-${String(month).padStart(2, "0")}-01T00:00:00+09:00`;
  return new Date(iso);
}

router.get("/ranking/monthly", requireAuth, async (req, res) => {
  try {
    const meId = req.authUser!.id;
    const limit = Math.max(1, Math.min(50, parseInt(String(req.query.limit ?? "10"), 10) || 10));
    const since = startOfMonthJST();

    // ★ 1 クエリで JST 当月分を user 単位で集計。
    //   pickedUpAt が NULL ならレガシー扱いで createdAt にフォールバック (COALESCE)。
    //   並び順: 回数 DESC → 同数なら user_id ASC で安定化 (順位ブレ防止)。
    const rows = await db.execute<{ user_id: string; cnt: string }>(sql`
      SELECT user_id, COUNT(*)::text AS cnt
      FROM reservations
      WHERE status = 'picked_up'
        AND COALESCE(picked_up_at, created_at) >= ${since}
      GROUP BY user_id
      ORDER BY COUNT(*) DESC, user_id ASC
    `);

    type AggRow = { userId: string; count: number };
    const aggregated: AggRow[] = (rows.rows as Array<{ user_id: string; cnt: string }>).map(
      (r) => ({ userId: r.user_id, count: parseInt(r.cnt, 10) })
    );

    // 順位を付与 (1-indexed)。 同数同順位ではなく単純連番 (UI のシンプルさ優先)。
    const ranked = aggregated.map((a, i) => ({ ...a, rank: i + 1 }));

    // 上位 N 件を抽出 (myRank が含まれていなくても別途下に表示)
    const topSlice = ranked.slice(0, limit);

    // 自分が当月一度もおすそわけしていなければ rank 0 (= 圏外) として count=0 を返す
    const myEntry = ranked.find((r) => r.userId === meId) ?? null;

    // display_name バッチ取得 (上位 + 自分の userId をまとめて IN 検索)
    const idsToLookup = Array.from(new Set([
      ...topSlice.map((r) => r.userId),
      ...(myEntry ? [myEntry.userId] : []),
    ]));

    const nameMap = new Map<string, string | null>();
    if (idsToLookup.length > 0) {
      const { data: users, error } = await supabaseAdmin
        .from("users")
        .select("id, display_name")
        .in("id", idsToLookup);
      if (error) {
        console.error("[ranking] users lookup error:", error.message);
      } else {
        for (const u of users ?? []) {
          nameMap.set(u.id as string, (u.display_name ?? null) as string | null);
        }
      }
    }

    function fmtName(id: string): string {
      return (nameMap.get(id) ?? "").trim() || "ゲスト";
    }

    const topUsers = topSlice.map((r) => ({
      userId: r.userId,
      displayName: fmtName(r.userId),
      count: r.count,
      rank: r.rank,
    }));

    // 「あと N 回でランクアップ」 計算
    //   - 1 位なら 0 (= ランクアップ不要)
    //   - 2 位以下なら (1 つ上の rank の人の count) - (自分の count) + 1
    //   - 圏外 (count=0) なら 末尾 (=最下位 rank の人の count) でランクインに必要な数
    let nextRankDelta = 0;
    if (myEntry) {
      if (myEntry.rank === 1) {
        nextRankDelta = 0;
      } else {
        const above = ranked[myEntry.rank - 2]; // rank N の上 = index N-2
        nextRankDelta = Math.max(1, (above.count - myEntry.count) + 1);
      }
    } else if (ranked.length > 0) {
      // 圏外: 最下位ユーザに並ぶための回数
      nextRankDelta = Math.max(1, ranked[ranked.length - 1].count);
    } else {
      // 当月誰もまだ受け取り完了していない → 1 回でも完了すれば 1 位
      nextRankDelta = 1;
    }

    res.json({
      monthStartIso: since.toISOString(),
      topUsers,
      myRank: myEntry
        ? {
            userId: meId,
            displayName: fmtName(meId),
            count: myEntry.count,
            rank: myEntry.rank,
          }
        : { userId: meId, displayName: fmtName(meId), count: 0, rank: 0 },
      totalParticipants: ranked.length,
      nextRankDelta,
    });
  } catch (err: any) {
    console.error("[GET /ranking/monthly] error:", err?.message ?? err);
    res.status(500).json({ error: "internal_error", message: "ランキング取得に失敗しました" });
  }
});

export default router;
