import React from 'react';
import { Link, useLocation } from 'wouter';
import { LayoutGrid, BarChart2, UserCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useMyStore } from '@/hooks/use-my-store';
import { NotificationsBell } from '@/components/NotificationsBell';

interface StoreLayoutProps {
  children: React.ReactNode;
  showBottomNav?: boolean;
  showHeader?: boolean;
}

const BASE_NAV_ITEMS = [
  { href: '/store/dashboard', icon: LayoutGrid, label: '出品管理' },
  { href: '/store/sales',     icon: BarChart2,  label: '売上確認' },
];

export function StoreLayout({ children, showBottomNav = true, showHeader = true }: StoreLayoutProps) {
  const [location] = useLocation();
  const { store, loading: storeLoading } = useMyStore();

  // ナビ表示条件:
  // - pending/pending_review → StoreDashboard が既に <Layout> を返すので StoreLayout には来ない
  // - applied/approved/suspended/rejected → StoreLayout が使われるのでナビを表示
  // ※ ステータス判定は親ページが行うため、ここでは store が存在すればナビを表示する
  const storeReady = !!store;
  const shouldShowNav = showBottomNav && storeReady;

  const navItems = [...BASE_NAV_ITEMS, { href: '/mypage', icon: UserCircle, label: 'マイページ' }];

  return (
    <div
      className="min-h-dvh flex flex-col bg-[#FAFAF8] text-foreground"
    >
      {/* ── ストアヘッダー ───────────────────────────────────── */}
      {showHeader && (
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-orange-100 shadow-[0_1px_8px_rgba(255,140,0,0.07)] shrink-0"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          <div className="px-4 h-14 flex items-center gap-3">
            {/* ブランドマーク */}
            <div className="w-8 h-8 rounded-[10px] bg-primary flex items-center justify-center shrink-0 shadow-sm shadow-primary/20">
              <span className="text-white font-black text-[11px] leading-none tracking-tight">Ow</span>
            </div>

            {/* タイトル＋店舗名 */}
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-primary/70 tracking-widest leading-none">
                Osusowake 店舗管理
              </p>
              <p className="text-sm font-black text-foreground truncate leading-tight mt-0.5">
                {store?.name ?? <span className="text-muted-foreground">読み込み中…</span>}
              </p>
            </div>

            {/* 🔔 通知ベル */}
            <NotificationsBell />

            {/* ステータスバッジ */}
            {store && (() => {
              const s = store.status;
              const cfg =
                s === 'approved'                          ? { label: '✓ 承認済み', cls: 'bg-green-50 text-green-700 border border-green-200' }
                : s === 'rejected'                        ? { label: '❌ 却下',    cls: 'bg-red-50 text-red-600 border border-red-200' }
                : s === 'suspended'                       ? { label: '停止中',     cls: 'bg-gray-100 text-gray-500 border border-gray-200' }
                : s === 'applied'                         ? { label: '本人確認中', cls: 'bg-blue-50 text-blue-700 border border-blue-200' }
                : /* pending / pending_review / unknown */  { label: '審査中',     cls: 'bg-amber-50 text-amber-700 border border-amber-200' };
              return (
                <span className={`text-[10px] font-black px-2 py-1 rounded-full shrink-0 ${cfg.cls}`}>
                  {cfg.label}
                </span>
              );
            })()}
          </div>
        </header>
      )}

      {/* ── メインコンテンツ ─────────────────────────────────── */}
      <main className="flex-1 w-full flex flex-col">
        {children}
        {/* ボトムナビ分のスペーサー（固定ナビによるコンテンツ隠れ防止） */}
        {shouldShowNav && (
          <div
            className="shrink-0"
            style={{ height: 'calc(62px + env(safe-area-inset-bottom))' }}
            aria-hidden="true"
          />
        )}
      </main>

      {/* ── 店舗専用ボトムナビ ──────────────────────────────── */}
      {shouldShowNav && (
        <div
          className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-orange-100 shadow-[0_-4px_24px_rgba(255,140,0,0.08)]"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="flex items-stretch h-[62px] px-1">
            {navItems.map((item) => {
              const isActive =
                item.href === '/store/dashboard'
                  ? location === '/store/dashboard'
                  : location.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative flex flex-col items-center justify-center flex-1 gap-0.5 min-w-0 py-2 transition-opacity active:opacity-60"
                >
                  {isActive && (
                    <motion.div
                      layoutId="store-bottom-nav-bar"
                      className="absolute top-0 w-10 h-[3px] bg-primary rounded-b-full shadow-sm shadow-primary/30"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}

                  <div className={`flex items-center justify-center w-10 h-7 rounded-xl transition-all duration-200 ${
                    isActive ? 'bg-primary/10 scale-105' : ''
                  }`}>
                    <Icon
                      className={`w-5 h-5 transition-all duration-200 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                  </div>

                  <span className={`text-[9px] font-black tracking-wide leading-none transition-colors duration-200 ${
                    isActive ? 'text-primary' : 'text-muted-foreground/70'
                  }`}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
