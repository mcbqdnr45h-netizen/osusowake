import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, MessageSquare, ChevronDown } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';

import { API_BASE } from '@/lib/api-base';
const BASE = API_BASE;

interface Review {
  id: number;
  userId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  reply?: string | null;
  repliedAt?: string | null;
}

interface StoreReviewSheetProps {
  storeId: number;
  storeName: string;
  avgRating: number;
  reviewCount: number;
  onClose: () => void;
}

function StarRow({ rating, size = 'md' }: { rating: number; size?: 'sm' | 'md' }) {
  const cls = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star
          key={n}
          className={`${cls} shrink-0 ${n <= rating ? 'fill-amber-400 text-amber-400' : 'text-border'}`}
        />
      ))}
    </div>
  );
}

export function StoreReviewSheet({ storeId, storeName, avgRating, reviewCount, onClose }: StoreReviewSheetProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`${BASE}/api/stores/${storeId}/reviews`)
      .then(r => r.json())
      .then(data => {
        if (!cancelled) {
          setReviews(data.reviews ?? []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [storeId]);

  return (
    <div
      className="fixed inset-0 z-[300] flex items-end justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="w-full max-w-lg bg-card rounded-t-3xl shadow-2xl overflow-hidden"
        style={{ maxHeight: '85dvh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ドラッグハンドル */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-border rounded-full" />
        </div>

        {/* ヘッダー */}
        <div className="flex items-start justify-between px-5 pt-2 pb-4 border-b border-border/60">
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-0.5 truncate max-w-[220px]">{storeName}</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-foreground">{Number(avgRating).toFixed(1)}</span>
              <div className="flex flex-col gap-0.5">
                <StarRow rating={Math.round(avgRating)} />
                <span className="text-xs text-muted-foreground">{reviewCount}件の口コミ</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors mt-1 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 口コミ一覧 */}
        <div className="overflow-y-auto overflow-x-hidden" style={{ maxHeight: 'calc(85dvh - 110px)' }}>
          {loading ? (
            <div className="space-y-4 p-5">
              {[1, 2, 3].map(i => (
                <div key={i} className="space-y-2 animate-pulse">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-muted" />
                    <div className="h-3 w-24 bg-muted rounded-full" />
                  </div>
                  <div className="h-3 w-full bg-muted rounded-full" />
                  <div className="h-3 w-3/4 bg-muted rounded-full" />
                </div>
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <MessageSquare className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-bold text-muted-foreground">まだ口コミがありません</p>
            </div>
          ) : (
            <div className="divide-y divide-border/40 px-5">
              {reviews.map(review => (
                <div key={review.id} className="py-4">
                  {/* ユーザー行 */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-sm font-black text-primary">
                          {review.userId.slice(0, 1).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <StarRow rating={review.rating} size="sm" />
                      </div>
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      {format(parseISO(review.createdAt), 'yyyy年M月d日', { locale: ja })}
                    </span>
                  </div>

                  {/* コメント */}
                  {review.comment && (
                    <p className="text-sm text-foreground leading-relaxed">{review.comment}</p>
                  )}

                  {/* 店舗オーナー返信 */}
                  {review.reply && (
                    <div className="mt-3 ml-3 pl-3 border-l-2 border-primary/30 bg-primary/5 rounded-r-xl py-2 pr-3">
                      <p className="text-[11px] font-bold text-primary mb-1">オーナーより</p>
                      <p className="text-xs text-foreground/80 leading-relaxed">{review.reply}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 下部パディング（iOSホームバー対策） */}
          <div className="h-6" />
        </div>
      </motion.div>
    </div>
  );
}
