import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { favoritesTable, storesTable } from "@workspace/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { supabaseAdmin } from "../lib/supabase";

const router: IRouter = Router();

async function getUserId(req: any): Promise<string | null> {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return null;
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;
  return user.id;
}

router.get("/favorites", async (req, res) => {
  const userId = await getUserId(req);
  if (!userId) { res.status(401).json({ error: "unauthorized" }); return; }

  try {
    const rows = await db
      .select({ storeId: favoritesTable.storeId })
      .from(favoritesTable)
      .where(eq(favoritesTable.userId, userId));

    res.json({ storeIds: rows.map(r => r.storeId) });
  } catch (err) {
    console.error("[favorites] GET error:", err);
    res.status(500).json({ error: "internal_error" });
  }
});

router.post("/favorites/:storeId", async (req, res) => {
  const userId = await getUserId(req);
  if (!userId) { res.status(401).json({ error: "unauthorized" }); return; }

  const storeId = parseInt(req.params.storeId, 10);
  if (isNaN(storeId)) { res.status(400).json({ error: "invalid_store_id" }); return; }

  try {
    await db
      .insert(favoritesTable)
      .values({ userId, storeId })
      .onConflictDoNothing();

    res.json({ ok: true });
  } catch (err) {
    console.error("[favorites] POST error:", err);
    res.status(500).json({ error: "internal_error" });
  }
});

router.delete("/favorites/:storeId", async (req, res) => {
  const userId = await getUserId(req);
  if (!userId) { res.status(401).json({ error: "unauthorized" }); return; }

  const storeId = parseInt(req.params.storeId, 10);
  if (isNaN(storeId)) { res.status(400).json({ error: "invalid_store_id" }); return; }

  try {
    await db
      .delete(favoritesTable)
      .where(and(eq(favoritesTable.userId, userId), eq(favoritesTable.storeId, storeId)));

    res.json({ ok: true });
  } catch (err) {
    console.error("[favorites] DELETE error:", err);
    res.status(500).json({ error: "internal_error" });
  }
});

export default router;
export { getUserId as getFavoritesUserId };
