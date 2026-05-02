import React, { useState } from 'react';
import { MobileFrame } from './_shared/MobileFrame';
import { mockBags } from './_shared/mockBags';
import {
  ChevronLeft, MapPin, Clock, Star, Minus, Plus, Heart,
  Info, Store, Phone, CalendarDays, UtensilsCrossed, MessageSquare,
  TrendingDown, Flame,
} from 'lucide-react';

export default function BagDetail() {
  const bag = mockBags[0] as typeof mockBags[0] & {
    stockCount: number;
    description: string;
    storeDescription: string;
    address: string;
    phone: string;
    openTime: string;
    closeTime: string;
    holiday: string;
    allergyInfo: string;
    pickupNote: string;
    reviews: { id: number; userId: string; rating: number; comment: string; date: string; reply: string | null }[];
  };
  const [qty, setQty] = useState(1);
  const [liked, setLiked] = useState(false);
  const [followed, setFollowed] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);

  const savings = bag.originalPrice - bag.discountedPrice;
  const discountPercent = Math.round((1 - bag.discountedPrice / bag.originalPrice) * 100);
  const avgRating = bag.reviews.reduce((s, r) => s + r.rating, 0) / bag.reviews.length;

  return (
    <MobileFrame className="bg-white">
      {/* Hero */}
      <div className="relative h-[55vh] w-full bg-[#1A1614] shrink-0">
        <img src={bag.photoUrl} alt={bag.title} className="w-full h-full object-cover opacity-90" />
        <div className="absolute inset-0 vignette-full pointer-events-none" />

        <button className="absolute top-14 left-4 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md bg-black/20 border border-white/20 text-white z-10">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={() => setLiked(!liked)}
          className="absolute top-14 right-4 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md bg-black/20 border border-white/20 text-white z-10"
        >
          <Heart className={`w-5 h-5 ${liked ? 'fill-[#F26419] text-[#F26419]' : 'fill-none'}`} />
        </button>

        <div className="absolute bottom-0 left-0 right-0 p-6 pt-24 vignette-bottom">
          <div className="flex flex-col gap-3">
            <span
              className="inline-flex w-fit px-3 py-1 rounded-sm text-[11px] font-black uppercase tracking-widest text-white mb-2"
              style={{ backgroundColor: 'var(--c-primary)' }}
            >
              {bag.category === 'meals' ? '料理・お惣菜' : bag.category}
            </span>
            <h1 className="text-3xl font-black text-white leading-[1.15] text-mag-title">{bag.title}</h1>
            <div className="flex items-center gap-3 text-white/90 text-sm mt-2">
              <span className="font-bold">{bag.storeName}</span>
              <span className="w-1 h-1 rounded-full bg-white/40" />
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-[#FFB800] text-[#FFB800]" />
                <span className="font-display font-bold">{bag.rating}</span>
                <span className="text-white/60">({bag.reviewCount})</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 pt-8 pb-32 space-y-8" style={{ backgroundColor: 'var(--c-surface)' }}>

        {/* Price */}
        <div>
          <div className="flex justify-between items-end pb-4">
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--c-text-muted)' }}>Price</span>
              <span className="text-lg line-through font-display text-gray-400">¥{bag.originalPrice.toLocaleString()}</span>
              <div className="flex items-baseline gap-1" style={{ color: 'var(--c-primary)' }}>
                <span className="text-xl font-bold">¥</span>
                <span className="text-[42px] font-black font-display tracking-tighter leading-none text-mag-num">
                  {bag.discountedPrice.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="px-4 py-1.5 rounded-sm font-display font-black text-white text-[15px] tracking-wide animate-c-pulse"
                   style={{ backgroundColor: 'var(--c-primary)' }}>
                {discountPercent}% OFF
              </div>
            </div>
          </div>

          {/* Status pills */}
          <div className="flex items-center gap-2 flex-wrap pt-2">
            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-[#0F5132] font-black text-[12px] px-3 py-1.5 rounded-full border border-emerald-200">
              <TrendingDown className="w-3.5 h-3.5" strokeWidth={2.8} />
              ¥{savings.toLocaleString()} お得
            </span>
            {bag.lowStock && (
              <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 font-bold text-[12px] px-3 py-1.5 rounded-full border border-red-200">
                <Flame className="w-3.5 h-3.5" />
                残り{bag.stockCount}個
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 bg-stone-100 text-stone-700 font-bold text-[12px] px-3 py-1.5 rounded-full border border-stone-200">
              <Clock className="w-3.5 h-3.5" />
              受取 {bag.pickupStart}〜{bag.pickupEnd}
            </span>
            <span className="inline-flex items-center gap-1.5 bg-sky-50 text-sky-700 font-bold text-[12px] px-3 py-1.5 rounded-full border border-sky-200">
              <MapPin className="w-3.5 h-3.5" />
              {bag.distance}
            </span>
          </div>
        </div>

        <hr className="border-[#E8E4DF]" />

        {/* バッグの内容 */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: 'var(--c-text-main)' }}>
            <Info className="w-4 h-4" style={{ color: 'var(--c-primary)' }} />
            バッグの内容
          </h3>
          <p className="text-[15px] leading-relaxed text-gray-700">{bag.description}</p>
          <div className="mt-3 bg-white/60 rounded-xl px-4 py-3 border border-[#E8E4DF]">
            <p className="text-[11px] font-black uppercase tracking-wider mb-1" style={{ color: 'var(--c-primary)' }}>お店のPR</p>
            <p className="text-sm text-gray-600 leading-relaxed">{bag.storeDescription}</p>
          </div>
        </div>

        <hr className="border-[#E8E4DF]" />

        {/* Chef's Message */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: 'var(--c-text-main)' }}>
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--c-primary)' }} />
            Chef's Message
          </h3>
          <p className="text-[15px] leading-relaxed text-gray-700 italic">"{bag.ownerComment}"</p>
        </div>

        <hr className="border-[#E8E4DF]" />

        {/* 店舗情報 */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2" style={{ color: 'var(--c-text-main)' }}>
            <Store className="w-4 h-4" style={{ color: 'var(--c-primary)' }} />
            店舗情報
          </h3>

          <div className="rounded-2xl border border-[#E8E4DF] overflow-hidden bg-white divide-y divide-[#E8E4DF]">
            {/* Header with follow button */}
            <div className="flex items-start justify-between gap-3 px-4 py-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                     style={{ backgroundColor: 'var(--c-surface)', border: '1px solid #E8E4DF' }}>
                  🍽️
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="font-black text-[15px] text-gray-900 leading-snug">{bag.storeName}</div>
                  <div className="text-[11px] text-gray-500 mt-1 flex items-center gap-1 font-medium">
                    <MapPin className="w-3 h-3" />
                    渋谷区
                  </div>
                </div>
              </div>
              <button
                onClick={() => setFollowed(!followed)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold border transition-all shrink-0 mt-0.5 ${
                  followed
                    ? 'bg-rose-500 text-white border-transparent'
                    : 'bg-white text-rose-500 border-rose-200'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${followed ? 'fill-white' : 'fill-none'}`} />
                {followed ? 'フォロー中' : 'フォロー'}
              </button>
            </div>

            {/* 住所 */}
            <div className="flex items-start gap-3 px-4 py-3.5">
              <MapPin className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--c-primary)' }} />
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-0.5">住所</div>
                <div className="text-sm text-gray-900 font-medium leading-relaxed">{bag.address}</div>
              </div>
            </div>

            {/* 電話番号 */}
            <div className="flex items-center gap-3 px-4 py-3.5">
              <Phone className="w-4 h-4 shrink-0" style={{ color: 'var(--c-primary)' }} />
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-0.5">電話番号</div>
                <a href={`tel:${bag.phone}`} className="text-sm font-bold underline underline-offset-2" style={{ color: 'var(--c-primary)' }}>
                  {bag.phone}
                </a>
              </div>
            </div>

            {/* 営業時間 */}
            <div className="flex items-start gap-3 px-4 py-3.5">
              <Clock className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--c-primary)' }} />
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-0.5">営業時間</div>
                <div className="text-sm font-bold text-gray-900">{bag.openTime} 〜 {bag.closeTime}</div>
              </div>
            </div>

            {/* 定休日 */}
            <div className="flex items-start gap-3 px-4 py-3.5">
              <CalendarDays className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--c-primary)' }} />
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-0.5">定休日</div>
                <div className="text-sm text-gray-900 font-medium">{bag.holiday}</div>
              </div>
            </div>

            {/* アレルギー */}
            <div className="flex items-start gap-3 px-4 py-3.5 bg-amber-50/60">
              <UtensilsCrossed className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wide mb-0.5">アレルギー情報</div>
                <div className="text-sm text-amber-900 leading-relaxed">{bag.allergyInfo}</div>
              </div>
            </div>
          </div>
        </div>

        {/* 受取メモ */}
        <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 flex gap-3">
          <Info className="w-5 h-5 shrink-0 mt-0.5 text-sky-600" />
          <div className="text-sm text-sky-900">
            <p className="font-black mb-1">受取メモ</p>
            <p className="leading-relaxed">{bag.pickupNote}</p>
          </div>
        </div>

        <hr className="border-[#E8E4DF]" />

        {/* 口コミ・評価 */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2" style={{ color: 'var(--c-text-main)' }}>
              <MessageSquare className="w-4 h-4" style={{ color: 'var(--c-primary)' }} />
              口コミ・評価
            </h3>
            <span className="text-xs text-gray-500 font-medium">{bag.reviews.length}件</span>
          </div>

          {/* Rating summary */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-5 mb-5">
            <div className="flex items-center gap-5">
              <div className="flex flex-col items-center justify-center shrink-0 min-w-[68px]">
                <div className="font-display font-black text-amber-500 text-[44px] leading-none text-mag-num">
                  {avgRating.toFixed(1)}
                </div>
                <div className="flex items-center gap-0.5 mt-2">
                  {[1, 2, 3, 4, 5].map(n => (
                    <Star key={n} className={`w-3.5 h-3.5 ${n <= Math.round(avgRating) ? 'fill-amber-400 text-amber-400' : 'fill-none text-amber-200'}`} />
                  ))}
                </div>
                <div className="text-[10px] text-gray-500 mt-1.5">{bag.reviews.length}件</div>
              </div>
              <div className="flex-1 flex flex-col gap-1.5">
                {[5, 4, 3, 2, 1].map(star => {
                  const count = bag.reviews.filter(r => r.rating === star).length;
                  const pct = (count / bag.reviews.length) * 100;
                  return (
                    <div key={star} className="flex items-center gap-2 text-xs">
                      <span className="w-3 text-right font-bold text-gray-500">{star}</span>
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <div className="flex-1 h-1.5 bg-amber-100 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-3 text-right text-gray-500">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Review list */}
          <div className="space-y-3">
            {(showAllReviews ? bag.reviews : bag.reviews.slice(0, 2)).map(review => (
              <div key={review.id} className="bg-white rounded-2xl p-4 border border-[#E8E4DF]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black"
                         style={{ backgroundColor: 'var(--c-surface)', color: 'var(--c-primary)' }}>
                      {review.userId}
                    </div>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map(n => (
                        <Star key={n} className={`w-3 h-3 ${n <= review.rating ? 'fill-amber-400 text-amber-400' : 'fill-none text-amber-200'}`} />
                      ))}
                    </div>
                  </div>
                  <span className="text-[11px] text-gray-400">{review.date}</span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed pl-9">{review.comment}</p>
                {review.reply && (
                  <div className="mt-3 ml-9 rounded-xl px-3 py-2.5"
                       style={{ backgroundColor: 'var(--c-surface)', border: '1px solid #E8E4DF' }}>
                    <p className="text-[11px] font-black mb-1" style={{ color: 'var(--c-primary)' }}>オーナーより</p>
                    <p className="text-xs text-gray-700 leading-relaxed">{review.reply}</p>
                  </div>
                )}
              </div>
            ))}

            {bag.reviews.length > 2 && (
              <button
                onClick={() => setShowAllReviews(v => !v)}
                className="w-full py-3 text-sm font-bold rounded-xl border"
                style={{ color: 'var(--c-primary)', borderColor: 'var(--c-primary)', borderWidth: 1 }}
              >
                {showAllReviews ? '口コミを閉じる' : `すべての口コミを見る (${bag.reviews.length}件)`}
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Bottom Sticky Bar */}
      <div className="sticky bottom-0 left-0 right-0 w-full p-6 bg-white border-t border-[#E8E4DF] z-20 pb-8 flex gap-4 items-center">
        <div className="flex items-center justify-between px-3 py-3 rounded-xl border border-[#E8E4DF] w-32 bg-[#FBFBFA]">
          <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-8 h-8 flex items-center justify-center text-gray-400">
            <Minus className="w-4 h-4" />
          </button>
          <span className="font-display font-bold text-lg">{qty}</span>
          <button onClick={() => setQty(qty + 1)} className="w-8 h-8 flex items-center justify-center text-gray-400">
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <button
          className="flex-1 py-4 rounded-xl font-bold text-white text-lg shadow-xl"
          style={{
            backgroundColor: 'var(--c-primary)',
            boxShadow: '0 8px 24px rgba(242,100,25,0.3)',
          }}
        >
          予約する
        </button>
      </div>
    </MobileFrame>
  );
}
