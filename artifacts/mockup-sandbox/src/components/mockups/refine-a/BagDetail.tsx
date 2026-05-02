import React, { useState } from 'react';
import { ChevronLeft, MapPin, Clock, Star, Heart, Minus, Plus } from 'lucide-react';
import { MobileFrame } from './_shared/MobileFrame';
import { mockBags } from './_shared/mockBags';

export default function BagDetail() {
  const bag = mockBags[0]; // Display first bag
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);

  return (
    <MobileFrame className="bg-[#FBFBFA]">
      {/* Header */}
      <header className="absolute top-0 inset-x-0 z-20 px-4 pt-12 pb-4 flex items-center justify-between pointer-events-none">
        <button 
          className="w-10 h-10 bg-[#FBFBFA]/80 backdrop-blur rounded-full flex items-center justify-center pointer-events-auto shadow-sm"
          onClick={() => {}}
        >
          <ChevronLeft className="w-5 h-5 text-[#2C2C2A]" strokeWidth={1.5} />
        </button>
        <button 
          className="w-10 h-10 bg-[#FBFBFA]/80 backdrop-blur rounded-full flex items-center justify-center pointer-events-auto shadow-sm"
          onClick={() => setIsFavorite(!isFavorite)}
        >
          <Heart className={`w-5 h-5 ${isFavorite ? 'fill-[#E8786C] text-[#E8786C]' : 'text-[#2C2C2A]'}`} strokeWidth={1.5} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto hide-scrollbar">
        {/* Hero Image */}
        <div className="w-full aspect-[4/5] bg-[#F4F1EA] relative">
          <img 
            src={bag.photoUrl} 
            alt={bag.title} 
            className="w-full h-full object-cover mix-blend-multiply opacity-90"
          />
          {bag.lowStock && (
            <div className="absolute bottom-6 left-6 px-3 py-1.5 bg-[#E8786C] text-white text-[11px] tracking-widest uppercase">
              Only {bag.id + 1} Left
            </div>
          )}
        </div>

        {/* Content */}
        <div className="px-6 py-8">
          <div className="mb-8">
            <h1 className="text-3xl leading-snug mb-3">{bag.title}</h1>
            <p className="en-title">{bag.storeName}</p>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-y-6 gap-x-4 mb-10 pb-8 thin-border-b">
            <div>
              <span className="block text-[10px] text-[#6B6862] tracking-widest uppercase mb-1">Pick up</span>
              <div className="flex items-center gap-1.5 text-[#2C2C2A]">
                <Clock className="w-4 h-4" strokeWidth={1.5} />
                <span className="number text-sm">{bag.pickupStart} - {bag.pickupEnd}</span>
              </div>
            </div>
            <div>
              <span className="block text-[10px] text-[#6B6862] tracking-widest uppercase mb-1">Distance</span>
              <div className="flex items-center gap-1.5 text-[#2C2C2A]">
                <MapPin className="w-4 h-4" strokeWidth={1.5} />
                <span className="number text-sm">{bag.distance}</span>
              </div>
            </div>
            <div>
              <span className="block text-[10px] text-[#6B6862] tracking-widest uppercase mb-1">Rating</span>
              <div className="flex items-center gap-1.5 text-[#2C2C2A]">
                <Star className="w-4 h-4 fill-current" strokeWidth={1.5} />
                <span className="number text-sm">4.8 (124)</span>
              </div>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-end justify-between mb-10">
            <div>
              <span className="block text-[10px] text-[#6B6862] tracking-widest uppercase mb-1">Special Price</span>
              <div className="flex items-end gap-3">
                <span className="text-4xl number tracking-tight text-[#E8786C]">¥{bag.discountedPrice}</span>
                <span className="text-lg number line-through text-[#6B6862] mb-1">¥{bag.originalPrice}</span>
              </div>
            </div>
            <div className="px-2 py-1 border border-[#E8786C] text-[#E8786C] text-[10px] tracking-widest uppercase">
              50% OFF
            </div>
          </div>

          {/* Quote */}
          <div className="bg-[#F4F1EA] p-6 mb-32 relative">
            <span className="absolute -top-3 left-6 text-4xl text-[#E8786C] font-serif leading-none">"</span>
            <p className="text-[13px] leading-loose text-[#6B6862] italic mt-2">
              {bag.ownerComment}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="absolute bottom-0 inset-x-0 bg-[#FBFBFA] pb-5 pt-4 px-6 thin-border-b" style={{ borderTop: "0.5px solid var(--border-color)" }}>
        <div className="flex gap-4">
          <div className="flex items-center justify-between px-4 h-14 w-32 thin-border text-[#2C2C2A]">
            <button 
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="text-[#6B6862] hover:text-[#2C2C2A]"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="number text-lg">{quantity}</span>
            <button 
              onClick={() => setQuantity(quantity + 1)}
              className="text-[#6B6862] hover:text-[#2C2C2A]"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <button className="flex-1 h-14 btn-primary flex items-center justify-center gap-2">
            <span>予約する</span>
            <span className="number font-normal opacity-80">¥{bag.discountedPrice * quantity}</span>
          </button>
        </div>
      </div>
    </MobileFrame>
  );
}