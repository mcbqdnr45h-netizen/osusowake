import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { Compass, ArrowLeft, Home as HomeIcon } from 'lucide-react';

export default function NotFound() {
  const [, navigate] = useLocation();
  return (
    <div
      className="min-h-dvh w-full flex items-center justify-center bg-gradient-to-b from-orange-50/40 via-amber-50/30 to-white px-5"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-sm md:max-w-md text-center"
      >
        {/* イラスト風アイコン */}
        <div className="relative mx-auto mb-7 w-28 h-28 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#FFD9C2] to-[#FFB088] opacity-60 blur-2xl" />
          <div className="relative w-24 h-24 rounded-3xl bg-white shadow-[0_8px_24px_rgba(196,66,20,0.18)] flex items-center justify-center ring-1 ring-orange-100">
            <Compass className="w-11 h-11 text-[#C44214]" strokeWidth={2.2} />
          </div>
        </div>

        {/* 大見出し */}
        <h1 className="text-[26px] font-black text-foreground tracking-tight leading-tight mb-3">
          ページが見つかりません
        </h1>

        {/* 説明 */}
        <p className="text-sm text-muted-foreground leading-relaxed mb-8 px-2">
          お探しのページは移動・削除されたか、
          <br />
          URL が間違っている可能性があります。
        </p>

        {/* CTA: ホームへ */}
        <button
          type="button"
          onClick={() => navigate('/')}
          className="block w-full py-3.5 rounded-2xl bg-gradient-to-br from-[#C44214] via-[#B5390B] to-[#8B2906] text-white font-bold text-[15px] shadow-lg shadow-[#B5390B]/30 active:scale-[0.98] transition-transform mb-3"
        >
          <span className="inline-flex items-center justify-center gap-2">
            <HomeIcon className="w-4 h-4" />
            ホームへ戻る
          </span>
        </button>

        {/* 戻るボタン */}
        <button
          type="button"
          onClick={() => {
            if (typeof window !== 'undefined' && window.history.length > 1) {
              window.history.back();
            } else {
              window.location.href = '/';
            }
          }}
          className="w-full py-3 rounded-2xl border border-border bg-card text-sm font-bold text-foreground/70 hover:bg-secondary/40 active:scale-[0.98] transition-all"
        >
          <span className="inline-flex items-center justify-center gap-1.5">
            <ArrowLeft className="w-4 h-4" />
            前のページへ戻る
          </span>
        </button>
      </motion.div>
    </div>
  );
}
