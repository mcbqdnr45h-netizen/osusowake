import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, RefreshCw, AlertTriangle, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';

export function AdminMfaModal() {
  const { pendingAdminMfa, sendAdminMfa, verifyAdminMfa, signOut } = useAuth();
  const [location, navigate] = useLocation();

  // パスワード再設定フローでは絶対に MFA モーダルを表示しない
  // （PKCE/implicit/OTP どのリンク経路でも /reset-password で開かれる）
  const isRecoveryFlow =
    location === '/reset-password' ||
    (typeof window !== 'undefined' && (
      window.location.pathname === '/reset-password' ||
      window.location.hash.includes('type=recovery') ||
      new URLSearchParams(window.location.search).get('type') === 'recovery' ||
      new URLSearchParams(window.location.search).has('token_hash')
    ));

  const [code, setCode]         = useState(['', '', '', '', '', '']);
  const [error, setError]       = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [sent, setSent]         = useState(true);
  const inputRefs               = useRef<(HTMLInputElement | null)[]>([]);
  const cooldownRef             = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!pendingAdminMfa) return;
    setSent(true);
    setCode(['', '', '', '', '', '']);
    setError('');
    setResendCooldown(30);
    setTimeout(() => inputRefs.current[0]?.focus(), 300);
  }, [pendingAdminMfa]);

  useEffect(() => {
    if (resendCooldown <= 0) {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
      return;
    }
    cooldownRef.current = setInterval(() => {
      setResendCooldown(c => {
        if (c <= 1) { clearInterval(cooldownRef.current!); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => { if (cooldownRef.current) clearInterval(cooldownRef.current); };
  }, [resendCooldown]);

  function handleDigit(index: number, val: string) {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next = [...code];
    next[index] = digit;
    setCode(next);
    setError('');
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    if (next.every(d => d) && next.join('').length === 6) {
      handleVerify(next.join(''));
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const next = [...code];
      next[index - 1] = '';
      setCode(next);
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      const digits = pasted.split('');
      setCode(digits);
      setError('');
      inputRefs.current[5]?.focus();
      handleVerify(pasted);
    }
  }

  async function handleVerify(otp: string) {
    setVerifying(true);
    setError('');
    const { error: err } = await verifyAdminMfa(otp);
    setVerifying(false);
    if (err) {
      setError(err);
      setCode(['', '', '', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } else {
      navigate('/admin');
    }
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    setResending(true);
    setError('');
    const { error: err } = await sendAdminMfa();
    setResending(false);
    if (err) {
      setError(err);
    } else {
      setSent(true);
      setCode(['', '', '', '', '', '']);
      setResendCooldown(30);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }

  if (!pendingAdminMfa) return null;
  if (isRecoveryFlow) return null;

  const fullCode = code.join('');

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
        className="w-full max-w-sm mx-4 bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* ヘッダー */}
        <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 px-8 pt-10 pb-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-20"
            style={{ backgroundImage: 'radial-gradient(circle at 30% 40%, white 0%, transparent 60%)' }} />
          <div className="relative">
            <div className="w-16 h-16 bg-white/20 rounded-2xl mx-auto mb-4 flex items-center justify-center backdrop-blur-sm border border-white/30">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-black text-white">管理者認証</h2>
            <p className="text-white/75 text-sm mt-1">神モードへのアクセスには<br />メール認証が必要です</p>
          </div>
        </div>

        {/* 本体 */}
        <div className="px-8 py-7">
          {sent && (
            <p className="text-center text-sm text-muted-foreground mb-6 leading-relaxed">
              管理者メールアドレスに<br />
              <span className="font-bold text-foreground">6桁の確認コード</span>を送信しました。
            </p>
          )}

          {/* OTP 入力 */}
          <div className="flex gap-2 justify-center mb-5">
            {code.map((digit, i) => (
              <input
                key={i}
                ref={el => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleDigit(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                onPaste={i === 0 ? handlePaste : undefined}
                disabled={verifying}
                className={`w-11 h-14 text-center text-xl font-black rounded-xl border-2 outline-none transition-all
                  ${digit ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-border bg-gray-50 text-foreground'}
                  ${error ? 'border-red-400 bg-red-50' : ''}
                  focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10
                  disabled:opacity-50`}
              />
            ))}
          </div>

          {/* エラー */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4"
              >
                <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 確認ボタン */}
          <button
            onClick={() => fullCode.length === 6 && handleVerify(fullCode)}
            disabled={fullCode.length !== 6 || verifying}
            className="w-full py-3.5 rounded-2xl font-black text-sm text-white transition-all
              bg-gradient-to-r from-violet-600 to-indigo-600
              hover:shadow-lg hover:shadow-violet-500/25 hover:-translate-y-0.5
              disabled:opacity-40 disabled:translate-y-0 disabled:shadow-none"
          >
            {verifying ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                認証中...
              </span>
            ) : '認証する'}
          </button>

          {/* 再送信 */}
          <div className="flex items-center justify-center gap-1 mt-4">
            <button
              onClick={handleResend}
              disabled={resendCooldown > 0 || resending}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-violet-600 disabled:opacity-40 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
              {resendCooldown > 0 ? `再送信 (${resendCooldown}秒後)` : 'コードを再送信'}
            </button>
          </div>

          {/* キャンセル（ログアウト） */}
          <button
            onClick={signOut}
            className="w-full mt-5 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
          >
            ログアウトする
          </button>
        </div>
      </motion.div>
    </div>
  );
}
