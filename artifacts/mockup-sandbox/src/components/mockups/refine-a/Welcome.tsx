import React from 'react';
import { MobileFrame } from './_shared/MobileFrame';
import { ArrowRight } from 'lucide-react';

export default function Welcome() {
  return (
    <MobileFrame>
      <div className="flex-1 relative flex flex-col justify-end bg-[#2C2C2A]">
        {/* Background Image / Texture */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/__mockup/images/refine-a/welcome-bg.png" 
            alt="Background Texture" 
            className="w-full h-full object-cover opacity-60 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#2C2C2A] via-[#2C2C2A]/80 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-10 px-8 pb-12">
          {/* Logo */}
          <div className="mb-12">
            <p className="text-[#FBFBFA]/80 mb-2 font-display text-xl tracking-[0.15em]">おすそわけ</p>
            <h1 className="text-4xl text-[#FBFBFA] leading-tight">
              お店の余った<br />
              おいしさを、<br />
              <span className="text-[#E8786C]">あなたへ。</span>
            </h1>
          </div>

          <p className="text-[#FBFBFA]/70 text-sm leading-relaxed mb-10 max-w-[280px]">
            まだまだ美味しい食べ物を、お得な「おすそわけバッグ」で。
          </p>

          {/* Features List */}
          <div className="space-y-4 mb-12">
            <div className="flex items-center gap-4">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E8786C]" />
              <span className="text-[13px] text-[#FBFBFA] tracking-wide">エリア・ジャンルで絞り込み</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E8786C]" />
              <span className="text-[13px] text-[#FBFBFA] tracking-wide">おすそわけバッグをお得に購入</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E8786C]" />
              <span className="text-[13px] text-[#FBFBFA] tracking-wide">買うたびにマイタウンが育つ</span>
            </div>
          </div>

          {/* CTAs */}
          <div className="space-y-3">
            <button className="w-full h-14 bg-[#FBFBFA] text-[#2C2C2A] flex items-center justify-center gap-2 font-medium tracking-widest transition-transform active:scale-95">
              はじめる (無料)
              <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
            </button>
            <button className="w-full h-14 bg-transparent border border-[#FBFBFA]/30 text-[#FBFBFA] font-medium tracking-widest transition-colors hover:bg-[#FBFBFA]/10 active:scale-95">
              ログイン
            </button>
          </div>
        </div>
      </div>
    </MobileFrame>
  );
}