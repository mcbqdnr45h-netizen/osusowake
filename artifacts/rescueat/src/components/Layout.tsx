import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import {
  Map, Search, Package, Heart, User, Menu, X,
  FileText, Shield, Store, Settings, ChevronRight, Coins,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMyStore } from '@/hooks/use-my-store';
import { useAuth } from '@/contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
  showBottomNav?: boolean;
  hideFooter?: boolean;
}

export function Layout({ children, showBottomNav = true, hideFooter = false }: LayoutProps) {
  const [location] = useLocation();
  const { isApprovedOwner } = useMyStore();
  const { user, profile } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  useEffect(() => { setMenuOpen(false); }, [location]);

  const navItems = [
    { href: '/',                icon: Map,     label: '発見'       },
    { href: '/search',          icon: Search,  label: '検索'       },
    { href: '/my-reservations', icon: Package, label: 'お届け'     },
    { href: '/favorites',       icon: Heart,   label: 'お気に入り' },
    { href: user ? '/mypage' : '/welcome', icon: User, label: user ? 'マイページ' : 'ログイン' },
  ];

  const desktopNavItems = [
    { href: '/',                label: '発見'   },
    { href: '/search',          label: '検索'   },
    { href: '/my-reservations', label: 'お届け' },
  ];

  const legalLinks = [
    { href: '/terms',   icon: FileText, label: '利用規約' },
    { href: '/privacy', icon: Shield,   label: 'プライバシーポリシー' },
    { href: '/legal',   icon: Store,    label: '特定商取引に基づく表記' },
  ];

  const isLoggedIn = !!user;

  return (
    <div className={`${hideFooter ? 'h-dvh overflow-hidden' : 'min-h-screen pb-[80px] md:pb-0'} bg-background text-foreground flex flex-col font-sans`}>

      {/* ── Top Header ── */}
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border shadow-sm shrink-0"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-display font-black text-2xl tracking-tight text-primary">食べロス</span>
          </Link>

          <div className="flex items-center gap-4">
            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              {desktopNavItems.map((item) => (
                <Link key={item.href} href={item.href}
                  className={`font-bold transition-colors hover:text-primary ${location === item.href ? 'text-primary' : 'text-muted-foreground'}`}>
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Hamburger Menu */}
            <div className="relative" ref={menuRef}>
              <button onClick={() => setMenuOpen((v) => !v)} aria-label="メニューを開く"
                className={`flex items-center justify-center w-10 h-10 rounded-xl hover:bg-muted transition-colors text-foreground relative ${isLoggedIn ? 'ring-2 ring-primary/30' : ''}`}>
                <AnimatePresence mode="wait" initial={false}>
                  {menuOpen ? (
                    <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                      <X className="w-5 h-5" />
                    </motion.div>
                  ) : (
                    <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                      <Menu className="w-5 h-5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="absolute right-0 mt-2 w-72 bg-card border border-border rounded-2xl shadow-xl overflow-hidden z-50"
                  >
                    {isLoggedIn ? (
                      <Link href="/mypage" className="block hover:bg-muted/60 transition-colors">
                        <div className="px-4 py-4 flex items-center gap-3">
                          <div className="w-11 h-11 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0">
                            <User className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-foreground truncate">{user.email}</p>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                                profile?.role === 'store_owner'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-primary/10 text-primary'
                              }`}>
                                {profile?.role === 'store_owner' ? '🏪 店舗オーナー' : '👤 お客様'}
                              </span>
                              {profile && (
                                <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-500">
                                  <Coins className="w-3 h-3" />
                                  {profile.points_balance.toLocaleString()} pt
                                </span>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                        </div>
                      </Link>
                    ) : (
                      <div className="px-4 py-3 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="w-4 h-4" />
                          <span>ゲストユーザー</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link href="/login"  className="text-xs font-bold text-primary border border-primary/40 rounded-lg px-2.5 py-1 hover:bg-primary/5 transition-colors">ログイン</Link>
                          <Link href="/signup" className="text-xs font-bold text-white bg-primary rounded-lg px-2.5 py-1 hover:bg-primary/90 transition-colors">新規登録</Link>
                        </div>
                      </div>
                    )}

                    {isLoggedIn && (
                      <Link href="/settings" className="flex items-center gap-3 px-4 py-2.5 border-t border-border/60 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                        <Settings className="w-4 h-4 shrink-0" />
                        アカウント設定
                      </Link>
                    )}

                    <div className="border-t border-border/60">
                      <div className="px-4 pt-3 pb-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">規約・その他</p>
                      </div>
                      <div className="pb-1">
                        {legalLinks.map((item) => {
                          const Icon = item.icon;
                          return (
                            <Link key={item.href} href={item.href}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">
                              <Icon className="w-4 h-4 text-primary shrink-0" />
                              {item.label}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1 min-h-0 w-full relative flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="flex-1 flex flex-col"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ── Footer ── */}
      {!hideFooter && (
        <footer className="bg-background border-t border-border mt-auto">
          <div className="md:hidden px-5 py-3">
            <p className="text-center text-[10px] text-muted-foreground/50">© 2026 食べロス</p>
          </div>
          <div className="hidden md:block max-w-7xl mx-auto px-6 py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="font-black text-lg text-primary">食べロス</span>
                <span className="text-xs text-muted-foreground">お店の味を、誰かにおすそ分けしよう</span>
              </div>
              <div className="flex flex-wrap items-center gap-5 text-xs text-muted-foreground">
                {profile?.role === 'store_owner' && isApprovedOwner && (
                  <>
                    <Link href="/store-dashboard" className="hover:text-primary transition-colors font-medium">店舗ダッシュボード</Link>
                    <span>·</span>
                  </>
                )}
                <a href="https://forms.gle/uhMoXjjF9YzkR52a6" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors font-medium">
                  ヘルプ・お問い合わせ
                </a>
                <span>·</span>
                <span className="text-muted-foreground/60">© 2026 食べロス. All rights reserved.</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border/50 text-xs text-muted-foreground/60 text-center">
              初期費用・月額0円。売れた場合のみ手数料20%が発生する成果報酬型。手数料は決済額から自動控除されます。
            </div>
          </div>
        </footer>
      )}

      {/* ── Mobile Bottom Nav（5アイテム・片手操作最適化） ── */}
      {showBottomNav && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border shadow-[0_-8px_32px_rgba(0,0,0,0.06)]"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="flex items-stretch h-[62px] px-1">
            {navItems.map((item) => {
              const isActive = location === item.href ||
                (item.href === '/my-reservations' && location.startsWith('/my-reservations')) ||
                (item.href === '/favorites' && location === '/favorites');
              const Icon = item.icon;
              const isUser = item.href === '/mypage' || item.href === '/welcome';

              return (
                <Link key={item.href} href={item.href}
                  className="relative flex flex-col items-center justify-center flex-1 gap-0.5 min-w-0 py-2 transition-opacity active:opacity-70">

                  {/* アクティブインジケーター（上部バー） */}
                  {isActive && (
                    <motion.div
                      layoutId="bottom-nav-bar"
                      className="absolute top-0 w-10 h-1 bg-primary rounded-b-full shadow-sm shadow-primary/40"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}

                  {/* アイコンコンテナ */}
                  <div className={`relative flex items-center justify-center w-10 h-7 rounded-xl transition-all duration-200
                    ${isActive ? 'bg-primary/12 scale-105' : 'hover:bg-muted'}`}>
                    <Icon
                      className={`w-5 h-5 transition-all duration-200 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
                      strokeWidth={isActive ? 2.5 : 2}
                      fill={isActive && !isUser ? 'rgba(var(--primary)/0.1)' : 'none'}
                    />
                    {/* ログイン状態バッジ */}
                    {isUser && isLoggedIn && (
                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-primary rounded-full border-2 border-background" />
                    )}
                  </div>

                  {/* ラベル */}
                  <span className={`text-[9px] font-black tracking-wide leading-none transition-colors duration-200
                    ${isActive ? 'text-primary' : 'text-muted-foreground/70'}`}>
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
