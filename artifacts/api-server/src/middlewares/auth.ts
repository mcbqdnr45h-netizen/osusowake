import type { Request, Response, NextFunction } from "express";
import { db } from "@workspace/db";
import { storesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { supabaseAdmin } from "../lib/supabase.js";

declare global {
  namespace Express {
    interface Request {
      authUser?: { id: string; email: string | null };
      authStore?: { id: number; ownerId: string | null };
    }
  }
}

/**
 * Bearer トークンを検証して req.authUser をセットする。
 * 失敗時は 401 を返す（next は呼ばない）。
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) {
    res.status(401).json({ error: "unauthorized", message: "ログインが必要です" });
    return;
  }
  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) {
      res.status(401).json({ error: "unauthorized", message: "セッションが無効です" });
      return;
    }
    req.authUser = { id: user.id, email: user.email ?? null };
    next();
  } catch (err: any) {
    console.error("[requireAuth] token verify failed:", err?.message);
    res.status(401).json({ error: "unauthorized" });
  }
}

/**
 * req.params.storeId の店舗が現在のユーザー所有であることを検証する単一責務 middleware。
 *
 * ★ 必ず requireAuth の **後ろ** にチェーンすること:
 *     router.post("/x", requireAuth, requireStoreOwner, handler)
 *
 * 成功時は req.authStore に { id, ownerId } をセットする。
 * 失敗時は 400 / 403 / 404 / 500 を返す（401 は requireAuth 側で処理）。
 */
export async function requireStoreOwner(req: Request, res: Response, next: NextFunction) {
  if (!req.authUser) {
    // requireAuth を先に通していない設定ミス → 露見させる（fail-closed）
    console.error("[requireStoreOwner] requireAuth が先に実行されていません（middleware 設定ミス）");
    res.status(500).json({ error: "internal_error", message: "auth middleware misconfigured" });
    return;
  }
  const storeId = parseInt(String(req.params.storeId ?? ""), 10);
  if (Number.isNaN(storeId)) {
    res.status(400).json({ error: "bad_request", message: "Invalid storeId" });
    return;
  }
  try {
    const [store] = await db
      .select({ id: storesTable.id, ownerId: storesTable.ownerId })
      .from(storesTable)
      .where(eq(storesTable.id, storeId))
      .limit(1);
    if (!store) {
      res.status(404).json({ error: "not_found", message: "店舗が見つかりません" });
      return;
    }
    if (!store.ownerId || store.ownerId !== req.authUser.id) {
      console.warn(`[SECURITY] storeOwner mismatch storeId=${storeId} ownerId=${store.ownerId} requester=${req.authUser.id}`);
      res.status(403).json({ error: "forbidden", message: "この店舗を操作する権限がありません" });
      return;
    }
    req.authStore = { id: store.id, ownerId: store.ownerId };
    next();
  } catch (err: any) {
    console.error("[requireStoreOwner] db lookup failed:", err?.message);
    res.status(500).json({ error: "internal_error" });
  }
}
