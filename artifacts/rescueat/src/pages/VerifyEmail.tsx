import React, { useRef, useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ChevronLeft, CheckCircle2, RefreshCw } from 'lucide-react';
import { Link } from 'wouter';

const CORRECT_CODE = '123456';
const CODE_LENGTH = 6;

export default function VerifyEmail() {
  const [, navigate] = useLocation();
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [shaking, setShaking] = useState(false);
  const [verified, setVerified] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  function handleChange(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1);
    setError('');

    const next = [...digits];
    next[index] = digit;
    setDigits(next);

    if (digit && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        const next = [...digits];
        next[index] = '';
        setDigits(next);
        setError('');
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
        const next = [...digits];
        next[index - 1] = '';
        setDigits(next);
        setError('');
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH);
    if (!pasted) return;
    const next = Array(CODE_LENGTH).fill('');
    pasted.split('').forEach((ch, i) => { next[i] = ch; });
    setDigits(next);
    setError('');
    const focusIdx = Math.min(pasted.length, CODE_LENGTH - 1);
    inputRefs.current[focusIdx]?.focus();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const code = digits.join('');
    if (code.length < CODE_LENGTH) {
      setError('6桁のコードをすべて入力してください');
      triggerShake();
      return;
    }
    if (code !== CORRECT_CODE) {
      setError('コードが間違っています。もう一度確認してください。');
      triggerShake();
      setDigits(Array(CODE_LENGTH).fill(''));
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
      return;
    }
    setVerified(true);
    setTimeout(() => navigate('/'), 1400);
  }

  function triggerShake() {
    setShaking(true);
    setTimeout(() => setShaking(false), 500);
  }

  function handleResend() {
    if (resendCooldown > 0) return;
    setResendCooldown(30);
    setError('');
    setDigits(Array(CODE_LENGTH).fill(''));
    setTimeout(() => inputRefs.current[0]?.focus(), 50);
  }

  const isFilled = digits.join('').length === CODE_LENGTH;

  if (verified) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-background px-6">
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="flex flex-col items-center text-center"
        >
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6 relative">
            <CheckCircle2 className="w-14 h-14 text-primary" />
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.4, 1] }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="absolute inset-0 bg-primary/10 rounded-full"
            />
          </div>
          <h2 className="text-2xl font-black text-foreground mb-2">認証完了！</h2>
          <p className="text-muted-foreground text-sm">ようこそ、おすそわけへ 🎉</p>
          <p className="text-muted-foreground text-xs mt-1">ホーム画面へ移動します...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col bg-background">

      {/* Header */}
      <div className="flex items-center px-4 pt-12 pb-4">
        <Link href="/signup">
          <button className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors">
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
        </Link>
      </div>

      <div className="flex-1 flex flex-col px-6 pt-2 pb-10 max-w-md md:max-w-2xl mx-auto w-full">

        {/* Icon + Title */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-10"
        >
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-5">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-black text-foreground mb-2">メールアドレスの確認</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            確認コードを送信しました。<br />
            登録したメールアドレスに届いた
            <span className="font-bold text-foreground"> 6桁のコード</span>
            を入力してください。
          </p>
          {/* Dev hint */}
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2">
            <span className="text-amber-500 text-xs font-black mt-0.5">DEV</span>
            <p className="text-amber-700 text-xs font-medium">
              開発用モック: コード <span className="font-black tracking-widest">123456</span> で認証できます
            </p>
          </div>
        </motion.div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6 flex-1">

          {/* OTP Input Boxes */}
          <motion.div
            animate={shaking ? {
              x: [0, -10, 10, -10, 10, -6, 6, 0],
            } : { x: 0 }}
            transition={{ duration: 0.45 }}
          >
            <div className="flex gap-3 justify-center" onPaste={handlePaste}>
              {digits.map((digit, i) => (
                <input
                  key={i}
                  ref={el => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={2}
                  value={digit}
                  onChange={e => handleChange(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  onFocus={e => e.target.select()}
                  className={`w-12 h-14 text-center text-2xl font-black rounded-xl border-2 outline-none transition-all caret-transparent
                    bg-card text-foreground
                    ${digit
                      ? 'border-primary bg-primary/5 text-primary shadow-sm shadow-primary/10'
                      : 'border-border'
                    }
                    focus:border-primary focus:ring-4 focus:ring-primary/15 focus:bg-primary/5
                    ${error ? 'border-destructive/60 bg-destructive/5' : ''}
                  `}
                  aria-label={`コード ${i + 1}桁目`}
                />
              ))}
            </div>

            {/* Error message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-4 flex items-center gap-2 bg-destructive/10 border border-destructive/30 text-destructive text-sm font-medium px-4 py-3 rounded-xl"
                >
                  <span className="text-base">❌</span>
                  {error}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <div className="flex-1" />

          {/* Submit button */}
          <button
            type="submit"
            disabled={!isFilled}
            className={`w-full font-black text-lg py-4 rounded-2xl transition-all min-h-[56px]
              ${isFilled
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 active:scale-[0.98]'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
              }`}
          >
            認証して始める
          </button>

          {/* Resend */}
          <div className="text-center pb-2">
            <p className="text-sm text-muted-foreground mb-2">コードが届いていませんか？</p>
            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0}
              className={`inline-flex items-center gap-1.5 text-sm font-bold transition-colors
                ${resendCooldown > 0
                  ? 'text-muted-foreground cursor-not-allowed'
                  : 'text-primary hover:underline'
                }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${resendCooldown > 0 ? 'animate-spin' : ''}`} />
              {resendCooldown > 0
                ? `再送信まで ${resendCooldown}秒`
                : 'コードを再送信する'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
