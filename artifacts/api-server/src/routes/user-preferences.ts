/**
 * ユーザー設定 (preferences) API
 *
 * - PATCH /api/user/ranking-preference
 *     ランキングへの参加 ON/OFF を切り替える。
 *
 * - PATCH /api/user/notification-preference
 *     デイリーエンゲージメント通知の受信 ON/OFF を切り替える。
 *     OFF にすると毎日の一斉プッシュ通知がその人だけスキップされる。
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

// ── デイリーエンゲージメント通知 ON/OFF ────────────────────────────────────────
router.patch("/user/notification-preference", requireAuth, async (req, res) => {
  try {
    const meId = req.authUser!.id;
    const body = (req.body ?? {}) as { notifDailyEngagement?: unknown };
    if (typeof body.notifDailyEngagement !== "boolean") {
      return res.status(400).json({
        error: "invalid_body",
        message: "notifDailyEngagement (boolean) is required",
      });
    }

    const { error } = await supabaseAdmin
      .from("users")
      .update({ notif_daily_engagement: body.notifDailyEngagement })
      .eq("id", meId);

    if (error) {
      console.error("[PATCH /user/notification-preference] supabase error:", error.message);
      return res.status(500).json({ error: "internal_error", message: "設定の保存に失敗しました" });
    }

    return res.json({ notifDailyEngagement: body.notifDailyEngagement });
  } catch (err: any) {
    console.error("[PATCH /user/notification-preference] error:", err?.message ?? err);
    return res.status(500).json({ error: "internal_error", message: "設定の保存に失敗しました" });
  }
});

router.get("/user/notification-preference", requireAuth, async (req, res) => {
  try {
    const meId = req.authUser!.id;
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("notif_daily_engagement")
      .eq("id", meId)
      .maybeSingle();
    if (error) {
      console.error("[GET /user/notification-preference] supabase error:", error.message);
      return res.status(500).json({ error: "internal_error", message: "設定の取得に失敗しました" });
    }
    // カラムが null (旧ユーザー) の場合は true (通知あり) とみなす
    const val = (data as { notif_daily_engagement?: boolean | null } | null)?.notif_daily_engagement;
    return res.json({ notifDailyEngagement: val !== false });
  } catch (err: any) {
    console.error("[GET /user/notification-preference] error:", err?.message ?? err);
    return res.status(500).json({ error: "internal_error", message: "設定の取得に失敗しました" });
  }
});

export default router;
