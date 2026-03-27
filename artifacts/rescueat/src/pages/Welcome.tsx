import React, { useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const rise = {
  hidden: { opacity: 0, y: 20 },
  show: (d: number) => ({
    opacity: 1, y: 0,
    transition: { delay: d * 0.12, duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  }),
};

export default function Welcome() {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (isLoading || !user) return;
    navigate('/', { replace: true });
  }, [isLoading, user, navigate]);

  if (isLoading || user) return null;

  const params = new URLSearchParams(
    typeof window !== 'undefined' ? window.location.search : ''
  );
  const redirect = params.get('redirect');
  const loginHref  = redirect ? `/login?redirect=${encodeURIComponent(redirect)}`  : '/login';
  const signupHref = redirect ? `/signup?redirect=${encodeURIComponent(redirect)}` : '/signup';

  return (
    <div className="min-h-dvh flex flex-col bg-[#FF8C00] relative overflow-hidden">

      {/* 背景テクスチャ（控えめ） */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[60vw] h-[60vw] max-w-sm max-h-sm bg-white/6 rounded-full translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-[50vw] h-[50vw] max-w-xs max-h-xs bg-black/6 rounded-full -translate-x-1/4 translate-y-1/4" />
      </div>

      {/* ─── ヘッダー ─────────────────────────────────────── */}
      <header className="relative z-10 px-5 sm:px-7 pt-12 sm:pt-14 flex items-center">
        <motion.div custom={0} variants={rise} initial="hidden" animate="show"
          className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-[11px] bg-white/25 border border-white/40 flex items-center justify-center">
            <span className="text-white font-black text-[12px] tracking-tight">Ow</span>
          </div>
          <span className="font-black text-[20px] tracking-[-0.03em] leading-none">
            <span className="text-white">Osus</span><span className="text-amber-200">Owake</span>
          </span>
        </motion.div>
      </header>

      {/* ─── メインコピー ──────────────────────────────────── */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-5 sm:px-7 pt-8 sm:pt-10 pb-4">

        {/* 大見出し */}
        <motion.div custom={1} variants={rise} initial="hidden" animate="show" className="mb-7 sm:mb-8">
          <p className="text-white/60 text-xs font-bold uppercase tracking-[0.18em] mb-3 sm:mb-4">
            おすそわけ、はじめよう。
          </p>
          <h1 className="text-[32px] sm:text-[42px] font-black text-white leading-[1.1] tracking-[-0.02em]">
            お店の余った<br />
            おいしさを、<br />
            <span className="text-amber-200">あなたへ。</span>
          </h1>
        </motion.div>

        {/* 特徴リスト */}
        <motion.ul custom={2} variants={rise} initial="hidden" animate="show"
          className="space-y-3 mb-8 sm:mb-10">
          {[
            { icon: '🗺️', text: 'エリア・ジャンルで絞り込み' },
            { icon: '🎁', text: 'おすそわけバッグをお得に購入' },
            { icon: '🏘️', text: '買うたびにマイタウンが育つ' },
          ].map(({ icon, text }) => (
            <li key={text} className="flex items-center gap-3">
              <span className="text-xl leading-none">{icon}</span>
              <span className="text-white/85 text-sm font-semibold">{text}</span>
            </li>
          ))}
        </motion.ul>

        {/* CTA */}
        <motion.div custom={3} variants={rise} initial="hidden" animate="show" className="space-y-3">
          <Link href={signupHref}>
            <button className="w-full bg-white text-[#FF8C00] font-black text-[16px] sm:text-[17px] py-[16px] sm:py-[17px] rounded-2xl shadow-lg shadow-black/15 active:scale-[0.98] transition-transform flex items-center justify-center gap-2">
              はじめる（無料）
              <ArrowRight className="w-5 h-5" strokeWidth={3} />
            </button>
          </Link>

          <Link href={loginHref}>
            <button className="w-full bg-transparent border border-white/40 text-white font-bold text-[15px] py-[14px] sm:py-[15px] rounded-2xl active:scale-[0.98] transition-transform hover:bg-white/10">
              ログイン
            </button>
          </Link>
        </motion.div>
      </div>

      {/* ─── フッター注記 ────────────────────────────────── */}
      <motion.p custom={4} variants={rise} initial="hidden" animate="show"
        className="relative z-10 text-center text-white/40 text-[11px] px-6 pb-8 leading-relaxed">
        登録することで利用規約およびプライバシーポリシーに同意したものとみなします
      </motion.p>
    </div>
  );
}
