-- 自動公開バッグがどの定期出品テンプレ由来かを記録。 テンプレ停止/削除時の連動停止に使う。
-- 既存行は null（手動出品扱い）。 追加のみ・冪等。
ALTER TABLE surprise_bags ADD COLUMN IF NOT EXISTS recurring_listing_id INTEGER;
