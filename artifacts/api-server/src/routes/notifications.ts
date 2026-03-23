import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { notificationsTable } from "@workspace/db/schema";
import { eq, and, desc } from "drizzle-orm";
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

router.get("/notifications", async (req, res) => {
  const userId = await getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  try {
    const rows = await db
      .select()
      .from(notificationsTable)
      .where(eq(notificationsTable.userId, userId))
      .orderBy(desc(notificationsTable.createdAt))
      .limit(50);

    const unreadCount = rows.filter(n => !n.read).length;
    res.json({ notifications: rows, unreadCount });
  } catch (err: any) {
    console.error("[notifications] GET error:", err);
    res.status(500).json({ error: "internal_error" });
  }
});

router.patch("/notifications/:id/read", async (req, res) => {
  const userId = await getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "invalid_id" });
    return;
  }

  try {
    await db
      .update(notificationsTable)
      .set({ read: true })
      .where(and(eq(notificationsTable.id, id), eq(notificationsTable.userId, userId)));

    res.json({ ok: true });
  } catch (err: any) {
    console.error("[notifications] PATCH read error:", err);
    res.status(500).json({ error: "internal_error" });
  }
});

router.patch("/notifications/read-all", async (req, res) => {
  const userId = await getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  try {
    await db
      .update(notificationsTable)
      .set({ read: true })
      .where(eq(notificationsTable.userId, userId));

    res.json({ ok: true });
  } catch (err: any) {
    console.error("[notifications] PATCH read-all error:", err);
    res.status(500).json({ error: "internal_error" });
  }
});

export default router;
