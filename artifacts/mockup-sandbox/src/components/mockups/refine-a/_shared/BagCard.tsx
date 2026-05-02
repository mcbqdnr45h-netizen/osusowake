import React from 'react';
import { MockBag } from './mockBags';

export function BagCard({ bag }: { bag: MockBag }) {
  return (
    <div className={`w-[260px] flex-shrink-0 flex flex-col gap-3 group ${bag.soldOut ? 'opacity-50' : ''}`}>
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#F4F1EA]">
        <img 
          src={bag.photoUrl} 
          alt={bag.title} 
          className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105 mix-blend-multiply opacity-90"
        />
        {bag.lowStock && !bag.soldOut && (
          <div className="absolute top-3 left-3 px-2 py-1 bg-[#E8786C] text-white text-[10px] tracking-wider uppercase">
            Few Left
          </div>
        )}
        {bag.soldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#FBFBFA]/60 backdrop-blur-sm">
            <span className="text-[#2C2C2A] text-xs tracking-[0.2em]">SOLD OUT</span>
          </div>
        )}
      </div>
      
      <div className="flex flex-col px-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[#6B6862] text-[10px] tracking-wider uppercase">{bag.storeName}</span>
          <span className="text-[#6B6862] text-[10px] number">{bag.distance}</span>
        </div>
        
        <h3 className="text-[15px] leading-snug mb-2 line-clamp-2" style={{ fontFamily: "var(--font-serif)" }}>
          {bag.title}
        </h3>
        
        <div className="flex items-end justify-between mt-auto">
          <div className="flex items-center gap-2">
            <span className="text-[#2C2C2A] text-[16px] number">¥{bag.discountedPrice}</span>
            <span className="text-[#6B6862] text-[10px] number line-through">¥{bag.originalPrice}</span>
          </div>
          <div className="text-[#6B6862] text-[10px] tracking-wider number">
            {bag.pickupStart} - {bag.pickupEnd}
          </div>
        </div>
      </div>
    </div>
  );
}