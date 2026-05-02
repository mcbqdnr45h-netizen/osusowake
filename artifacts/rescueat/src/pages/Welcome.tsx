import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { ArrowRight, MapPin, Gift, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { logNav } from '@/lib/nav-debug';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

const rise = {
  hidden: { opacity: 0, y: 18 },
  show: (d: number) => ({
    opacity: 1, y: 0,
    transition: { delay: d * 0.10, duration: 0.55, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  }),
};

export default function Welcome() {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (isLoading || !user) return;
    let dest = '/';
    try {
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect');
      if (redirect) {
        const decoded = decodeURIComponent(redirect);
        if (decoded.startsWith('/') && !decoded.startsWith('//')) {
          dest = decoded;
        }
      }
    } catch {
      // フォールバック: /
    }
    logNav('Welcome(logged-in user)', dest);
    navigate(dest, { replace: true });
  }, [isLoading, user, navigate]);

  if (isLoading || user) return null;

  const params = new URLSearchParams(
    typeof window !== 'undefined' ? window.location.search : ''
  );
  const redirect = params.get('redirect');
  const loginHref  = redirect ? `/login?redirect=${encodeURIComponent(redirect)}`  : '/login';
  const signupHref = redirect ? `/signup?redirect=${encodeURIComponent(redirect)}` : '/signup';

  const features = [
    { icon: MapPin,   text: 'エリア・ジャンルで絞り込み' },
    { icon: Gift,     text: 'おすそわけバッグをお得に購入' },
    { icon: Sparkles, text: '買うたびにマイタウンが育つ' },
  ];

  return (
    <div className="min-h-dvh flex flex-col relative overflow-hidden bg-[#1F1E1B]">
      {/* Background image (subtle) + uniform dark overlay for legibility */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img
          src={`${BASE}/images/refine-a/welcome-bg.png`}
          alt=""
          className="w-full h-full object-cover opacity-35"
          loading="eager"
          decoding="async"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to top, rgba(20,18,15,0.96) 0%, rgba(20,18,15,0.78) 40%, rgba(20,18,15,0.55) 70%, rgba(20,18,15,0.35) 100%)',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col justify-end px-7 sm:px-8 pt-16 pb-10 sm:pb-12">

        {/* Brand mark */}
        <motion.div custom={0} variants={rise} initial="hidden" animate="show" className="mb-9 sm:mb-10">
          <div className="flex items-baseline gap-3 mb-1.5">
            <span className="w-8 h-[1px] bg-[#E8786C]" />
            <p className="text-[#E8786C] text-[10px] font-bold tracking-[0.32em] uppercase">
              Editorial
            </p>
          </div>
          <h2
            className="text-white font-bold tracking-[0.18em] leading-none"
            style={{
              fontFamily: '"Noto Serif JP", serif',
              fontSize: '40px',
              textShadow: '0 2px 12px rgba(0,0,0,0.4)',
            }}
          >
            おすそわけ
          </h2>
        </motion.div>

        {/* Headline */}
        <motion.h1
          custom={1}
          variants={rise}
          initial="hidden"
          animate="show"
          className="mb-6 sm:mb-7 leading-[1.18]"
          style={{
            fontFamily: '"Noto Serif JP", serif',
            fontWeight: 600,
            fontSize: '34px',
            color: '#FFFFFF',
            textShadow: '0 2px 14px rgba(0,0,0,0.55), 0 1px 2px rgba(0,0,0,0.7)',
            letterSpacing: '0.02em',
          }}
        >
          お店の余った<br />
          おいしさを、<br />
          <span style={{ color: '#F5A89E', fontStyle: 'italic' }}>あなたへ。</span>
        </motion.h1>

        <motion.p
          custom={2}
          variants={rise}
          initial="hidden"
          animate="show"
          className="text-[14px] leading-relaxed mb-9 max-w-[300px] text-[#F4F1EA]/85"
          style={{ textShadow: '0 1px 6px rgba(0,0,0,0.5)' }}
        >
          まだまだ美味しい食べ物を、お得な「おすそわけバッグ」で。
        </motion.p>

        {/* Features */}
        <motion.ul
          custom={3}
          variants={rise}
          initial="hidden"
          animate="show"
          className="space-y-3 mb-9"
        >
          {features.map(({ icon: Icon, text }, i) => (
            <motion.li
              key={text}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.45 + i * 0.08, duration: 0.4 }}
              className="flex items-center gap-3"
            >
              <span className="w-7 h-7 rounded-full bg-[#E8786C]/15 border border-[#E8786C]/30 flex items-center justify-center shrink-0">
                <Icon className="w-3.5 h-3.5 text-[#F5A89E]" strokeWidth={2} />
              </span>
              <span className="text-[13px] text-white/95 tracking-wide font-medium">{text}</span>
            </motion.li>
          ))}
        </motion.ul>

        {/* CTAs */}
        <motion.div custom={4} variants={rise} initial="hidden" animate="show" className="space-y-3">
          <button
            type="button"
            onClick={() => navigate(signupHref)}
            className="w-full h-14 bg-[#FBFBFA] text-[#1F1E1B] flex items-center justify-center gap-2 font-bold tracking-widest active:scale-[0.98] transition-transform rounded-sm shadow-xl shadow-black/30"
          >
            はじめる (無料)
            <ArrowRight className="w-4 h-4" strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={() => navigate(loginHref)}
            className="w-full h-14 bg-transparent border border-[#FBFBFA]/30 text-[#FBFBFA] font-medium tracking-widest hover:bg-[#FBFBFA]/10 active:scale-[0.98] transition-colors rounded-sm"
          >
            ログイン
          </button>
        </motion.div>

        {/* フッター注記 */}
        <motion.p
          custom={5}
          variants={rise}
          initial="hidden"
          animate="show"
          className="text-center text-white/45 text-[11px] mt-6 leading-relaxed"
        >
          登録することで利用規約およびプライバシーポリシーに同意したものとみなします
        </motion.p>
      </div>
    </div>
  );
}
