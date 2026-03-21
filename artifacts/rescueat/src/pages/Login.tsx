import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, ChevronLeft, Mail, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function Login() {
  const [, navigate] = useLocation();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const isValid = email.trim() && password.length >= 1 && !isLoading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    setError('');
    setIsLoading(true);

    const { error: err } = await signIn(email, password);

    setIsLoading(false);

    if (err) {
      setError(err);
      return;
    }

    navigate('/mypage');
  }

  return (
    <div className="min-h-dvh flex flex-col bg-background">

      <div className="flex items-center px-4 pt-12 pb-4">
        <Link href="/welcome">
          <button className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors">
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
        </Link>
      </div>

      <div className="flex-1 flex flex-col px-6 pt-2 pb-10 max-w-md mx-auto w-full">

        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="mb-10"
        >
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
            <span className="text-2xl">🍀</span>
          </div>
          <h1 className="text-2xl font-black text-foreground">おかえりなさい</h1>
          <p className="text-muted-foreground text-sm mt-1">アカウントにログインしてください</p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}
          onSubmit={handleSubmit}
          className="flex flex-col gap-5 flex-1"
        >
          {/* Email */}
          <div>
            <label className="block text-sm font-bold text-foreground mb-1.5">メールアドレス</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Mail className="w-4 h-4 text-muted-foreground" />
              </div>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                placeholder="example@email.com"
                className="w-full bg-card border-2 border-border rounded-xl pl-11 pr-4 py-3.5 text-foreground font-medium placeholder:text-muted-foreground/60 placeholder:font-normal focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                autoComplete="email"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-bold text-foreground">パスワード</label>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Lock className="w-4 h-4 text-muted-foreground" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                placeholder="パスワードを入力"
                className="w-full bg-card border-2 border-border rounded-xl pl-11 pr-12 py-3.5 text-foreground font-medium placeholder:text-muted-foreground/60 placeholder:font-normal focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                autoComplete="current-password"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute inset-y-0 right-4 flex items-center text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="bg-destructive/10 border border-destructive/30 text-destructive text-sm font-medium px-4 py-3 rounded-xl"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex-1" />

          {/* Submit */}
          <button
            type="submit"
            disabled={!isValid}
            className={`w-full font-black text-lg py-4 rounded-2xl transition-all min-h-[56px] flex items-center justify-center
              ${isValid
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 active:scale-[0.98]'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
              }`}
          >
            {isLoading
              ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : 'ログインする'
            }
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground font-medium">または</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <p className="text-center text-sm text-muted-foreground pb-2">
            アカウントをお持ちでない方は{' '}
            <Link href="/signup" className="text-primary font-bold underline underline-offset-2">新規登録</Link>
          </p>
        </motion.form>
      </div>
    </div>
  );
}
