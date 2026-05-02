import React, { useState } from 'react';
import { MobileFrame } from './_shared/MobileFrame';
import { mockBags } from './_shared/mockBags';
import { ChevronLeft, MapPin, Clock, Star, Minus, Plus, Heart } from 'lucide-react';

export default function BagDetail() {
  const bag = mockBags[0];
  const [qty, setQty] = useState(1);
  const [liked, setLiked] = useState(false);

  return (
    <MobileFrame className="bg-white">
      {/* Hero Image (70% vibe) */}
      <div className="relative h-[65vh] w-full bg-[#1A1614]">
        <img 
          src={bag.photoUrl} 
          alt={bag.title}
          className="w-full h-full object-cover opacity-90"
        />
        <div className="absolute inset-0 vignette-full pointer-events-none" />

        {/* Back Button */}
        <button className="absolute top-14 left-4 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md bg-black/20 border border-white/20 text-white z-10 transition-colors hover:bg-black/40">
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button 
          onClick={() => setLiked(!liked)}
          className="absolute top-14 right-4 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md bg-black/20 border border-white/20 text-white z-10 transition-colors hover:bg-black/40"
        >
          <Heart className={`w-5 h-5 ${liked ? 'fill-[#F26419] text-[#F26419]' : 'fill-none'}`} />
        </button>

        {/* Dark overlay for text at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-6 pt-24 vignette-bottom">
          <div className="flex flex-col gap-3">
            <span 
              className="inline-flex w-fit px-3 py-1 rounded-sm text-[11px] font-black uppercase tracking-widest text-white mb-2"
              style={{ backgroundColor: 'var(--c-primary)' }}
            >
              {bag.category === 'meals' ? '料理・お惣菜' : bag.category}
            </span>
            <h1 className="text-3xl font-black text-white leading-[1.15] text-mag-title">{bag.title}</h1>
            
            <div className="flex items-center gap-3 text-white/90 text-sm mt-2">
              <span className="font-bold">{bag.storeName}</span>
              <span className="w-1 h-1 rounded-full bg-white/40" />
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-[#FFB800] text-[#FFB800]" />
                <span className="font-display font-bold">{bag.rating}</span>
                <span className="text-white/60">({bag.reviewCount})</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 px-6 pt-8 pb-32" style={{ backgroundColor: 'var(--c-surface)' }}>
        
        {/* Price Block */}
        <div className="flex justify-between items-end mb-8 pb-8 border-b border-[#E8E4DF]">
          <div className="flex flex-col">
            <span className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--c-text-muted)' }}>Price</span>
            <span className="text-lg line-through font-display text-gray-400">
              ¥{bag.originalPrice.toLocaleString()}
            </span>
            <div className="flex items-baseline gap-1" style={{ color: 'var(--c-primary)' }}>
              <span className="text-xl font-bold">¥</span>
              <span className="text-[42px] font-black font-display tracking-tighter leading-none text-mag-num">
                {bag.discountedPrice.toLocaleString()}
              </span>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <div className="px-4 py-1.5 rounded-sm font-display font-black text-white text-[15px] tracking-wide animate-c-pulse"
                 style={{ backgroundColor: 'var(--c-primary)' }}>
              {Math.round((1 - bag.discountedPrice / bag.originalPrice) * 100)}% OFF
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="p-4 rounded-xl border border-[#E8E4DF] bg-[#FBFBFA]">
            <Clock className="w-5 h-5 mb-3" style={{ color: 'var(--c-primary)' }} />
            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">Pickup Time</div>
            <div className="font-display font-bold text-lg text-mag-num">{bag.pickupStart} - {bag.pickupEnd}</div>
          </div>
          <div className="p-4 rounded-xl border border-[#E8E4DF] bg-[#FBFBFA]">
            <MapPin className="w-5 h-5 mb-3" style={{ color: 'var(--c-primary)' }} />
            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">Distance</div>
            <div className="font-display font-bold text-lg text-mag-num">{bag.distance}</div>
          </div>
        </div>

        {/* Comment Block */}
        <div className="mb-8">
          <h3 className="text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2" style={{ color: 'var(--c-text-main)' }}>
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--c-primary)' }} />
            Chef's Message
          </h3>
          <p className="text-[15px] leading-relaxed text-gray-700">
            {bag.ownerComment}
          </p>
        </div>

      </div>

      {/* Bottom Sticky Bar */}
      <div className="sticky bottom-0 left-0 right-0 w-full p-6 bg-white border-t border-[#E8E4DF] z-20 pb-8 flex gap-4 items-center">
        {/* Quantity selector */}
        <div className="flex items-center justify-between px-3 py-3 rounded-xl border border-[#E8E4DF] w-32 bg-[#FBFBFA]">
          <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-black">
            <Minus className="w-4 h-4" />
          </button>
          <span className="font-display font-bold text-lg">{qty}</span>
          <button onClick={() => setQty(qty + 1)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-black">
            <Plus className="w-4 h-4" />
          </button>
        </div>
        
        {/* Reserve Button */}
        <button 
          className="flex-1 py-4 rounded-xl font-bold text-white text-lg transition-transform hover:scale-[0.98] active:scale-95 shadow-xl"
          style={{ 
            backgroundColor: 'var(--c-primary)',
            boxShadow: '0 8px 24px rgba(242,100,25,0.3)'
          }}
        >
          予約する
        </button>
      </div>

    </MobileFrame>
  );
}