import { useEffect, useState } from 'react';
import { Trophy, Share2, Check, Copy } from 'lucide-react';
import { motion } from 'framer-motion';
import { authedFetch } from '@/lib/authed-fetch';

const BASE = (((import.meta as never as { env?: { VITE_API_BASE?: string } }).env?.VITE_API_BASE) || '') ||
             (import.meta.env.BASE_URL?.replace(/\/$/, '') || '');

type Badge = { tier: number; label: string; emoji: string; threshold: number };
type InviteStatus = {
  code: string;
  acceptedCount: number;
  badge: Badge;
  nextBadge: Badge | null;
  remainingToNext: number;
  shareUrl: string;
  allBadges: Badge[];
};

export function InviteBadgeCard() {
  const [data, setData] = useState<InviteStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  useEffect(() => {
    let cancelled = false;
    authedFetch(`${BASE}/api/me/invite-status`)
      .then(r => (r.ok ? r.json() : null))
      .then((j: InviteStatus | null) => {
        if (!cancelled && j) setData(j);
      })
      .catch(() => { /* silent */ })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl bg-secondary/30 h-32 animate-pulse" />
    );
  }
  if (!data) return null;

  async function onShare() {
    if (!data) return;
    const text = `🎁 「おすそわけ」 で食品ロス削減！\n半額バッグでお得に買えるアプリ、 一緒にどう？\n\n招待コード: ${data.code}\n${data.shareUrl}`;
    const navAny = navigator as Navigator & {
      share?: (d: { title?: string; text?: string; url?: string }) => Promise<void>;
    };
    if (typeof navAny.share === 'function') {
      try {
        await navAny.share({ title: 'おすそわけに招待されました', text, url: data.shareUrl });
        setShared(true);
        setTimeout(() => setShared(false), 2000);
        return;
      } catch (e: unknown) {
        if ((e as { name?: string })?.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch {
      window.prompt('コピーしてシェアしてください:', text);
    }
  }

  async function onCopyCode() {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(data.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt('コードをコピー:', data.code);
    }
  }

  // 進捗バーは「現在のバッジ閾値 → 次のバッジ閾値」 の間で計算する
  // (例: 3人で「広め隊」 (threshold 3) → 次「招待マスター」 (threshold 5)
  //  の場合、 3人時点では 0%、 4人で 50%、 5人で 100%)
  const progress = data.nextBadge
    ? (() => {
        const span = data.nextBadge.threshold - data.badge.threshold;
        if (span <= 0) return 1;
        const got = data.acceptedCount - data.badge.threshold;
        return Math.max(0, Math.min(1, got / span));
      })()
    : 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl overflow-hidden shadow-sm"
    >
      <div
        className="px-4 py-3.5 relative"
        style={{
          background: 'linear-gradient(135deg, #FFD700 0%, #FF9500 50%, #FF6B00 100%)',
        }}
      >
        <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full" />
        <div className="absolute -right-10 -bottom-10 w-28 h-28 bg-white/5 rounded-full" />

        <div className="relative flex items-center gap-3 mb-2.5">
          <div className="w-12 h-12 rounded-2xl bg-white/25 flex items-center justify-center text-2xl shrink-0 backdrop-blur-sm">
            {data.badge.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white/85 text-[10px] font-bold leading-none">あなたの招待バッジ</p>
            <p className="text-white text-base font-black leading-tight mt-1 truncate">
              {data.badge.label}
            </p>
            <p className="text-white/85 text-[11px] font-bold leading-tight mt-0.5">
              {data.acceptedCount}人を招待中
              {data.nextBadge && (
                <span className="text-white/70"> · あと {data.remainingToNext} 人で「{data.nextBadge.emoji} {data.nextBadge.label}」</span>
              )}
            </p>
          </div>
        </div>

        {data.nextBadge && (
          <div className="relative w-full h-1.5 bg-white/20 rounded-full overflow-hidden mb-2.5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="h-full bg-white rounded-full"
            />
          </div>
        )}

        <div className="relative flex items-center gap-2">
          <button
            onClick={onCopyCode}
            className="flex-1 bg-white/20 hover:bg-white/30 active:bg-white/40 transition-colors rounded-xl py-2 text-white text-sm font-black tracking-widest backdrop-blur-sm flex items-center justify-center gap-1.5"
            aria-label="招待コードをコピー"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                コピーしました
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                {data.code}
              </>
            )}
          </button>
          <button
            onClick={onShare}
            className="bg-white text-orange-600 hover:bg-orange-50 active:bg-orange-100 transition-colors rounded-xl px-3 py-2 text-sm font-black flex items-center gap-1 shadow"
            aria-label="招待リンクをシェア"
          >
            {shared ? (
              <>
                <Check className="w-3.5 h-3.5" />
                送信済み
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                招待する
              </>
            )}
          </button>
        </div>
      </div>

      <div className="bg-orange-50/60 px-4 py-2.5 flex items-center gap-2 border-t border-orange-100">
        <Trophy className="w-3.5 h-3.5 text-orange-500 shrink-0" />
        <p className="text-[10px] text-orange-700 font-bold leading-tight">
          友達があなたのコードで登録するとバッジが進化します (¥のやり取りなし、 純粋な称号)
        </p>
      </div>
    </motion.div>
  );
}
