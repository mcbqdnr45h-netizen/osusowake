import React, { useState } from 'react';
import { Share2, Copy, Check, MessageCircle, Twitter, Facebook } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SITE_URL = 'https://osusowakejapan.org';
const SHARE_TEXT_USER = 'おすそわけで地域の閉店前の食品をおトクにゲット🍞 私もこのアプリ使ってます！';
const SHARE_TEXT_STORE = '飲食店・食料品店の方へ📣 「おすそわけ」で売れ残りそうな食品を販売できます。月額・初期費用は¥0、売れた時だけ手数料が発生する完全成果報酬制です。';

interface Props {
  variant?: 'user' | 'store';
}

export function ShareAppCard({ variant = 'user' }: Props) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const text = variant === 'store' ? SHARE_TEXT_STORE : SHARE_TEXT_USER;
  const fullText = `${text}\n${SITE_URL}`;

  const tryNativeShare = async () => {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({
          title: 'おすそわけ',
          text,
          url: SITE_URL,
        });
        return true;
      } catch {
        // ユーザーがキャンセルした、または共有が失敗した場合はフォールバック表示
      }
    }
    return false;
  };

  const handleMainClick = async () => {
    const ok = await tryNativeShare();
    if (!ok) setExpanded(true);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 古いブラウザ向けフォールバック
      const ta = document.createElement('textarea');
      ta.value = fullText;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch {}
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const lineUrl = `https://line.me/R/msg/text/?${encodeURIComponent(fullText)}`;
  const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(SITE_URL)}`;
  const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(SITE_URL)}`;

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-orange-200 rounded-2xl p-4 shadow-sm">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 bg-primary/15 text-primary rounded-2xl flex items-center justify-center shrink-0">
          <Share2 className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-foreground text-sm leading-snug">
            {variant === 'store'
              ? '近くのお店に「おすそわけ」を教えてあげませんか？'
              : 'おすそわけを友だちに広めよう'}
          </p>
          <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
            {variant === 'store'
              ? '同業の店舗オーナーさんへシェアすると、地域全体で食品ロス削減につながります。'
              : 'シェアするほど食品ロスが減って、お得な「おすそわけ」が増えます🌱'}
          </p>
        </div>
      </div>

      <button
        onClick={handleMainClick}
        className="w-full bg-primary hover:bg-primary/90 active:scale-[0.98] transition-all text-primary-foreground font-bold py-3 px-4 rounded-xl shadow-md flex items-center justify-center gap-2"
      >
        <Share2 className="w-4 h-4" />
        友だちにおすそわけする
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-3 grid grid-cols-2 gap-2">
              <a
                href={lineUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-[#06C755] hover:bg-[#05b34c] active:scale-[0.98] transition-all text-white font-bold py-2.5 rounded-xl text-xs"
              >
                <MessageCircle className="w-4 h-4" />
                LINEでシェア
              </a>
              <a
                href={xUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-black hover:bg-zinc-800 active:scale-[0.98] transition-all text-white font-bold py-2.5 rounded-xl text-xs"
              >
                <Twitter className="w-4 h-4" />
                Xでポスト
              </a>
              <a
                href={fbUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-[#1877F2] hover:bg-[#1666d6] active:scale-[0.98] transition-all text-white font-bold py-2.5 rounded-xl text-xs"
              >
                <Facebook className="w-4 h-4" />
                Facebook
              </a>
              <button
                onClick={handleCopy}
                className="flex items-center justify-center gap-2 bg-secondary hover:bg-secondary/80 active:scale-[0.98] transition-all text-foreground font-bold py-2.5 rounded-xl text-xs"
              >
                {copied
                  ? <><Check className="w-4 h-4 text-emerald-600" /><span className="text-emerald-700">コピーしました</span></>
                  : <><Copy className="w-4 h-4" />リンクをコピー</>}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
