import { Router, type IRouter, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { supabaseAdmin } from "../lib/supabase";

const router: IRouter = Router();

// ── POST /auth/create-profile ─────────────────────────────────────────────────
// 新規ユーザーのプロフィールを Admin クライアント（RLS バイパス）で upsert する
// フロントからの supabase.from('users').upsert() は RLS でブロックされるため必須
router.post("/auth/create-profile", async (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  // JWT からユーザーを検証
  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
  if (authErr || !user) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  const { role, full_name, phone_number } = req.body as {
    role?: string;
    full_name?: string;
    phone_number?: string;
  };

  if (!role || !full_name || !phone_number) {
    res.status(400).json({ error: "role, full_name, phone_number are required" });
    return;
  }

  try {
    const { error: upsertErr } = await supabaseAdmin
      .from("users")
      .upsert({
        id: user.id,
        email: user.email!,
        role,
        full_name: full_name.trim(),
        phone_number: phone_number.trim(),
      }, { onConflict: "id" });

    if (upsertErr) {
      console.error("[auth/create-profile] upsert error:", upsertErr);
      if (upsertErr.code === "23505" || upsertErr.message?.includes("unique")) {
        res.status(409).json({ error: "phone_taken", message: "この電話番号は既に登録されています" });
      } else {
        res.status(500).json({ error: "db_error", message: upsertErr.message });
      }
      return;
    }

    res.json({ ok: true });
  } catch (err: any) {
    console.error("[auth/create-profile]", err);
    res.status(500).json({ error: "internal_error", message: err?.message });
  }
});

// ── POST /auth/check-phone ─────────────────────────────────────────────────────
// 電話番号の重複チェック（管理者クライアントで RLS をバイパス）
router.post("/auth/check-phone", async (req: Request, res: Response) => {
  const { phone } = req.body as { phone?: string };
  if (!phone?.trim()) {
    res.status(400).json({ error: "phone is required" });
    return;
  }
  try {
    const result = await db.execute(sql`
      SELECT id FROM users WHERE phone_number = ${phone.trim()} LIMIT 1
    `);
    res.json({ taken: result.rows.length > 0 });
  } catch (err: any) {
    console.error("[auth/check-phone]", err);
    res.status(500).json({ error: "internal_error", message: err?.message });
  }
});

// ── POST /auth/cleanup-user ────────────────────────────────────────────────────
// auth.users から孤立したユーザーを削除（DB upsert 失敗後のロールバック）
// セキュリティ: userId は Supabase auth の JWT から取得した ID のみ受け付ける
router.post("/auth/cleanup-user", async (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  // トークンからユーザーを検証（自分自身のアカウントのみ削除可能）
  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
  if (authErr || !user) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  try {
    // users テーブルにレコードが存在しない場合のみ削除（正常登録済みのユーザーは保護）
    const existing = await db.execute(sql`
      SELECT id FROM users WHERE id = ${user.id} LIMIT 1
    `);
    if (existing.rows.length > 0) {
      // すでに users テーブルに存在するユーザーは削除しない
      res.status(400).json({ error: "user_already_registered" });
      return;
    }

    await supabaseAdmin.auth.admin.deleteUser(user.id);
    res.json({ ok: true });
  } catch (err: any) {
    console.error("[auth/cleanup-user]", err);
    res.status(500).json({ error: "internal_error", message: err?.message });
  }
});

export default router;
