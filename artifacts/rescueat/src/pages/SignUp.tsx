import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, CheckCircle2, Gift, X, User, Phone } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthShell, AuthPrimaryButton } from '@/components/AuthShell';

export default function SignUp() {
  const [, navigate] = useLocation();
  const { signUp } = useAuth();

  const [name,            setName]            = useState('');
  const [phone,           setPhone]           = useState('');
  const [email,           setEmail]           = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword,    setShowPassword]    = useState(false);
  const [showConfirmPw,   setShowConfirmPw]   = useState(false);
  const [agreed,          setAgreed]          = useState(false);
  const [referralCode,    setReferralCode]    = useState('');
  const [referralValid,   setReferralValid]   = useState<boolean | null>(null);
  const [isLoading,       setIsLoading]       = useState(false);
  const [error,           setError]           = useState('');
  const [done,            setDone]            = useState(false);
  const [needsConfirm,    setNeedsConfirm]    = useState(false);

  const passwordsMatch   = confirmPassword === '' || password === confirmPassword;
  const normalizedPhone  = phone.replace(/[-\s]/g, '');
  const phoneValid       = /^0[0-9]{9,10}$/.test(normalizedPhone);

  const isValid =
    name.trim().length >= 1 &&
    phoneValid &&
    email.trim() &&
    password.length >= 6 &&
    password === confirmPassword &&
    agreed &&
    !isLoading;

  function handleReferralChange(val: string) {
    const upper = val.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setReferralCode(upper);
    if (upper.length === 0)    setReferralValid(null);
    else if (upper.length >= 8) setReferralValid(true);
    else                        setReferralValid(false);
  }

  function handlePhoneChange(val: string) {
    setPhone(val.replace(/[^\d\-\s]/g, ''));
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    setError('');
    setIsLoading(true);

    const { error: err, needsConfirmation: confirm } = await signUp(email, password, name, phone);
    setIsLoading(false);

    if (err) { setError(err); return; }

    setNeedsConfirm(confirm);
    setDone(true);
    if (!confirm) setTimeout(() => navigate('/'), 1200);
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
            <span className="text-5xl">{needsConfirm ? '📧' : '🎉'}</span>
          </div>
          <h2 className="text-2xl font-black text-foreground mb-3">
            {needsConfirm ? '確認メールを送信しました' : 'ようこそ！'}
          </h2>
          {needsConfirm ? (
            <>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                <span className="font-bold text-foreground">{email}</span> に確認メールを送りました。
                メール内のリンクをクリックして、登録を完了してください。
              </p>
              <Link
                href="/login"
                className="w-full flex items-center justify-center gap-2 text-white font-black py-4 rounded-2xl transition-all"
                style={{ background: 'linear-gradient(180deg, #FFA733 0%, #F07800 100%)', boxShadow: '0 4px 20px rgba(255,120,0,0.30)' }}
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

  const labelClass = "block text-xs font-black text-foreground/70 uppercase tracking-wider mb-2";
  const inputBase  = "w-full bg-card border-2 border-border rounded-xl pl-11 pr-4 py-3.5 text-foreground font-medium placeholder:text-muted-foreground/50 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all";

  return (
    <AuthShell activeTab="user" mode="signup">

      {/* ── ヒーロー ── */}
      <motion.div
        initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.38 }}
        className="mb-8"
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 shadow-sm"
          style={{ background: 'linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%)' }}
        >
          <span className="text-2xl">🍀</span>
        </div>
        <h1 className="text-[28px] font-black text-foreground leading-tight tracking-tight">アカウント作成</h1>
        <p className="text-muted-foreground text-sm mt-1.5 font-medium">
          お近くのお店から、おすそ分けを受け取ろう
        </p>
      </motion.div>

      {/* ── フォーム ── */}
      <motion.form
        initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.38 }}
        onSubmit={handleSubmit}
        className="flex flex-col gap-5 flex-1"
      >

        {/* 氏名 */}
        <div>
          <label className={labelClass}>氏名 <span className="text-destructive normal-case">*</span></label>
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <User className="w-4 h-4 text-muted-foreground" />
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
              <Phone className="w-4 h-4 text-muted-foreground" />
            </div>
            <input type="tel" value={phone} onChange={e => handlePhoneChange(e.target.value)}
              placeholder="090-0000-0000"
              className={`w-full bg-card border-2 rounded-xl pl-11 pr-4 py-3.5 text-foreground font-medium placeholder:text-muted-foreground/50 focus:ring-4 outline-none transition-all ${
                phone.length > 0 && !phoneValid ? 'border-destructive focus:border-destructive focus:ring-destructive/10'
                : phone.length > 0 && phoneValid ? 'border-green-500 focus:border-green-500 focus:ring-green-500/10'
                : 'border-border focus:border-primary focus:ring-primary/10'
              }`}
              autoComplete="tel" disabled={isLoading} required />
          </div>
          {phone.length > 0 && !phoneValid && <p className="text-destructive text-xs font-semibold mt-1.5">正しい電話番号を入力してください（例：090-0000-0000）</p>}
          {phone.length > 0 && phoneValid  && <p className="text-green-600 text-xs font-semibold mt-1.5">電話番号を確認しました ✓</p>}
        </div>

        {/* メール */}
        <div>
          <label className={labelClass}>メールアドレス <span className="text-destructive normal-case">*</span></label>
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Mail className="w-4 h-4 text-muted-foreground" />
            </div>
            <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(''); }}
              placeholder="example@email.com" className={inputBase} autoComplete="email" disabled={isLoading} required />
          </div>
        </div>

        {/* パスワード */}
        <div>
          <label className={labelClass}>パスワード <span className="text-destructive normal-case">*</span></label>
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Lock className="w-4 h-4 text-muted-foreground" />
            </div>
            <input type={showPassword ? 'text' : 'password'} value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              placeholder="6文字以上"
              className="w-full bg-card border-2 border-border rounded-xl pl-11 pr-12 py-3.5 text-foreground font-medium placeholder:text-muted-foreground/50 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
              autoComplete="new-password" disabled={isLoading} required />
            <motion.button type="button" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              onClick={() => setShowPassword(v => !v)}
              className="absolute inset-y-0 right-4 flex items-center text-muted-foreground hover:text-foreground transition-colors">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </motion.button>
          </div>
          {password.length > 0 && password.length < 6 && <p className="text-destructive text-xs font-semibold mt-1.5">6文字以上で入力してください</p>}
        </div>

        {/* パスワード（確認） */}
        <div>
          <label className={labelClass}>パスワード（確認） <span className="text-destructive normal-case">*</span></label>
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Lock className="w-4 h-4 text-muted-foreground" />
            </div>
            <input type={showConfirmPw ? 'text' : 'password'} value={confirmPassword}
              onChange={e => { setConfirmPassword(e.target.value); setError(''); }}
              placeholder="もう一度入力"
              className={`w-full bg-card border-2 rounded-xl pl-11 pr-12 py-3.5 text-foreground font-medium placeholder:text-muted-foreground/50 focus:ring-4 outline-none transition-all ${
                !passwordsMatch ? 'border-destructive focus:border-destructive focus:ring-destructive/10'
                : confirmPassword.length > 0 && password === confirmPassword ? 'border-green-500 focus:border-green-500 focus:ring-green-500/10'
                : 'border-border focus:border-primary focus:ring-primary/10'
              }`}
              autoComplete="new-password" disabled={isLoading} required />
            <motion.button type="button" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              onClick={() => setShowConfirmPw(v => !v)}
              className="absolute inset-y-0 right-4 flex items-center text-muted-foreground hover:text-foreground transition-colors">
              {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </motion.button>
          </div>
          {!passwordsMatch && <p className="text-destructive text-xs font-semibold mt-1.5">パスワードが一致しません</p>}
          {confirmPassword.length > 0 && password === confirmPassword && <p className="text-green-600 text-xs font-semibold mt-1.5">パスワードが一致しています ✓</p>}
        </div>

        {/* 招待コード */}
        <div>
          <label className="block text-xs font-black text-foreground/70 uppercase tracking-wider mb-2">
            招待コード <span className="ml-1 text-[11px] font-semibold text-muted-foreground normal-case tracking-normal">（任意）</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Gift className="w-4 h-4 text-muted-foreground" />
            </div>
            <input type="text" value={referralCode} onChange={e => handleReferralChange(e.target.value)}
              placeholder="例：RESCUEA08C32" maxLength={12}
              className={`w-full bg-card border-2 rounded-xl pl-11 pr-10 py-3.5 text-foreground font-mono font-medium tracking-widest placeholder:text-muted-foreground/50 placeholder:font-normal placeholder:tracking-normal focus:ring-4 outline-none transition-all uppercase ${
                referralValid === true  ? 'border-green-500 focus:border-green-500 focus:ring-green-500/10'
                : referralValid === false ? 'border-amber-400 focus:border-amber-400 focus:ring-amber-400/10'
                : 'border-border focus:border-primary focus:ring-primary/10'
              }`}
              autoComplete="off" disabled={isLoading} />
            {referralCode.length > 0 && (
              <button type="button" onClick={() => { setReferralCode(''); setReferralValid(null); }}
                className="absolute inset-y-0 right-4 flex items-center text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <AnimatePresence>
            {referralValid === true && (
              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-center gap-1.5 text-green-600 text-xs font-bold mt-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />招待コードを確認しました
              </motion.p>
            )}
            {referralValid === false && (
              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="text-amber-600 text-xs font-semibold mt-1.5">
                8文字以上の英数字で入力してください
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* エラー */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="bg-destructive/10 border border-destructive/25 text-destructive text-sm font-semibold px-4 py-3 rounded-xl">
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1" />

        {/* 利用規約 */}
        <motion.div
          whileTap={{ scale: 0.99 }}
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
        </motion.div>

        <AuthPrimaryButton disabled={!isValid} isLoading={isLoading}>
          登録する
        </AuthPrimaryButton>

        <p className="text-center text-sm text-muted-foreground pb-2">
          すでにアカウントをお持ちですか？{' '}
          <Link href="/login" className="text-primary font-black underline underline-offset-2">ログイン</Link>
        </p>
      </motion.form>
    </AuthShell>
  );
}
