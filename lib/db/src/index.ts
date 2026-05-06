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

/**
 * DB クエリのリトライ実行ヘルパー。
 * Supabase のアイドル切断 / TCP リセット等で発生する一時的な接続エラーを
 * 検知して、最大 retries 回まで指数バックオフで再試行する。
 *
 * - "Connection terminated" / ECONNRESET / 57P01 (admin shutdown) /
 *   08006 (connection_failure) / 08003 (connection_does_not_exist) を再試行対象とする
 * - 業務エラー（unique 違反など）は即時 throw（リトライしない）
 */
export async function withDbRetry<T>(
  fn: () => Promise<T>,
  opts: { retries?: number; baseDelayMs?: number; label?: string } = {},
): Promise<T> {
  const retries     = opts.retries ?? 3;
  const baseDelayMs = opts.baseDelayMs ?? 200;
  const label       = opts.label ?? "db";

  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastErr = err;
      const msg  = String(err?.message ?? "");
      const code = String(err?.code ?? "");
      const transient =
        msg.includes("Connection terminated") ||
        msg.includes("Client has encountered a connection error") ||
        msg.includes("connection terminated") ||
        code === "ECONNRESET" ||
        code === "ETIMEDOUT" ||
        code === "EPIPE" ||
        code === "57P01" ||
        code === "08006" ||
        code === "08003";

      if (!transient || attempt === retries) throw err;

      const delay = baseDelayMs * Math.pow(2, attempt);
      console.warn(
        `[${label}] transient DB error (attempt ${attempt + 1}/${retries + 1}) — retrying in ${delay}ms:`,
        msg || code,
      );
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

export * from "./schema";
