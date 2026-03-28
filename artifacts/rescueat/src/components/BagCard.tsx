import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Clock, Gift, Heart, Navigation, ChefHat, Sparkles, Star } from 'lucide-react';
import { Link } from 'wouter';
import { SurpriseBagWithStore } from '@workspace/api-client-react';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useAuth } from '@/contexts/AuthContext';
import { getCategoryIcon, getCategoryImage } from '@/lib/category-utils';
import { useUserLocation, haversineMeters, formatDistanceLabel } from '@/hooks/use-user-location';
import { useToast } from '@/hooks/use-toast';
import { LoginNudgeSheet } from '@/components/LoginNudgeSheet';
import { StoreReviewSheet } from '@/components/StoreReviewSheet';

interface BagCardProps {
  bag: SurpriseBagWithStore;
  compact?: boolean;
}

/* ── 白エリア用 距離ピル ── */
function InfoDistanceBadge({
  storeLat,
  storeLng,
  size = 'md',
}: {
  storeLat: number;
  storeLng: number;
  size?: 'sm' | 'md';
}) {
  const { coords, loading } = useUserLocation();
  if (loading) return (
    <span className={`inline-block rounded-full bg-muted animate-pulse ${size === 'sm' ? 'w-12 h-4' : 'w-16 h-5'}`} />
  );
  if (!coords || !storeLat || !storeLng) return null;
  const meters  = haversineMeters(coords.lat, coords.lng, storeLat, storeLng);
  const minutes = Math.round(meters / 67);
  const label   = formatDistanceLabel(meters);
  const colorClass = minutes <= 5
    ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/60'
    : minutes <= 15
    ? 'bg-amber-50 text-amber-600 ring-1 ring-amber-200/60'
    : 'bg-sky-50 text-sky-600 ring-1 ring-sky-200/60';
  return (
    <span className={`inline-flex items-center gap-1 ${colorClass} rounded-full font-bold
      ${size === 'sm' ? 'text-[9px] px-1.5 py-[3px]' : 'text-[11px] px-2.5 py-1'}`}>
      <Navigation className={size === 'sm' ? 'w-2 h-2 shrink-0' : 'w-3 h-3 shrink-0'} />
      {label}
    </span>
  );
}

/* ── 吹き出し風「店主の一言」 ── */
function OwnerComment({ comment }: { comment: string }) {
  return (
    <div className="flex items-start gap-2 mb-3 px-0.5">
      <div className="shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
        <ChefHat className="w-3.5 h-3.5 text-primary" />
      </div>
      <div className="relative bg-amber-50/80 rounded-xl rounded-tl-sm px-2.5 py-1.5 flex-1 min-w-0">
        <div className="absolute -left-1.5 top-2 w-0 h-0
          border-t-[5px] border-t-transparent
          border-r-[7px] border-r-amber-100
          border-b-[5px] border-b-transparent" />
        <p className="text-[11px] text-amber-800/75 font-medium italic leading-snug line-clamp-2 break-all">
          {comment}
        </p>
      </div>
    </div>
  );
}

export function BagCard({ bag, compact = false }: BagCardProps) {
  const discountPercent = bag.originalPrice > 0
    ? Math.round((1 - bag.discountedPrice / bag.originalPrice) * 100)
    : 0;
  const isSoldOut  = bag.stockCount <= 0;
  const isLowStock = bag.stockCount > 0 && bag.stockCount <= 2;
  const { isFavorite, toggle } = useFavorites();
  const { user } = useAuth();
  const { toast } = useToast();
  const storeId   = bag.store.id;
  const favorited = isFavorite(storeId);
  const [burst, setBurst]               = useState(false);
  const [imgLoaded, setImgLoaded]       = useState(false);
  const [fanBurst, setFanBurst]         = useState(false);
  const [showLoginNudge, setShowLoginNudge] = useState(false);
  const [showReviews, setShowReviews]   = useState(false);

  function handleFavorite(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { setShowLoginNudge(true); return; }
    const wasNotFavorited = !favorited;
    toggle(storeId);
    if (wasNotFavorited) {
      setBurst(true);
      setTimeout(() => setBurst(false), 500);
    }
  }

  function handleSoldOutFan(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { setShowLoginNudge(true); return; }
    const wasNotFavorited = !favorited;
    toggle(storeId);
    if (wasNotFavorited) {
      setFanBurst(true);
      setTimeout(() => setFanBurst(false), 500);
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
  const avgRating = (bag.store as any).avgRating as number | null | undefined;
  const reviewCount = (bag.store as any).reviewCount as number | undefined;

  return (<>
    <Link
      href={isSoldOut ? '#' : `/bags/${bag.id}`}
      className={[
        'group block relative rounded-2xl overflow-hidden bg-card',
        'transition-all duration-250 ease-out',
        isSoldOut
          ? 'opacity-50 cursor-not-allowed grayscale'
          : 'cursor-pointer hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(10,8,6,0.14),0_4px_8px_rgba(10,8,6,0.06)]',
      ].join(' ')}
      style={{
        boxShadow: '0 2px 8px -1px rgba(10,8,6,0.08), 0 1px 3px -1px rgba(10,8,6,0.04)',
      }}
      onClick={(e) => isSoldOut && e.preventDefault()}
    >
      {/* ── 画像エリア ── */}
      <div className={`relative w-full overflow-hidden bg-muted ${compact ? 'aspect-[16/9]' : 'aspect-[4/3]'}`}>

        {!imgLoaded && <div className="absolute inset-0 skeleton-shimmer" />}

        <img
          src={imgSrc}
          alt={bag.store.name}
          loading="lazy"
          decoding="async"
          onLoad={() => setImgLoaded(true)}
          className={`w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]
            ${imgLoaded ? 'img-fade-in' : 'opacity-0'}`}
        />

        {/* グラデーション（より繊細に） */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent pointer-events-none" />

        {/* 左上: 店舗名チップ */}
        <div className="absolute top-2.5 left-2.5">
          <div className="bg-white/92 backdrop-blur-sm px-2.5 py-1 rounded-full text-[11px] font-semibold
            shadow-[0_1px_4px_rgba(0,0,0,0.12)] flex items-center gap-1.5 text-foreground max-w-[58%]">
            <span className="text-sm leading-none">{getCategoryIcon(bag.store.category)}</span>
            <span className="truncate">{bag.store.name}</span>
          </div>
        </div>

        {/* 右上: 評価バッジ・ハート（＋距離）・割引バッジ */}
        <div className="absolute top-2.5 right-2.5 flex flex-col items-end gap-1.5">
          {/* 星評価バッジ（口コミがある場合のみ）タップで口コミ一覧を表示 */}
          {avgRating && !isSoldOut && (
            <button
              type="button"
              onClick={e => { e.preventDefault(); e.stopPropagation(); setShowReviews(true); }}
              className="flex items-center gap-0.5 bg-emerald-500 active:bg-emerald-600 text-white font-black px-2 py-0.5 rounded-full text-[11px] shadow-[0_2px_8px_rgba(16,185,129,0.45)] backdrop-blur-sm transition-transform active:scale-95 tap-scale-sm"
            >
              <Star className="w-2.5 h-2.5 fill-white shrink-0" />
              {Number(avgRating).toFixed(1)}
            </button>
          )}

          {/* ハートボタン */}
          <button
            onClick={handleFavorite}
            className={`w-8 h-8 flex items-center justify-center rounded-full
              transition-all duration-150 tap-scale-sm
              ${favorited
                ? 'bg-rose-500 shadow-[0_2px_8px_rgba(239,68,68,0.35)]'
                : 'bg-white/90 backdrop-blur-sm shadow-[0_1px_4px_rgba(0,0,0,0.12)]'
              } ${burst ? 'scale-125' : ''}`}
            aria-label={favorited ? 'お気に入りから削除' : 'お気に入りに追加'}
          >
            <Heart className={`w-4 h-4 transition-all duration-150
              ${favorited ? 'fill-white stroke-white' : 'fill-none stroke-rose-400'}`} />
          </button>

          {isSoldOut ? (
            <div className="bg-gray-800/75 text-white/85 font-bold px-2.5 py-0.5 rounded-full text-[10px] backdrop-blur-sm">
              完売
            </div>
          ) : (
            <>
              {/* 割引バッジ（原価ありの場合のみ表示） */}
              {discountPercent > 0 && (
                <div className={`flex items-center gap-0.5 text-white font-black px-2.5 py-0.5 rounded-full text-[11px] rotate-1
                  ${discountPercent >= 20
                    ? 'bg-gradient-to-r from-[#F07826] to-[#E85A0C] shadow-[0_2px_10px_rgba(240,120,38,0.45)]'
                    : 'bg-primary shadow-[0_2px_8px_rgba(255,140,0,0.30)]'
                  }`}>
                  {discountPercent >= 20 && <Sparkles className="w-2.5 h-2.5 shrink-0" />}
                  {discountPercent}% OFF
                </div>
              )}
              {/* 残りわずかバッジ */}
              {isLowStock && (
                <div className="flex items-center gap-0.5 bg-rose-500 text-white font-bold px-2 py-0.5 rounded-full text-[10px] animate-pulse shadow-[0_2px_8px_rgba(239,68,68,0.40)]">
                  🔥 残りわずか！
                </div>
              )}
            </>
          )}
        </div>

        {/* 完売スタンプ */}
        {isSoldOut && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="border-[3px] border-red-500/70 rounded-xl px-4 py-2 rotate-[-12deg] backdrop-blur-[1px]">
              <span className="text-red-400/90 text-2xl font-black tracking-widest leading-none block text-center drop-shadow"
                style={{ fontFamily: 'Outfit, sans-serif' }}>
                完売御礼
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── カード情報エリア ── */}
      <div className={compact ? 'p-2 pb-1.5' : 'p-4 pb-3.5'}>

        {/* 商品タイトル ＋ 距離（compact:右端） */}
        <div className={compact ? 'flex items-start justify-between gap-1.5 mb-1' : 'mb-2'}>
          <h3 className={`font-bold leading-snug tracking-tight
            ${compact ? 'text-[11px] line-clamp-2 flex-1 min-w-0' : 'line-clamp-2'}
            ${isSoldOut ? 'text-muted-foreground' : 'text-foreground'}
            ${!compact && !isSoldOut ? 'text-[15px]' : ''}`}>
            {bag.title}
          </h3>
          {compact && !isSoldOut && bag.store.lat && bag.store.lng && (
            <div className="shrink-0 mt-0.5">
              <InfoDistanceBadge storeLat={bag.store.lat} storeLng={bag.store.lng} size="sm" />
            </div>
          )}
          {avgRating && !isSoldOut && !compact && (
            <div className="flex items-center gap-1 mt-1">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
              <span className="text-[12px] font-black text-amber-500">{Number(avgRating).toFixed(1)}</span>
              {reviewCount ? (
                <span className="text-[11px] text-muted-foreground font-medium">({reviewCount}件)</span>
              ) : null}
            </div>
          )}
        </div>

        {/* 現在地からの距離（非compact・販売中のみ） */}
        {!isSoldOut && !compact && bag.store.lat && bag.store.lng && (
          <div className="mb-2.5">
            <InfoDistanceBadge storeLat={bag.store.lat} storeLng={bag.store.lng} size="md" />
          </div>
        )}

        {/* 店主の一言（compactでは非表示） */}
        {trimmedComment && !isSoldOut && !compact && (
          <OwnerComment comment={trimmedComment} />
        )}

        {/* ── 完売時 ── */}
        {isSoldOut ? (
          <div className="space-y-2 mt-2">
            <p className="text-xs text-muted-foreground/60 text-center font-medium">
              次のおすそわけをお楽しみに 🌸
            </p>
            <button
              onClick={handleSoldOutFan}
              className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold
                transition-all duration-150 tap-scale border
                ${favorited
                  ? 'bg-rose-50 border-rose-200 text-rose-600'
                  : 'bg-white border-rose-200/70 text-rose-500 hover:bg-rose-50/80'
                } ${fanBurst ? 'scale-105' : ''}`}
            >
              <Heart className={`w-4 h-4 transition-all ${favorited ? 'fill-rose-500 stroke-rose-500' : 'fill-none stroke-rose-400'}`} />
              {favorited ? 'お気に入り済み ✓' : 'このお店を応援する'}
            </button>
          </div>
        ) : (
          <>
            {compact ? (
              /* ── compact: 受取時間(左) ＋ 価格情報縦列(右) ── */
              <div className="mt-1 flex items-end justify-between gap-2">
                {/* 左列: 受取時間 + 残り個数 */}
                <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                  {(bag.pickupStart || bag.pickupEnd) && !isSoldOut && (
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock className="w-2.5 h-2.5 text-primary/70 shrink-0" />
                      <span className="font-medium truncate">
                        {bag.pickupStart}{bag.pickupEnd ? `〜${bag.pickupEnd}` : ''}
                      </span>
                    </div>
                  )}
                  {!isSoldOut && (
                    <div className="flex items-center gap-0.5 text-[10px]">
                      <Gift className={`w-2.5 h-2.5 shrink-0 ${isLowStock ? 'text-rose-400' : 'text-primary/50'}`} />
                      <span className={isLowStock ? 'text-rose-500 font-semibold' : 'text-muted-foreground'}>
                        残り{bag.stockCount}個
                      </span>
                    </div>
                  )}
                </div>

                {/* 右列: ①在庫アピール → ②元値 → ③販売価格 */}
                {!isSoldOut ? (
                  <div className="flex flex-col items-end gap-[3px] shrink-0">
                    {isLowStock && (
                      <span className="text-[9px] font-black text-rose-500 leading-none tracking-tight">
                        残りあと{bag.stockCount}個！
                      </span>
                    )}
                    {bag.originalPrice > bag.discountedPrice && (
                      <span className="text-[10px] text-muted-foreground/45 line-through font-medium leading-none">
                        ¥{bag.originalPrice.toLocaleString()}
                      </span>
                    )}
                    <span className="text-[15px] font-black text-primary leading-none tracking-tight whitespace-nowrap">
                      ¥{bag.discountedPrice.toLocaleString()}
                    </span>
                  </div>
                ) : null}
              </div>
            ) : (
              <>
            {/* 受取時間 ＋ 残り在庫 */}
            <div className="flex items-center justify-between mb-3 gap-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/60 px-2.5 py-1.5 rounded-lg">
                <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="font-semibold">受取 {bag.pickupStart}{bag.pickupEnd ? ` 〜 ${bag.pickupEnd}` : '〜'}</span>
              </div>
              <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg
                ${isLowStock
                  ? 'bg-rose-50 text-rose-600 font-semibold'
                  : 'text-muted-foreground bg-muted/60 font-semibold'
                }`}>
                <Gift className={`w-3.5 h-3.5 shrink-0 ${isLowStock ? 'text-rose-500' : 'text-primary'}`} />
                <span>残り {bag.stockCount} 個</span>
              </div>
            </div>

            {/* 価格エリア */}
            <div className="flex items-center justify-between pt-3"
              style={{ borderTop: '1px solid rgba(10,8,6,0.07)' }}>
              <div className="flex flex-col">
                {bag.originalPrice > bag.discountedPrice ? (
                  <>
                    <span className="text-[10px] text-muted-foreground/70 font-medium mb-0.5">定価</span>
                    <span className="text-sm text-muted-foreground/60 line-through decoration-rose-400/40 font-semibold leading-tight">
                      ¥{bag.originalPrice.toLocaleString()}
                    </span>
                  </>
                ) : (
                  <span className="text-[10px] text-muted-foreground/50 font-medium">特別価格</span>
                )}
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-primary/60 font-semibold tracking-wide mb-0.5">おすそわけ価格</span>
                <span className="text-2xl font-black text-primary leading-none whitespace-nowrap tracking-tight">
                  ¥{bag.discountedPrice.toLocaleString()}
                </span>
              </div>
            </div>
              </>
            )}
          </>
        )}
      </div>
    </Link>
    <LoginNudgeSheet
      isOpen={showLoginNudge}
      onClose={() => setShowLoginNudge(false)}
      reason="favorite"
    />

    {/* 口コミシート */}
    <AnimatePresence>
      {showReviews && avgRating && (
        <StoreReviewSheet
          storeId={storeId}
          storeName={bag.store.name}
          avgRating={avgRating}
          reviewCount={reviewCount ?? 0}
          onClose={() => setShowReviews(false)}
        />
      )}
    </AnimatePresence>
  </>);
}

export function BagCardSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div className="rounded-2xl overflow-hidden bg-card"
      style={{ boxShadow: '0 2px 8px -1px rgba(10,8,6,0.06), 0 1px 3px -1px rgba(10,8,6,0.03)' }}>
      <div className={`w-full skeleton-shimmer ${compact ? 'aspect-[16/9]' : 'aspect-[4/3]'}`} />
      {compact ? (
        <div className="p-2 pb-1.5 space-y-1.5">
          <div className="flex items-start justify-between gap-1.5">
            <div className="h-3 skeleton-shimmer rounded-full flex-1" />
            <div className="h-4 skeleton-shimmer rounded-full w-12 shrink-0" />
          </div>
          <div className="flex items-end justify-between gap-2">
            <div className="space-y-1 flex-1">
              <div className="h-2.5 skeleton-shimmer rounded-full w-16" />
              <div className="h-2.5 skeleton-shimmer rounded-full w-12" />
            </div>
            <div className="h-5 skeleton-shimmer rounded-full w-14" />
          </div>
        </div>
      ) : (
        <div className="p-4 space-y-3">
          <div className="h-4.5 skeleton-shimmer rounded-full w-3/4" />
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 shrink-0 skeleton-shimmer rounded-full" />
            <div className="flex-1 h-8 skeleton-shimmer rounded-xl" />
          </div>
          <div className="flex gap-2">
            <div className="h-7 skeleton-shimmer rounded-lg w-24" />
            <div className="h-7 skeleton-shimmer rounded-lg w-20" />
          </div>
          <div className="flex justify-between items-end pt-1"
            style={{ borderTop: '1px solid rgba(10,8,6,0.07)' }}>
            <div className="space-y-1.5">
              <div className="h-2.5 skeleton-shimmer rounded-full w-8" />
              <div className="h-3.5 skeleton-shimmer rounded-full w-16" />
            </div>
            <div className="h-8 skeleton-shimmer rounded-full w-24" />
          </div>
        </div>
      )}
    </div>
  );
}
