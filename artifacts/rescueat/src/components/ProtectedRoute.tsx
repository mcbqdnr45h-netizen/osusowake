import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import logoUrl from '@/lib/logo';
import { useAuth } from '@/contexts/AuthContext';
import { useMyStoresContext } from '@/contexts/MyStoresContext';
import { logNav } from '@/lib/nav-debug';
import {
  Loader2, Ticket, Heart, User, ArrowRight,
} from 'lucide-react';
import { Layout } from '@/components/Layout';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

function AuthLoadingScreen() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-gradient-to-br from-orange-50/40 via-background to-rose-50/30">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl animate-pulse" />
          <img loading="lazy" decoding="async" src={logoUrl} alt="おすそわけ" className="relative w-16 h-16 rounded-2xl object-cover shadow-lg ring-1 ring-black/5" />
        </div>
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground font-medium tracking-wide">読み込み中…</p>
      </div>
    </div>
  );
}

function GuestPlaceholderScreen() {
  const [, navigate] = useLocation();

  const features = [
    { icon: Ticket, label: 'お届け',     desc: '購入した商品の受取チケットを確認' },
    { icon: Heart,  label: 'お気に入り', desc: '気になる店舗をブックマーク' },
    { icon: User,   label: 'マイページ',  desc: 'プロフィール・通知・ご利用設定' },
  ] as const;

  return (
    <Layout showBottomNav>
      <div className="relative flex-1 min-h-0 flex flex-col bg-[#1F1E1B] overflow-y-auto overflow-x-hidden">
        {/* ── 背景画像 + 縦グラデ オーバーレイ ─── */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img
            src={`${BASE}/images/refine-a/welcome-bg.png`}
            alt=""
            className="w-full h-full object-cover opacity-30"
            loading="eager"
            decoding="async"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to top, rgba(20,18,15,0.96) 0%, rgba(20,18,15,0.82) 40%, rgba(20,18,15,0.6) 70%, rgba(20,18,15,0.4) 100%)',
            }}
          />
        </div>

        {/* ── コンテンツ ─── */}
        <div className="relative z-10 flex-1 flex flex-col px-7 pt-8 pb-6">

          {/* ブランドマーク */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="mb-6 shrink-0"
          >
            <div className="flex items-baseline gap-3 mb-1.5">
              <span className="w-8 h-[1px] bg-[#E8786C]" />
              <p className="text-[#E8786C] text-[10px] font-bold tracking-[0.32em] uppercase">
                Editorial
              </p>
            </div>
            <h2
              className="text-white font-bold tracking-[0.18em] leading-none"
              style={{
                fontFamily: '"Noto Serif JP", serif',
                fontSize: '34px',
                textShadow: '0 2px 12px rgba(0,0,0,0.4)',
              }}
            >
              おすそわけ
            </h2>
          </motion.div>

          {/* キャッチコピー */}
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="mb-4 leading-[1.22] shrink-0"
            style={{
              fontFamily: '"Noto Serif JP", serif',
              fontWeight: 600,
              fontSize: '26px',
              color: '#FFFFFF',
              textShadow: '0 2px 14px rgba(0,0,0,0.55), 0 1px 2px rgba(0,0,0,0.7)',
              letterSpacing: '0.02em',
            }}
          >
            ログインして、<br />
            <span style={{ color: '#F5A89E', fontStyle: 'italic' }}>
              おいしいおすそわけ
            </span>を。
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-[13px] leading-relaxed mb-7 max-w-[300px] shrink-0 text-[#F4F1EA]/80"
            style={{ textShadow: '0 1px 6px rgba(0,0,0,0.5)' }}
          >
            お店の余ったおいしさを、お得に持ち帰り。
            まずは無料アカウントで始めよう。
          </motion.p>

          {/* 機能リスト */}
          <div className="space-y-3 mb-7">
            {features.map(({ icon: Icon, label, desc }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.07, duration: 0.4 }}
                className="flex items-center gap-3.5"
              >
                <span className="w-9 h-9 rounded-full bg-[#E8786C]/15 border border-[#E8786C]/30 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-[#F5A89E]" strokeWidth={2} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-bold text-white leading-tight">{label}</p>
                  <p className="text-[11px] text-white/55 mt-0.5 truncate">{desc}</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-white/30 shrink-0" />
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.45 }}
            className="space-y-3 shrink-0"
          >
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full h-13 py-3.5 bg-[#FBFBFA] text-[#1F1E1B] flex items-center justify-center gap-2 font-bold tracking-widest active:scale-[0.98] transition-transform rounded-sm shadow-xl shadow-black/30"
            >
              ログインする
              <ArrowRight className="w-4 h-4" strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={() => navigate('/signup')}
              className="w-full h-13 py-3.5 bg-transparent border border-[#FBFBFA]/30 text-[#FBFBFA] font-medium tracking-widest hover:bg-[#FBFBFA]/10 active:scale-[0.98] transition-colors rounded-sm"
            >
              新規登録（無料）
            </button>
          </motion.div>

          {/* ゲスト閲覧リンク */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.75, duration: 0.4 }}
            type="button"
            onClick={() => navigate('/')}
            className="mt-4 text-center text-[11px] text-white/45 hover:text-white/70 transition-colors py-1"
          >
            ログインせずに店舗を見る →
          </motion.button>
        </div>
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
  const { stores, loading: storesLoading } = useMyStoresContext();
  const [location, navigate] = useLocation();

  // store_owner ルートかつ profile.role が customer の場合でも
  // stores をロード中 OR stores がある = 整合修正待ちの可能性 → 待機
  const hasStores = stores.length > 0;
  const isStoreRoleReconciling =
    requireRole === 'store_owner' &&
    profile?.role !== 'store_owner' &&
    (storesLoading || hasStores);

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
      logNav('ProtectedRoute(no user)', `/welcome?redirect=${redirect}`, { from: location, requireRole });
      navigate(`/welcome?redirect=${redirect}`, { replace: true });
      return;
    }

    if (requireRole && profile && !storesLoading) {
      if (profile.role !== requireRole) {
        // store_owner ルートで store を持っているなら整合修正待ち → リダイレクトしない
        if (requireRole === 'store_owner' && hasStores) return;
        if (requireRole === 'store_owner') {
          logNav('ProtectedRoute(role mismatch, customer on store route)', '/', { from: location, profileRole: profile.role });
          navigate('/', { replace: true });
        } else {
          logNav('ProtectedRoute(role mismatch, store on customer route)', '/store/dashboard', { from: location, profileRole: profile.role });
          navigate('/store/dashboard', { replace: true });
        }
      }
    }
  }, [isLoading, user, profile, requireRole, location, navigate, storesLoading, hasStores]);

  if (isLoading) return <AuthLoadingScreen />;
  if (!user) return null;
  if (requireRole && !profile && !profileWaitExpired) return <AuthLoadingScreen />;
  // store_owner ルートで整合修正待ちの間はローディング表示（誤リダイレクト防止）
  if (isStoreRoleReconciling) return <AuthLoadingScreen />;
  if (requireRole && profile && profile.role !== requireRole && !hasStores) return null;

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

  useEffect(() => {
    if (isLoading || !user) return;

    // redirect クエリがある場合はそこへ
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect');
    if (redirect) {
      const decoded = decodeURIComponent(redirect);
      if (decoded.startsWith('/') && !decoded.startsWith('//')) {
        logNav('GuestRoute(redirect param)', decoded);
        navigate(decoded, { replace: true });
        return;
      }
    }

    // profile が確定してからロールで振り分け
    if (profile) {
      // オーナー・一般とも /mypage へ (発見ページに飛ばさない)
      logNav('GuestRoute(logged-in)', '/mypage', { role: profile.role });
      navigate('/mypage', { replace: true });
    }
  }, [isLoading, user, profile, navigate]);

  if (isLoading) return null;
  // ログイン済み (user あり) なら遷移完了まで何も表示しない (再ログイン画面の無限ループ防止)
  if (user) return null;

  return <Component />;
}
