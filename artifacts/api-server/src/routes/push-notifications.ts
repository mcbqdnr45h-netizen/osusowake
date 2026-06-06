/**
 * APNs / FCM デバイストークン管理 API
 *
 * POST /api/push/device-token   — トークンを登録 / 更新 (platform で iOS=APNs / Android=FCM 振り分け)
 * DELETE /api/push/device-token — ログアウト時にトークンを削除
 */
import { Router, type IRouter } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { db } from "@workspace/db";
import { apnsRegistrationsTable, fcmRegistrationsTable } from "@workspace/db/schema";
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
    const body = (req.body ?? {}) as { deviceToken?: unknown; platform?: unknown };

    if (typeof body.deviceToken !== "string" || body.deviceToken.trim().length === 0) {
      return res.status(400).json({ error: "invalid_body", message: "deviceToken が必要です" });
    }

    const deviceToken = body.deviceToken.trim();
    // platform="android" の時だけ FCM テーブル。 それ以外 (ios / 省略) は APNs (旧フロント互換)
    const isAndroid = body.platform === "android";
    const table = isAndroid ? fcmRegistrationsTable : apnsRegistrationsTable;
    const label = isAndroid ? "FCM" : "APNs";

    // ★ 重複通知の根本対策 (APNs と同じロジックを FCM にも適用):
    //   (1) 同じユーザーの「他の deviceToken」を全削除 → 端末トークン rotation 対策
    //   (2) 同じ deviceToken の「他のユーザー」も全削除 → 端末ハンドオフ対策
    await db
      .delete(table)
      .where(
        and(
          eq(table.userId, userId),
          sql`${table.deviceToken} <> ${deviceToken}`,
        ),
      );
    await db
      .delete(table)
      .where(
        and(
          eq(table.deviceToken, deviceToken),
          sql`${table.userId} <> ${userId}`,
        ),
      );

    await db
      .insert(table)
      .values({ userId, deviceToken })
      .onConflictDoUpdate({
        target: [table.userId, table.deviceToken],
        set: { updatedAt: sql`now()` },
      });

    console.log(`[push] ${label} device token registered for user ${userId.slice(0, 8)}... (古いトークン掃除済)`);
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
    const hasToken = typeof body.deviceToken === "string" && body.deviceToken.trim().length > 0;

    // ログアウト時は両プラットフォームから一気に削除する (端末乗り換えにも対応)
    if (!hasToken) {
      await db.delete(apnsRegistrationsTable).where(eq(apnsRegistrationsTable.userId, userId));
      await db.delete(fcmRegistrationsTable).where(eq(fcmRegistrationsTable.userId, userId));
      console.log(`[push] all device tokens removed for user ${userId.slice(0, 8)}...`);
    } else {
      const tok = (body.deviceToken as string).trim();
      // どちらに入ってるか分からないので両方試す (DELETE は冪等)
      await db.delete(apnsRegistrationsTable).where(
        and(eq(apnsRegistrationsTable.userId, userId), eq(apnsRegistrationsTable.deviceToken, tok)),
      );
      await db.delete(fcmRegistrationsTable).where(
        and(eq(fcmRegistrationsTable.userId, userId), eq(fcmRegistrationsTable.deviceToken, tok)),
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
