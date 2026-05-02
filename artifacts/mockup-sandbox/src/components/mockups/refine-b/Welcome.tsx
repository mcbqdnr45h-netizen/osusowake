import React from 'react';
import { MobileFrame } from './_shared/MobileFrame';
import { MapPin, Gift, Sparkles } from 'lucide-react';

export default function Welcome() {
  return (
    <MobileFrame>
      <div className="flex flex-col h-full justify-between pb-8 relative z-10">
        
        {/* Top Logo */}
        <div className="flex items-center gap-3 pt-4">
          <div className="w-10 h-10 rounded-[14px] bg-[var(--rb-primary)] flex items-center justify-center shadow-[var(--rb-shadow-btn)]">
            <span className="text-white font-bold text-lg leading-none">お</span>
          </div>
          <span className="font-bold text-xl text-[var(--rb-text)] tracking-tight">おすそわけ</span>
        </div>

        {/* Middle Copy */}
        <div className="flex flex-col gap-6 mt-12 mb-8">
          <p className="text-[var(--rb-primary)] text-xs font-bold tracking-widest uppercase">Osusowake</p>
          <h1 className="text-[40px] font-black text-[var(--rb-text)] leading-[1.15] tracking-tight">
            お店の余った<br/>
            おいしさを、<br/>
            <span className="text-[var(--rb-primary)] relative inline-block mt-1">
              あなたへ。
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M0 5 Q 50 10 100 2" stroke="var(--rb-primary)" strokeWidth="3" fill="none" strokeLinecap="round"/>
              </svg>
            </span>
          </h1>
          <p className="text-[15px] text-[var(--rb-text-muted)] font-medium leading-relaxed max-w-[280px] mt-4">
            まだまだ美味しい食べ物を、おトクな「おすそわけバッグ」で。
          </p>
        </div>

        {/* Features list */}
        <div className="flex flex-col gap-4 mb-12">
          {[
            { icon: MapPin, text: "エリア・ジャンルで絞り込み" },
            { icon: Gift, text: "おすそわけバッグをお得に購入" },
            { icon: Sparkles, text: "買うたびにマイタウンが育つ" }
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-4 bg-[var(--rb-surface)] p-4 rounded-2xl shadow-[var(--rb-shadow-card)] border border-[var(--rb-border)]">
              <div className="w-10 h-10 rounded-xl bg-[var(--rb-bg)] flex items-center justify-center shrink-0">
                <item.icon className="w-5 h-5 text-[var(--rb-primary)]" />
              </div>
              <span className="font-bold text-[14px] text-[var(--rb-text)]">{item.text}</span>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-3 mt-auto">
          <button className="rb-btn w-full py-4 text-[16px]">
            はじめる（無料）
          </button>
          <button className="rb-btn-secondary w-full py-4 text-[16px]">
            ログイン
          </button>
        </div>

      </div>
    </MobileFrame>
  );
}
