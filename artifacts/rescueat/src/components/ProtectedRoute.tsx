import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

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

export function ProtectedRoute({
  component: Component,
  requireRole,
}: {
  component: React.ComponentType;
  requireRole?: 'customer' | 'store_owner';
}) {
  const { user, profile, isLoading } = useAuth();
  const [location, navigate] = useLocation();

  // profile=null が続く場合のフォールバックタイマー（3秒後に強制通過）
  const [profileWaitExpired, setProfileWaitExpired] = useState(false);
  useEffect(() => {
    if (!isLoading && user && requireRole && !profile) {
      const t = setTimeout(() => {
        console.warn('[ProtectedRoute] profile still null after 3s — proceeding anyway');
        setProfileWaitExpired(true);
      }, 3000);
      return () => clearTimeout(t);
    }
    setProfileWaitExpired(false);
    return undefined;
  }, [isLoading, user, profile, requireRole]);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      const redirect = encodeURIComponent(location);
      navigate(`/welcome?redirect=${redirect}`, { replace: true });
      return;
    }

    if (requireRole && profile) {
      if (profile.role !== requireRole) {
        if (requireRole === 'store_owner') {
          navigate('/', { replace: true });
        } else {
          navigate('/store/dashboard', { replace: true });
        }
      }
    }
  }, [isLoading, user, profile, requireRole, location, navigate]);

  // auth取得中はスピナー
  if (isLoading) return <AuthLoadingScreen />;

  // 未ログイン → effectがリダイレクト中
  if (!user) return null;

  // profile=null でロールチェック必要 → 最大3秒だけ待機
  if (requireRole && !profile && !profileWaitExpired) return <AuthLoadingScreen />;

  // ロール違反 → effectがリダイレクト中
  if (requireRole && profile && profile.role !== requireRole) return null;

  return <Component />;
  // eslint-disable-next-line no-unreachable
}

export function GuestRoute({
  component: Component,
}: {
  component: React.ComponentType;
}) {
  const { user, profile, isLoading } = useAuth();
  const [, navigate] = useLocation();

  const wasAlreadyLoggedIn = useRef<boolean | null>(null);

  useEffect(() => {
    if (!isLoading && wasAlreadyLoggedIn.current === null) {
      wasAlreadyLoggedIn.current = !!user;
    }
  }, [isLoading, user]);

  useEffect(() => {
    if (isLoading || !user) return;
    if (!wasAlreadyLoggedIn.current) return;

    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect');
    if (redirect) {
      navigate(decodeURIComponent(redirect), { replace: true });
      return;
    }

    if (profile) {
      if (profile.role === 'store_owner') {
        navigate('/mypage', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [isLoading, user, profile, navigate]);

  if (isLoading) return null;
  if (user && wasAlreadyLoggedIn.current) return null;

  return <Component />;
}
