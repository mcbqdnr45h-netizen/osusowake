import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import logoUrl from '@/lib/logo';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye, EyeOff, Mail, Lock, CheckCircle2, X, User, Phone, Store, ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthShell, AuthPrimaryButton } from '@/components/AuthShell';

const SHOW_SSO = true;

export default function SignUp() {
  const [, navigate] = useLocation();
  const { signUp, signUpAsStore, signInWithProvider } = useAuth();
  const [ssoLoading, setSsoLoading] = useState<'apple' | 'google' | null>(null);

  async function handleSso(provider: 'apple' | 'google') {
    setSsoLoading(provider);
    try {
      const { error: err } = await signInWithProvider(provider);
      if (err) console.warn('[SignUp SSO]', err);
    } finally {
      setSsoLoading(null);
    }
  }

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
  const [loadingStep,     setLoadingStep]     = useState('');
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

  // ★ ニックネームは登録時不要 (オプトイン制ランキング参加時にのみ要求)。

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
    setLoadingStep('処理中…');

    try {
      if (activeTab === 'store') {
        const { error: err, needsConfirmation: confirm } = await signUpAsStore(email, password, name.trim(), normalizedPhone, setLoadingStep);
        if (err) { setError(err); setShakeKey(k => k + 1); return; }
        setNeedsConfirm(confirm);
        setDone(true);
        if (!confirm) setTimeout(() => navigate('/store-onboarding'), 2000);
      } else {
        const { error: err, needsConfirmation: confirm } = await signUp(email, password, name, phone, '', setLoadingStep);
        if (err) { setError(err); setShakeKey(k => k + 1); return; }
        setNeedsConfirm(confirm);
        setDone(true);
        if (!confirm) setTimeout(() => navigate('/'), 1200);
      }
    } catch (e: any) {
      setError(e?.message ?? '登録中にエラーが発生しました');
      setShakeKey(k => k + 1);
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  }

  if (done) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-background px-6">
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="flex flex-col items-center text-center max-w-sm md:max-w-2xl"
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
          className="flex flex-col flex-1 md:flex-none"
        >
          {/* ── ヒーロー（プレミアム） ── */}
          <div className="mb-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 220, damping: 22 }}
              className="relative inline-block mb-4"
            >
              <div
                aria-hidden
                className="absolute inset-0 rounded-2xl blur-xl"
                style={{
                  background: isStore
                    ? 'linear-gradient(135deg, rgba(242,100,25,0.35), rgba(246,174,45,0.25))'
                    : 'linear-gradient(135deg, rgba(242,100,25,0.30), rgba(255,180,100,0.25))',
                }}
              />
              <div
                className="relative w-16 h-16 rounded-2xl flex items-center justify-center ring-1 ring-black/5 shadow-lg"
                style={{
                  background: isStore
                    ? 'linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%)'
                    : '#FFFFFF',
                  boxShadow: '0 6px 20px rgba(242,100,25,0.18)',
                }}
              >
                {isStore
                  ? <Store className="w-7 h-7 text-primary" strokeWidth={2.4} />
                  : <img loading="lazy" decoding="async" src={logoUrl} alt="おすそわけ" className="w-full h-full rounded-2xl object-cover" />
                }
              </div>
            </motion.div>
            <p className="text-[10px] font-black tracking-[0.25em] text-primary/80 mb-1.5">おすそわけ</p>
            <h1 className="text-[28px] font-black text-foreground leading-tight" style={{ letterSpacing: '-0.03em' }}>
              {isStore ? (
                <>店舗オーナー登録</>
              ) : (
                <>はじめまして<span className="text-primary">。</span></>
              )}
            </h1>
            <p className="text-[13.5px] text-muted-foreground mt-2 font-medium leading-snug">
              {isStore
                ? '余剰食品をおすそわけして、新しい常連客を増やしましょう'
                : '全国の美味しいおすそわけを、もっと身近に。'
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
                  '売上は毎月25日に自動振込',
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
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 flex-1 md:flex-none">

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
              {!isStore && (
                <p className="text-[11px] text-muted-foreground/70 mt-1.5 leading-snug">
                  本名は他のユーザーには公開されません (注文時の宛名・本人確認用)
                </p>
              )}
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
              {/* ★ #4: 電話番号の利用目的を明示 (店舗からの受取連絡用、 マーケティング目的では使用しない) */}
              <p className="text-muted-foreground text-[11px] mt-1.5 leading-snug">
                受取時に店舗から連絡が必要な場合のみ使用します。 広告・マーケティング目的では一切使用しません。
              </p>
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
                <span>登録情報は決済システムとの連携に使用されます。第三者への提供はありません。</span>
              </div>
            )}

            <AuthPrimaryButton disabled={!isValid} isLoading={isLoading} loadingText={loadingStep}>
              {isStore ? <><Store className="w-4.5 h-4.5" />店舗として登録する</> : '登録する'}
            </AuthPrimaryButton>

            {SHOW_SSO && !isStore && (
              <>
                <div className="flex items-center gap-3 my-1">
                  <div className="flex-1 h-px bg-border/60" />
                  <span className="text-[11px] font-bold text-muted-foreground/60 shrink-0">または</span>
                  <div className="flex-1 h-px bg-border/60" />
                </div>
                <button
                  type="button"
                  onClick={() => handleSso('apple')}
                  disabled={!!ssoLoading}
                  className="w-full flex items-center justify-center gap-2.5 bg-foreground text-background font-bold py-3.5 rounded-2xl text-[14px] tap-scale disabled:opacity-60"
                  aria-label="Apple で続ける"
                >
                  <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 fill-current shrink-0" aria-hidden><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                  {ssoLoading === 'apple' ? '接続中…' : 'Apple で続ける'}
                </button>
                <button
                  type="button"
                  onClick={() => handleSso('google')}
                  disabled={!!ssoLoading}
                  className="w-full flex items-center justify-center gap-2.5 bg-white border border-border text-foreground font-bold py-3.5 rounded-2xl text-[14px] tap-scale disabled:opacity-60 shadow-sm"
                  aria-label="Google で続ける"
                >
                  <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 shrink-0" aria-hidden><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  {ssoLoading === 'google' ? '接続中…' : 'Google で続ける'}
                </button>
              </>
            )}

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
