import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { Link } from 'wouter';

interface AuthShellProps {
  children: React.ReactNode;
  backHref?: string;
  activeTab: 'user' | 'store';
  onTabChange?: (tab: 'user' | 'store') => void;
  mode: 'login' | 'signup';
}

export function AuthShell({
  children,
  backHref = '/',
  activeTab,
  onTabChange,
  mode,
}: AuthShellProps) {
  const userHref  = mode === 'login' ? '/login'       : '/signup';
  const storeHref = mode === 'login' ? '/store/login' : '/store/signup';

  function handleTab(tab: 'user' | 'store') {
    if (onTabChange) {
      onTabChange(tab);
    }
  }

  const tabs: { id: 'user' | 'store'; label: string; emoji: string }[] = [
    { id: 'user',  label: '一般ユーザー',    emoji: '👤' },
    { id: 'store', label: '飲食店・パートナー', emoji: '🏪' },
  ];

  return (
    <div className="min-h-dvh flex flex-col relative overflow-hidden bg-background">

      {/* ── 淡いドットパターン背景 ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 auth-bg-dots"
      />

      {/* ── アクセントブロブ ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -right-32 w-80 h-80 rounded-full z-0"
        style={{ background: 'radial-gradient(circle at 50% 50%, rgba(242,100,25,0.14) 0%, transparent 65%)' }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -left-24 w-64 h-64 rounded-full z-0"
        style={{ background: 'radial-gradient(circle at 50% 50%, rgba(246,174,45,0.12) 0%, transparent 65%)' }}
      />

      {/* ── ヘッダー ── */}
      <div className="relative z-10 flex items-center px-6 pt-safe-or-5 pb-2">
        <Link href={backHref}>
          <motion.button
            whileHover={{ scale: 1.06, backgroundColor: 'rgba(255,255,255,0.96)' }}
            whileTap={{ scale: 0.92 }}
            className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm border border-border/30 shadow-sm flex items-center justify-center transition-colors"
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </motion.button>
        </Link>
      </div>

      {/* ── メインコンテンツ ── */}
      <div className="relative z-10 flex-1 flex flex-col px-6 pt-4 pb-12 max-w-md mx-auto w-full">

        {/* ── ロール切替タブ（アニメーション付きスライドピル） ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative flex rounded-2xl p-1.5 mb-8 gap-0"
          style={{ background: 'rgba(20,16,10,0.07)', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.08)' }}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const href = tab.id === 'user' ? userHref : storeHref;

            const inner = (
              <motion.button
                key={tab.id}
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={() => handleTab(tab.id)}
                className="relative flex-1 py-2.5 px-3 rounded-xl text-sm z-10 flex items-center justify-center gap-1.5 transition-colors duration-200"
                style={{
                  color: isActive
                    ? (tab.id === 'store' ? '#C84A0A' : '#1a3a6b')
                    : 'hsl(var(--muted-foreground))',
                  fontWeight: isActive ? 900 : 600,
                }}
              >
                {/* スライドするピル背景 */}
                {isActive && (
                  <motion.div
                    layoutId="auth-segment-pill"
                    className="absolute inset-0 rounded-xl"
                    style={tab.id === 'store' ? {
                      background: 'linear-gradient(145deg, #fff5ee 0%, #fde8d8 100%)',
                      boxShadow: '0 2px 12px rgba(242,100,25,0.18), 0 1px 2px rgba(0,0,0,0.06)',
                      border: '1.5px solid rgba(242,100,25,0.22)',
                    } : {
                      background: 'linear-gradient(145deg, #eef4ff 0%, #dbeafe 100%)',
                      boxShadow: '0 2px 12px rgba(59,130,246,0.15), 0 1px 2px rgba(0,0,0,0.06)',
                      border: '1.5px solid rgba(59,130,246,0.20)',
                    }}
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  />
                )}
                <span className="text-[15px] leading-none relative z-10">{tab.emoji}</span>
                <span className="relative z-10 leading-none">{tab.label}</span>
                {isActive && (
                  <motion.span
                    layoutId="auth-tab-dot"
                    className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                    style={{ background: tab.id === 'store' ? '#F26419' : '#3b82f6' }}
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  />
                )}
              </motion.button>
            );

            return onTabChange ? (
              <React.Fragment key={tab.id}>{inner}</React.Fragment>
            ) : (
              <Link key={tab.id} href={href} className="flex-1">
                {inner}
              </Link>
            );
          })}
        </motion.div>

        {children}
      </div>
    </div>
  );
}

/** グラデーションのプライマリボタン（テラコッタ #F26419） */
export function AuthPrimaryButton({
  children,
  disabled,
  isLoading,
  type = 'submit',
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  isLoading?: boolean;
  type?: 'submit' | 'button';
  onClick?: () => void;
}) {
  return (
    <motion.button
      type={type}
      disabled={disabled}
      onClick={onClick}
      whileHover={!disabled ? { scale: 1.015, boxShadow: '0 8px 28px rgba(242,100,25,0.38)' } : {}}
      whileTap={!disabled ? { scale: 0.97 } : {}}
      className={`w-full font-black text-[17px] py-4 rounded-2xl min-h-[56px] flex items-center justify-center gap-2 transition-colors duration-150 ${
        disabled
          ? 'bg-muted text-muted-foreground cursor-not-allowed'
          : 'text-white cursor-pointer'
      }`}
      style={!disabled ? {
        background: 'linear-gradient(180deg, #F07826 0%, #E85A0C 100%)',
        boxShadow: '0 4px 20px rgba(242,100,25,0.30)',
        letterSpacing: '-0.02em',
      } : {}}
    >
      {isLoading
        ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        : children
      }
    </motion.button>
  );
}
