import React from 'react';
import { Link, useLocation } from 'wouter';
import { Map, Search, Package, Heart, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMyStore } from '@/hooks/use-my-store';

interface LayoutProps {
  children: React.ReactNode;
  showBottomNav?: boolean;
  hideFooter?: boolean;
}

export function Layout({ children, showBottomNav = true, hideFooter = false }: LayoutProps) {
  const [location] = useLocation();
  const { isApprovedOwner } = useMyStore();

  const navItems = [
    { href: '/', icon: Map, label: '発見' },
    { href: '/search', icon: Search, label: '検索' },
    { href: '/my-reservations', icon: Package, label: 'お届け' },
    { href: '/favorites', icon: Heart, label: 'お気に入り' },
    { href: '/mypage', icon: User, label: 'マイページ' },
  ];

  const desktopNavItems = [
    { href: '/', label: '発見' },
    { href: '/search', label: '検索' },
    { href: '/my-reservations', label: 'お届け' },
    { href: '/mypage', label: 'マイページ' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground pb-[80px] md:pb-0 flex flex-col font-sans">

      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="font-display font-black text-2xl tracking-tight text-primary">
              食べロス
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {desktopNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`font-bold transition-colors hover:text-primary ${
                  location === item.href ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      {!hideFooter && <footer className="bg-background border-t border-border mt-auto">
        {/* Mobile footer */}
        <div className="md:hidden px-5 py-3">
          <p className="text-center text-[10px] text-muted-foreground/50">© 2025 食べロス</p>
        </div>

        {/* Desktop footer */}
        <div className="hidden md:block max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-black text-lg text-primary">食べロス</span>
              <span className="text-xs text-muted-foreground">フードロスを減らし、美味しい食品を救う</span>
            </div>
            <div className="flex flex-wrap items-center gap-5 text-xs text-muted-foreground">
              {isApprovedOwner && (
                <>
                  <Link href="/store-dashboard" className="hover:text-primary transition-colors font-medium">店舗ダッシュボード</Link>
                  <span>·</span>
                </>
              )}
              <a
                href="https://forms.gle/uhMoXjjF9YzkR52a6"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors font-medium"
              >
                ヘルプ・お問い合わせ
              </a>
              <span>·</span>
              <span className="text-muted-foreground/60">© 2025 食べロス. All rights reserved.</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border/50 text-xs text-muted-foreground/60 text-center">
            初期費用・月額0円。売れた場合のみ手数料20%が発生する成果報酬型。手数料は決済額から自動控除されます。
          </div>
        </div>
      </footer>}

      {/* Mobile Bottom Nav */}
      {showBottomNav && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border shadow-[0_-10px_30px_rgba(0,0,0,0.05)] pb-safe">
          <div className="flex items-center justify-around h-16 px-1">
            {navItems.map((item) => {
              const isActive = location === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative flex flex-col items-center justify-center w-full h-full space-y-1"
                >
                  <div className={`p-1.5 rounded-full transition-all duration-300 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                    <Icon className={`w-6 h-6 ${isActive ? 'fill-primary/10' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  <span className={`text-[10px] font-bold transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                    {item.label}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="bottom-nav-indicator"
                      className="absolute top-0 w-8 h-1 bg-primary rounded-b-full"
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
