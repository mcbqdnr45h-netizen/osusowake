import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import logoUrl from '@/lib/logo';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, Store, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthShell, AuthPrimaryButton } from '@/components/AuthShell';

export default function Login() {
  const [, navigate] = useLocation();
  const { signIn, resetPasswordForEmail } = useAuth();

  function getInitialTab(): 'user' | 'store' {
    const params = new URLSearchParams(window.location.search);
    return params.get('tab') === 'store' ? 'store' : 'user';
  }

  const [activeTab,  setActiveTab]  = useState<'user' | 'store'>(getInitialTab);
  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [showPw,     setShowPw]     = useState(false);
  const [isLoading,  setIsLoading]  = useState(false);
  const [error,      setError]      = useState('');
  const [shakeKey,   setShakeKey]   = useState(0);

  // ── パスワードリセット ──
  const [showForgotPw,  setShowForgotPw]  = useState(false);
  const [forgotEmail,   setForgotEmail]   = useState('');
  const [forgotSending, setForgotSending] = useState(false);
  const [forgotSent,    setForgotSent]    = useState(false);
  const [forgotError,   setForgotError]   = useState('');

  async function handleForgotPw() {
    if (!forgotEmail.trim() || forgotSending) return;
    setForgotSending(true);
    setForgotError('');
    const { error: err } = await resetPasswordForEmail(forgotEmail);
    setForgotSending(false);
    if (err) { setForgotError(err); return; }
    setForgotSent(true);
  }

  // タブ変更時: URLを更新（リマウント時の状態リセット防止）、フォームをクリア
  function handleTabChange(tab: 'user' | 'store') {
    setActiveTab(tab);
    const base = window.location.pathname;
    window.history.replaceState(null, '', tab === 'store' ? `${base}?tab=store` : base);
    setEmail('');
    setPassword('');
    setError('');
  }

  const isValid = email.trim() && password.length >= 1 && !isLoading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    setError('');
    setIsLoading(true);

    if (activeTab === 'store') {
      // 店舗タブでログイン → ユーザーモードフラグを解除
      sessionStorage.removeItem('adminUserMode');
      const { error: err } = await signIn(email, password, 'store_owner');
      setIsLoading(false);
      if (err) {
        setError(err);
        setShakeKey(k => k + 1);
        return;
      }
      const params = new URLSearchParams(window.location.search);
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
      const { error: err, role, isAdmin: adminFlag, requiresMfa } = await signIn(email, password);
      setIsLoading(false);
      if (err) {
        setError(err);
        setShakeKey(k => k + 1);
        return;
      }
      if (role === 'store_owner' && !adminFlag) {
        setError('このアカウントは店舗オーナー用です。「飲食店・パートナー」タブからログインしてください。');
        setShakeKey(k => k + 1);
        return;
      }
      // 管理者: MFA モーダルが出るのでここでは navigate しない
      if (requiresMfa) return;
      // 一般ユーザーはホームへ
      navigate('/');
    }
  }

  const labelClass = "block text-xs font-black text-foreground/65 uppercase tracking-widest mb-2";
  const inputClass = "w-full bg-white border border-border/80 rounded-xl pl-11 pr-4 py-3.5 text-foreground font-medium placeholder:text-muted-foreground/45 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all text-[15px]";

  const isStore = activeTab === 'store';

  return (
    <AuthShell activeTab={activeTab} onTabChange={handleTabChange} mode="login">

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
                : <img src={logoUrl} alt="Osusowake" className="w-10 h-10 rounded-xl object-cover" />
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

            {/* パスワードを忘れた方はこちら（一般ユーザー・店舗側 両方に表示） */}
            <div className="flex justify-end -mt-2">
              <button
                type="button"
                onClick={() => { setShowForgotPw(true); setForgotEmail(email); setForgotSent(false); setForgotError(''); }}
                className="text-[12px] text-primary font-bold hover:underline underline-offset-2"
              >
                パスワードを忘れた方はこちら
              </button>
            </div>

            {/* パスワードリセットパネル（常にDOMに存在、高さだけアニメーション）*/}
            {(
              <motion.div
                initial={false}
                animate={{
                  height:   showForgotPw ? 'auto' : 0,
                  opacity:  showForgotPw ? 1 : 0,
                  marginTop: showForgotPw ? undefined : 0,
                }}
                transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
                style={{ pointerEvents: showForgotPw ? 'auto' : 'none' }}
              >
                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-3">
                    {forgotSent ? (
                      <div className="flex flex-col items-center gap-2 py-1">
                        <CheckCircle className="w-8 h-8 text-green-500" />
                        <p className="text-sm font-black text-foreground text-center">メールを送信しました！</p>
                        <p className="text-[12px] text-muted-foreground text-center leading-relaxed">
                          {forgotEmail} にパスワード再設定のリンクを送りました。<br/>メールをご確認ください。
                        </p>
                        <p className="text-[11px] text-muted-foreground text-center leading-relaxed bg-yellow-50 border border-yellow-200 rounded-xl px-3 py-2">
                          ※メールが届かない場合は、迷惑メールフォルダやゴミ箱を確認してください。
                        </p>
                        <button
                          type="button"
                          onClick={() => { setShowForgotPw(false); setForgotSent(false); }}
                          className="text-[12px] text-primary font-bold underline underline-offset-2 mt-1"
                        >
                          ログインに戻る
                        </button>
                      </div>
                    ) : (
                      <>
                        <p className="text-[12px] font-bold text-foreground">パスワード再設定メールを送信します</p>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
                            <Mail className="w-4 h-4 text-muted-foreground/60" />
                          </div>
                          <input
                            type="email"
                            value={forgotEmail}
                            onChange={e => setForgotEmail(e.target.value)}
                            placeholder="登録メールアドレスを入力"
                            className="w-full bg-white border border-border/80 rounded-xl pl-10 pr-4 py-3 text-sm font-medium placeholder:text-muted-foreground/45 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                          />
                        </div>
                        {forgotError && (
                          <p className="text-[12px] text-destructive font-semibold">{forgotError}</p>
                        )}
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setShowForgotPw(false)}
                            className="flex-1 py-2.5 rounded-xl border border-border text-sm font-bold text-muted-foreground hover:bg-muted transition-colors"
                          >
                            キャンセル
                          </button>
                          <button
                            type="button"
                            disabled={!forgotEmail.trim() || forgotSending}
                            onClick={handleForgotPw}
                            className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-black disabled:opacity-50 hover:bg-primary/90 transition-colors"
                          >
                            {forgotSending ? '送信中...' : '送信する'}
                          </button>
                        </div>
                        {/* LINE サポートリンク */}
                        <p className="text-center text-[11px] text-muted-foreground">
                          メールが届かない場合は{' '}
                          <a
                            href="https://lin.ee/V1amrv8"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-bold text-[#06C755] underline underline-offset-2"
                          >
                            LINEでお問い合わせ
                          </a>
                        </p>
                      </>
                    )}
                  </div>
                </motion.div>
            )}

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
