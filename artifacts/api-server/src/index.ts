import app from "./app";
import { pool } from "@workspace/db";
import { releaseExpiredCartReservations } from "./routes/reservations";
import { sendPickupReminders } from "./lib/pickup-reminder.js";

// ── 起動時マイグレーション（冪等・全て Supabase PostgreSQL 対象）──────────────
async function runMigrations() {
  const client = await pool.connect();
  try {
    // ── store_category enum に新カテゴリを追加 ──────────────────────────────
    await client.query(`ALTER TYPE store_category ADD VALUE IF NOT EXISTS 'meals'`);
    await client.query(`ALTER TYPE store_category ADD VALUE IF NOT EXISTS 'bakery_sweets'`);
    await client.query(`ALTER TYPE store_category ADD VALUE IF NOT EXISTS 'ingredients'`);
    console.log('[migration] store_category enum values ✅');

    // ── surprise_bags.category 列が存在しない場合のみ追加 ────────────────────
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema='public' AND table_name='surprise_bags' AND column_name='category'
        ) THEN
          ALTER TABLE surprise_bags ADD COLUMN category TEXT;
        END IF;
      END $$;
    `);
    console.log('[migration] surprise_bags.category ✅');

    // ── 旧カテゴリ値 → 新3カテゴリへ一括変換（冪等）────────────────────────
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

    // ── stores.approval_email_sent 列が存在しない場合のみ追加 ─────────────────
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema='public' AND table_name='stores' AND column_name='approval_email_sent'
        ) THEN
          ALTER TABLE stores ADD COLUMN approval_email_sent BOOLEAN NOT NULL DEFAULT false;
        END IF;
      END $$;
    `);
    console.log('[migration] stores.approval_email_sent ✅');

    // ── notifications テーブルが存在しない場合のみ作成 ────────────────────────
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

    // ── users テーブル: display_name 列 ──────────────────────────────────────
    await client.query(`
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
    console.log('[migration] users.display_name ✅');

    // ── users テーブル: phone_number UNIQUE 制約 ──────────────────────────────
    // 1) 重複している phone_number を NULL にする（初回のみ有効・冪等）
    await client.query(`
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
    // 2) UNIQUE 制約を追加（既にあればスキップ）
    await client.query(`
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
    console.log('[migration] users.phone_number UNIQUE ✅');

    // ── stores 各種追加列 ─────────────────────────────────────────────────────
    const storeExtraCols = [
      ['holiday',              'TEXT'],
      ['pickup_hours',         'TEXT'],
      ['legal_name',           'TEXT'],
      ['legal_representative', 'TEXT'],
      ['legal_address',        'TEXT'],
      ['legal_phone',          'TEXT'],
      ['legal_email',          'TEXT'],
      ['legal_other',          'TEXT'],
    ];
    for (const [col, type] of storeExtraCols) {
      await client.query(`
        DO $$ BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema='public' AND table_name='stores' AND column_name='${col}'
          ) THEN
            ALTER TABLE public.stores ADD COLUMN ${col} ${type};
          END IF;
        END $$;
      `);
    }
    console.log('[migration] stores extra columns ✅');

    // ── reservations: pickup_code 列 ─────────────────────────────────────────
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema='public' AND table_name='reservations' AND column_name='pickup_code'
        ) THEN
          ALTER TABLE public.reservations ADD COLUMN pickup_code TEXT;
        END IF;
      END $$;
    `);
    console.log('[migration] reservations.pickup_code ✅');

    // ── favorites テーブル ────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS favorites (
        id         SERIAL PRIMARY KEY,
        user_id    TEXT NOT NULL,
        store_id   INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT favorites_user_store_uniq UNIQUE (user_id, store_id)
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS favorites_user_id_idx ON favorites (user_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS favorites_store_id_idx ON favorites (store_id);
    `);
    console.log('[migration] favorites table ✅');

    // ── surprise_bags: allergy_info / pickup_note 列 ─────────────────────────
    for (const col of ['allergy_info', 'pickup_note']) {
      await client.query(`
        DO $$ BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema='public' AND table_name='surprise_bags' AND column_name='${col}'
          ) THEN
            ALTER TABLE public.surprise_bags ADD COLUMN ${col} TEXT;
          END IF;
        END $$;
      `);
    }
    console.log('[migration] surprise_bags.allergy_info / pickup_note ✅');

    // ── cart_reservations テーブル ────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS cart_reservations (
        id             SERIAL PRIMARY KEY,
        user_id        TEXT NOT NULL,
        bag_id         INTEGER NOT NULL REFERENCES surprise_bags(id) ON DELETE CASCADE,
        reservation_id INTEGER,
        quantity       INTEGER NOT NULL DEFAULT 1,
        reserved_at    TIMESTAMP NOT NULL DEFAULT NOW(),
        expires_at     TIMESTAMP NOT NULL,
        status         TEXT NOT NULL DEFAULT 'active'
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS cart_reservations_bag_id_status_idx ON cart_reservations (bag_id, status);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS cart_reservations_reservation_id_idx ON cart_reservations (reservation_id);
    `);
    console.log('[migration] cart_reservations table ✅');

    // ── パフォーマンス用インデックス（冪等）────────────────────────────────────
    // bags 一覧: is_active + created_at フィルタで高速スキャン
    await client.query(`CREATE INDEX IF NOT EXISTS sb_active_created_idx   ON surprise_bags (is_active, created_at DESC)`);
    // バッグ → ストア JOIN キー
    await client.query(`CREATE INDEX IF NOT EXISTS sb_store_id_idx          ON surprise_bags (store_id)`);
    // status=active の期限切れ仮押さえ cleanup
    await client.query(`CREATE INDEX IF NOT EXISTS cr_status_expires_idx    ON cart_reservations (status, expires_at)`);
    // 予約一覧をユーザー軸で高速取得
    await client.query(`CREATE INDEX IF NOT EXISTS res_user_id_idx          ON reservations (user_id)`);
    // ストア一覧: 承認済みフィルタ
    await client.query(`CREATE INDEX IF NOT EXISTS stores_status_active_idx ON stores (status, is_active)`);
    console.log('[migration] performance indexes ✅');

    // ── announcements テーブル ────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS announcements (
        id          SERIAL PRIMARY KEY,
        title       TEXT NOT NULL,
        body        TEXT NOT NULL,
        created_by  TEXT NOT NULL,
        created_at  TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log('[migration] announcements table ✅');

    // ── web_push_subscriptions テーブル ──────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS web_push_subscriptions (
        id          SERIAL PRIMARY KEY,
        user_id     TEXT NOT NULL,
        endpoint    TEXT NOT NULL UNIQUE,
        p256dh      TEXT NOT NULL,
        auth        TEXT NOT NULL,
        created_at  TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS wps_user_id_idx ON web_push_subscriptions (user_id);
    `);
    console.log('[migration] web_push_subscriptions table ✅');

    // ── store_status enum に suspended を追加 ─────────────────────────────────
    await client.query(`ALTER TYPE store_status ADD VALUE IF NOT EXISTS 'suspended'`);
    console.log('[migration] store_status suspended ✅');

    // ── app_settings テーブル ─────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS app_settings (
        key   TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    // デフォルト値を INSERT OR IGNORE で挿入
    await client.query(`
      INSERT INTO app_settings (key, value) VALUES
        ('catchphrase',                   'あなたの街のおすそわけ'),
        ('sub_catchphrase',               'おいしいものを、もっとみんなへ。'),
        ('maintenance_mode',              'false'),
        ('maintenance_title',             'ただいまメンテナンス中です'),
        ('maintenance_message',           'より良いサービスのために、現在システムメンテナンスを行っています。\nしばらくお待ちください🙏'),
        ('auto_approve_stripe_verified',  'false')
      ON CONFLICT (key) DO NOTHING;
    `);
    console.log('[migration] app_settings table ✅');

    // ── stores.stripe_kyc_admin_email_sent 列 ─────────────────────────────────
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema='public' AND table_name='stores'
            AND column_name='stripe_kyc_admin_email_sent'
        ) THEN
          ALTER TABLE stores ADD COLUMN stripe_kyc_admin_email_sent BOOLEAN NOT NULL DEFAULT false;
        END IF;
      END $$;
    `);
    console.log('[migration] stores.stripe_kyc_admin_email_sent ✅');

    // ── sales_leads テーブル ─────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS sales_leads (
        id          SERIAL PRIMARY KEY,
        reported_by TEXT,
        store_name  TEXT NOT NULL,
        location    TEXT NOT NULL,
        memo        TEXT,
        status      TEXT NOT NULL DEFAULT 'new',
        created_at  TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log('[migration] sales_leads table ✅');

    // ── surprise_bags: item_type 列 ──────────────────────────────────────────
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema='public' AND table_name='surprise_bags' AND column_name='item_type'
        ) THEN
          ALTER TABLE surprise_bags ADD COLUMN item_type TEXT DEFAULT 'bag';
        END IF;
      END $$;
    `);
    console.log('[migration] surprise_bags.item_type ✅');

    // ── reviews テーブル ─────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id             SERIAL PRIMARY KEY,
        store_id       INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
        reservation_id INTEGER NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
        user_id        TEXT NOT NULL,
        rating         INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
        comment        TEXT,
        created_at     TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE UNIQUE INDEX IF NOT EXISTS reviews_reservation_unique ON reviews(reservation_id);
    `);
    // reply / replied_at カラムは後から追加された可能性があるため個別に追加
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema='public' AND table_name='reviews' AND column_name='reply'
        ) THEN
          ALTER TABLE reviews ADD COLUMN reply TEXT;
        END IF;
      END $$;
    `);
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema='public' AND table_name='reviews' AND column_name='replied_at'
        ) THEN
          ALTER TABLE reviews ADD COLUMN replied_at TIMESTAMP;
        END IF;
      END $$;
    `);
    console.log('[migration] reviews table ✅');

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
    console.log(`Server listening on port ${port} — DB: Supabase PostgreSQL`);
  });

  // 期限切れ仮押さえを1分ごとに自動解放（在庫復元）
  setInterval(() => {
    releaseExpiredCartReservations().catch(() => {});
  }, 60_000);

  // 受取1時間前リマインダーを5分ごとに送信
  setInterval(() => {
    sendPickupReminders().catch(() => {});
  }, 5 * 60_000);
});
