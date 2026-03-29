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

// ── GET /api/auth/profile ──────────────────────────────────────────────────────
// JWT を検証してプロフィールを返す（Admin クライアントで RLS バイパス）
router.get("/auth/profile", async (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) { res.status(401).json({ error: "unauthorized" }); return; }

  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
  if (authErr || !user) { res.status(401).json({ error: "unauthorized" }); return; }

  try {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("id, email, role, full_name, phone_number, display_name")
      .eq("id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      res.status(500).json({ error: "db_error", message: error.message });
      return;
    }
    res.json({ profile: data ?? null });
  } catch (err: any) {
    res.status(500).json({ error: "internal_error", message: err?.message });
  }
});

// ── PATCH /api/auth/update-role ────────────────────────────────────────────────
// サインイン後にロールを確定させる（ロール整合チェック付き）
// - store_owner タブからログイン: DB が customer(=trigger自動作成) なら store_owner に昇格
// - customer タブからログイン: DB が store_owner なら 403 を返す
router.patch("/auth/update-role", async (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) { res.status(401).json({ error: "unauthorized" }); return; }

  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
  if (authErr || !user) { res.status(401).json({ error: "unauthorized" }); return; }

  const { desiredRole } = req.body as { desiredRole?: string };
  if (desiredRole !== "store_owner" && desiredRole !== "customer") {
    res.status(400).json({ error: "invalid_role" });
    return;
  }

  try {
    // 現在の DB プロフィールを取得
    const { data: existing } = await supabaseAdmin
      .from("users")
      .select("id, role, full_name")
      .eq("id", user.id)
      .single();

    // ── ケース分岐 ──────────────────────────────────────────────────────────
    if (!existing) {
      // プロフィールなし（メール確認後の初回ログイン等）→ 新規作成
      const { error: insertErr } = await supabaseAdmin.from("users").insert({
        id: user.id,
        email: user.email!,
        role: desiredRole,
      });
      if (insertErr) {
        res.status(500).json({ error: "db_error", message: insertErr.message });
        return;
      }
      res.json({ ok: true, role: desiredRole, action: "created" });
      return;
    }

    const currentRole = existing.role as string;
    // Supabase auth メタデータの intended_role（signUpAsStore で埋め込み）
    const intendedRole = (user.user_metadata?.intended_role as string | undefined) ?? null;

    if (desiredRole === "store_owner") {
      if (currentRole === "store_owner") {
        // 既に store_owner → そのまま OK
        res.json({ ok: true, role: currentRole, action: "noop" });
        return;
      }
      // customer だが full_name が設定済み → 意図的に customer 登録したユーザー → 拒否
      if (currentRole === "customer" && existing.full_name) {
        res.status(403).json({
          error: "role_mismatch",
          message: "このアカウントは一般ユーザー用です。一般ユーザータブからログインしてください。",
        });
        return;
      }
      // customer で full_name=null（トリガー自動生成）→ store_owner に昇格
      await supabaseAdmin.from("users").update({ role: "store_owner" }).eq("id", user.id);
      res.json({ ok: true, role: "store_owner", action: "upgraded" });
      return;
    }

    // desiredRole = 'customer'
    if (currentRole === "store_owner") {
      // 店舗オーナーが一般タブでログイン → 拒否
      res.status(403).json({
        error: "role_mismatch",
        message: "このアカウントは店舗オーナー用です。「飲食店・パートナー」タブからログインしてください。",
      });
      return;
    }
    // customer で intended_role=store_owner（メール確認後に誤って user タブでログイン）→ 拒否
    if (currentRole === "customer" && !existing.full_name && intendedRole === "store_owner") {
      res.status(403).json({
        error: "role_mismatch",
        message: "店舗オーナーとして登録されています。「飲食店・パートナー」タブからログインしてください。",
      });
      return;
    }
    // customer → customer → そのまま OK
    res.json({ ok: true, role: currentRole, action: "noop" });
  } catch (err: any) {
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
    // users テーブルの状態を確認
    const { data: existing } = await supabaseAdmin
      .from("users")
      .select("id, full_name")
      .eq("id", user.id)
      .single();

    if (existing && existing.full_name) {
      // full_name が設定済み = 正常に登録されたユーザー → 削除しない
      res.status(400).json({ error: "user_already_registered" });
      return;
    }

    // レコードが存在しない OR full_name=null（Supabase トリガーが自動生成した不完全レコード）
    // → public.users の行を先に削除してから auth.users を削除
    if (existing) {
      await supabaseAdmin.from("users").delete().eq("id", user.id);
    }
    await supabaseAdmin.auth.admin.deleteUser(user.id);
    res.json({ ok: true });
  } catch (err: any) {
    console.error("[auth/cleanup-user]", err);
    res.status(500).json({ error: "internal_error", message: err?.message });
  }
});

export default router;
