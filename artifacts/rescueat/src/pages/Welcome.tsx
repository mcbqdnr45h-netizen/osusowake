import React, { useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { ChevronRight, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (d: number) => ({ opacity: 1, y: 0, transition: { delay: d * 0.15, duration: 0.55, ease: [0.22, 1, 0.36, 1] } }),
};

export default function Welcome() {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  // ログイン済みなら適切なページへリダイレクト
  useEffect(() => {
    if (isLoading || !user) return;
    // store_ownerも含めてホームへ（/store/dashboardを経由するとpending時にループするため）
    navigate('/', { replace: true });
  }, [isLoading, user, navigate]);

  // auth確認中 or ログイン済みはウェルカム画面を表示しない
  if (isLoading || user) return null;

  // ?redirect= パラメータがあれば Login/SignUp リンクへ引き継ぐ
  const params = new URLSearchParams(
    typeof window !== 'undefined' ? window.location.search : ''
  );
  const redirect = params.get('redirect');
  const loginHref  = redirect ? `/login?redirect=${encodeURIComponent(redirect)}`  : '/login';
  const signupHref = redirect ? `/signup?redirect=${encodeURIComponent(redirect)}` : '/signup';

  return (
    <div className="min-h-dvh flex flex-col relative overflow-hidden bg-gradient-to-br from-[#FF8C00] via-[#FF6B00] to-[#FF4500]">

      {/* 背景デコレーション */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/8 rounded-full" />
        <div className="absolute top-1/3 -left-28 w-64 h-64 bg-white/8 rounded-full" />
        <div className="absolute -bottom-24 right-10 w-72 h-72 bg-black/8 rounded-full" />
        {/* 食材の背景アイコン */}
        <div className="absolute top-20 left-6 text-6xl opacity-15 select-none">🥐</div>
        <div className="absolute top-36 right-12 text-4xl opacity-15 select-none">🍱</div>
        <div className="absolute bottom-56 left-14 text-5xl opacity-15 select-none">🍰</div>
        <div className="absolute bottom-40 right-8 text-5xl opacity-20 select-none">🎁</div>
        <div className="absolute top-64 left-1/2 text-3xl opacity-10 select-none">☕</div>
      </div>

      {/* メインコンテンツ */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 pt-16 pb-6 relative z-10">

        {/* ロゴ */}
        <motion.div
          custom={0} variants={fadeUp} initial="hidden" animate="show"
          className="flex flex-col items-center mb-10"
        >
          <div className="w-28 h-28 bg-white rounded-3xl shadow-2xl shadow-black/20 flex items-center justify-center mb-6 rotate-3">
            <span className="text-6xl leading-none">🍀</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight drop-shadow-sm">食べロス</h1>
          <p className="text-white/70 text-sm font-semibold mt-1.5 tracking-widest">TabeRosu</p>
        </motion.div>

        {/* キャッチコピー */}
        <motion.div
          custom={1} variants={fadeUp} initial="hidden" animate="show"
          className="text-center mb-10"
        >
          <p className="text-white text-2xl font-black leading-relaxed tracking-tight drop-shadow-sm">
            お店の味を、誰かに<br />
            <span className="text-amber-200">おすそ分けしたい。</span>
          </p>
          <p className="text-white/70 text-sm mt-4 leading-relaxed font-medium">
            近くのお店のサプライズバッグをお得にゲット！<br />
            食べる人も、お店も、みんな笑顔に。
          </p>
        </motion.div>

        {/* 特徴ピル */}
        <motion.div
          custom={2} variants={fadeUp} initial="hidden" animate="show"
          className="flex flex-wrap justify-center gap-2 mb-10"
        >
          {[
            '🗺️ エリア・ジャンルで絞り込み',
            '🎁 サプライズバッグをお得に',
            '🏘️ 買うたびにマイタウンが育つ',
          ].map(text => (
            <span key={text} className="bg-white/18 backdrop-blur-sm text-white text-xs font-bold px-3.5 py-2 rounded-full border border-white/25">
              {text}
            </span>
          ))}
        </motion.div>
      </div>

      {/* 下部 CTA */}
      <motion.div
        custom={3} variants={fadeUp} initial="hidden" animate="show"
        className="px-6 pb-10 relative z-10 space-y-3"
      >
        <Link href={signupHref}>
          <button className="w-full bg-white text-orange-600 font-black text-lg py-4 rounded-2xl shadow-xl shadow-black/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5" />
            はじめる（無料登録）
            <ChevronRight className="w-5 h-5" />
          </button>
        </Link>

        <Link href={loginHref}>
          <button className="w-full bg-white/15 backdrop-blur-sm border border-white/35 text-white font-bold text-base py-4 rounded-2xl active:scale-[0.98] transition-all hover:bg-white/25">
            ログイン
          </button>
        </Link>

        <p className="text-center text-white/45 text-xs pt-2 leading-relaxed">
          登録することで利用規約およびプライバシーポリシーに<br />同意したものとみなします
        </p>
      </motion.div>
    </div>
  );
}
