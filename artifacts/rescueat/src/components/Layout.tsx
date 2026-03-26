import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import {
  Map, MapPin, Package, Heart, User, Menu, X,
  FileText, Shield, Store, Settings, ChevronRight, Coins, BarChart2,
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

  const isStoreOwner = profile?.role === 'store_owner';

  const storeNavItems = [
    { href: '/store/dashboard', icon: Store,     label: '出品管理', isUser: false },
    { href: '/store/sales',     icon: BarChart2, label: '売上確認', isUser: false },
    { href: '/mypage',          icon: User,      label: 'マイページ', isUser: true },
  ];

  const customerNavItems = [
    { href: '/',                                 icon: Map,     label: '発見',       isUser: false },
    { href: '/map',                              icon: MapPin,  label: 'マップ',     isUser: false },
    { href: '/my-reservations',                  icon: Package, label: 'お届け',     isUser: false },
    { href: '/favorites',                        icon: Heart,   label: 'お気に入り', isUser: false },
    { href: user ? '/mypage' : '/welcome',       icon: User,    label: user ? 'マイページ' : 'ログイン', isUser: true },
  ];

  const navItems = isStoreOwner ? storeNavItems : customerNavItems;

  const desktopNavItems = [
    { href: '/',                label: '発見'  },
    { href: '/map',             label: 'マップ' },
    { href: '/my-reservations', label: 'お届け' },
  ];

  const legalLinks = [
    { href: '/terms',   icon: FileText, label: '利用規約' },
    { href: '/privacy', icon: Shield,   label: 'プライバシーポリシー' },
    { href: '/legal',   icon: Store,    label: '特定商取引に基づく表記' },
  ];

  const isLoggedIn = !!user;

  return (
    <div
      className={`${hideFooter ? 'h-dvh overflow-hidden' : 'min-h-screen md:!pb-0'} bg-background text-foreground flex flex-col font-sans`}
      style={!hideFooter ? { paddingBottom: 'calc(64px + env(safe-area-inset-bottom))' } : undefined}
    >

      {/* ── Top Header ───────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 shrink-0"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        {/* ガラスモルフィズム効果: backdrop-blur + 薄いbg + 細いborder-bottom */}
        <div className="bg-white/80 dark:bg-background/85 backdrop-blur-xl border-b border-border/40"
          style={{ boxShadow: '0 1px 0 rgba(10,8,6,0.06), 0 2px 12px rgba(10,8,6,0.04)' }}>
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group shrink-0">
              <div className="w-8 h-8 rounded-[10px] bg-primary flex items-center justify-center shadow-sm shadow-primary/25 transition-transform duration-200 group-hover:scale-105">
                <span className="text-white font-black text-[11px] leading-none tracking-tight">Ow</span>
              </div>
              <span className="leading-none font-black text-[19px] tracking-[-0.04em]">
                <span className="text-foreground">Osus</span><span className="text-primary">Owake</span>
              </span>
            </Link>

            <div className="flex items-center gap-3">
              {/* Desktop Nav */}
              <nav className="hidden md:flex items-center gap-6">
                {desktopNavItems.map((item) => (
                  <Link key={item.href} href={item.href}
                    className={`text-sm font-semibold transition-all duration-150 relative py-1
                      ${location === item.href
                        ? 'text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                      }`}>
                    {item.label}
                    {location === item.href && (
                      <motion.div
                        layoutId="desktop-nav-indicator"
                        className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-primary rounded-full"
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      />
                    )}
                  </Link>
                ))}
              </nav>

              {/* Hamburger */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-label="メニューを開く"
                  className={`flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-150 text-foreground
                    ${menuOpen
                      ? 'bg-muted text-primary'
                      : 'hover:bg-muted/70'
                    }
                    ${isLoggedIn ? 'ring-2 ring-primary/25 ring-offset-1 ring-offset-background' : ''}`}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {menuOpen ? (
                      <motion.div key="x"
                        initial={{ rotate: -45, opacity: 0, scale: 0.7 }}
                        animate={{ rotate: 0,   opacity: 1, scale: 1 }}
                        exit={{ rotate: 45,    opacity: 0, scale: 0.7 }}
                        transition={{ duration: 0.14 }}>
                        <X className="w-4.5 h-4.5" />
                      </motion.div>
                    ) : (
                      <motion.div key="menu"
                        initial={{ rotate: 45, opacity: 0, scale: 0.7 }}
                        animate={{ rotate: 0,  opacity: 1, scale: 1 }}
                        exit={{ rotate: -45,   opacity: 0, scale: 0.7 }}
                        transition={{ duration: 0.14 }}>
                        <Menu className="w-4.5 h-4.5" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>

                <AnimatePresence>
                  {menuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0,  scale: 1 }}
                      exit={{ opacity: 0,  y: -6, scale: 0.97 }}
                      transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute right-0 mt-2 w-72 bg-card rounded-2xl overflow-hidden z-50"
                      style={{ boxShadow: '0 8px 32px rgba(10,8,6,0.14), 0 2px 8px rgba(10,8,6,0.06), 0 0 0 1px rgba(10,8,6,0.06)' }}
                    >
                      {/* ユーザー情報 */}
                      {isLoggedIn ? (
                        <Link href="/mypage"
                          className="block transition-colors duration-150 hover:bg-muted/50">
                          <div className="px-4 py-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/12 border border-primary/25 flex items-center justify-center shrink-0">
                              <User className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-foreground truncate">{user.email}</p>
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                  profile?.role === 'store_owner'
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-primary/10 text-primary'
                                }`}>
                                  {profile?.role === 'store_owner' ? '🏪 店舗オーナー' : '👤 お客様'}
                                </span>
                                {profile && (
                                  <span className="flex items-center gap-0.5 text-[10px] font-semibold text-amber-600">
                                    <Coins className="w-3 h-3" />
                                    {profile.points_balance.toLocaleString()} pt
                                  </span>
                                )}
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground/50 shrink-0" />
                          </div>
                        </Link>
                      ) : (
                        <div className="px-4 py-3.5 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <User className="w-4 h-4" />
                            <span>ゲストユーザー</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Link href="/login"
                              className="text-xs font-semibold text-primary border border-primary/35 rounded-lg px-3 py-1.5 hover:bg-primary/6 transition-colors">
                              ログイン
                            </Link>
                            <Link href="/signup"
                              className="text-xs font-semibold text-white bg-primary rounded-lg px-3 py-1.5 hover:brightness-105 transition-all shadow-sm shadow-primary/20">
                              新規登録
                            </Link>
                          </div>
                        </div>
                      )}

                      {isLoggedIn && (
                        <Link href="/settings"
                          className="flex items-center gap-3 px-4 py-2.5 border-t border-border/40 text-sm font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors duration-150">
                          <Settings className="w-4 h-4 shrink-0" />
                          アカウント設定
                        </Link>
                      )}

                      {/* 規約リンク */}
                      <div className="border-t border-border/40">
                        <div className="px-4 pt-3 pb-1">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                            規約・その他
                          </p>
                        </div>
                        <div className="pb-2">
                          {legalLinks.map((item) => {
                            const Icon = item.icon;
                            return (
                              <Link key={item.href} href={item.href}
                                className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors duration-150">
                                <Icon className="w-4 h-4 text-primary/70 shrink-0" />
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
        </div>
      </header>

      {/* ── Main Content ─────────────────────────────────────────────── */}
      <main className="flex-1 min-h-0 w-full relative flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.20, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1 flex flex-col"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      {!hideFooter && (
        <footer className="bg-background border-t border-border/40 mt-auto">
          <div className="md:hidden px-5 py-3">
            <p className="text-center text-[10px] text-muted-foreground/40">© 2026 OsusOwake</p>
          </div>
          <div className="hidden md:block max-w-7xl mx-auto px-6 py-7">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-[8px] bg-primary flex items-center justify-center shrink-0">
                  <span className="text-white font-black text-[10px] leading-none">Ow</span>
                </div>
                <span className="font-black text-[17px] tracking-[-0.03em]">
                  <span className="text-foreground">Osus</span><span className="text-primary">Owake</span>
                </span>
                <span className="text-xs text-muted-foreground">お店の味を、誰かにおすそ分けしよう</span>
              </div>
              <div className="flex flex-wrap items-center gap-5 text-xs text-muted-foreground">
                {profile?.role === 'store_owner' && isApprovedOwner && (
                  <>
                    <Link href="/store-dashboard"
                      className="hover:text-primary transition-colors font-medium">
                      店舗ダッシュボード
                    </Link>
                    <span className="text-border">·</span>
                  </>
                )}
                <a href="https://forms.gle/uhMoXjjF9YzkR52a6"
                  target="_blank" rel="noopener noreferrer"
                  className="hover:text-primary transition-colors font-medium">
                  ヘルプ・お問い合わせ
                </a>
                <span className="text-border">·</span>
                <span className="text-muted-foreground/50">© 2026 OsusOwake. All rights reserved.</span>
              </div>
            </div>
            <div className="mt-5 pt-4 border-t border-border/30 text-xs text-muted-foreground/50 text-center">
              初期費用・月額0円。売れた場合のみ手数料25%が発生する成果報酬型。手数料は決済額から自動控除されます。
            </div>
          </div>
        </footer>
      )}

      {/* ── Mobile Bottom Nav ─────────────────────────────────────────── */}
      {showBottomNav && (
        <div
          className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/85 dark:bg-background/90 backdrop-blur-xl border-t border-border/30"
          style={{
            paddingBottom: 'env(safe-area-inset-bottom)',
            boxShadow: '0 -1px 0 rgba(10,8,6,0.05), 0 -4px 20px rgba(10,8,6,0.06)',
          }}
        >
          <div className="flex items-stretch h-[64px] px-2">
            {navItems.map((item) => {
              const isActive =
                location === item.href ||
                (item.href === '/my-reservations' && location.startsWith('/my-reservations')) ||
                (item.href === '/favorites' && location === '/favorites') ||
                (item.href === '/store/dashboard' && (location === '/store-onboarding' || location === '/store/bank-setup')) ||
                (item.href === '/store/bags' && location.startsWith('/store/bag'));
              const Icon = item.icon;
              const isUser = item.isUser ?? (item.href === '/mypage' || item.href === '/welcome');

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative flex flex-col items-center justify-center flex-1 gap-0.5 min-w-0 py-2 transition-opacity duration-100 active:opacity-60"
                >
                  {/* アクティブピル（アイコン背景） */}
                  <div className={`relative flex items-center justify-center w-10 h-7 rounded-full transition-all duration-200
                    ${isActive ? 'bg-primary/12' : ''}`}>

                    {/* アクティブドット（上部） */}
                    {isActive && (
                      <motion.div
                        layoutId="bottom-nav-dot"
                        className="absolute -top-[14px] w-5 h-1 bg-primary rounded-b-full"
                        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                      />
                    )}

                    <Icon
                      className={`w-[22px] h-[22px] transition-all duration-200
                        ${isActive ? 'text-primary' : 'text-muted-foreground/60'}`}
                      strokeWidth={isActive ? 2.5 : 1.8}
                    />

                    {/* ログイン済みバッジ */}
                    {isUser && isLoggedIn && (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full border-2 border-white dark:border-background" />
                    )}
                  </div>

                  {/* ラベル */}
                  <span className={`text-[9.5px] font-bold leading-none transition-colors duration-200
                    ${isActive ? 'text-primary' : 'text-muted-foreground/55'}`}>
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
