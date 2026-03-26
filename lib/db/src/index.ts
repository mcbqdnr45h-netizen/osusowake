import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

// Supabase PostgreSQL を優先使用（統一 DB）
const rawUrl = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;

if (!rawUrl) {
  throw new Error(
    "SUPABASE_DATABASE_URL または DATABASE_URL を設定してください。"
  );
}

const isSupabase = !!process.env.SUPABASE_DATABASE_URL;

/**
 * コネクションプール設定 — Supabase 無料枠最適化
 *
 * max: 3
 *   Supabase 無料プランの PostgreSQL は最大 60 接続だが、
 *   長時間サーバープロセス × 少数コネクションで十分。
 *   コネクションは再利用されるためパフォーマンス劣化なし。
 *
 * idleTimeoutMillis: 10_000
 *   アイドル 10 秒でコネクションを解放。
 *   Supabase 側が強制切断する前に自発的に返却する。
 *
 * connectionTimeoutMillis: 5_000
 *   5 秒以内に取得できなければエラー（ハング防止）。
 *
 * keepAlive + keepAliveInitialDelayMillis
 *   TCP キープアライブで Supabase の idle 切断を防ぐ。
 */
export const pool = new Pool({
  connectionString: rawUrl,
  ssl: isSupabase ? { rejectUnauthorized: false } : undefined,
  max: 3,
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 5_000,
  allowExitOnIdle: true,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10_000,
});

// プールエラーをキャッチしてプロセスをクラッシュさせない
pool.on("error", (err) => {
  console.error("[db] pool error (non-fatal):", err.message);
});

export const db = drizzle(pool, { schema });

export * from "./schema";
