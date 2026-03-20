import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { Eye, EyeOff, ChevronLeft, User, Mail, Lock, CheckCircle2 } from 'lucide-react';

export default function SignUp() {
  const [, navigate] = useLocation();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const isValid = username.trim() && email.trim() && password.length >= 6 && agreed;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    setSubmitted(true);
    setTimeout(() => navigate('/verify-email'), 900);
  }

  if (submitted) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-background px-6">
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="flex flex-col items-center text-center"
        >
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-5">
            <span className="text-4xl">📧</span>
          </div>
          <h2 className="text-2xl font-black text-foreground mb-2">確認メールを送信しました</h2>
          <p className="text-muted-foreground text-sm">メールアドレスの確認画面へ移動します...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col bg-background">

      {/* Header */}
      <div className="flex items-center px-4 pt-12 pb-4">
        <Link href="/welcome">
          <button className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors">
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
        </Link>
      </div>

      <div className="flex-1 flex flex-col px-6 pt-2 pb-10 max-w-md mx-auto w-full">

        {/* Title */}
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
          {/* Username */}
          <div>
            <label className="block text-sm font-bold text-foreground mb-1.5">ユーザー名</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <User className="w-4.5 h-4.5 text-muted-foreground" />
              </div>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="例: tanaka_taro"
                className="w-full bg-card border-2 border-border rounded-xl pl-11 pr-4 py-3.5 text-foreground font-medium placeholder:text-muted-foreground/60 placeholder:font-normal focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                autoComplete="username"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-bold text-foreground mb-1.5">メールアドレス</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Mail className="w-4.5 h-4.5 text-muted-foreground" />
              </div>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="w-full bg-card border-2 border-border rounded-xl pl-11 pr-4 py-3.5 text-foreground font-medium placeholder:text-muted-foreground/60 placeholder:font-normal focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-bold text-foreground mb-1.5">パスワード</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Lock className="w-4.5 h-4.5 text-muted-foreground" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="6文字以上"
                className="w-full bg-card border-2 border-border rounded-xl pl-11 pr-12 py-3.5 text-foreground font-medium placeholder:text-muted-foreground/60 placeholder:font-normal focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute inset-y-0 right-4 flex items-center text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
              </button>
            </div>
            {password.length > 0 && password.length < 6 && (
              <p className="text-destructive text-xs font-medium mt-1.5">6文字以上で入力してください</p>
            )}
          </div>

          <div className="flex-1" />

          {/* Terms agreement checkbox */}
          <div
            onClick={() => setAgreed(v => !v)}
            className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all select-none
              ${agreed ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/40'}`}
          >
            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all
              ${agreed ? 'bg-primary border-primary' : 'border-border bg-background'}`}>
              {agreed && (
                <motion.svg
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  viewBox="0 0 12 10" className="w-3 h-3"
                >
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

          {/* Submit button */}
          <button
            type="submit"
            disabled={!isValid}
            className={`w-full font-black text-lg py-4 rounded-2xl transition-all min-h-[56px]
              ${isValid
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 active:scale-[0.98]'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
              }`}
          >
            登録する
          </button>

          {/* Login link */}
          <p className="text-center text-sm text-muted-foreground pb-2">
            すでにアカウントをお持ちですか？{' '}
            <Link href="/login" className="text-primary font-bold underline underline-offset-2">
              ログイン
            </Link>
          </p>
        </motion.form>
      </div>
    </div>
  );
}
