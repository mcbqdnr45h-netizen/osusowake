import app from "./app";
import { pool } from "@workspace/db";
import pkg from "pg";
const { Pool: PgPool } = pkg;

// ── 起動時マイグレーション（冪等） ──────────────────────────────────────────
async function runMigrations() {
  const client = await pool.connect();
  try {
    // surprise_bags.category 列が存在しない場合のみ追加
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name='surprise_bags' AND column_name='category'
        ) THEN
          ALTER TABLE surprise_bags ADD COLUMN category TEXT;
          RAISE NOTICE 'surprise_bags.category column added';
        END IF;
      END $$;
    `);
    console.log('[migration] surprise_bags.category ✅');

    // 旧カテゴリ値 → 新3カテゴリへ一括変換（冪等）
    await client.query(`
      UPDATE surprise_bags SET category =
        CASE
          WHEN category IN ('bakery', 'sweets', 'cafe', 'drinks') THEN 'bakery_sweets'
          WHEN category IN ('produce', 'supermarket')              THEN 'ingredients'
          WHEN category IN ('restaurant', 'other', 'convenience', 'meat', 'noodles', 'assorted') THEN 'meals'
        END
      WHERE category IS NOT NULL
        AND category NOT IN ('meals', 'bakery_sweets', 'ingredients');
    `);
    console.log('[migration] category remapping ✅');

    // stores.approval_email_sent 列が存在しない場合のみ追加
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name='stores' AND column_name='approval_email_sent'
        ) THEN
          ALTER TABLE stores ADD COLUMN approval_email_sent BOOLEAN NOT NULL DEFAULT false;
          RAISE NOTICE 'stores.approval_email_sent column added';
        END IF;
      END $$;
    `);
    console.log('[migration] stores.approval_email_sent ✅');

    // store_category enum に新カテゴリを追加（ALTER TYPE は DO ブロック外で実行）
    // IF NOT EXISTS は PG 9.3+ でサポート
    await client.query(`ALTER TYPE store_category ADD VALUE IF NOT EXISTS 'meals'`);
    await client.query(`ALTER TYPE store_category ADD VALUE IF NOT EXISTS 'bakery_sweets'`);
    await client.query(`ALTER TYPE store_category ADD VALUE IF NOT EXISTS 'ingredients'`);
    console.log('[migration] store_category enum values ✅');

    // notifications テーブルが存在しない場合のみ作成
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id          SERIAL PRIMARY KEY,
        user_id     TEXT NOT NULL,
        type        TEXT NOT NULL,
        title       TEXT NOT NULL,
        body        TEXT,
        read        BOOLEAN NOT NULL DEFAULT false,
        created_at  TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications (user_id);
    `);
    console.log('[migration] notifications table ✅');
  } catch (err) {
    console.error('[migration] failed:', err);
  } finally {
    client.release();
  }

  // ── Supabase users.display_name migration ────────────────────────────────
  const supabaseDbUrl = process.env['SUPABASE_DATABASE_URL'];
  if (supabaseDbUrl) {
    const sbPool = new PgPool({
      connectionString: supabaseDbUrl,
      ssl: { rejectUnauthorized: false },
      max: 1,
    });
    let sbClient;
    try {
      sbClient = await sbPool.connect();
      await sbClient.query(`
        DO $$ BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema='public' AND table_name='users' AND column_name='display_name'
          ) THEN
            ALTER TABLE public.users ADD COLUMN display_name TEXT;
            UPDATE public.users
              SET display_name = SPLIT_PART(email, '@', 1)
              WHERE display_name IS NULL AND email IS NOT NULL AND email <> '';
          END IF;
        END $$;
      `);
      console.log('[supabase-migration] users.display_name ✅');

      // ── phone_number UNIQUE制約 ──────────────────────────────────────────────
      // 1) 重複している phone_number を NULL にする（初回のみ有効・冪等）
      await sbClient.query(`
        UPDATE public.users u
        SET phone_number = NULL
        WHERE phone_number IS NOT NULL
          AND id NOT IN (
            SELECT DISTINCT ON (phone_number) id
            FROM public.users
            WHERE phone_number IS NOT NULL
            ORDER BY phone_number, created_at ASC
          );
      `);

      // 2) UNIQUE制約を追加（既にあればスキップ）
      await sbClient.query(`
        DO $$ BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conname = 'users_phone_number_key'
              AND conrelid = 'public.users'::regclass
          ) THEN
            ALTER TABLE public.users ADD CONSTRAINT users_phone_number_key UNIQUE (phone_number);
          END IF;
        END $$;
      `);
      console.log('[supabase-migration] users.phone_number UNIQUE ✅');
    } catch (err) {
      console.warn('[supabase-migration] skipped:', (err as Error).message);
    } finally {
      sbClient?.release();
      await sbPool.end();
    }
  }
}

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

runMigrations().then(() => {
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
});
