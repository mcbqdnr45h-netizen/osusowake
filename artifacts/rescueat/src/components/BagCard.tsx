import React, { useState } from 'react';
import { Clock, Package, Heart, Navigation, ChefHat } from 'lucide-react';
import { Link } from 'wouter';
import { SurpriseBagWithStore } from '@workspace/api-client-react';
import { useFavorites } from '@/contexts/FavoritesContext';
import { getCategoryIcon, getCategoryImage } from '@/lib/category-utils';
import { useUserLocation, haversineMeters, formatDistanceLabel } from '@/hooks/use-user-location';
import { useToast } from '@/hooks/use-toast';

interface BagCardProps {
  bag: SurpriseBagWithStore;
}

function WalkTimeBadge({ storeLat, storeLng }: { storeLat: number; storeLng: number }) {
  const { coords } = useUserLocation();
  if (!coords) return null;
  const meters  = haversineMeters(coords.lat, coords.lng, storeLat, storeLng);
  const minutes = Math.round(meters / 67);
  const label   = formatDistanceLabel(meters);
  const color   = minutes <= 5 ? 'text-green-300' : minutes <= 15 ? 'text-orange-300' : 'text-sky-300';
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-black ${color}`}>
      <Navigation className="w-2.5 h-2.5 shrink-0" />
      {label}
    </span>
  );
}

/* ── 吹き出し風「店主の一言」 ── */
function OwnerComment({ comment }: { comment: string }) {
  return (
    <div className="flex items-start gap-2 mb-3 px-1">
      {/* 店主アイコン */}
      <div className="shrink-0 w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mt-0.5">
        <ChefHat className="w-3.5 h-3.5 text-primary" />
      </div>
      {/* 吹き出し */}
      <div className="relative bg-amber-50 border border-amber-200/70 rounded-xl rounded-tl-sm px-2.5 py-1.5 flex-1 min-w-0">
        {/* 吹き出しの尖り */}
        <div className="absolute -left-1.5 top-2 w-0 h-0
          border-t-4 border-t-transparent
          border-r-[7px] border-r-amber-200/70
          border-b-4 border-b-transparent" />
        <div className="absolute -left-[5px] top-[9px] w-0 h-0
          border-t-[3px] border-t-transparent
          border-r-[6px] border-r-amber-50
          border-b-[3px] border-b-transparent" />
        <p className="text-[11px] text-amber-800/80 font-medium italic leading-snug line-clamp-2 break-all">
          {comment}
        </p>
      </div>
    </div>
  );
}

export function BagCard({ bag }: BagCardProps) {
  const discountPercent = Math.round((1 - bag.discountedPrice / bag.originalPrice) * 100);
  const isSoldOut  = bag.stockCount <= 0;
  const isLowStock = bag.stockCount > 0 && bag.stockCount <= 2;
  const { isFavorite, toggle } = useFavorites();
  const { toast } = useToast();
  const storeId   = bag.store.id;
  const favorited = isFavorite(storeId);
  const [burst, setBurst]         = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [fanBurst, setFanBurst]   = useState(false);

  function handleFavorite(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const wasNotFavorited = !favorited;
    toggle(storeId);
    if (wasNotFavorited) {
      setBurst(true);
      setTimeout(() => setBurst(false), 600);
    }
  }

  function handleSoldOutFan(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const wasNotFavorited = !favorited;
    toggle(storeId);
    if (wasNotFavorited) {
      setFanBurst(true);
      setTimeout(() => setFanBurst(false), 600);
      toast({
        title: '💌 お気に入り登録しました！',
        description: '準備が整い次第、通知機能でお知らせできるようになります',
        duration: 4000,
      });
    } else {
      toast({ title: 'お気に入りから削除しました', duration: 2000 });
    }
  }

  const imgSrc = bag.imageUrl || bag.store.imageUrl || getCategoryImage(bag.store.category);

  const storeComment = (bag as any).description as string | null | undefined;
  const trimmedComment = storeComment
    ? storeComment.length > 36 ? storeComment.slice(0, 35) + '…' : storeComment
    : null;

  return (
    <Link
      href={isSoldOut ? '#' : `/bags/${bag.id}`}
      className={`group block relative rounded-2xl overflow-hidden shadow-md bg-card border transition-all duration-200 tap-scale
        ${isSoldOut
          ? 'opacity-55 cursor-not-allowed grayscale border-border/20'
          : 'border-border/30 hover:shadow-xl hover:-translate-y-0.5 cursor-pointer'
        }`}
      onClick={(e) => isSoldOut && e.preventDefault()}
    >
      {/* ── 4:3 画像エリア ── */}
      <div className="relative w-full aspect-[4/3] overflow-hidden bg-muted">

        {!imgLoaded && <div className="absolute inset-0 skeleton-shimmer" />}

        <img
          src={imgSrc}
          alt={bag.store.name}
          loading="lazy"
          decoding="async"
          onLoad={() => setImgLoaded(true)}
          className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105
            ${imgLoaded ? 'img-fade-in' : 'opacity-0'}`}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />

        {/* 左上: 店舗名チップ */}
        <div className="absolute top-2.5 left-2.5">
          <div className="bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-bold shadow-sm flex items-center gap-1.5 text-foreground max-w-[58%]">
            <span>{getCategoryIcon(bag.store.category)}</span>
            <span className="truncate">{bag.store.name}</span>
          </div>
        </div>

        {/* 右上: バッジ群 */}
        <div className="absolute top-2.5 right-2.5 flex flex-col items-end gap-1.5">
          <button
            onClick={handleFavorite}
            className={`w-8 h-8 flex items-center justify-center rounded-full shadow-md
              tap-scale-sm transition-all duration-150
              ${favorited
                ? 'bg-rose-500 text-white'
                : 'bg-white/90 backdrop-blur-sm text-rose-400 hover:bg-rose-50'
              } ${burst ? 'scale-125' : ''}`}
            aria-label={favorited ? 'お気に入りから削除' : 'お気に入りに追加'}
          >
            <Heart className={`w-4 h-4 transition-all duration-150 ${favorited ? 'fill-white stroke-white' : 'fill-none stroke-rose-400'}`} />
          </button>

          {isSoldOut ? (
            <div className="bg-gray-700/80 text-white/90 font-black px-2.5 py-1 rounded-full text-xs backdrop-blur-sm border border-white/10">
              完売
            </div>
          ) : (
            <>
              <div className="bg-accent text-accent-foreground font-black px-2.5 py-1 rounded-full text-xs shadow-md rotate-2">
                {discountPercent}% OFF
              </div>
              {isLowStock && (
                <div className="bg-destructive text-destructive-foreground font-black px-2 py-0.5 rounded-full text-[10px] animate-pulse shadow-md">
                  残りわずか!
                </div>
              )}
            </>
          )}
        </div>

        {/* 左下: 徒歩時間 */}
        {!isSoldOut && bag.store.lat && bag.store.lng && (
          <div className="absolute bottom-2.5 left-2.5 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full">
            <WalkTimeBadge storeLat={bag.store.lat} storeLng={bag.store.lng} />
          </div>
        )}

        {/* 完売スタンプ（中央オーバーレイ）*/}
        {isSoldOut && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="border-4 border-red-500/80 rounded-xl px-4 py-2 rotate-[-12deg] bg-white/5 backdrop-blur-[1px]">
              <span className="text-red-500/90 text-2xl font-black tracking-widest leading-none block text-center"
                style={{ fontFamily: 'Outfit, sans-serif', textShadow: '0 0 12px rgba(239,68,68,0.3)' }}>
                完売御礼
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── カード情報エリア ── */}
      <div className="p-4 pb-3.5">

        {/* 商品タイトル */}
        <h3 className={`font-black leading-snug mb-2.5 line-clamp-2
          ${isSoldOut ? 'text-sm text-muted-foreground' : 'text-base text-foreground'}`}>
          {bag.title}
        </h3>

        {/* 店主の一言（吹き出し）*/}
        {trimmedComment && !isSoldOut && (
          <OwnerComment comment={trimmedComment} />
        )}

        {/* ── 完売御礼エリア ── */}
        {isSoldOut ? (
          <div className="space-y-2 mt-2">
            <p className="text-xs text-muted-foreground/70 text-center font-medium">
              次のおすそ分けをお楽しみに 🌸
            </p>
            <button
              onClick={handleSoldOutFan}
              className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-black transition-all tap-scale border-2
                ${favorited
                  ? 'bg-rose-50 border-rose-300 text-rose-600'
                  : 'bg-white border-rose-200 text-rose-500 hover:bg-rose-50 hover:border-rose-300'
                } ${fanBurst ? 'scale-105' : ''}`}
            >
              <Heart className={`w-4 h-4 transition-all ${favorited ? 'fill-rose-500 stroke-rose-500' : 'fill-none stroke-rose-400'}`} />
              {favorited ? 'お気に入り済み ✓' : 'このお店を応援する'}
            </button>
            {!favorited && (
              <p className="text-[10px] text-center text-muted-foreground/60 leading-relaxed">
                ♡ タップで次のおすそ分けを待てます
              </p>
            )}
          </div>
        ) : (
          <>
            {/* 受取時間 ＋ 残り在庫 */}
            <div className="flex items-center justify-between mb-3 gap-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/60 px-2 py-1 rounded-md">
                <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="font-bold">受取 {bag.pickupStart}{bag.pickupEnd ? ` 〜 ${bag.pickupEnd}` : '〜'}</span>
              </div>
              <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-md
                ${isLowStock
                  ? 'bg-orange-100 text-orange-600 font-black border border-orange-200'
                  : 'text-muted-foreground bg-secondary/60 font-bold'
                }`}>
                <Package className={`w-3.5 h-3.5 shrink-0 ${isLowStock ? 'text-orange-500' : 'text-primary'}`} />
                <span>残り<span className={`ml-0.5 ${isLowStock ? 'text-orange-700 text-sm' : ''}`}>{bag.stockCount}</span>個</span>
              </div>
            </div>

            {/* 価格エリア */}
            <div className="flex items-center justify-between border-t border-border/50 pt-3">
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">定価</span>
                <span className="text-sm text-muted-foreground line-through decoration-destructive/50 font-bold leading-tight">
                  ¥{bag.originalPrice.toLocaleString()}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-primary/70 font-bold tracking-wide uppercase">おすそ分け価格</span>
                <span className="text-2xl font-black text-primary leading-none whitespace-nowrap">
                  ¥{bag.discountedPrice.toLocaleString()}
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </Link>
  );
}

export function BagCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden shadow-sm border border-border/30 bg-card">
      <div className="w-full aspect-[4/3] skeleton-shimmer" />
      <div className="p-4 space-y-3">
        <div className="h-5 skeleton-shimmer rounded-full w-3/4" />
        <div className="flex items-start gap-2">
          <div className="w-6 h-6 shrink-0 skeleton-shimmer rounded-full" />
          <div className="flex-1 h-8 skeleton-shimmer rounded-xl" />
        </div>
        <div className="flex gap-2">
          <div className="h-6 skeleton-shimmer rounded-md w-24" />
          <div className="h-6 skeleton-shimmer rounded-md w-20" />
        </div>
        <div className="flex justify-between items-end pt-1 border-t border-border/30">
          <div className="space-y-1">
            <div className="h-2.5 skeleton-shimmer rounded-full w-8" />
            <div className="h-3.5 skeleton-shimmer rounded-full w-16" />
          </div>
          <div className="h-8 skeleton-shimmer rounded-full w-24" />
        </div>
      </div>
    </div>
  );
}
