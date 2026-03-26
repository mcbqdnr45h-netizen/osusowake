import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { Link } from 'wouter';

interface AuthShellProps {
  children: React.ReactNode;
  backHref?: string;
  activeTab: 'user' | 'store';
  mode: 'login' | 'signup';
}

export function AuthShell({ children, backHref = '/welcome', activeTab, mode }: AuthShellProps) {
  const userHref  = mode === 'login' ? '/login'        : '/signup';
  const storeHref = mode === 'login' ? '/store/login'  : '/store/signup';

  return (
    <div className="min-h-dvh flex flex-col relative overflow-hidden bg-background">

      {/* ── 淡いドットパターン背景 ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,140,0,0.09) 1.2px, transparent 1.2px)',
          backgroundSize: '22px 22px',
        }}
      />

      {/* ── アクセントブロブ（右上・左下） ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-28 -right-28 w-72 h-72 rounded-full z-0"
        style={{ background: 'radial-gradient(circle at 50% 50%, rgba(255,152,0,0.18) 0%, transparent 68%)' }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-20 -left-20 w-56 h-56 rounded-full z-0"
        style={{ background: 'radial-gradient(circle at 50% 50%, rgba(255,180,0,0.13) 0%, transparent 68%)' }}
      />

      {/* ── ヘッダー ── */}
      <div className="relative z-10 flex items-center px-4 pt-12 pb-4">
        <Link href={backHref}>
          <motion.button
            whileHover={{ scale: 1.06, backgroundColor: 'rgba(255,255,255,0.95)' }}
            whileTap={{ scale: 0.92 }}
            className="w-10 h-10 rounded-full bg-white/75 backdrop-blur-sm border border-border/30 shadow-sm flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </motion.button>
        </Link>
      </div>

      {/* ── メインコンテンツ ── */}
      <div className="relative z-10 flex-1 flex flex-col px-6 pt-2 pb-10 max-w-md mx-auto w-full">

        {/* ロール切替タブ */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex rounded-2xl p-1 mb-8 gap-1 shadow-inner"
          style={{ background: 'rgba(0,0,0,0.055)' }}
        >
          <Link href={userHref} className="flex-1">
            <motion.button
              whileTap={{ scale: 0.96 }}
              className={`w-full py-2.5 rounded-xl text-sm transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'user'
                  ? 'font-black text-foreground'
                  : 'font-semibold text-muted-foreground hover:text-foreground/70'
              }`}
              style={activeTab === 'user' ? {
                background: 'linear-gradient(145deg, #ffffff 0%, #fff7ed 100%)',
                boxShadow: '0 2px 10px rgba(0,0,0,0.09), 0 1px 2px rgba(0,0,0,0.04)',
              } : {}}
            >
              <span className="text-base">👤</span>
              <span>ユーザーの方</span>
            </motion.button>
          </Link>
          <Link href={storeHref} className="flex-1">
            <motion.button
              whileTap={{ scale: 0.96 }}
              className={`w-full py-2.5 rounded-xl text-sm transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'store'
                  ? 'font-black text-foreground'
                  : 'font-semibold text-muted-foreground hover:text-foreground/70'
              }`}
              style={activeTab === 'store' ? {
                background: 'linear-gradient(145deg, #ffffff 0%, #fff7ed 100%)',
                boxShadow: '0 2px 10px rgba(0,0,0,0.09), 0 1px 2px rgba(0,0,0,0.04)',
              } : {}}
            >
              <span className="text-base">🏪</span>
              <span>店舗の方</span>
            </motion.button>
          </Link>
        </motion.div>

        {children}
      </div>
    </div>
  );
}

/** グラデーションのプライマリボタン（ログイン・登録用） */
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
      whileHover={!disabled ? { scale: 1.02, boxShadow: '0 8px 28px rgba(255,120,0,0.38)' } : {}}
      whileTap={!disabled ? { scale: 0.97 } : {}}
      className={`w-full font-black text-lg py-4 rounded-2xl min-h-[56px] flex items-center justify-center gap-2 transition-colors duration-150 ${
        disabled
          ? 'bg-muted text-muted-foreground cursor-not-allowed'
          : 'text-white cursor-pointer'
      }`}
      style={!disabled ? {
        background: 'linear-gradient(180deg, #FFA733 0%, #F07800 100%)',
        boxShadow: '0 4px 20px rgba(255,120,0,0.30)',
      } : {}}
    >
      {isLoading
        ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        : children
      }
    </motion.button>
  );
}
