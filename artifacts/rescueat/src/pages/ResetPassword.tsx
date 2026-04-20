import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { Lock, CheckCircle, AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function ResetPassword() {
  const [, navigate] = useLocation();
  const [password, setPassword]     = useState('');
  const [confirm, setConfirm]       = useState('');
  const [showPw, setShowPw]         = useState(false);
  const [showCf, setShowCf]         = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]             = useState(false);
  const [error, setError]           = useState('');
  const [linkStatus, setLinkStatus] = useState<'checking' | 'ready' | 'failed'>('checking');

  useEffect(() => {
    let cancelled = false;

    // ① 既存セッションを即時確認（SDKがhashを処理済みの場合）
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!cancelled && session?.user) {
        setLinkStatus('ready');
      }
    });

    // ② PASSWORD_RECOVERY イベントを待つ
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (event === 'PASSWORD_RECOVERY' && session?.user) {
        setLinkStatus('ready');
      }
    });

    // ③ 4秒待っても ready にならなければ failed に
    const timeout = setTimeout(() => {
      if (!cancelled) {
        setLinkStatus(prev => prev === 'checking' ? 'failed' : prev);
      }
    }, 4000);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('パスワードは8文字以上で設定してください');
      return;
    }
    if (password !== confirm) {
      setError('パスワードが一致しません');
      return;
    }

    // セッションが有効か確認してから更新
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      setError('セッションが切れました。もう一度パスワードリセットメールを送り直してください。');
      setLinkStatus('failed');
      return;
    }

    setSubmitting(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (err) {
      if (err.message?.includes('different from the old password') || err.message?.includes('same password')) {
        setError('以前と異なるパスワードを設定してください');
      } else if (err.message?.includes('expired') || err.message?.includes('invalid')) {
        setError('リンクの有効期限が切れています。もう一度パスワードリセットメールを送り直してください。');
        setLinkStatus('failed');
      } else if (err.message?.includes('session') || err.message?.includes('Auth session')) {
        setError('セッションが切れました。もう一度パスワードリセットメールを送り直してください。');
        setLinkStatus('failed');
      } else {
        setError('エラーが発生しました。もう一度お試しください');
      }
      return;
    }

    setDone(true);
    setTimeout(() => navigate('/login'), 3000);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm"
      >
        {/* ロゴ */}
        <div className="text-center mb-8 flex flex-col items-center gap-2">
          <img src="/rescueat/images/logo.jpg" alt="Osusowake" className="w-12 h-12 rounded-[14px] object-cover shadow-sm" />
          <div>
            <p className="text-3xl font-black text-primary tracking-tight">Osusowake</p>
            <p className="text-xs text-muted-foreground mt-1">食品ロスをなくす、おすそわけマーケット</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-black/5 border border-border/40 p-7">
          {done ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <CheckCircle className="w-12 h-12 text-green-500" />
              <p className="text-base font-black text-foreground text-center">パスワードを変更しました！</p>
              <p className="text-sm text-muted-foreground text-center leading-relaxed">
                ログインページへ移動します…
              </p>
            </div>
          ) : linkStatus === 'checking' ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm font-bold text-foreground text-center">リンクを確認中…</p>
            </div>
          ) : linkStatus === 'failed' ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <AlertCircle className="w-10 h-10 text-amber-400" />
              <p className="text-sm font-bold text-foreground text-center">リンクを確認できませんでした</p>
              <p className="text-xs text-muted-foreground text-center leading-relaxed">
                メール内のリンクから直接アクセスするか、<br/>
                再度パスワードリセットを申請してください。
              </p>
              <button
                onClick={() => navigate('/login')}
                className="mt-2 text-xs text-primary font-bold underline underline-offset-2"
              >
                ログインページへ戻る
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <p className="text-lg font-black text-foreground mb-0.5">新しいパスワードを設定</p>
                <p className="text-xs text-muted-foreground">8文字以上で入力してください</p>
              </div>

              {/* 新パスワード */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground tracking-wide uppercase">新しいパスワード</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="8文字以上"
                    required
                    className="w-full bg-muted/40 border border-border/70 rounded-xl pl-10 pr-10 py-3 text-sm font-medium placeholder:text-muted-foreground/40 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* 確認 */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground tracking-wide uppercase">確認入力</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                  <input
                    type={showCf ? 'text' : 'password'}
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="もう一度入力"
                    required
                    className="w-full bg-muted/40 border border-border/70 rounded-xl pl-10 pr-10 py-3 text-sm font-medium placeholder:text-muted-foreground/40 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCf(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                  >
                    {showCf ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-xs text-destructive font-semibold">{error}</p>
              )}

              <button
                type="submit"
                disabled={submitting || !password || !confirm}
                className="w-full py-3.5 rounded-2xl bg-primary text-white font-black text-sm shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all disabled:opacity-50 mt-2"
              >
                {submitting ? '変更中…' : 'パスワードを変更する'}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
