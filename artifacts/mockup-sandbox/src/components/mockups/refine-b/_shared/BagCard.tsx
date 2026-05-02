import React from 'react';
import { MapPin, Clock } from 'lucide-react';

export function BagCard({ bag, compact = false }: { bag: any, compact?: boolean }) {
  const discountPercent = Math.round((1 - bag.discountedPrice / bag.originalPrice) * 100);

  return (
    <div className={`rb-card cursor-pointer group flex flex-col ${compact ? 'w-[180px]' : 'w-full mb-4'}`}>
      <div className="relative w-full aspect-[4/3] overflow-hidden">
        <img 
          src={bag.photoUrl} 
          alt={bag.title} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
          style={{ filter: bag.soldOut ? 'grayscale(100%) opacity(70%)' : 'none' }}
        />
        {bag.soldOut && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
            <span className="bg-white/90 text-[var(--rb-text)] text-xs font-bold px-3 py-1 rounded-full">完売御礼</span>
          </div>
        )}
        {!bag.soldOut && discountPercent > 0 && (
          <div className="absolute top-2 left-2 bg-[var(--rb-primary)] text-white text-[11px] font-bold px-2 py-1 rounded-full shadow-sm">
            {discountPercent}% OFF
          </div>
        )}
      </div>

      <div className="p-3 flex flex-col gap-1.5 flex-1">
        <div className="flex items-center justify-between text-[11px] text-[var(--rb-text-muted)]">
          <span className="truncate">{bag.storeName}</span>
          <span className="flex items-center gap-1 shrink-0"><Clock className="w-3 h-3"/> {bag.pickupStart}〜</span>
        </div>
        
        <h3 className={`font-bold text-[14px] leading-tight line-clamp-2 ${bag.soldOut ? 'text-[var(--rb-text-muted)]' : 'text-[var(--rb-text)]'}`}>
          {bag.title}
        </h3>

        {!bag.soldOut && (
          <div className="mt-auto pt-2 flex items-end justify-between">
            <div className="flex flex-col gap-1">
              {bag.lowStock && (
                <span className="text-[10px] font-bold text-[var(--rb-primary)] bg-[var(--rb-primary)]/10 px-1.5 py-0.5 rounded-md w-fit">残りわずか</span>
              )}
              <span className="flex items-center gap-1 text-[11px] text-[var(--rb-text-muted)]">
                <MapPin className="w-3 h-3"/> {bag.distance}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] line-through text-[var(--rb-text-muted)] opacity-70">
                ¥{bag.originalPrice}
              </span>
              <span className="text-xl font-bold text-[var(--rb-primary)] rb-price leading-none mt-0.5">
                ¥{bag.discountedPrice}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
