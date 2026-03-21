import React, { useState } from 'react';
import { Clock, Package, Heart, Navigation } from 'lucide-react';
import { Link } from 'wouter';
import { SurpriseBagWithStore } from '@workspace/api-client-react';
import { useFavorites } from '@/contexts/FavoritesContext';
import { getCategoryIcon, getCategoryImage } from '@/lib/category-utils';
import { useUserLocation, haversineMeters, metersToWalkMinutes, formatWalkTime } from '@/hooks/use-user-location';

interface BagCardProps {
  bag: SurpriseBagWithStore;
}

function WalkTimeBadge({ storeLat, storeLng }: { storeLat: number; storeLng: number }) {
  const { coords } = useUserLocation();
  if (!coords) return null;
  const meters  = haversineMeters(coords.lat, coords.lng, storeLat, storeLng);
  const minutes = metersToWalkMinutes(meters);
  const label   = formatWalkTime(minutes);
  const color   = minutes <= 5 ? 'text-green-600' : minutes <= 15 ? 'text-orange-500' : 'text-sky-500';
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-black ${color}`}>
      <Navigation className="w-2.5 h-2.5" />
      {label}
    </span>
  );
}

export function BagCard({ bag }: BagCardProps) {
  const discountPercent = Math.round((1 - bag.discountedPrice / bag.originalPrice) * 100);
  const isSoldOut  = bag.stockCount <= 0;
  const isLowStock = bag.stockCount > 0 && bag.stockCount < 3;
  const { isFavorite, toggle } = useFavorites();
  const storeId  = bag.store.id;
  const favorited = isFavorite(storeId);
  const [burst, setBurst]         = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  function handleFavorite(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    toggle(storeId);
    if (!favorited) { setBurst(true); setTimeout(() => setBurst(false), 600); }
  }

  const imgSrc = bag.store.imageUrl || getCategoryImage(bag.store.category);

  return (
    <Link
      href={isSoldOut ? '#' : `/bags/${bag.id}`}
      className={`group block relative rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 bg-card border border-border/30
        ${isSoldOut ? 'opacity-60 cursor-not-allowed grayscale' : 'hover:-translate-y-1 cursor-pointer'}`}
      onClick={(e) => isSoldOut && e.preventDefault()}
    >
      {/* ── 4:3 画像エリア（スケルトン付き） ── */}
      <div className="relative w-full aspect-[4/3] bg-muted overflow-hidden">

        {/* スケルトン */}
        {!imgLoaded && (
          <div className="absolute inset-0 bg-gradient-to-r from-muted via-muted/60 to-muted animate-pulse" />
        )}

        {/* 画像 */}
        <img
          src={imgSrc}
          alt={bag.store.name}
          loading="lazy"
          onLoad={() => setImgLoaded(true)}
          className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-105
            ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
        />

        {/* グラデーションオーバーレイ */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        {/* 左上: 店舗名チップ */}
        <div className="absolute top-2.5 left-2.5">
          <div className="bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-bold shadow-sm flex items-center gap-1.5 text-foreground max-w-[58%]">
            <span>{getCategoryIcon(bag.store.category)}</span>
            <span className="truncate">{bag.store.name}</span>
          </div>
        </div>

        {/* 右上: アクションバッジ群 */}
        <div className="absolute top-2.5 right-2.5 flex flex-col items-end gap-1.5">
          {/* ハートボタン */}
          <button
            onClick={handleFavorite}
            className={`w-8 h-8 flex items-center justify-center rounded-full shadow-md transition-all duration-200 active:scale-90
              ${favorited
                ? 'bg-rose-500 text-white'
                : 'bg-white/90 backdrop-blur-sm text-rose-400 hover:bg-rose-50'
              } ${burst ? 'scale-125' : ''}`}
            aria-label={favorited ? 'お気に入りから削除' : 'お気に入りに追加'}
          >
            <Heart className={`w-4 h-4 ${favorited ? 'fill-white stroke-white' : 'fill-none stroke-rose-400'}`} />
          </button>

          {isSoldOut ? (
            <div className="bg-black/60 text-white font-black px-2.5 py-1 rounded-full text-xs backdrop-blur-sm">完売</div>
          ) : (
            <>
              <div className="bg-accent text-accent-foreground font-black px-2.5 py-1 rounded-full text-xs shadow-md rotate-2">
                {discountPercent}% OFF
              </div>
              {isLowStock && (
                <div className="bg-destructive text-destructive-foreground font-bold px-2 py-0.5 rounded-full text-[10px] animate-pulse shadow-md">
                  残りわずか!
                </div>
              )}
            </>
          )}
        </div>

        {/* 左下: 徒歩時間 */}
        {bag.store.lat && bag.store.lng && (
          <div className="absolute bottom-2.5 left-2.5 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full">
            <WalkTimeBadge storeLat={bag.store.lat} storeLng={bag.store.lng} />
          </div>
        )}
      </div>

      {/* ── カード下部情報 ── */}
      <div className="p-4">
        <h3 className="font-bold text-foreground text-[15px] leading-snug mb-3 line-clamp-2">
          {bag.title}
        </h3>

        <div className="flex items-center justify-between mb-3 gap-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/60 px-2 py-1 rounded-md">
            <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="font-medium">受取 {bag.pickupStart}-{bag.pickupEnd}</span>
          </div>
          <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-md font-medium
            ${isLowStock ? 'bg-orange-100 text-orange-600' : 'text-muted-foreground bg-secondary/60'}`}>
            <Package className={`w-3.5 h-3.5 shrink-0 ${isLowStock ? 'text-orange-500' : 'text-primary'}`} />
            <span>残り{bag.stockCount}個</span>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border/50 pt-3">
          <div className="text-sm text-muted-foreground line-through decoration-destructive/50 font-medium">
            ¥{bag.originalPrice.toLocaleString()}
          </div>
          <div className="text-2xl font-black text-primary leading-none">
            ¥{bag.discountedPrice.toLocaleString()}
          </div>
        </div>
      </div>
    </Link>
  );
}

/** ホーム画面用スケルトンカード */
export function BagCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden shadow-sm border border-border/30 bg-card animate-pulse">
      <div className="w-full aspect-[4/3] bg-muted" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-3 bg-muted rounded w-1/2" />
        <div className="flex justify-between pt-1">
          <div className="h-3 bg-muted rounded w-16" />
          <div className="h-6 bg-muted rounded w-20" />
        </div>
      </div>
    </div>
  );
}
