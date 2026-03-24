import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { StoreLayout } from '@/components/StoreLayout';
import { useMyStore } from '@/hooks/use-my-store';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, Star, MessageSquare, Send, Package2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, '') || '';

type OwnerReview = {
  id: number;
  rating: number;
  comment: string | null;
  createdAt: string;
  reply: string | null;
  repliedAt: string | null;
  bagTitle: string | null;
  reservationId: number;
};

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`w-4 h-4 ${i <= rating ? 'fill-amber-400 text-amber-400' : 'fill-muted text-muted'}`}
        />
      ))}
    </div>
  );
}

export default function StoreReviews() {
  const [, navigate] = useLocation();
  const { store, loading } = useMyStore();
  const { toast } = useToast();

  const [reviews, setReviews] = useState<OwnerReview[]>([]);
  const [fetching, setFetching] = useState(false);
  const [replyingId, setReplyingId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!store) return;
    setFetching(true);
    fetch(`${BASE}/api/stores/${store.id}/owner-reviews`)
      .then(r => r.ok ? r.json() : { reviews: [] })
      .then(data => setReviews(data.reviews ?? []))
      .finally(() => setFetching(false));
  }, [store]);

  const openReply = (review: OwnerReview) => {
    setReplyingId(review.id);
    setReplyText(review.reply ?? '');
  };

  const submitReply = async (reviewId: number) => {
    if (!store) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${BASE}/api/stores/${store.id}/reviews/${reviewId}/reply`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply: replyText }),
      });
      if (!res.ok) throw new Error('失敗');
      const updated = await res.json();
      setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, reply: updated.reply, repliedAt: updated.repliedAt } : r));
      setReplyingId(null);
      toast({ title: '返信しました', description: 'お客様へのお礼が送られました' });
    } catch {
      toast({ title: 'エラー', description: '返信の保存に失敗しました', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  if (loading) {
    return (
      <StoreLayout showHeader={false}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout showHeader={false}>
      <div className="max-w-xl mx-auto pb-10">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-4 sticky bg-background/90 backdrop-blur-sm z-10 border-b border-border/50"
          style={{ top: 'calc(4rem + env(safe-area-inset-top))' }}>
          <button
            onClick={() => navigate('/mypage')}
            className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-black text-foreground">お客様からのレビュー</h1>
            <p className="text-xs text-muted-foreground">{reviews.length}件のレビュー{avgRating ? `  ／  平均 ★${avgRating}` : ''}</p>
          </div>
        </div>

        <div className="px-4 py-6 space-y-4">
          {/* 集計サマリー */}
          {reviews.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 flex items-center gap-5">
              <div className="text-center">
                <div className="text-4xl font-black text-amber-500">{avgRating}</div>
                <StarRow rating={Math.round(parseFloat(avgRating!))} />
              </div>
              <div className="flex-1">
                {[5, 4, 3, 2, 1].map(s => {
                  const cnt = reviews.filter(r => r.rating === s).length;
                  const pct = reviews.length > 0 ? (cnt / reviews.length) * 100 : 0;
                  return (
                    <div key={s} className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-muted-foreground w-3">{s}</span>
                      <div className="flex-1 h-2 bg-amber-100 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground w-4">{cnt}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {fetching && (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!fetching && reviews.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="font-bold text-foreground">まだレビューがありません</p>
              <p className="text-sm text-muted-foreground mt-1">商品が受取られるとレビューが届きます</p>
            </div>
          )}

          {reviews.map((review, idx) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm"
            >
              {/* レビュー本文 */}
              <div className="p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <StarRow rating={review.rating} />
                    {review.bagTitle && (
                      <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
                        <Package2 className="w-3.5 h-3.5" />
                        {review.bagTitle}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {new Date(review.createdAt).toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' })}
                  </span>
                </div>
                {review.comment && (
                  <p className="text-sm text-foreground leading-relaxed">{review.comment}</p>
                )}
                {!review.comment && (
                  <p className="text-sm text-muted-foreground italic">コメントなし</p>
                )}
              </div>

              {/* 返信表示 */}
              {review.reply && (
                <div className="mx-5 mb-4 bg-primary/5 border border-primary/20 rounded-xl p-4">
                  <div className="flex items-center gap-1.5 text-xs font-black text-primary mb-1.5">
                    <MessageSquare className="w-3.5 h-3.5" />
                    オーナーからの返信
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">{review.reply}</p>
                </div>
              )}

              {/* 返信ボタン */}
              <div className="px-5 pb-4">
                <button
                  onClick={() => openReply(review)}
                  className="text-xs font-bold text-primary flex items-center gap-1.5 hover:underline"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  {review.reply ? '返信を編集する' : 'お礼を書く'}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 返信モーダル */}
      <AnimatePresence>
        {replyingId !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end"
            onClick={() => setReplyingId(null)}
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="w-full bg-background rounded-t-3xl p-6 max-w-xl mx-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-base">お客様へのお礼を書く</h3>
                <button onClick={() => setReplyingId(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-secondary hover:bg-secondary/80">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <textarea
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                rows={4}
                placeholder="ご来店・ご購入ありがとうございました！…"
                className="w-full px-4 py-3 bg-secondary/50 rounded-xl text-sm font-medium border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none mb-4"
              />
              <button
                onClick={() => submitReply(replyingId)}
                disabled={submitting}
                className="w-full h-12 bg-primary text-primary-foreground rounded-xl font-black flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                <Send className="w-4 h-4" />
                {submitting ? '送信中...' : '返信する'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </StoreLayout>
  );
}
