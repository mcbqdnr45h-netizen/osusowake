import app from "./app";
import { pool } from "@workspace/db";

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
  } catch (err) {
    console.error('[migration] failed:', err);
  } finally {
    client.release();
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
