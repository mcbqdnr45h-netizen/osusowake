import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Package, Heart, User, ShoppingBag } from 'lucide-react';
import { Layout } from '@/components/Layout';

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

function GuestPlaceholderScreen() {
  const [, navigate] = useLocation();

  const features = [
    { icon: Package, label: 'お届け', desc: '購入した商品の受取チケットを確認' },
    { icon: Heart,   label: 'お気に入り', desc: 'お気に入りの店舗をリスト管理' },
    { icon: User,    label: 'マイページ', desc: 'プロフィール・ご利用設定' },
  ];

  return (
    <Layout showBottomNav>
      <div className="min-h-[calc(100dvh-64px)] flex flex-col items-center justify-center bg-background px-6 pb-10">
        {/* イラスト */}
        <div className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
          <ShoppingBag className="w-12 h-12 text-primary" />
        </div>

        {/* キャッチコピー */}
        <h1 className="text-2xl font-black text-foreground text-center mb-2 leading-tight">
          ログインして<br />すべての機能を使おう
        </h1>
        <p className="text-sm text-muted-foreground text-center leading-relaxed mb-8 max-w-xs">
          OsusOwake アカウントを作成すると、お得なおすそわけバッグを購入・管理できます。
        </p>

        {/* 機能リスト */}
        <div className="w-full max-w-sm space-y-2.5 mb-8">
          {features.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex items-center gap-3 bg-card border border-border rounded-2xl px-4 py-3">
              <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                <Icon className="w-4.5 h-4.5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground leading-tight">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ボタン */}
        <div className="w-full max-w-sm space-y-3">
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-primary text-white font-black py-4 rounded-2xl text-base shadow-lg shadow-primary/25 active:scale-[0.98] transition-transform"
          >
            ログインする
          </button>
          <button
            onClick={() => navigate('/signup')}
            className="w-full border-2 border-border text-foreground font-bold py-3.5 rounded-2xl text-sm hover:bg-secondary/50 active:scale-[0.98] transition-all"
          >
            新規登録（無料）
          </button>
        </div>

        {/* 閲覧に戻る */}
        <button
          onClick={() => navigate('/')}
          className="mt-5 text-xs text-muted-foreground underline underline-offset-2"
        >
          ログインせずに店舗を見る
        </button>
      </div>
    </Layout>
  );
}

// ── 完全保護（管理・チェックアウトなど）────────────────────────────────────
export function ProtectedRoute({
  component: Component,
  requireRole,
}: {
  component: React.ComponentType;
  requireRole?: 'customer' | 'store_owner';
}) {
  const { user, profile, isLoading } = useAuth();
  const [location, navigate] = useLocation();

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

  if (isLoading) return <AuthLoadingScreen />;
  if (!user) return null;
  if (requireRole && !profile && !profileWaitExpired) return <AuthLoadingScreen />;
  if (requireRole && profile && profile.role !== requireRole) return null;

  return <Component />;
}

// ── ゲストウォール（タブページ：未ログインはプレースホルダー表示）────────────
export function GuestWallRoute({
  component: Component,
}: {
  component: React.ComponentType;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <AuthLoadingScreen />;
  if (!user) return <GuestPlaceholderScreen />;
  return <Component />;
}

// ── ゲスト専用（ログイン済みなら自動リダイレクト）────────────────────────────
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
