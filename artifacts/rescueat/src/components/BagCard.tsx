import React from 'react';
import { Clock, Package } from 'lucide-react';
import { Link } from 'wouter';
import { SurpriseBagWithStore } from '@workspace/api-client-react';

interface BagCardProps {
  bag: SurpriseBagWithStore;
}

export function getCategoryIcon(category: string) {
  switch (category) {
    case 'restaurant': return '🍱';
    case 'bakery': return '🥐';
    case 'cafe': return '☕';
    case 'supermarket': return '🛒';
    case 'convenience': return '🏪';
    default: return '📦';
  }
}

export function getCategoryImage(category: string) {
  switch (category) {
    case 'restaurant': return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80';
    case 'bakery': return 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80';
    case 'cafe': return 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80';
    case 'supermarket': return 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&q=80';
    case 'convenience': return 'https://images.unsplash.com/photo-1581458925565-df0bd529a674?w=800&q=80';
    default: return 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80';
  }
}

export function BagCard({ bag }: BagCardProps) {
  const discountPercent = Math.round((1 - bag.discountedPrice / bag.originalPrice) * 100);
  const isSoldOut = bag.stockCount <= 0;
  const isLowStock = bag.stockCount > 0 && bag.stockCount < 3;

  return (
    <Link 
      href={isSoldOut ? "#" : `/bags/${bag.id}`}
      className={`group block relative rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 ${isSoldOut ? 'opacity-60 cursor-not-allowed grayscale' : 'hover:-translate-y-1 cursor-pointer'}`}
      onClick={(e) => isSoldOut && e.preventDefault()}
    >
      {/* Background Image full bleed */}
      <div className="absolute inset-0 z-0 bg-muted">
        <img 
          src={bag.store.imageUrl || getCategoryImage(bag.store.category)} 
          alt={bag.store.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10" />
      </div>

      <div className="relative z-10 h-full flex flex-col">
        {/* Top Badges */}
        <div className="p-3 flex justify-between items-start">
          <div className="bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold shadow-sm flex items-center gap-1.5 text-foreground max-w-[60%]">
            <span>{getCategoryIcon(bag.store.category)}</span>
            <span className="truncate">{bag.store.name}</span>
          </div>
          
          {isSoldOut ? (
            <div className="bg-muted text-muted-foreground font-black px-3 py-1 rounded-full text-sm shadow-md">
              完売
            </div>
          ) : (
            <div className="flex flex-col items-end gap-2">
              <div className="bg-accent text-accent-foreground font-black px-3 py-1 rounded-full text-sm shadow-md border border-accent/50 transform rotate-2">
                {discountPercent}% OFF
              </div>
              {isLowStock && (
                <div className="bg-destructive text-destructive-foreground font-bold px-2.5 py-0.5 rounded-full text-xs animate-pulse shadow-md">
                  残りわずか!
                </div>
              )}
            </div>
          )}
        </div>

        {/* Spacer to push content to bottom */}
        <div className="flex-1 min-h-[120px]"></div>

        {/* Bottom Content Area */}
        <div className="bg-card p-4 rounded-t-xl mx-0 transform translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
          <h3 className="font-bold text-foreground text-lg leading-tight mb-3 line-clamp-2">{bag.title}</h3>
          
          <div className="flex items-center justify-between mb-3 text-sm text-muted-foreground font-medium">
            <div className="flex items-center gap-1.5 bg-secondary/50 px-2 py-1 rounded-md">
              <Clock className="w-4 h-4 text-primary" />
              <span>受取 {bag.pickupStart}-{bag.pickupEnd}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-secondary/50 px-2 py-1 rounded-md">
              <Package className={`w-4 h-4 ${isLowStock ? 'text-orange-500' : 'text-primary'}`} />
              <span className={isLowStock ? "text-orange-500 font-bold" : ""}>
                残り{bag.stockCount}個
              </span>
            </div>
          </div>
          
          <div className="flex items-end justify-between border-t border-border pt-3">
            <div className="text-sm text-muted-foreground line-through decoration-destructive/60 font-medium">
              ¥{bag.originalPrice.toLocaleString()}
            </div>
            <div className="text-2xl font-black text-primary leading-none">
              ¥{bag.discountedPrice.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
