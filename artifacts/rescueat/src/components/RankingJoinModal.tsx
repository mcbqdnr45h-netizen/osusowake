/**
 * RankingJoinModal — ランキング参加 (オプトイン) 専用モーダル
 *
 * フロー:
 *   1. ニックネーム入力 → display_name PUT
 *   2. ranking-preference PATCH (rankingOptOut: false) で掲載開始
 *   3. 成功時 onSuccess でクエリ invalidate → 親が閉じる
 *
 * 仕様変更 2026-05: ランキングは完全オプトイン化。 参加時のみニックネーム入力を促す。
 */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Check, AlertCircle, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { authedFetch } from '@/lib/authed-fetch';
import { validateNickname, NICKNAME_MIN, NICKNAME_MAX } from '@/lib/nickname-validator';

function getApiBase(): string {
  return ((import.meta as any).env?.VITE_API_BASE as string)
    || ((import.meta.env.BASE_URL as string) || '').replace(/\/$/, '');
}

interface Props {
  /** 既存ニックネーム (Settings で事前設定済の場合) — あれば確認だけで即参加 */
  existingDisplayName?: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function RankingJoinModal({ existingDisplayName, onClose, onSuccess }: Props) {
  const { refreshProfile } = useAuth();
  const initial = (existingDisplayName ?? '').trim();
  const [value, setValue] = useState(initial);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const trimmed = value.trim();
  const validation = trimmed.length === 0 ? null : validateNickname(value);
  const isValid = validation?.ok === true;
  const localError = validation && validation.ok === false ? validation.reason : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || submitting) return;
    setServerError(null);
    setSubmitting(true);
    try {
      // ① ニックネーム保存 (PUT /api/user/display-name)
      const apiBase = getApiBase();
      const res1 = await authedFetch(`${apiBase}/api/user/display-name`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: trimmed }),
      });
      if (!res1.ok) {
        const data = await res1.json().catch(() => ({}));
        setServerError(data?.message ?? 'ニックネームの保存に失敗しました');
        setSubmitting(false);
        return;
      }

      // ② ランキング参加 ON (PATCH /api/user/ranking-preference)
      const res2 = await authedFetch(`${apiBase}/api/user/ranking-preference`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rankingOptOut: false }),
      });
      if (!res2.ok) {
        const data = await res2.json().catch(() => ({}));
        setServerError(data?.message ?? 'ランキング参加の設定に失敗しました');
        setSubmitting(false);
        return;
      }

      // ③ プロフィール再取得 → onSuccess で親が invalidate + close
      await refreshProfile();
      onSuccess();
    } catch (err: any) {
      setServerError(err?.message ?? '通信エラーが発生しました');
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        className="w-full max-w-sm bg-card rounded-3xl shadow-2xl overflow-hidden border border-border/40 relative"
      >
        {/* 閉じるボタン (任意参加なので閉じられる) */}
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          aria-label="閉じる"
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow-sm border border-border/40 disabled:opacity-50"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* ヘッダ: トロフィー + グラデーション */}
        <div
          className="px-6 pt-7 pb-5 text-center"
          style={{ background: 'linear-gradient(135deg, rgba(234,179,8,0.10) 0%, rgba(242,100,25,0.06) 100%)' }}
        >
          <div className="inline-flex w-14 h-14 rounded-2xl items-center justify-center mb-3 bg-gradient-to-br from-yellow-300 to-amber-500 text-white shadow-md">
            <Trophy className="w-7 h-7" strokeWidth={2.4} />
          </div>
          <h2 className="text-lg font-black text-foreground tracking-tight">
            ランキングに参加する
          </h2>
          <p className="text-[12.5px] text-muted-foreground mt-1.5 leading-relaxed font-medium">
            表示するニックネームを決めてください。<br />
            本名ではなく、 公開しても良い名前を入力してください。
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-[11px] font-black text-foreground/70 uppercase tracking-widest mb-2">
              ニックネーム <span className="text-destructive normal-case">*</span>
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => { setValue(e.target.value); setServerError(null); }}
              placeholder="たろう"
              maxLength={NICKNAME_MAX + 4}
              autoFocus
              disabled={submitting}
              className={`w-full bg-white border rounded-xl px-4 py-3.5 text-foreground font-medium placeholder:text-muted-foreground/45 focus:ring-4 outline-none transition-all text-[15px] ${
                localError ? 'border-destructive focus:border-destructive focus:ring-destructive/10'
                : isValid ? 'border-green-500 focus:border-green-500 focus:ring-green-500/10'
                : 'border-border/80 focus:border-primary focus:ring-primary/10'
              }`}
            />
            <div className="flex items-center justify-between mt-1.5 min-h-[18px]">
              <p className={`text-[11.5px] font-semibold ${
                localError ? 'text-destructive' : isValid ? 'text-green-600' : 'text-muted-foreground/70'
              }`}>
                {localError || (isValid ? '使用できます ✓' : `${NICKNAME_MIN}〜${NICKNAME_MAX}文字`)}
              </p>
              <span className="text-[11px] text-muted-foreground/60 tabular-nums">{trimmed.length}/{NICKNAME_MAX}</span>
            </div>
          </div>

          {serverError && (
            <div className="flex items-start gap-2 bg-destructive/8 border border-destructive/20 text-destructive text-[12.5px] font-semibold px-3 py-2.5 rounded-lg leading-snug">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          {/* ★ 「不適切な表現は使用できません」 文言は削除 (UX: 先回り注意は逆に刺激)。
                禁止語バリデーションは validateNickname() 内で継続。 */}
          <div className="bg-secondary/50 rounded-xl px-3.5 py-2.5 border border-border/40">
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              後で設定からいつでも非掲載に戻せます。
            </p>
          </div>

          <button
            type="submit"
            disabled={!isValid || submitting}
            className="w-full flex items-center justify-center gap-2 text-white font-black py-3.5 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            style={{
              background: 'linear-gradient(180deg, #F07826 0%, #E85A0C 100%)',
              boxShadow: '0 4px 16px rgba(242,100,25,0.28)',
            }}
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                参加中…
              </>
            ) : (
              <>
                <Check className="w-4.5 h-4.5" strokeWidth={2.6} />
                この名前で参加する
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
