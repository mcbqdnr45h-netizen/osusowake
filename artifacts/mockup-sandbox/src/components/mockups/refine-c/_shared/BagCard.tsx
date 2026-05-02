import React from 'react';
import { Star, Clock, MapPin, ChevronRight, Flame } from 'lucide-react';
import { mockBags } from './mockBags';

export function BagCard({ bag }: { bag: typeof mockBags[0] }) {
  const isSoldOut = bag.soldOut;
  const isLowStock = bag.lowStock;

  return (
    <div 
      className="group block relative w-full overflow-hidden rounded-[20px] mb-6 cursor-pointer"
      style={{ backgroundColor: 'var(--c-surface)', border: '1px solid var(--c-border)' }}
    >
      {/* Photo Area (70%) */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#1A1614]">
        <img 
          src={bag.photoUrl} 
          alt={bag.title}
          className={`w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 ${isSoldOut ? 'opacity-40 grayscale' : 'opacity-95'}`}
        />
        
        {/* Dark Vignette Overlay */}
        <div className="absolute inset-0 vignette-full pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
          <div className="flex flex-col gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md bg-black/40 border border-white/20 text-white">
              <MapPin className="w-3.5 h-3.5" style={{ color: 'var(--c-primary)' }} />
              <span className="text-xs font-bold font-display">{bag.distance}</span>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            {!isSoldOut && (
              <div 
                className="px-3 py-1 rounded-sm font-display font-black text-white text-[13px] tracking-wide"
                style={{ backgroundColor: 'var(--c-primary)', boxShadow: '0 4px 12px rgba(242,100,25,0.4)' }}
              >
                {Math.round((1 - bag.discountedPrice / bag.originalPrice) * 100)}% OFF
              </div>
            )}
            {!isSoldOut && isLowStock && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-sm bg-red-600/90 text-white text-[10px] font-bold animate-c-pulse">
                <Flame className="w-3 h-3" />
                残りわずか
              </div>
            )}
          </div>
        </div>

        {/* Bottom Image Overlay Text */}
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className={`text-xl font-bold text-white leading-tight mb-1 drop-shadow-md text-mag-title ${isSoldOut ? 'opacity-60' : ''}`}>
            {bag.title}
          </h3>
          <div className="flex items-center gap-2 text-white/80 text-sm">
            <span className="font-medium truncate max-w-[180px]">{bag.storeName}</span>
            <span className="w-1 h-1 rounded-full bg-white/40" />
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-[#FFB800] text-[#FFB800]" />
              <span className="font-display font-bold text-white">{bag.rating}</span>
            </div>
          </div>
        </div>

        {/* Sold Out Overlay */}
        {isSoldOut && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="px-6 py-2 bg-black/70 backdrop-blur-sm border border-white/10 rounded-sm">
              <span className="text-white font-bold tracking-widest text-sm">SOLD OUT</span>
            </div>
          </div>
        )}
      </div>

      {/* Info Area (30%) */}
      <div className="p-4" style={{ backgroundColor: 'var(--c-surface)' }}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-full" style={{ backgroundColor: 'rgba(242,100,25,0.1)' }}>
              <Clock className="w-4 h-4" style={{ color: 'var(--c-primary)' }} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--c-text-muted)' }}>Pickup Time</span>
              <span className="font-display font-bold text-sm text-mag-num" style={{ color: 'var(--c-text-main)' }}>
                {bag.pickupStart} - {bag.pickupEnd}
              </span>
            </div>
          </div>
          
          <div className="flex flex-col items-end">
            <span className="text-xs line-through font-display font-semibold" style={{ color: 'var(--c-text-muted)' }}>
              ¥{bag.originalPrice.toLocaleString()}
            </span>
            <div className="flex items-baseline gap-0.5" style={{ color: 'var(--c-primary)' }}>
              <span className="text-sm font-bold">¥</span>
              <span className="text-2xl font-black font-display tracking-tight text-mag-num">
                {bag.discountedPrice.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}