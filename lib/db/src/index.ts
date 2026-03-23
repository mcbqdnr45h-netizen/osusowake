import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

let rawUrl = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;

if (!rawUrl) {
  throw new Error(
    "SUPABASE_DATABASE_URL または DATABASE_URL を設定してください。"
  );
}

const isSupabase = !!process.env.SUPABASE_DATABASE_URL;

// Supabase 直接接続URL (db.xxx.supabase.co:5432) を
// Transaction Pooler URL (aws-0-xxx.pooler.supabase.com:6543) に自動変換
let connectionString = rawUrl;
if (isSupabase && rawUrl.includes("db.") && rawUrl.includes(".supabase.co")) {
  try {
    const parsed = new URL(rawUrl);
    const projectRef = parsed.hostname.replace("db.", "").replace(".supabase.co", "");
    // Transaction Pooler ホストに変換（Supabaseのリージョンはap-northeast-1をデフォルトとして試みる）
    // ただしユーザー名が postgres の場合は postgres.{ref} に変更が必要
    const newHost = `aws-0-ap-northeast-1.pooler.supabase.com`;
    const newUser = parsed.username === "postgres"
      ? `postgres.${projectRef}`
      : parsed.username;
    parsed.hostname = newHost;
    parsed.port = "6543";
    parsed.username = newUser;
    connectionString = parsed.toString();
    console.log(`[DB] 直接接続URLをTransaction Pooler URLに変換しました: host=${newHost} port=6543`);
  } catch (e) {
    console.warn("[DB] URL変換に失敗しました。元のURLを使用します:", e);
  }
}

export const pool = new Pool({
  connectionString,
  ssl: isSupabase ? { rejectUnauthorized: false } : undefined,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

export const db = drizzle(pool, { schema });

export * from "./schema";
