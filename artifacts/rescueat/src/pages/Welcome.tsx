import React from 'react';
import { Link, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (d: number) => ({ opacity: 1, y: 0, transition: { delay: d * 0.15, duration: 0.55, ease: [0.22, 1, 0.36, 1] } }),
};

export default function Welcome() {
  const [location] = useLocation();

  // ?redirect= パラメータがあれば Login/SignUp リンクへ引き継ぐ
  const params = new URLSearchParams(
    typeof window !== 'undefined' ? window.location.search : ''
  );
  const redirect = params.get('redirect');
  const loginHref = redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : '/login';
  const signupHref = redirect ? `/signup?redirect=${encodeURIComponent(redirect)}` : '/signup';

  return (
    <div className="min-h-dvh flex flex-col bg-[#2D5A51] relative overflow-hidden">

      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-white/5 rounded-full" />
        <div className="absolute top-1/3 -left-24 w-56 h-56 bg-white/5 rounded-full" />
        <div className="absolute -bottom-20 right-8 w-64 h-64 bg-white/5 rounded-full" />
        <div className="absolute top-16 left-8 text-6xl opacity-20 select-none">🌿</div>
        <div className="absolute top-32 right-16 text-4xl opacity-15 select-none">🥐</div>
        <div className="absolute bottom-52 left-10 text-5xl opacity-15 select-none">🍱</div>
        <div className="absolute bottom-36 right-14 text-4xl opacity-20 select-none">🛍️</div>
      </div>

      {/* Top spacer */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 pt-16 pb-6 relative z-10">

        {/* Logo */}
        <motion.div
          custom={0} variants={fadeUp} initial="hidden" animate="show"
          className="flex flex-col items-center mb-10"
        >
          <div className="w-24 h-24 bg-white rounded-3xl shadow-2xl flex items-center justify-center mb-5 rotate-3">
            <span className="text-5xl leading-none">🍀</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">食べロス</h1>
          <p className="text-white/60 text-sm font-medium mt-1 tracking-widest">RescuEat</p>
        </motion.div>

        {/* Catchcopy */}
        <motion.div
          custom={1} variants={fadeUp} initial="hidden" animate="show"
          className="text-center mb-12"
        >
          <p className="text-white text-2xl font-black leading-relaxed tracking-tight">
            おいしく、お得に、<br />
            <span className="text-[#A8D5C2]">フードロスをなくそう。</span>
          </p>
          <p className="text-white/60 text-sm mt-4 leading-relaxed font-medium">
            近くのお店のサプライズバッグを見つけて<br />
            食品廃棄削減に貢献しよう
          </p>
        </motion.div>

        {/* Feature pills */}
        <motion.div
          custom={2} variants={fadeUp} initial="hidden" animate="show"
          className="flex flex-wrap justify-center gap-2 mb-10"
        >
          {['🗺️ 地図で近くのお店を探す', '🎁 サプライズバッグをお得に', '🌱 フードロスに貢献'].map(text => (
            <span key={text} className="bg-white/15 backdrop-blur-sm text-white text-xs font-bold px-3.5 py-2 rounded-full border border-white/20">
              {text}
            </span>
          ))}
        </motion.div>
      </div>

      {/* Bottom CTA */}
      <motion.div
        custom={3} variants={fadeUp} initial="hidden" animate="show"
        className="px-6 pb-10 relative z-10 space-y-3"
      >
        <Link href={signupHref}>
          <button className="w-full bg-white text-[#2D5A51] font-black text-lg py-4 rounded-2xl shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2">
            はじめる（新規登録）
            <ChevronRight className="w-5 h-5" />
          </button>
        </Link>

        <Link href={loginHref}>
          <button className="w-full bg-white/15 backdrop-blur-sm border border-white/30 text-white font-bold text-base py-4 rounded-2xl active:scale-[0.98] transition-all">
            ログイン
          </button>
        </Link>

        <p className="text-center text-white/40 text-xs pt-2">
          登録することで利用規約およびプライバシーポリシーに同意したものとみなします
        </p>
      </motion.div>
    </div>
  );
}
