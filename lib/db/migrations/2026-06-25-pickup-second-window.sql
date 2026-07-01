-- 2部制(受取2枠)対応: 休憩をはさむ店向けに「2枠目の受取時間」を追加。
-- 任意(NULL=従来どおり1枠のみ)。 "HH:MM" 文字列。
-- 本番Supabaseに適用すること（冪等: IF NOT EXISTS）。

ALTER TABLE recurring_listings ADD COLUMN IF NOT EXISTS pickup_start_2 text;
ALTER TABLE recurring_listings ADD COLUMN IF NOT EXISTS pickup_end_2 text;

ALTER TABLE surprise_bags ADD COLUMN IF NOT EXISTS pickup_start_2 text;
ALTER TABLE surprise_bags ADD COLUMN IF NOT EXISTS pickup_end_2 text;
