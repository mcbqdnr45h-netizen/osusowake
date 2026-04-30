/**
 * ユーザー設定 (preferences) API
 *
 * - PATCH /api/user/ranking-preference
 *     ランキングへの参加 ON/OFF を切り替える。
 *     OFF にすると /ranking/monthly の topUsers リストから除外される。
 *     自分の累計値 (foodSavedKg / co2Saved / MyTown レベル) には影響しない。
 *
 * セキュリティ: requireAuth 必須。
 */
import { Router, type IRouter } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { supabaseAdmin } from "../lib/supabase.js";

const router: IRouter = Router();

router.patch("/user/ranking-preference", requireAuth, async (req, res) => {
  try {
    const meId = req.authUser!.id;
    const body = (req.body ?? {}) as { rankingOptOut?: unknown };
    if (typeof body.rankingOptOut !== "boolean") {
      return res.status(400).json({
        error: "invalid_body",
        message: "rankingOptOut (boolean) is required",
      });
    }

    const { error } = await supabaseAdmin
      .from("users")
      .update({ ranking_opt_out: body.rankingOptOut })
      .eq("id", meId);

    if (error) {
      console.error("[PATCH /user/ranking-preference] supabase error:", error.message);
      return res
        .status(500)
        .json({ error: "internal_error", message: "設定の保存に失敗しました" });
    }

    return res.json({ rankingOptOut: body.rankingOptOut });
  } catch (err: any) {
    console.error("[PATCH /user/ranking-preference] error:", err?.message ?? err);
    return res
      .status(500)
      .json({ error: "internal_error", message: "設定の保存に失敗しました" });
  }
});

router.get("/user/ranking-preference", requireAuth, async (req, res) => {
  try {
    const meId = req.authUser!.id;
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("ranking_opt_out")
      .eq("id", meId)
      .maybeSingle();
    if (error) {
      console.error("[GET /user/ranking-preference] supabase error:", error.message);
      return res
        .status(500)
        .json({ error: "internal_error", message: "設定の取得に失敗しました" });
    }
    return res.json({
      rankingOptOut: Boolean((data as { ranking_opt_out?: boolean } | null)?.ranking_opt_out),
    });
  } catch (err: any) {
    console.error("[GET /user/ranking-preference] error:", err?.message ?? err);
    return res
      .status(500)
      .json({ error: "internal_error", message: "設定の取得に失敗しました" });
  }
});

export default router;
