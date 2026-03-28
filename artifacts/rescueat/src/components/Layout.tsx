import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import {
  Map, MapPin, Package, Heart, User, Menu, X,
  FileText, Shield, Store, Settings, ChevronRight, Coins, BarChart2,
  MessageCircle, HelpCircle, ExternalLink, ShieldCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMyStore } from '@/hooks/use-my-store';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationsBell } from '@/components/NotificationsBell';

interface LayoutProps {
  children: React.ReactNode;
  showBottomNav?: boolean;
  hideFooter?: boolean;
  hideHeader?: boolean;
}

export function Layout({ children, showBottomNav = true, hideFooter = false, hideHeader = false }: LayoutProps) {
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
  const isAdmin = user?.email === 'yuuhi0125416@icloud.com';

  const storeNavItems = [
    { href: '/store/dashboard', icon: Store,     label: '出品管理', isUser: false },
    { href: '/store/sales',     icon: BarChart2, label: '売上確認', isUser: false },
    { href: '/mypage',          icon: User,      label: 'マイページ', isUser: true },
  ];

  const customerNavItems = [
    { href: '/',                icon: Map,     label: '発見',       isUser: false },
    { href: '/map',             icon: MapPin,  label: 'マップ',     isUser: false },
    { href: '/my-reservations', icon: Package, label: 'マイバック',     isUser: false },
    { href: '/favorites',       icon: Heart,   label: 'お気に入り', isUser: false },
    { href: '/mypage',          icon: User,    label: 'マイページ', isUser: true },
  ];

  const navItems = isStoreOwner ? storeNavItems : customerNavItems;

  const desktopNavItems = [
    { href: '/',    label: '発見'  },
    { href: '/map', label: 'マップ' },
    { href: '/my-reservations', label: 'マイバック' },
  ];

  const isLoggedIn = !!user;
  // 共通トップヘッダーは全ページ非表示（マイページは独自のインラインヘッダーを使用）
  const showHeader = false;

  return (
    <div
      className={`${hideFooter ? 'h-dvh overflow-hidden' : 'min-h-screen md:!pb-0'} bg-background text-foreground flex flex-col font-sans overflow-x-hidden`}
      style={!hideFooter ? { paddingBottom: 'calc(64px + env(safe-area-inset-bottom))' } : undefined}
    >

      {/* ── Top Header: マイページのみ表示 ─────────────────────────────── */}
      {showHeader && <header
        className="sticky top-0 z-50 shrink-0"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="bg-white/85 backdrop-blur-xl border-b border-border/40"
          style={{ boxShadow: '0 1px 0 rgba(10,8,6,0.05), 0 2px 16px rgba(10,8,6,0.04)' }}>
          <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between gap-4">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group shrink-0">
              <div
                className="w-8 h-8 rounded-[10px] flex items-center justify-center shadow-sm transition-transform duration-200 group-hover:scale-105"
                style={{ background: 'linear-gradient(145deg, #F07826 0%, #E85A0C 100%)', boxShadow: '0 2px 8px rgba(242,100,25,0.30)' }}
              >
                <span className="text-white font-black text-[11px] leading-none tracking-tight">Ow</span>
              </div>
              <span className="leading-none font-black text-[19px]" style={{ letterSpacing: '-0.04em' }}>
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

              {/* ベルアイコン（ログイン済みのみ）*/}
              {isLoggedIn && <NotificationsBell />}

              {/* Hamburger */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-label="メニューを開く"
                  className={`flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-150 text-foreground
                    ${menuOpen ? 'bg-muted text-primary' : 'hover:bg-muted/70'}
                    ${isLoggedIn ? 'ring-2 ring-primary/20 ring-offset-1 ring-offset-background' : ''}`}
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
                      style={{ boxShadow: '0 8px 32px rgba(10,8,6,0.12), 0 2px 8px rgba(10,8,6,0.05), 0 0 0 1px rgba(10,8,6,0.05)' }}
                    >
                      {isLoggedIn ? (
                        <Link href="/mypage"
                          className="block transition-colors duration-150 hover:bg-muted/50">
                          <div className="px-4 py-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
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
                              className="text-xs font-semibold text-primary border border-primary/30 rounded-lg px-3 py-1.5 hover:bg-primary/5 transition-colors">
                              ログイン
                            </Link>
                            <Link href="/signup"
                              className="text-xs font-semibold text-white rounded-lg px-3 py-1.5 hover:brightness-105 transition-all shadow-sm"
                              style={{ background: 'linear-gradient(180deg, #F07826 0%, #E85A0C 100%)', boxShadow: '0 2px 8px rgba(242,100,25,0.25)' }}>
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

                      {isAdmin && (
                        <Link href="/admin"
                          className="flex items-center gap-3 px-4 py-2.5 border-t border-border/40 text-sm font-bold hover:bg-purple-50 transition-colors duration-150"
                          style={{ color: '#7c3aed' }}>
                          <ShieldCheck className="w-4 h-4 shrink-0" />
                          <span>管理者ダッシュボード</span>
                          <span className="ml-auto text-[10px] font-black bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">神モード</span>
                        </Link>
                      )}

                      {/* 規約リンク */}
                      <div className="border-t border-border/40">
                        <div className="px-4 pt-3 pb-1">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                            規約・その他
                          </p>
                        </div>
                        <div className="pb-2">
                          {[
                            { href: '/terms',   icon: FileText, label: '利用規約' },
                            { href: '/privacy', icon: Shield,   label: 'プライバシーポリシー' },
                            { href: '/legal',   icon: Store,    label: '特定商取引に基づく表記' },
                          ].map((item) => {
                            const Icon = item.icon;
                            return (
                              <Link key={item.href} href={item.href}
                                className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors duration-150">
                                <Icon className="w-4 h-4 text-primary/60 shrink-0" />
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
      </header>}

      {/* ── Main Content ─────────────────────────────────────────────── */}
      <main className="flex-1 min-h-0 w-full relative flex flex-col overflow-x-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.20, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1 flex flex-col"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      {!hideFooter && (
        <footer
          className="bg-white border-t border-border/40 mt-auto"
          style={{ boxShadow: '0 -1px 0 rgba(0,0,0,0.04)' }}
        >
          {/* ─── Desktop Full Footer ─── */}
          <div className="hidden md:block max-w-7xl mx-auto px-8 pt-12 pb-8">
            <div className="grid grid-cols-4 gap-8 pb-10 border-b border-border/25">

              {/* Brand column */}
              <div className="col-span-1">
                <div className="flex items-center gap-2.5 mb-3">
                  <div
                    className="w-7 h-7 rounded-[8px] flex items-center justify-center shrink-0"
                    style={{ background: 'linear-gradient(145deg, #F07826 0%, #E85A0C 100%)', boxShadow: '0 2px 6px rgba(242,100,25,0.28)' }}
                  >
                    <span className="text-white font-black text-[10px] leading-none">Ow</span>
                  </div>
                  <span className="font-black text-[17px]" style={{ letterSpacing: '-0.03em' }}>
                    <span className="text-foreground">Osus</span><span className="text-primary">Owake</span>
                  </span>
                </div>
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                  お店の味を、誰かにおすそわけしよう。<br />
                  余剰食品を、価値ある出会いに。
                </p>
              </div>

              {/* サービス */}
              <div>
                <h4 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60 mb-4">サービス</h4>
                <ul className="space-y-2.5">
                  {[
                    { href: '/',    label: '発見' },
                    { href: '/map', label: 'マップで探す' },
                    { href: '/my-reservations', label: 'お届け管理' },
                    { href: '/favorites', label: 'お気に入り' },
                  ].map((item) => (
                    <li key={item.href}>
                      <Link href={item.href}
                        className="text-[13px] text-muted-foreground hover:text-primary transition-colors font-medium">
                        {item.label}
                      </Link>
                    </li>
                  ))}
                  {profile?.role === 'store_owner' && isApprovedOwner && (
                    <li>
                      <Link href="/store/dashboard"
                        className="text-[13px] text-muted-foreground hover:text-primary transition-colors font-medium">
                        店舗ダッシュボード
                      </Link>
                    </li>
                  )}
                </ul>
              </div>

              {/* 法的情報 */}
              <div>
                <h4 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60 mb-4">法的情報</h4>
                <ul className="space-y-2.5">
                  {[
                    { href: '/terms',   label: '利用規約',              icon: FileText },
                    { href: '/privacy', label: 'プライバシーポリシー',  icon: Shield },
                    { href: '/legal',   label: '特定商取引法に基づく表記', icon: Store },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <li key={item.href}>
                        <Link href={item.href}
                          className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-primary transition-colors font-medium">
                          <Icon className="w-3.5 h-3.5 shrink-0 opacity-60" />
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* サポート */}
              <div>
                <h4 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60 mb-4">サポート</h4>
                <ul className="space-y-2.5">
                  <li>
                    <Link href="/help"
                      className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-primary transition-colors font-medium">
                      <HelpCircle className="w-3.5 h-3.5 shrink-0 opacity-60" />
                      ヘルプ・FAQ
                    </Link>
                  </li>
                  <li>
                    <a
                      href="https://line.me/R/ti/p/@osusowake"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-primary transition-colors font-medium"
                    >
                      <MessageCircle className="w-3.5 h-3.5 shrink-0 opacity-60" />
                      LINEで問い合わせ
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://forms.gle/uhMoXjjF9YzkR52a6"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-primary transition-colors font-medium"
                    >
                      <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-60" />
                      お問い合わせフォーム
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            {/* Copyright row */}
            <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
              <p className="text-[12px] text-muted-foreground/55 font-medium">
                © 2026 YK Nova LLC. All rights reserved.
              </p>
              <p className="text-[11px] text-muted-foreground/40">
                初期費用・月額0円。成果報酬型（手数料25%）
              </p>
            </div>
          </div>

          {/* ─── Mobile Compact Footer ─── */}
          <div className="md:hidden px-5 py-6">
            {/* Legal Links */}
            <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 mb-4">
              {[
                { href: '/terms',   label: '利用規約' },
                { href: '/privacy', label: 'プライバシー' },
                { href: '/legal',   label: '特定商取引法' },
                { href: '/help',    label: 'ヘルプ' },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-[11px] text-muted-foreground/60 hover:text-primary transition-colors font-medium"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* LINE Support */}
            <div className="flex justify-center mb-4">
              <a
                href="https://line.me/R/ti/p/@osusowake"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border/60 bg-white text-[12px] font-semibold text-muted-foreground hover:text-primary hover:border-primary/30 transition-all"
                style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
              >
                <MessageCircle className="w-3.5 h-3.5 text-green-500" />
                LINEでサポートに問い合わせる
                <ExternalLink className="w-3 h-3 opacity-40" />
              </a>
            </div>

            <p className="text-center text-[11px] text-muted-foreground/40 font-medium">
              © 2026 YK Nova LLC. All rights reserved.
            </p>
          </div>
        </footer>
      )}

      {/* ── Mobile Bottom Nav ─────────────────────────────────────────── */}
      {showBottomNav && (
        <div
          className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-border/30"
          style={{
            paddingBottom: 'env(safe-area-inset-bottom)',
            boxShadow: '0 -1px 0 rgba(10,8,6,0.04), 0 -4px 20px rgba(10,8,6,0.05)',
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
                  <div className={`relative flex items-center justify-center w-10 h-7 rounded-full transition-all duration-200
                    ${isActive ? 'bg-primary/10' : ''}`}>
                    {isActive && (
                      <motion.div
                        layoutId="bottom-nav-dot"
                        className="absolute -top-[14px] w-5 h-1 bg-primary rounded-b-full"
                        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                      />
                    )}
                    <Icon
                      className={`w-[22px] h-[22px] transition-all duration-200
                        ${isActive ? 'text-primary' : 'text-muted-foreground/55'}`}
                      strokeWidth={isActive ? 2.5 : 1.8}
                    />
                    {isUser && isLoggedIn && (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full border-2 border-white" />
                    )}
                  </div>
                  <span className={`text-[9.5px] font-bold leading-none transition-colors duration-200
                    ${isActive ? 'text-primary' : 'text-muted-foreground/50'}`}>
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
