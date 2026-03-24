import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, ChevronLeft, Mail, Lock, Store, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function StoreSignUp() {
  const [, navigate] = useLocation();
  const { signUpAsStore } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  const passwordsMatch = confirmPassword === '' || password === confirmPassword;
  const isValid =
    email.trim() &&
    password.length >= 6 &&
    password === confirmPassword &&
    agreed &&
    !isLoading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    setError('');
    setIsLoading(true);

    const { error: err, needsConfirmation: confirm } = await signUpAsStore(email, password);

    setIsLoading(false);

    if (err) {
      setError(err);
      return;
    }

    setNeedsConfirmation(confirm);
    setDone(true);

    if (!confirm) {
      // 成功画面を一瞬見せてから店舗情報入力へ（/store/dashboardは店舗なしで/store-onboardingへリダイレクトするため直接遷移）
      setTimeout(() => navigate('/store-onboarding'), 2000);
    }
  }

  if (done) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-background px-6">
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="flex flex-col items-center text-center max-w-sm"
        >
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-5">
            <span className="text-5xl">{needsConfirmation ? '📧' : '🏪'}</span>
          </div>
          <h2 className="text-2xl font-black text-foreground mb-3">
            {needsConfirmation ? '確認メールを送信しました' : 'アカウント登録完了！'}
          </h2>
          {needsConfirmation ? (
            <>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                <span className="font-bold text-foreground">{email}</span> に確認メールを送りました。
                メール内のリンクをクリックして、登録を完了してください。
              </p>
              <Link
                href="/store/login"
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-black py-4 rounded-2xl hover:bg-primary/90 transition-all"
              >
                ログイン画面へ
              </Link>
            </>
          ) : (
            <>
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                登録が完了しました。<br />続けて店舗情報を入力してください。
              </p>
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </>
          )}
        </motion.div>
      </div>
    );
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

        {/* ロール切替タブ */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="flex bg-secondary rounded-2xl p-1 mb-8 gap-1"
        >
          <Link href="/signup" className="flex-1">
            <button className="w-full py-2.5 rounded-xl text-sm font-bold text-muted-foreground transition-all">
              ユーザー
            </button>
          </Link>
          <button className="flex-1 py-2.5 rounded-xl text-sm font-black bg-card text-foreground shadow-sm transition-all">
            店舗オーナー
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
            <Store className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-black text-foreground">店舗オーナー登録</h1>
          <p className="text-muted-foreground text-sm mt-1">お店の味を、もっと多くの人へおすそ分けしよう</p>
        </motion.div>

        {/* 特典バナー */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-primary/5 border border-primary/20 rounded-2xl p-4 mb-6"
        >
          <p className="text-xs font-black text-primary mb-2">店舗オーナー特典</p>
          <ul className="space-y-1.5">
            {[
              '余剰食品を手軽に出品・管理',
              '売上は毎週月曜に自動振込（Stripe Connect）',
              'プラットフォーム手数料は25%のみ',
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-xs text-foreground">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                {item}
              </li>
            ))}
          </ul>
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
                placeholder="store@example.com"
                className="w-full bg-card border-2 border-border rounded-xl pl-11 pr-4 py-3.5 text-foreground font-medium placeholder:text-muted-foreground/60 placeholder:font-normal focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                autoComplete="email"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-bold text-foreground mb-1.5">パスワード</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Lock className="w-4 h-4 text-muted-foreground" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                placeholder="6文字以上"
                className="w-full bg-card border-2 border-border rounded-xl pl-11 pr-12 py-3.5 text-foreground font-medium placeholder:text-muted-foreground/60 placeholder:font-normal focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                autoComplete="new-password"
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
            {password.length > 0 && password.length < 6 && (
              <p className="text-destructive text-xs font-medium mt-1.5">6文字以上で入力してください</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-bold text-foreground mb-1.5">パスワード（確認）</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Lock className="w-4 h-4 text-muted-foreground" />
              </div>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => { setConfirmPassword(e.target.value); setError(''); }}
                placeholder="もう一度入力"
                className={`w-full bg-card border-2 rounded-xl pl-11 pr-12 py-3.5 text-foreground font-medium placeholder:text-muted-foreground/60 placeholder:font-normal focus:ring-4 outline-none transition-all
                  ${!passwordsMatch
                    ? 'border-destructive focus:border-destructive focus:ring-destructive/10'
                    : 'border-border focus:border-primary focus:ring-primary/10'
                  }`}
                autoComplete="new-password"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(v => !v)}
                className="absolute inset-y-0 right-4 flex items-center text-muted-foreground hover:text-foreground transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {!passwordsMatch && confirmPassword.length > 0 && (
              <p className="text-destructive text-xs font-medium mt-1.5">パスワードが一致しません</p>
            )}
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

          {/* Terms */}
          <div
            onClick={() => setAgreed(v => !v)}
            className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all select-none
              ${agreed ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/40'}`}
          >
            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all
              ${agreed ? 'bg-primary border-primary' : 'border-border bg-background'}`}>
              {agreed && (
                <motion.svg initial={{ scale: 0 }} animate={{ scale: 1 }} viewBox="0 0 12 10" className="w-3 h-3">
                  <polyline points="1,5.5 4.5,9 11,1" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </motion.svg>
              )}
            </div>
            <p className="text-sm text-foreground leading-relaxed">
              <Link href="/terms" onClick={e => e.stopPropagation()} className="font-bold text-primary underline underline-offset-2">利用規約</Link>
              {' '}および{' '}
              <Link href="/privacy" onClick={e => e.stopPropagation()} className="font-bold text-primary underline underline-offset-2">プライバシーポリシー</Link>
              に同意します
            </p>
          </div>

          {/* Security note */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
            <span>登録情報はStripeとの連携に使用されます。第三者への提供はありません。</span>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!isValid}
            className={`w-full font-black text-lg py-4 rounded-2xl transition-all min-h-[56px] flex items-center justify-center gap-2
              ${isValid
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 active:scale-[0.98]'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
              }`}
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : <><Store className="w-5 h-5" />店舗として登録する</>}
          </button>

          <p className="text-center text-sm text-muted-foreground pb-2">
            すでにアカウントをお持ちですか？{' '}
            <Link href="/store/login" className="text-primary font-bold underline underline-offset-2">ログイン</Link>
          </p>
        </motion.form>
      </div>
    </div>
  );
}
