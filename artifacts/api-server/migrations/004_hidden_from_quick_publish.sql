-- 004_hidden_from_quick_publish.sql
-- 「クイック出品」 履歴リストからオーナーが × ボタンで個別に非表示にできるようにする論理削除フラグ。
-- NULL/false の既存行はそのまま履歴に表示される。
ALTER TABLE surprise_bags
  ADD COLUMN IF NOT EXISTS hidden_from_quick_publish BOOLEAN NOT NULL DEFAULT FALSE;
