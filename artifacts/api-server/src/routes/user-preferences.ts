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

    // ★ オプトイン (rankingOptOut=false) する時は display_name (ニックネーム) 必須。
    //   未設定のまま参加すると "ゲスト" としてランキングに表示されてしまうので、
    //   ニックネーム未設定なら 400 を返してフロント側でモーダル誘導させる。
    if (body.rankingOptOut === false) {
      const { data: u, error: ue } = await supabaseAdmin
        .from("users")
        .select("display_name")
        .eq("id", meId)
        .maybeSingle();
      if (ue) {
        console.error("[PATCH /user/ranking-preference] users lookup error:", ue.message);
        return res.status(500).json({
          error: "internal_error",
          message: "設定の保存に失敗しました",
        });
      }
      const dn = (u as { display_name?: string | null } | null)?.display_name;
      if (!dn || dn.trim().length === 0) {
        return res.status(400).json({
          error: "display_name_required",
          message: "ランキング参加にはニックネーム (表示名) の設定が必要です",
        });
      }
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

// ── 店舗オーナー: 注文メール通知 ON/OFF ──────────────────────────────────────
//   Web Push 補完として送ってるメールを「Push 来てるからメール邪魔」と感じる
//   店舗向けの opt-out スイッチ。 OFF にすると emails.ts:sendOrderEmailToStoreOwnerById
//   が事前チェックして送信スキップする。
router.patch("/user/email-order-preference", requireAuth, async (req, res) => {
  try {
    const meId = req.authUser!.id;
    const body = (req.body ?? {}) as { notifEmailOrders?: unknown };
    if (typeof body.notifEmailOrders !== "boolean") {
      return res.status(400).json({
        error: "invalid_body",
        message: "notifEmailOrders (boolean) is required",
      });
    }

    const { error } = await supabaseAdmin
      .from("users")
      .update({ notif_email_orders: body.notifEmailOrders })
      .eq("id", meId);

    if (error) {
      console.error("[PATCH /user/email-order-preference] supabase error:", error.message);
      return res.status(500).json({ error: "internal_error", message: "設定の保存に失敗しました" });
    }

    return res.json({ notifEmailOrders: body.notifEmailOrders });
  } catch (err: any) {
    console.error("[PATCH /user/email-order-preference] error:", err?.message ?? err);
    return res.status(500).json({ error: "internal_error", message: "設定の保存に失敗しました" });
  }
});

router.get("/user/email-order-preference", requireAuth, async (req, res) => {
  try {
    const meId = req.authUser!.id;
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("notif_email_orders")
      .eq("id", meId)
      .maybeSingle();
    if (error) {
      console.error("[GET /user/email-order-preference] supabase error:", error.message);
      return res.status(500).json({ error: "internal_error", message: "設定の取得に失敗しました" });
    }
    // null (旧ユーザー) は true 扱い (デフォルト届く)
    const val = (data as { notif_email_orders?: boolean | null } | null)?.notif_email_orders;
    return res.json({ notifEmailOrders: val !== false });
  } catch (err: any) {
    console.error("[GET /user/email-order-preference] error:", err?.message ?? err);
    return res.status(500).json({ error: "internal_error", message: "設定の取得に失敗しました" });
  }
});

export default router;
