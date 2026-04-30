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
    const aggregatedAll: AggRow[] = (rows.rows as Array<{ user_id: string; cnt: string }>).map(
      (r) => ({ userId: r.user_id, count: parseInt(r.cnt, 10) })
    );

    // ★ ランキング opt-out しているユーザを除外するため、 まず全集計対象 + 自分の
    //   ranking_opt_out / display_name を一括取得する (1 クエリで済ませる N+1 回避)。
    const allUserIds = Array.from(new Set([...aggregatedAll.map((a) => a.userId), meId]));
    const userMetaMap = new Map<string, { displayName: string | null; optOut: boolean }>();
    if (allUserIds.length > 0) {
      const { data: users, error } = await supabaseAdmin
        .from("users")
        .select("id, display_name, ranking_opt_out")
        .in("id", allUserIds);
      if (error) {
        // ★ fail-closed: opt-out 設定をプライバシーとして守るため、
        //   users メタ取得に失敗した場合は公開ランキングを返さず 500 を返す。
        //   (fail-open にすると opt-out 中ユーザが topUsers に漏出する恐れがある)
        console.error("[ranking] users lookup error (fail-closed):", error.message);
        res.status(500).json({
          error: "ranking_users_lookup_failed",
          message: "ランキングを取得できませんでした。 時間をおいて再度お試しください。",
        });
        return;
      } else {
        for (const u of users ?? []) {
          const row = u as {
            id: string;
            display_name?: string | null;
            ranking_opt_out?: boolean | null;
          };
          userMetaMap.set(row.id, {
            displayName: row.display_name ?? null,
            optOut: Boolean(row.ranking_opt_out),
          });
        }
      }
    }

    function fmtName(id: string): string {
      return (userMetaMap.get(id)?.displayName ?? "").trim() || "ゲスト";
    }
    function isOptOut(id: string): boolean {
      return userMetaMap.get(id)?.optOut ?? false;
    }

    const meOptOut = isOptOut(meId);

    // ★ opt-out 中のユーザは公開ランキング (topUsers) から除外。
    //   ただし totalParticipants には「実際に当月おすそわけした人数」をそのままカウント (累計値の扱いと整合)。
    const aggregated = aggregatedAll.filter((a) => !isOptOut(a.userId));

    // 順位を付与 (1-indexed)。 同数同順位ではなく単純連番 (UI のシンプルさ優先)。
    const ranked = aggregated.map((a, i) => ({ ...a, rank: i + 1 }));

    // 上位 N 件を抽出
    const topSlice = ranked.slice(0, limit);

    // 自分の rank。 opt-out 中なら -1 (sentinel: 「非表示中」)、 集計対象だが圏外なら 0、 入っていれば実 rank。
    const myAggregatedEntry = aggregatedAll.find((a) => a.userId === meId) ?? null;
    const myRanked = ranked.find((r) => r.userId === meId) ?? null;

    const topUsers = topSlice.map((r) => ({
      userId: r.userId,
      displayName: fmtName(r.userId),
      count: r.count,
      rank: r.rank,
    }));

    // 「あと N 回でランクアップ」 計算 (opt-out 中はそもそもランクされないので 0)
    let nextRankDelta = 0;
    if (meOptOut) {
      nextRankDelta = 0;
    } else if (myRanked) {
      if (myRanked.rank === 1) {
        nextRankDelta = 0;
      } else {
        const above = ranked[myRanked.rank - 2];
        nextRankDelta = Math.max(1, (above.count - myRanked.count) + 1);
      }
    } else if (ranked.length > 0) {
      nextRankDelta = Math.max(1, ranked[ranked.length - 1].count);
    } else {
      nextRankDelta = 1;
    }

    let myRankPayload;
    if (meOptOut) {
      // opt-out 中: rank = -1, count は実カウント (本人だけ自分の数値は見える)
      myRankPayload = {
        userId: meId,
        displayName: fmtName(meId),
        count: myAggregatedEntry?.count ?? 0,
        rank: -1,
      };
    } else if (myRanked) {
      myRankPayload = {
        userId: meId,
        displayName: fmtName(meId),
        count: myRanked.count,
        rank: myRanked.rank,
      };
    } else {
      myRankPayload = {
        userId: meId,
        displayName: fmtName(meId),
        count: 0,
        rank: 0,
      };
    }

    res.json({
      monthStartIso: since.toISOString(),
      topUsers,
      myRank: myRankPayload,
      totalParticipants: ranked.length,
      nextRankDelta,
      optedOut: meOptOut,
    });
  } catch (err: any) {
    console.error("[GET /ranking/monthly] error:", err?.message ?? err);
    res.status(500).json({ error: "internal_error", message: "ランキング取得に失敗しました" });
  }
});

export default router;
