import React from 'react';
import { MobileFrame } from './_shared/MobileFrame';
import { MapPin, Gift, Sparkles, ArrowRight } from 'lucide-react';

export default function Welcome() {
  return (
    <MobileFrame>
      <div
        className="flex-1 relative flex flex-col justify-end overflow-hidden"
        style={{
          backgroundColor: '#1A1614',
          backgroundImage:
            "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.55) 45%, rgba(0,0,0,0.25) 100%), url('/__mockup/images/refine-c/welcome_bg.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="relative z-10 px-7 pt-14 pb-10 flex-1 flex flex-col">
          <div className="flex items-center gap-3">
            <img
              src="/__mockup/images/refine-c/logo.png"
              alt="logo"
              className="w-10 h-10 rounded-lg object-cover border border-white/20"
            />
            <span className="font-display font-black text-2xl text-white tracking-tight">
              Osusowake
            </span>
          </div>

          <div className="mt-auto">
            <h1 className="text-[44px] font-black text-white leading-[1.08] text-mag-title mb-5">
              お店の余った<br />
              おいしさを、<br />
              <span style={{ color: 'var(--c-primary)' }}>あなたへ。</span>
            </h1>

            <p className="text-[15px] font-medium text-white/85 leading-relaxed mb-8 max-w-[280px]">
              レストランやカフェで余ってしまった高品質な食事を、
              おトクな価格でおすそわけ。
            </p>

            <ul className="space-y-4 mb-9">
              {[
                { icon: MapPin, text: 'エリア・ジャンルで絞り込み' },
                { icon: Gift, text: 'おすそわけバッグをお得に購入' },
                { icon: Sparkles, text: '買うたびにマイタウンが育つ' },
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center bg-white/12 border border-white/15">
                    <item.icon
                      className="w-4 h-4"
                      style={{ color: 'var(--c-primary)' }}
                    />
                  </div>
                  <span className="text-white font-bold text-[14px] tracking-wide">
                    {item.text}
                  </span>
                </li>
              ))}
            </ul>

            <div className="space-y-3">
              <button
                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-white text-base shadow-xl"
                style={{
                  backgroundColor: 'var(--c-primary)',
                  boxShadow: '0 10px 32px rgba(242,100,25,0.45)',
                }}
              >
                はじめる(無料)
                <ArrowRight className="w-5 h-5" />
              </button>

              <button className="w-full py-4 rounded-xl font-bold text-white text-[14px] bg-white/10 border border-white/20">
                ログイン
              </button>
            </div>
          </div>
        </div>
      </div>
    </MobileFrame>
  );
}
