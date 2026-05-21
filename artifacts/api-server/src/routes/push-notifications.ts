/**
 * APNs デバイストークン管理 API
 *
 * POST /api/push/device-token   — APNs トークンを登録 / 更新
 * DELETE /api/push/device-token — ログアウト時にトークンを削除
 */
import { Router, type IRouter } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { db } from "@workspace/db";
import { apnsRegistrationsTable } from "@workspace/db/schema";
import { and, eq } from "drizzle-orm";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

// ★ デバッグ用: 現在のユーザーに登録されている APNs デバイストークン数を返す
//   設定画面の「通知デバッグ」セクションがこれを叩いて状態確認する。
router.get("/push/me/registrations", requireAuth, async (req, res) => {
  try {
    const userId = req.authUser!.id;
    const rows = await db
      .select({ deviceToken: apnsRegistrationsTable.deviceToken, updatedAt: apnsRegistrationsTable.updatedAt })
      .from(apnsRegistrationsTable)
      .where(eq(apnsRegistrationsTable.userId, userId));
    return res.json({
      count: rows.length,
      tokens: rows.map(r => ({
        prefix: (r.deviceToken ?? '').slice(0, 10),
        updatedAt: r.updatedAt,
      })),
    });
  } catch (err: any) {
    console.error("[GET /push/me/registrations] error:", err?.message ?? err);
    return res.status(500).json({ error: "internal_error", message: err?.message });
  }
});

router.post("/push/device-token", requireAuth, async (req, res) => {
  try {
    const userId = req.authUser!.id;
    const body = (req.body ?? {}) as { deviceToken?: unknown };

    if (typeof body.deviceToken !== "string" || body.deviceToken.trim().length === 0) {
      return res.status(400).json({ error: "invalid_body", message: "deviceToken が必要です" });
    }

    const deviceToken = body.deviceToken.trim();

    await db
      .insert(apnsRegistrationsTable)
      .values({ userId, deviceToken })
      .onConflictDoUpdate({
        target: [apnsRegistrationsTable.userId, apnsRegistrationsTable.deviceToken],
        set: { updatedAt: sql`now()` },
      });

    console.log(`[push] device token registered for user ${userId.slice(0, 8)}...`);
    return res.json({ ok: true });
  } catch (err: any) {
    console.error("[POST /push/device-token] error:", err?.message ?? err);
    return res.status(500).json({ error: "internal_error", message: "トークン登録に失敗しました" });
  }
});

router.delete("/push/device-token", requireAuth, async (req, res) => {
  try {
    const userId = req.authUser!.id;
    const body = (req.body ?? {}) as { deviceToken?: unknown };

    if (typeof body.deviceToken !== "string" || body.deviceToken.trim().length === 0) {
      await db
        .delete(apnsRegistrationsTable)
        .where(eq(apnsRegistrationsTable.userId, userId));
      console.log(`[push] all device tokens removed for user ${userId.slice(0, 8)}...`);
    } else {
      await db
        .delete(apnsRegistrationsTable)
        .where(
          and(
            eq(apnsRegistrationsTable.userId, userId),
            eq(apnsRegistrationsTable.deviceToken, body.deviceToken.trim()),
          ),
        );
      console.log(`[push] specific device token removed for user ${userId.slice(0, 8)}...`);
    }

    return res.json({ ok: true });
  } catch (err: any) {
    console.error("[DELETE /push/device-token] error:", err?.message ?? err);
    return res.status(500).json({ error: "internal_error", message: "トークン削除に失敗しました" });
  }
});

export default router;
