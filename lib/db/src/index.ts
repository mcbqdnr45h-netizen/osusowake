import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

// Supabase PostgreSQL を優先使用（統一 DB）
// SUPABASE_DATABASE_URL が設定されている場合は SSL 必須
const rawUrl = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;

if (!rawUrl) {
  throw new Error(
    "SUPABASE_DATABASE_URL または DATABASE_URL を設定してください。"
  );
}

const isSupabase = !!process.env.SUPABASE_DATABASE_URL;

export const pool = new Pool({
  connectionString: rawUrl,
  ssl: isSupabase ? { rejectUnauthorized: false } : undefined,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

export const db = drizzle(pool, { schema });

export * from "./schema";
