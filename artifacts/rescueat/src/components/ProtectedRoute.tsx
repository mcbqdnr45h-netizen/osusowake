import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────
// ローディング画面（auth / profile 取得中）
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
//
//  AuthContext の改修により isLoading=false の時点で
//  user と profile は両方確定済み（fetchProfile を await している）。
//
//  isLoading=true  → スピナー（絶対にリダイレクトしない）
//  !user           → /welcome へ
//  role 不一致     → 各ロールのホームへ
//  その他          → <Component /> を表示
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
    // isLoading 中は絶対に判定しない（profile が揃っていない可能性があるため）
    if (isLoading) return;

    // 未ログイン → ウェルカム画面へ（redirect パラメータ付き）
    if (!user) {
      const redirect = encodeURIComponent(location);
      navigate(`/welcome?redirect=${redirect}`, { replace: true });
      return;
    }

    // ロール制限チェック
    // AuthContext 改修後、isLoading=false の時点で profile は揃っているが
    // signOut 直後など profile=null になる瞬間があるため null ガードを残す
    if (requireRole && profile) {
      if (profile.role !== requireRole) {
        if (requireRole === 'store_owner') {
          // 一般ユーザーが店舗ページへ → トップへ
          navigate('/', { replace: true });
        } else {
          // 店舗オーナーが顧客専用ページへ → ダッシュボードへ
          navigate('/store/dashboard', { replace: true });
        }
      }
    }
  }, [isLoading, user, profile, requireRole, location, navigate]);

  // ① auth+profile 取得完了まで必ずスピナー
  if (isLoading) return <AuthLoadingScreen />;

  // ② 未ログイン（effect がリダイレクト中）→ 何も表示しない
  if (!user) return null;

  // ③ profile が null（極稀なタイミング）→ スピナーで待機
  if (requireRole && !profile) return <AuthLoadingScreen />;

  // ④ ロール違反（effect がリダイレクト中）→ 何も表示しない（コンポーネントを見せない）
  if (requireRole && profile && profile.role !== requireRole) return null;

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

    // profile が揃ったら role に応じて振り分け
    if (profile) {
      if (profile.role === 'store_owner') {
        navigate('/store/dashboard', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [isLoading, user, profile, navigate]);

  // auth+profile 取得完了まで何も表示しない（ちらつき防止）
  if (isLoading) return null;
  // ログイン済みなら effect がリダイレクト中 → 何も表示しない
  if (user) return null;

  return <Component />;
}
