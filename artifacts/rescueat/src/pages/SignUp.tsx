import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye, EyeOff, Mail, Lock, CheckCircle2, X, User, Phone, Store, ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthShell, AuthPrimaryButton } from '@/components/AuthShell';

export default function SignUp() {
  const [, navigate] = useLocation();
  const { signUp, signUpAsStore } = useAuth();

  const params = new URLSearchParams(window.location.search);
  const initialTab = params.get('tab') === 'store' ? 'store' : 'user';

  const [activeTab,       setActiveTab]       = useState<'user' | 'store'>(initialTab);
  const [name,            setName]            = useState('');
  const [phone,           setPhone]           = useState('');
  const [email,           setEmail]           = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword,    setShowPassword]    = useState(false);
  const [showConfirmPw,   setShowConfirmPw]   = useState(false);
  const [agreed,          setAgreed]          = useState(false);
  const [isLoading,       setIsLoading]       = useState(false);
  const [error,           setError]           = useState('');
  const [shakeKey,        setShakeKey]        = useState(0);
  const [done,            setDone]            = useState(false);
  const [needsConfirm,    setNeedsConfirm]    = useState(false);

  useEffect(() => {
    setName(''); setPhone(''); setEmail('');
    setPassword(''); setConfirmPassword('');
    setAgreed(false); setError('');
  }, [activeTab]);

  const passwordsMatch  = confirmPassword === '' || password === confirmPassword;
  const normalizedPhone = phone.replace(/[-\s]/g, '');
  const phoneValid      = /^0[0-9]{9,10}$/.test(normalizedPhone);

  const isValid =
    name.trim().length >= 1 &&
    phoneValid &&
    email.trim() &&
    password.length >= 6 &&
    password === confirmPassword &&
    agreed &&
    !isLoading;

  function handlePhoneChange(val: string) {
    setPhone(val.replace(/[^\d\-\s]/g, ''));
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    setError('');
    setIsLoading(true);

    if (activeTab === 'store') {
      const { error: err, needsConfirmation: confirm } = await signUpAsStore(email, password, name.trim(), normalizedPhone);
      setIsLoading(false);
      if (err) { setError(err); setShakeKey(k => k + 1); return; }
      setNeedsConfirm(confirm);
      setDone(true);
      if (!confirm) setTimeout(() => navigate('/store-onboarding'), 2000);
    } else {
      const { error: err, needsConfirmation: confirm } = await signUp(email, password, name, phone);
      setIsLoading(false);
      if (err) { setError(err); setShakeKey(k => k + 1); return; }
      setNeedsConfirm(confirm);
      setDone(true);
      if (!confirm) setTimeout(() => navigate('/'), 1200);
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
            <span className="text-5xl">
              {needsConfirm ? '📧' : (activeTab === 'store' ? '🏪' : '🎉')}
            </span>
          </div>
          <h2 className="text-2xl font-black text-foreground mb-3">
            {needsConfirm ? '確認メールを送信しました' : (activeTab === 'store' ? 'アカウント登録完了！' : 'ようこそ！')}
          </h2>
          {needsConfirm ? (
            <>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                <span className="font-bold text-foreground">{email}</span> に確認メールを送りました。
                メール内のリンクをクリックして、登録を完了してください。
              </p>
              <Link
                href={activeTab === 'store' ? '/login?tab=store' : '/login'}
                className="w-full flex items-center justify-center gap-2 text-white font-black py-4 rounded-2xl"
                style={{
                  background: 'linear-gradient(180deg, #F07826 0%, #E85A0C 100%)',
                  boxShadow: '0 4px 20px rgba(242,100,25,0.30)',
                }}
              >
                ログイン画面へ
              </Link>
            </>
          ) : (
            <>
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                {activeTab === 'store'
                  ? <>登録が完了しました。<br />続けて店舗情報を入力してください。</>
                  : 'マイページに移動します...'}
              </p>
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </>
          )}
        </motion.div>
      </div>
    );
  }

  const labelClass = "block text-xs font-black text-foreground/65 uppercase tracking-widest mb-2";
  const inputBase  = "w-full bg-white border border-border/80 rounded-xl pl-11 pr-4 py-3.5 text-foreground font-medium placeholder:text-muted-foreground/45 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all text-[15px]";

  const isStore = activeTab === 'store';

  return (
    <AuthShell activeTab={activeTab} onTabChange={setActiveTab} mode="signup">
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
          <div className="mb-6">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
              style={{
                background: 'linear-gradient(135deg, #FFF8F0 0%, #FFE8D0 100%)',
                boxShadow: '0 2px 12px rgba(242,100,25,0.14)',
              }}
            >
              {isStore ? <Store className="w-6 h-6 text-primary" /> : <span className="text-2xl">🍀</span>}
            </div>
            <h1 className="text-[30px] font-black text-foreground leading-tight" style={{ letterSpacing: '-0.03em' }}>
              {isStore ? '店舗オーナー登録' : 'アカウント作成'}
            </h1>
            <p className="text-[14px] text-muted-foreground mt-2 font-medium leading-snug">
              {isStore
                ? '余剰食品をおすそわけして、新しい常連客を増やしましょう'
                : '全国の美味しいおすそわけを、もっと身近に'
              }
            </p>
          </div>

          {/* 店舗特典バナー */}
          {isStore && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-4 mb-5 border border-primary/15"
              style={{ background: 'linear-gradient(135deg, rgba(242,100,25,0.06) 0%, rgba(246,174,45,0.04) 100%)' }}
            >
              <p className="text-[11px] font-black text-primary mb-2.5 tracking-widest uppercase">店舗オーナー特典</p>
              <ul className="space-y-1.5">
                {[
                  '余剰食品を手軽に出品・管理',
                  '売上は毎週月曜に自動振込（Stripe Connect）',
                  'プラットフォーム手数料は25%のみ',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-foreground font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          {/* ── フォーム ── */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 flex-1">

            {/* 氏名 */}
            <div>
              <label className={labelClass}>氏名 <span className="text-destructive normal-case">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <User className="w-4 h-4 text-muted-foreground/60" />
                </div>
                <input type="text" value={name} onChange={e => { setName(e.target.value); setError(''); }}
                  placeholder="山田 太郎" className={inputBase} autoComplete="name" disabled={isLoading} required />
              </div>
            </div>

            {/* 電話番号 */}
            <div>
              <label className={labelClass}>電話番号 <span className="text-destructive normal-case">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Phone className="w-4 h-4 text-muted-foreground/60" />
                </div>
                <input type="tel" value={phone} onChange={e => handlePhoneChange(e.target.value)}
                  placeholder="090-0000-0000"
                  className={`w-full bg-white border rounded-xl pl-11 pr-4 py-3.5 text-foreground font-medium placeholder:text-muted-foreground/45 focus:ring-4 outline-none transition-all text-[15px] ${
                    phone.length > 0 && !phoneValid ? 'border-destructive focus:border-destructive focus:ring-destructive/10'
                    : phone.length > 0 && phoneValid ? 'border-green-500 focus:border-green-500 focus:ring-green-500/10'
                    : 'border-border/80 focus:border-primary focus:ring-primary/10'
                  }`}
                  autoComplete="tel" disabled={isLoading} required />
              </div>
              {phone.length > 0 && !phoneValid && <p className="text-destructive text-[12px] font-semibold mt-1.5">正しい電話番号を入力してください（例：090-0000-0000）</p>}
              {phone.length > 0 && phoneValid  && <p className="text-green-600 text-[12px] font-semibold mt-1.5">電話番号を確認しました ✓</p>}
            </div>

            {/* メール */}
            <div>
              <label className={labelClass}>メールアドレス <span className="text-destructive normal-case">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Mail className="w-4 h-4 text-muted-foreground/60" />
                </div>
                <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(''); }}
                  placeholder={isStore ? 'store@example.com' : 'example@email.com'}
                  className={inputBase} autoComplete="email" disabled={isLoading} required />
              </div>
            </div>

            {/* パスワード */}
            <div>
              <label className={labelClass}>パスワード <span className="text-destructive normal-case">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Lock className="w-4 h-4 text-muted-foreground/60" />
                </div>
                <input type={showPassword ? 'text' : 'password'} value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  placeholder="6文字以上"
                  className={`${inputBase} pr-12`}
                  autoComplete="new-password" disabled={isLoading} required />
                <motion.button type="button" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute inset-y-0 right-4 flex items-center text-muted-foreground/50 hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </motion.button>
              </div>
              {password.length > 0 && password.length < 6 && <p className="text-destructive text-[12px] font-semibold mt-1.5">6文字以上で入力してください</p>}
            </div>

            {/* パスワード（確認） */}
            <div>
              <label className={labelClass}>パスワード（確認） <span className="text-destructive normal-case">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Lock className="w-4 h-4 text-muted-foreground/60" />
                </div>
                <input type={showConfirmPw ? 'text' : 'password'} value={confirmPassword}
                  onChange={e => { setConfirmPassword(e.target.value); setError(''); }}
                  placeholder="もう一度入力"
                  className={`w-full bg-white border rounded-xl pl-11 pr-12 py-3.5 text-foreground font-medium placeholder:text-muted-foreground/45 focus:ring-4 outline-none transition-all text-[15px] ${
                    !passwordsMatch ? 'border-destructive focus:border-destructive focus:ring-destructive/10'
                    : confirmPassword.length > 0 && password === confirmPassword ? 'border-green-500 focus:border-green-500 focus:ring-green-500/10'
                    : 'border-border/80 focus:border-primary focus:ring-primary/10'
                  }`}
                  autoComplete="new-password" disabled={isLoading} required />
                <motion.button type="button" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  onClick={() => setShowConfirmPw(v => !v)}
                  className="absolute inset-y-0 right-4 flex items-center text-muted-foreground/50 hover:text-foreground transition-colors">
                  {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </motion.button>
              </div>
              {!passwordsMatch && <p className="text-destructive text-[12px] font-semibold mt-1.5">パスワードが一致しません</p>}
              {confirmPassword.length > 0 && password === confirmPassword && <p className="text-green-600 text-[12px] font-semibold mt-1.5">パスワードが一致しています ✓</p>}
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

            <div className="flex-1 min-h-2" />

            {/* 利用規約 */}
            <motion.div
              whileTap={{ scale: 0.99 }}
              onClick={() => setAgreed(v => !v)}
              className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all select-none
                ${agreed ? 'border-primary/40 bg-primary/5' : 'border-border/60 bg-white hover:border-primary/30'}`}
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
            </motion.div>

            {isStore && (
              <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                <span>登録情報はStripeとの連携に使用されます。第三者への提供はありません。</span>
              </div>
            )}

            <AuthPrimaryButton disabled={!isValid} isLoading={isLoading}>
              {isStore ? <><Store className="w-4.5 h-4.5" />店舗として登録する</> : '登録する'}
            </AuthPrimaryButton>

            <p className="text-center text-[13px] text-muted-foreground pb-3">
              すでにアカウントをお持ちですか？{' '}
              <Link
                href={isStore ? '/login?tab=store' : '/login'}
                className="text-primary font-black underline underline-offset-2"
              >
                ログイン
              </Link>
            </p>
          </form>
        </motion.div>
      </AnimatePresence>
    </AuthShell>
  );
}
