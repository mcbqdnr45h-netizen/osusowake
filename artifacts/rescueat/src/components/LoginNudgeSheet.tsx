import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, LogIn, UserPlus, ShoppingBag } from 'lucide-react';
import { useLocation } from 'wouter';

interface LoginNudgeSheetProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: 'favorite' | 'purchase' | 'general';
}

const REASON_TEXT = {
  favorite: {
    title: 'ログインしてお気に入りに追加',
    desc: 'ログインすると、気になるお店をお気に入り登録してすぐに見つけられます。',
  },
  purchase: {
    title: 'ログインして購入手続きへ',
    desc: 'ログインすると、おすそわけバッグを購入・受取管理できます。',
  },
  general: {
    title: 'ログインしてこの機能を使おう',
    desc: 'おすそわけのすべての機能を使うにはアカウントが必要です。',
  },
};

export function LoginNudgeSheet({ isOpen, onClose, reason = 'general' }: LoginNudgeSheetProps) {
  const [, navigate] = useLocation();
  const text = REASON_TEXT[reason];

  const handleLogin = () => {
    onClose();
    navigate('/login');
  };

  const handleSignup = () => {
    onClose();
    navigate('/signup');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          {/* オーバーレイ */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          {/* シート */}
          <motion.div
            className="relative w-full max-w-lg bg-card rounded-t-3xl px-6 pt-5 pb-8 z-10"
            style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            onClick={e => e.stopPropagation()}
          >
            {/* ドラッグハンドル */}
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-4" />

            {/* 閉じるボタン */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>

            {/* アイコン */}
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-7 h-7 text-primary" />
            </div>

            {/* テキスト */}
            <h2 className="text-lg font-black text-foreground text-center mb-2 leading-snug">
              {text.title}
            </h2>
            <p className="text-sm text-muted-foreground text-center leading-relaxed mb-6">
              {text.desc}
            </p>

            {/* ボタン */}
            <div className="space-y-2.5">
              <button
                onClick={handleLogin}
                className="w-full bg-primary text-white font-black py-3.5 rounded-2xl text-sm flex items-center justify-center gap-2 shadow-md shadow-primary/20 active:scale-[0.98] transition-transform"
              >
                <LogIn className="w-4 h-4" />
                ログインする
              </button>
              <button
                onClick={handleSignup}
                className="w-full border-2 border-border text-foreground font-bold py-3 rounded-2xl text-sm flex items-center justify-center gap-2 hover:bg-secondary/40 active:scale-[0.98] transition-all"
              >
                <UserPlus className="w-4 h-4" />
                新規登録（無料）
              </button>
              <button
                onClick={onClose}
                className="w-full text-xs text-muted-foreground py-1.5"
              >
                後で登録する
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
