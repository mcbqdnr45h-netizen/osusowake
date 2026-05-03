// 管理者判定 / 通知宛先解決の共通ヘルパー (#6 フェーズ B)
// ハードコード ADMIN_EMAIL を完全廃止し、 supabase users.role = 'admin' で
// 一元判定する。 通知宛先も全 admin に配信する。
//
// 初期 admin の seed は index.ts migration で env `INITIAL_ADMIN_EMAILS`
// (カンマ区切り) から行う。 env 未設定なら seed しない (fail-safe)。
import { supabaseAdmin } from "./supabase.js";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

export interface AdminUserRow {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string | null;
}

export type RevokeResult =
  | { ok: true }
  | { ok: false; reason: "self_revoke_forbidden" | "last_admin" | "not_admin" | "error" };

/**
 * 指定ユーザーが admin かどうかを判定する (DB role=admin で一元判定)。
 * email 一致のフォールバックは行わない。
 */
export async function isUserAdmin(user: { id?: string | null } | null | undefined): Promise<boolean> {
  if (!user?.id) return false;
  try {
    const { data } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();
    return data?.role === "admin";
  } catch (e) {
    console.warn("[isUserAdmin] users.role lookup failed:", (e as Error).message);
    return false;
  }
}

/**
 * 全 admin の supabase user id を返す (通知宛先解決用)。
 * 失敗時は空配列 (best-effort)。
 */
export async function getAllAdminUserIds(): Promise<string[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("role", "admin");
    if (error) {
      console.warn("[getAllAdminUserIds] failed:", error.message);
      return [];
    }
    return (data ?? []).map((r) => r.id as string).filter(Boolean);
  } catch (e) {
    console.warn("[getAllAdminUserIds] error:", (e as Error).message);
    return [];
  }
}

/**
 * 全 admin の詳細 (id, email, full_name, created_at) を返す。
 * AdminDashboard の管理者一覧 UI 用。
 */
export async function getAllAdminUsers(): Promise<AdminUserRow[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("id, email, full_name, created_at")
      .eq("role", "admin")
      .order("created_at", { ascending: true });
    if (error) {
      console.warn("[getAllAdminUsers] failed:", error.message);
      return [];
    }
    return (data ?? []) as AdminUserRow[];
  } catch (e) {
    console.warn("[getAllAdminUsers] error:", (e as Error).message);
    return [];
  }
}

/**
 * email から user id を解決する (admin 追加 endpoint で使用)。
 * 見つからなければ null。
 */
export async function findUserIdByEmail(email: string): Promise<string | null> {
  const target = email.toLowerCase().trim();
  if (!target) return null;
  try {
    // case-insensitive lookup (LOWER 比較)。 重複時は最古行を返す。
    const result = await db.execute(sql`
      SELECT id FROM users
       WHERE LOWER(email) = ${target}
       ORDER BY created_at ASC NULLS LAST
       LIMIT 1
    `);
    const rows = (result as unknown as { rows?: Array<{ id?: string }> }).rows ?? [];
    return rows[0]?.id ?? null;
  } catch (e) {
    console.warn("[findUserIdByEmail] failed:", (e as Error).message);
    return null;
  }
}

/**
 * ユーザーの role を 'admin' に昇格する。
 * 該当 user が users テーブルに存在しない場合は false を返す。
 */
export async function grantAdminRole(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin
      .from("users")
      .update({ role: "admin" })
      .eq("id", userId)
      .select("id")
      .maybeSingle();
    if (error) {
      console.error("[grantAdminRole] failed:", error.message);
      return false;
    }
    return !!data;
  } catch (e) {
    console.error("[grantAdminRole] error:", (e as Error).message);
    return false;
  }
}

/**
 * ユーザーの admin role を剥奪 (customer に戻す)。
 * #6 フェーズ B 改修 (architect C1 指摘対応): 1 ステートメント条件付き UPDATE で
 * TOCTOU を排除する。 並走で全 admin が同時に剥奪されることを防ぐ。
 *
 * 条件:
 *   - target は現在 admin
 *   - target は requester 自身ではない
 *   - target を剥奪しても admin が 1 名以上残る
 *
 * いずれかを満たさない場合は理由付き失敗を返し、 DB 行は不変。
 */
export async function revokeAdminRole(
  userId: string,
  requesterId: string,
): Promise<RevokeResult> {
  if (userId === requesterId) {
    return { ok: false, reason: "self_revoke_forbidden" };
  }
  try {
    const updateResult = await db.execute(sql`
      WITH current_admins AS (
        SELECT id FROM users WHERE role = 'admin'
      )
      UPDATE users
         SET role = 'customer'
       WHERE id = ${userId}
         AND role = 'admin'
         AND id <> ${requesterId}
         AND (SELECT COUNT(*) FROM current_admins) > 1
      RETURNING id
    `);
    const updatedRows = (updateResult as unknown as { rows?: unknown[] }).rows ?? [];
    if (updatedRows.length > 0) return { ok: true };

    // どの条件で弾かれたかを後追い判定 (best-effort)
    const checkResult = await db.execute(sql`
      SELECT
        (SELECT role FROM users WHERE id = ${userId}) AS target_role,
        (SELECT COUNT(*) FROM users WHERE role = 'admin') AS admin_count
    `);
    const checkRows = (checkResult as unknown as {
      rows?: Array<{ target_role?: string | null; admin_count?: number | string | null }>;
    }).rows ?? [];
    const check = checkRows[0] ?? {};
    if (check.target_role !== "admin") return { ok: false, reason: "not_admin" };
    if (Number(check.admin_count ?? 0) <= 1) return { ok: false, reason: "last_admin" };
    return { ok: false, reason: "error" };
  } catch (e) {
    console.error("[revokeAdminRole] error:", (e as Error).message);
    return { ok: false, reason: "error" };
  }
}
