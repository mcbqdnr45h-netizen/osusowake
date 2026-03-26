-- ════════════════════════════════════════════════════════════════
-- OsusOwake — Row Level Security マイグレーション
-- 実行日: 2026-03-26
--
-- 注意: バックエンド API は SUPABASE_DATABASE_URL（postgres ロール）で
--       直接接続するため RLS をバイパスします。
--       RLS は Supabase anon key 経由のクライアント直接アクセスを保護します。
-- ════════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────
-- 1. stores
-- ──────────────────────────────────────────────────────────────
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- 誰でも閲覧可（ユーザーが店舗一覧を表示するため）
CREATE POLICY stores_select_public
  ON stores FOR SELECT USING (true);

-- オーナー本人のみ更新
CREATE POLICY stores_update_own
  ON stores FOR UPDATE
  USING  (owner_id = auth.uid()::text)
  WITH CHECK (owner_id = auth.uid()::text);

-- INSERT/DELETE はバックエンド（サービスロール）専用 — 直接アクセス拒否
CREATE POLICY stores_insert_deny
  ON stores FOR INSERT WITH CHECK (false);

CREATE POLICY stores_delete_deny
  ON stores FOR DELETE USING (false);

-- ──────────────────────────────────────────────────────────────
-- 2. surprise_bags
-- ──────────────────────────────────────────────────────────────
ALTER TABLE surprise_bags ENABLE ROW LEVEL SECURITY;

-- 誰でも閲覧可
CREATE POLICY bags_select_public
  ON surprise_bags FOR SELECT USING (true);

-- 自店舗のバッグのみ INSERT
CREATE POLICY bags_insert_own_store
  ON surprise_bags FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stores s
      WHERE s.id = store_id AND s.owner_id = auth.uid()::text
    )
  );

-- 自店舗のバッグのみ UPDATE
CREATE POLICY bags_update_own_store
  ON surprise_bags FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM stores s
      WHERE s.id = store_id AND s.owner_id = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stores s
      WHERE s.id = store_id AND s.owner_id = auth.uid()::text
    )
  );

-- 自店舗のバッグのみ DELETE
CREATE POLICY bags_delete_own_store
  ON surprise_bags FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM stores s
      WHERE s.id = store_id AND s.owner_id = auth.uid()::text
    )
  );

-- ──────────────────────────────────────────────────────────────
-- 3. reservations
-- ──────────────────────────────────────────────────────────────
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- 予約者本人 または 対象店舗のオーナーのみ閲覧
CREATE POLICY reservations_select_own
  ON reservations FOR SELECT
  USING (
    user_id = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM stores s
      WHERE s.id = store_id AND s.owner_id = auth.uid()::text
    )
  );

-- ログイン済みユーザーが自分の user_id で INSERT
CREATE POLICY reservations_insert_auth
  ON reservations FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND user_id = auth.uid()::text
  );

-- 予約者本人（キャンセル等）または店舗オーナー（受取完了等）
CREATE POLICY reservations_update_own
  ON reservations FOR UPDATE
  USING (
    user_id = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM stores s
      WHERE s.id = store_id AND s.owner_id = auth.uid()::text
    )
  )
  WITH CHECK (
    user_id = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM stores s
      WHERE s.id = store_id AND s.owner_id = auth.uid()::text
    )
  );

-- DELETE はバックエンド専用（ユーザーはキャンセル = UPDATE status で対応）
CREATE POLICY reservations_delete_deny
  ON reservations FOR DELETE USING (false);

-- ──────────────────────────────────────────────────────────────
-- 4. reviews
-- ──────────────────────────────────────────────────────────────
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- レビューは公開情報
CREATE POLICY reviews_select_public
  ON reviews FOR SELECT USING (true);

-- 投稿者本人のみ INSERT
CREATE POLICY reviews_insert_auth
  ON reviews FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND user_id = auth.uid()::text
  );

-- 投稿者本人 または 店舗オーナー（reply フィールド更新用）
CREATE POLICY reviews_update_own_or_store
  ON reviews FOR UPDATE
  USING (
    user_id = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM stores s
      WHERE s.id = store_id AND s.owner_id = auth.uid()::text
    )
  )
  WITH CHECK (
    user_id = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM stores s
      WHERE s.id = store_id AND s.owner_id = auth.uid()::text
    )
  );

-- 投稿者本人のみ DELETE
CREATE POLICY reviews_delete_own
  ON reviews FOR DELETE
  USING (user_id = auth.uid()::text);

-- ──────────────────────────────────────────────────────────────
-- 5. favorites（RLS 事前有効済み・ポリシー追加）
-- ──────────────────────────────────────────────────────────────
CREATE POLICY favorites_own
  ON favorites FOR ALL
  USING  (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

-- ──────────────────────────────────────────────────────────────
-- 6. cart_reservations（RLS 事前有効済み・ポリシー追加）
-- ──────────────────────────────────────────────────────────────
CREATE POLICY cart_own
  ON cart_reservations FOR ALL
  USING  (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

-- ──────────────────────────────────────────────────────────────
-- 7. notifications
-- ──────────────────────────────────────────────────────────────
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY notifications_own
  ON notifications FOR ALL
  USING  (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

-- ──────────────────────────────────────────────────────────────
-- 8. reports
-- ──────────────────────────────────────────────────────────────
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- SELECT はサービスロール（管理者）専用 — 一般ユーザーからは非表示
CREATE POLICY reports_select_deny
  ON reports FOR SELECT USING (false);

-- ログイン済みユーザーが自分の user_id で通報 INSERT
CREATE POLICY reports_insert_auth
  ON reports FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND user_id = auth.uid()::text
  );

-- UPDATE/DELETE はバックエンド（サービスロール）専用
CREATE POLICY reports_update_deny
  ON reports FOR UPDATE USING (false);

CREATE POLICY reports_delete_deny
  ON reports FOR DELETE USING (false);
