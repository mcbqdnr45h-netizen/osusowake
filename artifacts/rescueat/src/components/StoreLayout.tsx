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

const NAV_ITEMS = [
  { href: '/store/dashboard', icon: LayoutGrid, label: '出品管理'   },
  { href: '/store/sales',     icon: BarChart2,  label: '売上確認'   },
  { href: '/mypage',          icon: UserCircle, label: 'マイページ' },
];

export function StoreLayout({ children, showBottomNav = true, showHeader = true }: StoreLayoutProps) {
  const [location] = useLocation();
  const { store } = useMyStore();

  return (
    <div
      className="min-h-dvh flex flex-col bg-[#FAFAF8] text-foreground"
      style={{ paddingBottom: showBottomNav ? 'calc(72px + env(safe-area-inset-bottom))' : undefined }}
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
              <p className="text-[10px] font-bold text-primary/70 tracking-widest uppercase leading-none">
                OsusOwake 店舗管理
              </p>
              <p className="text-sm font-black text-foreground truncate leading-tight mt-0.5">
                {store?.name ?? <span className="text-muted-foreground">読み込み中…</span>}
              </p>
            </div>

            {/* 🔔 通知ベル */}
            <NotificationsBell />

            {/* ステータスバッジ */}
            {store && (
              <span className={`text-[10px] font-black px-2 py-1 rounded-full shrink-0 ${
                store.status === 'approved'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {store.status === 'approved' ? '✓ 承認済み' : '審査中'}
              </span>
            )}
          </div>
        </header>
      )}

      {/* ── メインコンテンツ ─────────────────────────────────── */}
      <main className="flex-1 min-h-0 w-full flex flex-col">
        {children}
      </main>

      {/* ── 店舗専用ボトムナビ ──────────────────────────────── */}
      {showBottomNav && (
        <div
          className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-orange-100 shadow-[0_-4px_24px_rgba(255,140,0,0.08)]"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="flex items-stretch h-[62px] px-1">
            {NAV_ITEMS.map((item) => {
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
