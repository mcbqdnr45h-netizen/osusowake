-- 買い手に「明日受け取り」を正しく表示するため、 surprise_bags に翌日受け取りフラグを追加。
-- 既存行は false（＝従来どおり表示変化なし）。 追加のみ・冪等。
ALTER TABLE surprise_bags ADD COLUMN IF NOT EXISTS pickup_next_day BOOLEAN NOT NULL DEFAULT false;
