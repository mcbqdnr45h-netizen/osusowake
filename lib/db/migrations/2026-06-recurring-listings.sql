-- 定期出品（毎日自動公開）テンプレート用テーブル。
-- ★ 既存テーブルには一切触れない追加のみ。 冪等（IF NOT EXISTS）。
-- 本番 Supabase へは drizzle-kit push ではなく、 この SQL を直接実行して適用する
-- （push はスキーマ全体を同期するため、 ドリフトしている本番に対して破壊的変更を提案し得るため）。

CREATE TABLE IF NOT EXISTS recurring_listings (
  id                  SERIAL PRIMARY KEY,
  store_id            INTEGER NOT NULL REFERENCES stores(id),
  title               TEXT NOT NULL,
  description         TEXT,
  original_price      REAL NOT NULL,
  discounted_price    REAL NOT NULL,
  stock_count         INTEGER NOT NULL DEFAULT 0,
  pickup_start        TEXT,
  pickup_end          TEXT,
  image_url           TEXT,
  category            TEXT,
  allergy_info        TEXT,
  pickup_note         TEXT,
  item_type           TEXT DEFAULT 'bag',
  publish_time        TEXT NOT NULL,           -- JST "HH:MM"
  days_of_week        INTEGER NOT NULL DEFAULT 127,  -- bitmask bit0=日..bit6=土
  is_active           BOOLEAN NOT NULL DEFAULT true,
  skip_date           TEXT,                    -- 「今夜だけ停止」 JST "YYYY-MM-DD"
  last_published_date TEXT,                    -- 冪等性キー JST "YYYY-MM-DD"
  created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

-- API サーバー経由のみアクセス（既存テーブルと同じ方針）
ALTER TABLE recurring_listings DISABLE ROW LEVEL SECURITY;

-- 自動公開ジョブの抽出を高速化
CREATE INDEX IF NOT EXISTS idx_recurring_active ON recurring_listings (is_active, publish_time);

-- v2: 受け取り日の前日に出品するか（翌日受け取り対応）。 既存行は false（同日）。
ALTER TABLE recurring_listings ADD COLUMN IF NOT EXISTS pickup_next_day BOOLEAN NOT NULL DEFAULT false;
