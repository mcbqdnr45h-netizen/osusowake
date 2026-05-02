import React, { useState } from 'react';
import { MobileFrame } from './_shared/MobileFrame';
import { mockBags } from './_shared/mockBags';
import { ChevronLeft, Star, Clock, MapPin, Plus, Minus, ChefHat } from 'lucide-react';

export default function BagDetail() {
  const bag = mockBags[0]; // mock data
  const [qty, setQty] = useState(1);
  const discountPercent = Math.round((1 - bag.discountedPrice / bag.originalPrice) * 100);

  return (
    <MobileFrame>
      <div className="flex flex-col h-full -mx-4 -mt-12 overflow-y-auto rb-no-scrollbar bg-[var(--rb-bg)] relative">
        
        {/* Header & Hero */}
        <div className="relative w-full h-[320px]">
          <img src={bag.photoUrl} alt={bag.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />
          
          <button className="absolute top-12 left-4 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 text-white">
            <ChevronLeft className="w-6 h-6" />
          </button>

          <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
            <div className="flex flex-col gap-2">
              <span className="bg-[var(--rb-primary)] text-white text-xs font-bold px-2.5 py-1 rounded-full w-fit shadow-md">
                {discountPercent}% OFF
              </span>
              <h1 className="text-2xl font-bold text-white leading-tight" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.4)" }}>{bag.title}</h1>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="bg-[var(--rb-surface)] flex-1 -mt-4 rounded-t-[32px] p-6 shadow-[0_-8px_24px_rgba(0,0,0,0.05)] relative z-10">
          
          {/* Store Info */}
          <div className="flex items-center justify-between pb-5 border-b border-[var(--rb-border)]">
            <div>
              <h2 className="font-bold text-[var(--rb-text)] text-lg">{bag.storeName}</h2>
              <div className="flex items-center gap-3 mt-1.5 text-sm text-[var(--rb-text-muted)]">
                <span className="flex items-center gap-1"><Star className="w-4 h-4 text-amber-500 fill-amber-500"/> {bag.rating}</span>
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4"/> {bag.distance}</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-full bg-[var(--rb-bg)] border border-[var(--rb-border)] flex items-center justify-center">
              <ChefHat className="w-6 h-6 text-[var(--rb-text-muted)]" />
            </div>
          </div>

          {/* Details */}
          <div className="py-5 space-y-4 border-b border-[var(--rb-border)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[var(--rb-primary)]/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-[var(--rb-primary)]" />
              </div>
              <div>
                <p className="text-xs text-[var(--rb-text-muted)]">受取時間</p>
                <p className="font-bold text-[var(--rb-text)]">{bag.pickupStart} 〜 {bag.pickupEnd}</p>
              </div>
            </div>
            
            {/* Owner Comment */}
            <div className="bg-[var(--rb-bg)] rounded-2xl p-4 relative mt-2 border border-[var(--rb-border)]">
              <div className="absolute -top-2 left-6 w-4 h-4 bg-[var(--rb-bg)] rotate-45 border-l border-t border-[var(--rb-border)]" />
              <p className="text-sm text-[var(--rb-text)] leading-relaxed italic">
                「{bag.ownerComment}」
              </p>
            </div>
          </div>

          {/* Pricing & Qty */}
          <div className="py-6 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm text-[var(--rb-text-muted)] line-through">定価 ¥{bag.originalPrice}</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl font-bold text-[var(--rb-primary)] rb-price leading-none">¥{bag.discountedPrice}</span>
                <span className="text-sm text-[var(--rb-text-muted)] font-medium">/ 税込</span>
              </div>
            </div>

            <div className="flex items-center bg-[var(--rb-bg)] rounded-xl p-1 border border-[var(--rb-border)]">
              <button onClick={() => setQty(Math.max(1, qty-1))} className="w-10 h-10 flex items-center justify-center text-[var(--rb-text-muted)] active:scale-90 transition-transform">
                <Minus className="w-5 h-5" />
              </button>
              <span className="w-8 text-center font-bold text-[var(--rb-text)]">{qty}</span>
              <button onClick={() => setQty(qty+1)} className="w-10 h-10 flex items-center justify-center text-[var(--rb-text)] active:scale-90 transition-transform">
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Spacer for sticky footer */}
          <div className="h-20" />

        </div>

        {/* Sticky CTA */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[var(--rb-surface)] via-[var(--rb-surface)] to-transparent z-20">
          <button className="rb-btn w-full py-4 text-lg">
            予約する
          </button>
        </div>

      </div>
    </MobileFrame>
  );
}
