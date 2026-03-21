import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, ChevronLeft, Mail, Lock, CheckCircle2, Gift, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function SignUp() {
  const [, navigate] = useLocation();
  const { signUp } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [referralValid, setReferralValid] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  const passwordsMatch = confirmPassword === '' || password === confirmPassword;
  const isValid = email.trim() && password.length >= 6 && password === confirmPassword && agreed && !isLoading;

  function handleReferralChange(val: string) {
    const upper = val.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setReferralCode(upper);
    if (upper.length === 0) {
      setReferralValid(null);
    } else if (upper.length >= 8) {
      setReferralValid(true);
    } else {
      setReferralValid(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    setError('');
    setIsLoading(true);

    const { error: err, needsConfirmation: confirm } = await signUp(email, password);

    setIsLoading(false);

    if (err) {
      setError(err);
      return;
    }

    setNeedsConfirmation(confirm);
    setDone(true);

    if (!confirm) {
      // ?redirect= があればそちら、なければ商品一覧トップへ
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect');
      setTimeout(() => navigate(redirect ? decodeURIComponent(redirect) : '/'), 1200);
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
            <span className="text-5xl">{needsConfirmation ? '📧' : '🎉'}</span>
          </div>
          <h2 className="text-2xl font-black text-foreground mb-3">
            {needsConfirmation ? '確認メールを送信しました' : 'ようこそ！'}
          </h2>
          {needsConfirmation ? (
            <>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                <span className="font-bold text-foreground">{email}</span> に確認メールを送りました。
                メール内のリンクをクリックして、登録を完了してください。
              </p>
              <Link
                href="/login"
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-black py-4 rounded-2xl hover:bg-primary/90 transition-all"
              >
                ログイン画面へ
              </Link>
            </>
          ) : (
            <p className="text-muted-foreground text-sm">マイページに移動します...</p>
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
          <button className="flex-1 py-2.5 rounded-xl text-sm font-black bg-card text-foreground shadow-sm transition-all">
            ユーザー
          </button>
          <Link href="/store/signup" className="flex-1">
            <button className="w-full py-2.5 rounded-xl text-sm font-bold text-muted-foreground transition-all">
              店舗オーナー
            </button>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
            <span className="text-2xl">🍀</span>
          </div>
          <h1 className="text-2xl font-black text-foreground">アカウント作成</h1>
          <p className="text-muted-foreground text-sm mt-1">食べロスに参加して、フードロス削減に貢献しよう</p>
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
                className={`w-full bg-card border-2 rounded-xl pl-11 pr-12 py-3.5 text-foreground font-medium placeholder:text-muted-foreground/60 placeholder:font-normal focus:ring-4 outline-none transition-all ${
                  !passwordsMatch
                    ? 'border-destructive focus:border-destructive focus:ring-destructive/10'
                    : confirmPassword.length > 0 && password === confirmPassword
                    ? 'border-green-500 focus:border-green-500 focus:ring-green-500/10'
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
            {!passwordsMatch && (
              <p className="text-destructive text-xs font-medium mt-1.5">パスワードが一致しません</p>
            )}
            {confirmPassword.length > 0 && password === confirmPassword && (
              <p className="text-green-600 text-xs font-medium mt-1.5">パスワードが一致しています ✓</p>
            )}
          </div>

          {/* Referral Code */}
          <div>
            <label className="block text-sm font-bold text-foreground mb-1.5">
              招待コード
              <span className="ml-2 text-xs font-normal text-muted-foreground">（任意）</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Gift className="w-4 h-4 text-muted-foreground" />
              </div>
              <input
                type="text"
                value={referralCode}
                onChange={e => handleReferralChange(e.target.value)}
                placeholder="例：RESCUEA08C32"
                maxLength={12}
                className={`w-full bg-card border-2 rounded-xl pl-11 pr-10 py-3.5 text-foreground font-mono font-medium tracking-widest placeholder:text-muted-foreground/60 placeholder:font-normal placeholder:tracking-normal focus:ring-4 outline-none transition-all uppercase
                  ${referralValid === true
                    ? 'border-green-500 focus:border-green-500 focus:ring-green-500/10'
                    : referralValid === false
                    ? 'border-amber-400 focus:border-amber-400 focus:ring-amber-400/10'
                    : 'border-border focus:border-primary focus:ring-primary/10'
                  }`}
                autoComplete="off"
                disabled={isLoading}
              />
              {referralCode.length > 0 && (
                <button
                  type="button"
                  onClick={() => { setReferralCode(''); setReferralValid(null); }}
                  className="absolute inset-y-0 right-4 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <AnimatePresence>
              {referralValid === true && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-1.5 text-green-600 text-xs font-bold mt-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  招待コードを確認しました
                </motion.p>
              )}
              {referralValid === false && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="text-amber-600 text-xs font-medium mt-1.5"
                >
                  8文字以上の英数字で入力してください
                </motion.p>
              )}
            </AnimatePresence>
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
            ) : '登録する'}
          </button>

          <p className="text-center text-sm text-muted-foreground pb-2">
            すでにアカウントをお持ちですか？{' '}
            <Link href="/login" className="text-primary font-bold underline underline-offset-2">ログイン</Link>
          </p>
        </motion.form>
      </div>
    </div>
  );
}
