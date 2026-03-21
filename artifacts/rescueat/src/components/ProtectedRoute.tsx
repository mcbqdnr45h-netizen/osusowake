import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

function AuthLoadingScreen() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-medium">読み込み中...</p>
      </div>
    </div>
  );
}

/**
 * ProtectedRoute — ログインが必要なページ
 * requireRole: 'store_owner' → 店舗専用、未ログインは /store/login へ
 * requireRole: 'customer'    → ユーザー専用、未ログインは /login へ
 * requireRole なし           → ログインしていれば OK
 */
export function ProtectedRoute({
  component: Component,
  requireRole,
}: {
  component: React.ComponentType;
  requireRole?: 'customer' | 'store_owner' | 'admin';
}) {
  const { user, profile, isLoading } = useAuth();
  const [location, navigate] = useLocation();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      const loginPath = requireRole === 'store_owner' ? '/store/login' : '/login';
      const redirect = encodeURIComponent(location);
      navigate(`${loginPath}?redirect=${redirect}`, { replace: true });
      return;
    }

    if (requireRole && requireRole !== 'admin' && profile && profile.role !== requireRole) {
      if (requireRole === 'store_owner') {
        navigate('/store/login', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [isLoading, user, profile, requireRole, location, navigate]);

  if (isLoading) return <AuthLoadingScreen />;
  if (!user) return null;
  if (requireRole && requireRole !== 'admin' && profile && profile.role !== requireRole) return null;

  return <Component />;
}

/**
 * GuestRoute — 未ログイン専用ページ（ログイン・新規登録など）
 * ログイン済みなら role に応じて自動リダイレクト
 */
export function GuestRoute({
  component: Component,
  storeOnly = false,
}: {
  component: React.ComponentType;
  storeOnly?: boolean;
}) {
  const { user, profile, isLoading } = useAuth();
  const [location, navigate] = useLocation();

  useEffect(() => {
    if (isLoading || !user) return;

    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect');

    if (redirect) {
      navigate(decodeURIComponent(redirect), { replace: true });
      return;
    }

    if (profile?.role === 'store_owner') {
      navigate('/store/dashboard', { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  }, [isLoading, user, profile, navigate, location]);

  if (isLoading) return null;
  if (user) return null;

  return <Component />;
}
