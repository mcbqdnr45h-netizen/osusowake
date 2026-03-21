import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────
// ローディング画面
// ─────────────────────────────────────────────────────────────────
function AuthLoadingScreen() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
          <span className="text-3xl">🍀</span>
        </div>
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-medium">読み込み中...</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// ProtectedRoute
//   requireRole なし       → ログインのみ必要（role 不問）
//   requireRole: 'store_owner' → 店舗オーナー専用
//   requireRole: 'customer'    → 一般ユーザー専用
//
// 未ログイン     → /welcome?redirect=<元のURL>
// ロール違い     → role に応じた適切な場所へ
// ─────────────────────────────────────────────────────────────────
export function ProtectedRoute({
  component: Component,
  requireRole,
}: {
  component: React.ComponentType;
  requireRole?: 'customer' | 'store_owner';
}) {
  const { user, profile, isLoading } = useAuth();
  const [location, navigate] = useLocation();

  useEffect(() => {
    if (isLoading) return;

    // 未ログイン → ウェルカム画面へ（redirect パラメータ付き）
    if (!user) {
      const redirect = encodeURIComponent(location);
      navigate(`/welcome?redirect=${redirect}`, { replace: true });
      return;
    }

    // ロール制限チェック（profile 取得後のみ判定）
    if (requireRole && profile) {
      if (profile.role !== requireRole) {
        // 一般ユーザーが店舗ページへ → トップへ
        if (requireRole === 'store_owner') {
          navigate('/', { replace: true });
        }
        // 店舗オーナーが顧客専用ページへ → ダッシュボードへ
        else if (requireRole === 'customer') {
          navigate('/store/dashboard', { replace: true });
        }
      }
    }
  }, [isLoading, user, profile, requireRole, location, navigate]);

  if (isLoading) return <AuthLoadingScreen />;
  if (!user) return null;

  // profile が取得中 or ロール制限に違反している場合は非表示
  if (requireRole && profile && profile.role !== requireRole) return null;

  // profile 未取得中はロード画面（一瞬だが安全のため）
  if (requireRole && !profile) return <AuthLoadingScreen />;

  return <Component />;
}

// ─────────────────────────────────────────────────────────────────
// GuestRoute — 未ログイン専用ページ（ログイン・新規登録など）
//   ログイン済みなら role に応じて自動リダイレクト
//   ?redirect= パラメータがあれば最優先で遷移
// ─────────────────────────────────────────────────────────────────
export function GuestRoute({
  component: Component,
}: {
  component: React.ComponentType;
}) {
  const { user, profile, isLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (isLoading || !user) return;

    // ?redirect= が指定されていれば最優先
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect');
    if (redirect) {
      navigate(decodeURIComponent(redirect), { replace: true });
      return;
    }

    // role に応じて振り分け（profile 取得後のみ）
    if (profile) {
      if (profile.role === 'store_owner') {
        navigate('/store/dashboard', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [isLoading, user, profile, navigate]);

  // Auth チェック中はちらつき防止のため何も表示しない
  if (isLoading) return null;
  if (user) return null;

  return <Component />;
}
