import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, Store } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthShell, AuthPrimaryButton } from '@/components/AuthShell';

export default function Login() {
  const [, navigate] = useLocation();
  const { signIn } = useAuth();

  const params = new URLSearchParams(window.location.search);
  const initialTab = params.get('tab') === 'store' ? 'store' : 'user';

  const [activeTab,  setActiveTab]  = useState<'user' | 'store'>(initialTab);
  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [showPw,     setShowPw]     = useState(false);
  const [isLoading,  setIsLoading]  = useState(false);
  const [error,      setError]      = useState('');
  const [shakeKey,   setShakeKey]   = useState(0);

  useEffect(() => {
    setEmail('');
    setPassword('');
    setError('');
  }, [activeTab]);

  const isValid = email.trim() && password.length >= 1 && !isLoading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    setError('');
    setIsLoading(true);

    if (activeTab === 'store') {
      const { error: err } = await signIn(email, password, 'store_owner');
      setIsLoading(false);
      if (err) {
        setError(err);
        setShakeKey(k => k + 1);
        return;
      }
      const redirect = params.get('redirect');
      if (redirect) {
        const decoded = decodeURIComponent(redirect);
        if (decoded.startsWith('/store/') || decoded.startsWith('/register-store') || decoded.startsWith('/store-onboarding')) {
          navigate(decoded);
          return;
        }
      }
      navigate('/store/dashboard');
    } else {
      const { error: err, role } = await signIn(email, password);
      setIsLoading(false);
      if (err) {
        setError(err);
        setShakeKey(k => k + 1);
        return;
      }
      const isAdmin = email.trim().toLowerCase() === 'yuuhi0125416@icloud.com';
      if (role === 'store_owner' && !isAdmin) {
        setError('このアカウントは店舗オーナー用です。「飲食店・パートナー」タブからログインしてください。');
        setShakeKey(k => k + 1);
        return;
      }
      navigate(isAdmin ? '/admin' : '/');
    }
  }

  const labelClass = "block text-xs font-black text-foreground/65 uppercase tracking-widest mb-2";
  const inputClass = "w-full bg-white border border-border/80 rounded-xl pl-11 pr-4 py-3.5 text-foreground font-medium placeholder:text-muted-foreground/45 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all text-[15px]";

  const isStore = activeTab === 'store';

  return (
    <AuthShell activeTab={activeTab} onTabChange={setActiveTab} mode="login">

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: isStore ? 18 : -18 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: isStore ? -18 : 18 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col flex-1"
        >
          {/* ── ヒーロー ── */}
          <div className="mb-8">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
              style={{
                background: isStore
                  ? 'linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%)'
                  : 'linear-gradient(135deg, #FFF8F0 0%, #FFE8D0 100%)',
                boxShadow: '0 2px 12px rgba(242,100,25,0.14)',
              }}
            >
              {isStore
                ? <Store className="w-6 h-6 text-primary" />
                : <span className="text-2xl">🍀</span>
              }
            </div>
            <h1 className="text-[30px] font-black text-foreground leading-tight" style={{ letterSpacing: '-0.03em' }}>
              {isStore ? '店舗管理画面へ' : 'おかえりなさい'}
            </h1>
            <p className="text-[14px] text-muted-foreground mt-2 font-medium leading-snug">
              {isStore
                ? '余剰食品をおすそわけして、新しい常連客を増やしましょう'
                : '全国の美味しいおすそわけを見つけよう'
              }
            </p>
          </div>

          {/* ── フォーム ── */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5 flex-1">

            {/* メール */}
            <div>
              <label className={labelClass}>メールアドレス</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Mail className="w-4 h-4 text-muted-foreground/60" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  placeholder={isStore ? 'store@example.com' : 'example@email.com'}
                  className={inputClass}
                  autoComplete="email"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* パスワード */}
            <div>
              <label className={labelClass}>パスワード</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Lock className="w-4 h-4 text-muted-foreground/60" />
                </div>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  placeholder="パスワードを入力"
                  className={`${inputClass} pr-12`}
                  autoComplete="current-password"
                  disabled={isLoading}
                />
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  onClick={() => setShowPw(v => !v)}
                  className="absolute inset-y-0 right-4 flex items-center text-muted-foreground/50 hover:text-foreground transition-colors"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </motion.button>
              </div>
            </div>

            {/* エラー（シェイク付き） */}
            <AnimatePresence>
              {error && (
                <motion.div
                  key={shakeKey}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="shake bg-destructive/8 border border-destructive/20 text-destructive text-[13px] font-semibold px-4 py-3 rounded-xl leading-snug"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex-1 min-h-4" />

            <AuthPrimaryButton disabled={!isValid} isLoading={isLoading}>
              {isStore ? (
                <><Store className="w-4.5 h-4.5" />ダッシュボードへ</>
              ) : 'ログインする'}
            </AuthPrimaryButton>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border/60" />
              <span className="text-[11px] text-muted-foreground/60 font-semibold tracking-wider">または</span>
              <div className="flex-1 h-px bg-border/60" />
            </div>

            <p className="text-center text-[13px] text-muted-foreground pb-2">
              アカウントをお持ちでない方は{' '}
              <Link
                href={isStore ? '/store/signup' : '/signup'}
                className="text-primary font-black underline underline-offset-2"
              >
                新規登録
              </Link>
            </p>
          </form>
        </motion.div>
      </AnimatePresence>
    </AuthShell>
  );
}
