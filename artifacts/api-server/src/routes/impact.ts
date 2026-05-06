import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { reservationsTable } from "@workspace/db/schema";
import { eq, and, count } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";

const router: IRouter = Router();

// GET /api/me/impact — 個人累計インパクト（要ログイン）
router.get("/me/impact", requireAuth, async (req, res) => {
  try {
    const userId = req.authUser!.id;
    const rows = await db
      .select({ cnt: count() })
      .from(reservationsTable)
      .where(and(eq(reservationsTable.userId, userId), eq(reservationsTable.status, "picked_up")));
    const pickedUpCount = Number(rows[0]?.cnt ?? 0);
    res.json({
      pickedUpCount,
      foodSavedKg: +(pickedUpCount * 0.5).toFixed(1),
      co2Saved: +(pickedUpCount * 2.5).toFixed(1),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "internal_error", message: msg });
  }
});

// GET /api/global-impact — 全体ライブカウンター（公開）
router.get("/global-impact", async (_req, res) => {
  try {
    const rows = await db
      .select({ cnt: count() })
      .from(reservationsTable)
      .where(eq(reservationsTable.status, "picked_up"));
    const totalPickedUp = Number(rows[0]?.cnt ?? 0);
    res.json({
      totalPickedUp,
      totalFoodSavedKg: +(totalPickedUp * 0.5).toFixed(1),
      totalCo2Saved: +(totalPickedUp * 2.5).toFixed(1),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "internal_error", message: msg });
  }
});

export default router;
