import React, { useState } from 'react';
import { Clock, Package, Heart } from 'lucide-react';
import { Link } from 'wouter';
import { SurpriseBagWithStore } from '@workspace/api-client-react';
import { useFavorites } from '@/contexts/FavoritesContext';
import { getCategoryIcon, getCategoryImage } from '@/lib/category-utils';

interface BagCardProps {
  bag: SurpriseBagWithStore;
}

export function BagCard({ bag }: BagCardProps) {
  const discountPercent = Math.round((1 - bag.discountedPrice / bag.originalPrice) * 100);
  const isSoldOut = bag.stockCount <= 0;
  const isLowStock = bag.stockCount > 0 && bag.stockCount < 3;
  const { isFavorite, toggle } = useFavorites();
  const storeId = bag.store.id;
  const favorited = isFavorite(storeId);
  const [burst, setBurst] = useState(false);

  function handleFavorite(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    toggle(storeId);
    if (!favorited) {
      setBurst(true);
      setTimeout(() => setBurst(false), 600);
    }
  }

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
          
          <div className="flex flex-col items-end gap-2">
            {/* Heart button */}
            <button
              onClick={handleFavorite}
              className={`w-8 h-8 flex items-center justify-center rounded-full shadow-md transition-all duration-200 active:scale-90
                ${favorited
                  ? 'bg-rose-500 text-white'
                  : 'bg-white/90 backdrop-blur-md text-rose-400 hover:bg-rose-50'
                } ${burst ? 'scale-125' : ''}`}
              aria-label={favorited ? 'お気に入りから削除' : 'お気に入りに追加'}
            >
              <Heart
                className={`w-4 h-4 transition-all duration-200 ${favorited ? 'fill-white stroke-white' : 'fill-none stroke-rose-400'}`}
              />
            </button>

            {isSoldOut ? (
              <div className="bg-muted text-muted-foreground font-black px-3 py-1 rounded-full text-sm shadow-md">
                完売
              </div>
            ) : (
              <>
                <div className="bg-accent text-accent-foreground font-black px-3 py-1 rounded-full text-sm shadow-md border border-accent/50 transform rotate-2">
                  {discountPercent}% OFF
                </div>
                {isLowStock && (
                  <div className="bg-destructive text-destructive-foreground font-bold px-2.5 py-0.5 rounded-full text-xs animate-pulse shadow-md">
                    残りわずか!
                  </div>
                )}
              </>
            )}
          </div>
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
