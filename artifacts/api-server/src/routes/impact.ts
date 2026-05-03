import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { reservationsTable } from "@workspace/db/schema";
import { eq, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";

const router: IRouter = Router();

// ── GET /api/global-impact ─────────────────────────────────────────────────
// 全体の累計救済数 (PUBLIC) — キャッシュ可 (1分)
router.get("/global-impact", async (_req, res) => {
  try {
    const [row] = await db
      .select({ total: sql<number>`COUNT(*)::int` })
      .from(reservationsTable)
      .where(eq(reservationsTable.status, "picked_up"));

    const total     = row?.total ?? 0;
    const foodKg    = +(total * 0.5).toFixed(1);
    const co2Kg     = +(total * 2.5).toFixed(1);
    const savingsYen = total * 350;

    res.set("Cache-Control", "public, max-age=60");
    res.json({ total, foodKg, co2Kg, savingsYen });
  } catch (err: any) {
    console.error("[/global-impact]", err?.message);
    res.status(500).json({ error: "internal_error" });
  }
});

// ── GET /api/me/impact ─────────────────────────────────────────────────────
// 自分の累計救済数 (認証必須)
router.get("/me/impact", requireAuth, async (req, res) => {
  try {
    const userId = req.authUser!.id;

    const [row] = await db
      .select({ total: sql<number>`COUNT(*)::int` })
      .from(reservationsTable)
      .where(
        sql`${reservationsTable.userId} = ${userId} AND ${reservationsTable.status} = 'picked_up'`,
      );

    const total     = row?.total ?? 0;
    const foodKg    = +(total * 0.5).toFixed(1);
    const co2Kg     = +(total * 2.5).toFixed(1);
    const savingsYen = total * 350;

    res.json({ total, foodKg, co2Kg, savingsYen });
  } catch (err: any) {
    console.error("[/me/impact]", err?.message);
    res.status(500).json({ error: "internal_error" });
  }
});

export default router;
