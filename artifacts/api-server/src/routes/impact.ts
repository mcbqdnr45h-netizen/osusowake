import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

const FOOD_KG_PER_RESCUE = 0.5;
const CO2_KG_PER_RESCUE = 2.5;

let cache: { data: GlobalImpact; expiresAt: number } | null = null;
const CACHE_TTL_MS = 60_000;

type GlobalImpact = {
  totalRescued: number;
  totalCo2Kg: number;
  totalFoodKg: number;
  totalSavedYen: number;
  totalUsers: number;
  totalStores: number;
  updatedAt: string;
};

router.get("/impact/global", async (_req, res) => {
  try {
    if (cache && cache.expiresAt > Date.now()) {
      res.setHeader("Cache-Control", "public, max-age=30");
      return res.json(cache.data);
    }

    const result = await db.execute(sql`
      SELECT
        COUNT(*) FILTER (WHERE r.status IN ('confirmed','picked_up'))::int       AS rescued,
        COALESCE(SUM(r.total_price) FILTER (WHERE r.status IN ('confirmed','picked_up')), 0)::numeric AS gmv,
        COUNT(DISTINCT r.user_id) FILTER (WHERE r.status IN ('confirmed','picked_up'))::int          AS users
      FROM reservations r
    `);
    const row = (result.rows[0] ?? {}) as { rescued?: number; gmv?: string | number; users?: number };
    const rescued = Number(row.rescued ?? 0);
    const gmv = Number(row.gmv ?? 0);
    const users = Number(row.users ?? 0);

    const storesResult = await db.execute(sql`
      SELECT COUNT(*)::int AS approved
      FROM stores
      WHERE status = 'approved'
    `);
    const stores = Number((storesResult.rows[0] as { approved?: number })?.approved ?? 0);

    const data: GlobalImpact = {
      totalRescued: rescued,
      totalCo2Kg: +(rescued * CO2_KG_PER_RESCUE).toFixed(1),
      totalFoodKg: +(rescued * FOOD_KG_PER_RESCUE).toFixed(1),
      totalSavedYen: Math.round(gmv),
      totalUsers: users,
      totalStores: stores,
      updatedAt: new Date().toISOString(),
    };

    cache = { data, expiresAt: Date.now() + CACHE_TTL_MS };
    res.setHeader("Cache-Control", "public, max-age=30");
    return res.json(data);
  } catch (e: unknown) {
    console.error("[impact/global] error", e);
    return res.status(500).json({ error: "failed_to_compute_impact" });
  }
});

export default router;
