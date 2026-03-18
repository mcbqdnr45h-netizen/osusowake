import React from 'react';
import { Clock, MapPin, Package } from 'lucide-react';
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
    case 'restaurant': return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80'; /* restaurant food background */
    case 'bakery': return 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80'; /* bakery bread background */
    case 'cafe': return 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80'; /* cafe coffee background */
    case 'supermarket': return 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&q=80'; /* supermarket background */
    case 'convenience': return 'https://images.unsplash.com/photo-1581458925565-df0bd529a674?w=800&q=80'; /* convenience store background */
    default: return 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80'; /* grocery bag background */
  }
}

export function BagCard({ bag }: BagCardProps) {
  const discountPercent = Math.round((1 - bag.discountedPrice / bag.originalPrice) * 100);
  const isSoldOut = bag.stockCount <= 0;

  return (
    <Link 
      href={isSoldOut ? "#" : `/bags/${bag.id}`}
      className={`group block bg-card rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-lg transition-all duration-300 ${isSoldOut ? 'opacity-70 grayscale-[30%] cursor-not-allowed' : 'hover:-translate-y-1'}`}
      onClick={(e) => isSoldOut && e.preventDefault()}
    >
      <div className="relative h-40 overflow-hidden">
        <img 
          src={bag.store.imageUrl || getCategoryImage(bag.store.category)} 
          alt={bag.store.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <div className="bg-background/90 backdrop-blur-md px-2 py-1 rounded-lg text-sm shadow-sm flex items-center gap-1.5 font-medium">
            <span>{getCategoryIcon(bag.store.category)}</span>
            <span className="truncate max-w-[120px]">{bag.store.name}</span>
          </div>
        </div>

        {isSoldOut ? (
          <div className="absolute top-3 right-3 bg-destructive text-destructive-foreground font-bold px-3 py-1 rounded-full text-xs shadow-sm">
            完売
          </div>
        ) : (
          <div className="absolute top-3 right-3 bg-accent text-accent-foreground font-bold px-3 py-1 rounded-full text-xs shadow-sm shadow-accent/20">
            {discountPercent}% OFF
          </div>
        )}

        {/* Bottom Title overlay */}
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-white font-bold text-lg drop-shadow-md truncate">{bag.title}</h3>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center text-muted-foreground text-sm gap-1.5">
            <Clock className="w-4 h-4" />
            <span>{bag.pickupStart} - {bag.pickupEnd}</span>
          </div>
          <div className="flex items-center text-muted-foreground text-sm gap-1.5">
            <Package className="w-4 h-4" />
            <span className={bag.stockCount < 3 && bag.stockCount > 0 ? "text-orange-500 font-bold" : ""}>
              残り{bag.stockCount}個
            </span>
          </div>
        </div>
        
        <div className="flex items-end justify-between mt-auto">
          <div className="flex items-center text-muted-foreground text-sm gap-1 truncate max-w-[140px]">
            <MapPin className="w-4 h-4 shrink-0" />
            <span className="truncate">{bag.store.city}</span>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground line-through decoration-destructive/50">
              ¥{bag.originalPrice.toLocaleString()}
            </div>
            <div className="text-xl font-display font-bold text-foreground leading-none mt-0.5">
              ¥{bag.discountedPrice.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
