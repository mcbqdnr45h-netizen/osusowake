import React from 'react';
import { MobileFrame } from './_shared/MobileFrame';
import { ArrowRight, MapPin, Gift, Sparkles } from 'lucide-react';

export default function Welcome() {
  const features = [
    { icon: MapPin,   text: 'エリア・ジャンルで絞り込み' },
    { icon: Gift,     text: 'おすそわけバッグをお得に購入' },
    { icon: Sparkles, text: '買うたびにマイタウンが育つ' },
  ];

  return (
    <MobileFrame>
      <div className="flex-1 relative flex flex-col justify-end bg-[#1F1E1B]">
        {/* Background Image (subtle) */}
        <div className="absolute inset-0 z-0">
          <img
            src="/__mockup/images/refine-a/welcome-bg.png"
            alt=""
            className="w-full h-full object-cover opacity-35"
          />
          {/* Stronger uniform dark overlay so headline stays legible everywhere */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to top, rgba(20,18,15,0.96) 0%, rgba(20,18,15,0.78) 40%, rgba(20,18,15,0.55) 70%, rgba(20,18,15,0.35) 100%)',
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 px-8 pb-12 pt-16">
          {/* Brand mark — emphasized */}
          <div className="mb-10">
            <div className="flex items-baseline gap-3 mb-1">
              <span className="w-8 h-[1px] bg-[#E8786C]" />
              <p className="text-[#E8786C] text-[10px] font-bold tracking-[0.32em] uppercase">
                Editorial
              </p>
            </div>
            <h2
              className="text-white font-bold tracking-[0.18em] leading-none"
              style={{
                fontFamily: '"Noto Serif JP", serif',
                fontSize: '38px',
                textShadow: '0 2px 12px rgba(0,0,0,0.4)',
              }}
            >
              おすそわけ
            </h2>
          </div>

          {/* Headline — pure white, strong shadow for legibility */}
          <h1
            className="mb-7 leading-[1.18]"
            style={{
              fontFamily: '"Noto Serif JP", serif',
              fontWeight: 600,
              fontSize: '32px',
              color: '#FFFFFF',
              textShadow: '0 2px 14px rgba(0,0,0,0.55), 0 1px 2px rgba(0,0,0,0.7)',
              letterSpacing: '0.02em',
            }}
          >
            お店の余った<br />
            おいしさを、<br />
            <span style={{ color: '#F5A89E', fontStyle: 'italic' }}>あなたへ。</span>
          </h1>

          <p
            className="text-[#F4F1EA]/85 text-[14px] leading-relaxed mb-10 max-w-[280px]"
            style={{ textShadow: '0 1px 6px rgba(0,0,0,0.5)' }}
          >
            まだまだ美味しい食べ物を、お得な「おすそわけバッグ」で。
          </p>

          {/* Features List */}
          <ul className="space-y-3 mb-10">
            {features.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-[#E8786C]/15 border border-[#E8786C]/30 flex items-center justify-center shrink-0">
                  <Icon className="w-3.5 h-3.5 text-[#F5A89E]" strokeWidth={2} />
                </span>
                <span className="text-[13px] text-white/95 tracking-wide font-medium">{text}</span>
              </li>
            ))}
          </ul>

          {/* CTAs */}
          <div className="space-y-3">
            <button className="w-full h-14 bg-[#FBFBFA] text-[#1F1E1B] flex items-center justify-center gap-2 font-bold tracking-widest active:scale-95 transition-transform rounded-sm">
              はじめる (無料)
              <ArrowRight className="w-4 h-4" strokeWidth={2} />
            </button>
            <button className="w-full h-14 bg-transparent border border-[#FBFBFA]/30 text-[#FBFBFA] font-medium tracking-widest hover:bg-[#FBFBFA]/10 active:scale-95 transition-colors rounded-sm">
              ログイン
            </button>
          </div>
        </div>
      </div>
    </MobileFrame>
  );
}
