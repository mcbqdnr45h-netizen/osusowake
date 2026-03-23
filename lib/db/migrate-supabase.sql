-- 古いテーブルを削除（依存関係の逆順）
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS stores CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 古いENUMがあれば削除
DROP TYPE IF EXISTS store_category CASCADE;
DROP TYPE IF EXISTS store_status CASCADE;
DROP TYPE IF EXISTS reservation_status CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS report_type CASCADE;

-- ENUMs作成
CREATE TYPE store_category AS ENUM ('restaurant','bakery','cafe','supermarket','convenience','other');
CREATE TYPE store_status AS ENUM ('pending','approved','rejected','pending_review','applied');
CREATE TYPE reservation_status AS ENUM ('pending','confirmed','picked_up','cancelled');
CREATE TYPE payment_status AS ENUM ('unpaid','paid','refunded');
CREATE TYPE report_type AS ENUM ('closed','temp_closed','wrong_hours','wrong_info','other');

-- stores
CREATE TABLE stores (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  category store_category NOT NULL DEFAULT 'other',
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  image_url TEXT,
  phone TEXT,
  open_time TEXT,
  close_time TEXT,
  rating REAL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  status store_status NOT NULL DEFAULT 'approved',
  owner_id TEXT,
  stripe_account_id TEXT,
  license_number TEXT,
  license_image_url TEXT,
  id_image_url TEXT,
  pledge_signed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- surprise_bags
CREATE TABLE surprise_bags (
  id SERIAL PRIMARY KEY,
  store_id INTEGER NOT NULL REFERENCES stores(id),
  title TEXT NOT NULL,
  description TEXT,
  original_price REAL NOT NULL,
  discounted_price REAL NOT NULL,
  stock_count INTEGER NOT NULL DEFAULT 0,
  pickup_start TEXT,
  pickup_end TEXT,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- reservations
CREATE TABLE reservations (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  bag_id INTEGER NOT NULL REFERENCES surprise_bags(id),
  store_id INTEGER NOT NULL REFERENCES stores(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  total_price REAL NOT NULL,
  status reservation_status NOT NULL DEFAULT 'pending',
  payment_intent_id TEXT,
  payment_status payment_status NOT NULL DEFAULT 'unpaid',
  pickup_code TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- reports
CREATE TABLE reports (
  id SERIAL PRIMARY KEY,
  store_id INTEGER NOT NULL REFERENCES stores(id),
  user_id TEXT NOT NULL,
  report_type report_type NOT NULL,
  comment TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- reviews
CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  store_id INTEGER NOT NULL REFERENCES stores(id),
  reservation_id INTEGER NOT NULL REFERENCES reservations(id),
  user_id TEXT NOT NULL,
  rating INTEGER NOT NULL,
  comment TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- RLS（Row Level Security）は無効にして、APIサーバー経由のみアクセス
ALTER TABLE stores DISABLE ROW LEVEL SECURITY;
ALTER TABLE surprise_bags DISABLE ROW LEVEL SECURITY;
ALTER TABLE reservations DISABLE ROW LEVEL SECURITY;
ALTER TABLE reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;
