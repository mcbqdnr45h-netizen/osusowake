import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Map, Search, Package, Heart, User, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LayoutProps {
  children: React.ReactNode;
  showBottomNav?: boolean;
}

function TokushoModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm px-0 md:px-6"
      onClick={onClose}
    >
      <div
        className="bg-card w-full md:max-w-lg rounded-t-3xl md:rounded-2xl shadow-2xl max-h-[85dvh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle bar (mobile) */}
        <div className="flex justify-center pt-3 md:hidden">
          <div className="w-10 h-1 bg-border rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="text-lg font-black">特定商取引法に基づく表記</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto px-6 py-5 space-y-5">
          {[
            { label: '販売業者', value: '食べロス運営事務局' },
            { label: '運営責任者', value: 'Yuhi' },
            { label: 'お問い合わせ', value: (
              <a href="https://forms.gle/uhMoXjjF9YzkR52a6" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
                Googleフォームよりお問い合わせください
              </a>
            )},
            { label: 'サービス内容', value: 'フードロス削減を目的とした飲食店・食料品店のサプライズバッグ予約・購入プラットフォーム' },
            { label: '販売価格', value: '各商品ページに表示の価格（税込）' },
            { label: '支払方法', value: 'クレジットカード（Stripe決済）' },
            { label: '支払時期', value: '予約確定時に即時決済' },
            { label: '商品の引渡し時期', value: '各店舗の受取時間内にご来店の上、お受け取りください' },
            { label: 'キャンセル・返品規定', value: '商品の性質上、購入確定後のキャンセル・返品・交換はお受けできません。ただし、店舗側の都合による商品提供不可の場合は全額返金いたします。' },
            { label: '手数料', value: '初期費用・月額費用：0円。販売成立時のみ、販売金額の20%を手数料として申し受けます。' },
            { label: '個人情報の取扱い', value: '収集した個人情報は、サービス提供・改善の目的のみに使用し、第三者への提供は行いません。' },
          ].map(({ label, value }) => (
            <div key={label} className="border-b border-border/50 pb-4 last:border-0 last:pb-0">
              <dt className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-1">{label}</dt>
              <dd className="text-sm text-foreground leading-relaxed">{value}</dd>
            </div>
          ))}
        </div>

        <div className="shrink-0 px-6 pb-6 pt-4">
          <button
            onClick={onClose}
            className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-xl hover:bg-primary/90 active:scale-[0.98] transition-all"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}

export function Layout({ children, showBottomNav = true }: LayoutProps) {
  const [location] = useLocation();
  const [showTokusho, setShowTokusho] = useState(false);

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
      {showTokusho && <TokushoModal onClose={() => setShowTokusho(false)} />}

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

      {/* Desktop Footer */}
      <footer className="hidden md:block bg-background border-t border-border mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-black text-lg text-primary">食べロス</span>
              <span className="text-xs text-muted-foreground">フードロスを減らし、美味しい食品を救う</span>
            </div>
            <div className="flex flex-wrap items-center gap-5 text-xs text-muted-foreground">
              <Link href="/register-store" className="hover:text-primary transition-colors font-medium">お店を登録する</Link>
              <span>·</span>
              <a
                href="https://forms.gle/uhMoXjjF9YzkR52a6"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors font-medium"
              >
                ヘルプ・お問い合わせ
              </a>
              <span>·</span>
              <button
                onClick={() => setShowTokusho(true)}
                className="hover:text-primary transition-colors text-xs"
              >
                特定商取引法に基づく表記
              </button>
              <span>·</span>
              <a href="#privacy" className="hover:text-primary transition-colors">プライバシーポリシー</a>
              <span>·</span>
              <a href="#terms" className="hover:text-primary transition-colors">利用規約</a>
              <span>·</span>
              <span className="text-muted-foreground/60">© 2025 食べロス. All rights reserved.</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border/50 text-xs text-muted-foreground/60 text-center">
            初期費用・月額0円。売れた場合のみ手数料20%が発生する成果報酬型。手数料は決済額から自動控除されます。
          </div>
        </div>
      </footer>

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
