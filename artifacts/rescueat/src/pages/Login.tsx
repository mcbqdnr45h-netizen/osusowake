import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthShell, AuthPrimaryButton } from '@/components/AuthShell';

export default function Login() {
  const [, navigate] = useLocation();
  const { signIn, signOut } = useAuth();

  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [showPw,      setShowPw]      = useState(false);
  const [isLoading,   setIsLoading]   = useState(false);
  const [error,       setError]       = useState('');

  const isValid = email.trim() && password.length >= 1 && !isLoading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    setError('');
    setIsLoading(true);

    const { error: err, role } = await signIn(email, password);
    setIsLoading(false);

    if (err) { setError(err); return; }

    if (role === 'store_owner') {
      await signOut();
      setError('このアカウントは店舗オーナー用です。「店舗の方」タブからログインしてください。');
      return;
    }

    navigate('/');
  }

  return (
    <AuthShell activeTab="user" mode="login">

      {/* ── ヒーロー ── */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38 }}
        className="mb-10"
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 shadow-sm"
          style={{ background: 'linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%)' }}
        >
          <span className="text-2xl">🍀</span>
        </div>
        <h1 className="text-[28px] font-black text-foreground leading-tight tracking-tight">
          おかえりなさい
        </h1>
        <p className="text-muted-foreground text-sm mt-1.5 font-medium">
          アカウントにログインしてください
        </p>
      </motion.div>

      {/* ── フォーム ── */}
      <motion.form
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.38 }}
        onSubmit={handleSubmit}
        className="flex flex-col gap-5 flex-1"
      >
        {/* メール */}
        <div>
          <label className="block text-xs font-black text-foreground/70 uppercase tracking-wider mb-2">
            メールアドレス
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Mail className="w-4 h-4 text-muted-foreground" />
            </div>
            <motion.input
              whileFocus={{ scale: 1.005 }}
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(''); }}
              placeholder="example@email.com"
              className="w-full bg-card border-2 border-border rounded-xl pl-11 pr-4 py-3.5 text-foreground font-medium placeholder:text-muted-foreground/50 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
              autoComplete="email"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* パスワード */}
        <div>
          <label className="block text-xs font-black text-foreground/70 uppercase tracking-wider mb-2">
            パスワード
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Lock className="w-4 h-4 text-muted-foreground" />
            </div>
            <motion.input
              whileFocus={{ scale: 1.005 }}
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              placeholder="パスワードを入力"
              className="w-full bg-card border-2 border-border rounded-xl pl-11 pr-12 py-3.5 text-foreground font-medium placeholder:text-muted-foreground/50 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
              autoComplete="current-password"
              disabled={isLoading}
            />
            <motion.button
              type="button"
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              onClick={() => setShowPw(v => !v)}
              className="absolute inset-y-0 right-4 flex items-center text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </motion.button>
          </div>
        </div>

        {/* エラー */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="bg-destructive/10 border border-destructive/25 text-destructive text-sm font-semibold px-4 py-3 rounded-xl"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1" />

        {/* 送信 */}
        <AuthPrimaryButton disabled={!isValid} isLoading={isLoading}>
          ログインする
        </AuthPrimaryButton>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground font-semibold">または</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <p className="text-center text-sm text-muted-foreground pb-2">
          アカウントをお持ちでない方は{' '}
          <Link href="/signup" className="text-primary font-black underline underline-offset-2">
            新規登録
          </Link>
        </p>
      </motion.form>
    </AuthShell>
  );
}
