import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { useUserId } from '@/hooks/use-user';
import { useListReservations } from '@workspace/api-client-react';
import { format, parseISO } from 'date-fns';
import { Ticket, MapPin, Clock, ExternalLink, Star, PenLine, X, ChevronDown, QrCode } from 'lucide-react';
import { Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

interface ReviewModalProps {
  reservation: {
    id: number;
    storeId: number;
    store?: { name?: string } | null;
  };
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}

function StarSelector({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  const labels = ['', '悪い', '微妙', '普通', '良い', '最高！'];
  const display = hovered || value;
  return (
    <div>
      <div className="flex items-center gap-1 mb-2">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(n)}
            className="p-0.5 transition-transform hover:scale-110 active:scale-95"
          >
            <Star
              className={`w-9 h-9 transition-colors ${n <= display ? 'fill-amber-400 text-amber-400' : 'text-border'}`}
            />
          </button>
        ))}
      </div>
      {display > 0 && (
        <p className="text-sm font-bold text-amber-600">{labels[display]}</p>
      )}
    </div>
  );
}

function ReviewModal({ reservation, userId, onClose, onSuccess }: ReviewModalProps) {
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`${BASE}/api/stores/${reservation.storeId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          reservationId: reservation.id,
          rating,
          comment: comment.trim() || undefined,
        }),
      });
      if (res.status === 409) {
        toast({ title: '投稿済みです', description: 'この注文の口コミは既に投稿されています', variant: 'destructive' });
        onClose();
        return;
      }
      if (!res.ok) throw new Error('failed');
      toast({ title: '口コミを投稿しました！', description: 'ありがとうございます 🌟' });
      onSuccess();
      onClose();
    } catch {
      toast({ title: '送信に失敗しました', description: 'もう一度お試しください', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', damping: 26, stiffness: 300 }}
        className="bg-card w-full md:max-w-md md:rounded-2xl rounded-t-3xl shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 md:hidden">
          <div className="w-10 h-1 bg-border rounded-full" />
        </div>

        <div className="px-6 py-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <h3 className="text-lg font-black">口コミを書く</h3>
              <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[220px]">
                {reservation.store?.name}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Star rating */}
          <div className="mb-5">
            <label className="block text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wide">
              総合評価 <span className="text-destructive">*</span>
            </label>
            <StarSelector value={rating} onChange={setRating} />
          </div>

          {/* Comment */}
          <div className="mb-5">
            <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wide">
              コメント（任意）
            </label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="商品の感想、スタッフの対応、また利用したいかなど..."
              maxLength={400}
              rows={4}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
            />
            <div className="text-right text-xs text-muted-foreground/60 mt-1">{comment.length}/400</div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={rating === 0 || isSubmitting}
            className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-xl hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Star className="w-4 h-4 fill-white" />
                口コミを投稿する
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function MyReservations() {
  const userId = useUserId();
  const { toast } = useToast();
  const { data: reservations, isLoading, refetch } = useListReservations({ userId: userId || '' }, {
    query: { enabled: !!userId }
  });

  const [reviewTarget, setReviewTarget] = useState<null | {
    id: number; storeId: number; store?: { name?: string } | null;
  }>(null);

  // Track which reservations have been reviewed (within this session)
  const [reviewedIds, setReviewedIds] = useState<Set<number>>(new Set());

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <span className="bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-md text-xs font-bold">予約確定</span>;
      case 'picked_up':
        return <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded-md text-xs font-bold">受取完了</span>;
      case 'cancelled':
        return <span className="bg-destructive/10 text-destructive px-2 py-0.5 rounded-md text-xs font-bold">キャンセル</span>;
      default:
        return <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-md text-xs font-bold">未払い</span>;
    }
  };

  return (
    <Layout>
      <AnimatePresence>
        {reviewTarget && userId && (
          <ReviewModal
            reservation={reviewTarget}
            userId={userId}
            onClose={() => setReviewTarget(null)}
            onSuccess={() => setReviewedIds(prev => new Set([...prev, reviewTarget.id]))}
          />
        )}
      </AnimatePresence>

      <div className="max-w-3xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-display font-bold text-foreground mb-6">マイ予約</h1>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-40 bg-card border border-border rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : !reservations || reservations.length === 0 ? (
          <div className="text-center py-20 bg-card border border-border border-dashed rounded-3xl">
            <Ticket className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h2 className="text-lg font-bold text-foreground mb-2">まだ予約がありません</h2>
            <p className="text-muted-foreground mb-6 text-sm">気になるサプライズバッグを見つけて、<br />フードロス削減に貢献しましょう！</p>
            <Link href="/">
              <span className="bg-primary text-primary-foreground font-bold px-6 py-3 rounded-full shadow-md shadow-primary/20 hover:shadow-lg transition-all inline-block cursor-pointer">
                バッグを探す
              </span>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {reservations.map((res, i) => {
              const alreadyReviewed = reviewedIds.has(res.id);
              return (
                <motion.div
                  key={res.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className={`bg-card rounded-2xl border overflow-hidden shadow-sm ${res.status === 'picked_up' || res.status === 'cancelled' ? 'border-border/50' : 'border-border hover:shadow-md transition-shadow'}`}
                >
                  <div className="flex flex-col sm:flex-row">
                    {/* Main Info */}
                    <div className="p-5 flex-1 border-b sm:border-b-0 sm:border-r border-border">
                      <div className="flex justify-between items-start mb-3">
                        <div className="text-sm text-muted-foreground">{format(parseISO(res.createdAt), 'yyyy/MM/dd')}</div>
                        {getStatusBadge(res.status)}
                      </div>

                      <h3 className="font-bold text-lg mb-1">{res.store?.name}</h3>
                      <p className="text-foreground mb-4 font-medium">
                        {res.bag?.title} <span className="text-muted-foreground font-normal">× {res.quantity}</span>
                      </p>

                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-primary" />
                          <span>受取期間: <strong className="text-foreground">{res.bag?.pickupStart} - {res.bag?.pickupEnd}</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-primary" />
                          <span className="truncate">{res.store?.address}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action / Code section */}
                    <div className="bg-secondary/30 p-5 sm:w-64 flex flex-col justify-center items-center text-center gap-3">
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">お支払い金額</div>
                        <div className="text-2xl font-display font-bold text-foreground">¥{res.totalPrice.toLocaleString()}</div>
                      </div>

                      {res.status === 'confirmed' && res.pickupCode ? (
                        <div className="w-full space-y-2">
                          <div className="text-xs text-muted-foreground">店頭でチケットを提示</div>
                          <div className="bg-background border-2 border-primary/20 text-primary font-mono font-bold text-base py-2 rounded-xl tracking-widest text-center">
                            {res.pickupCode}
                          </div>
                          <Link href={`/orders/${res.id}`}>
                            <span className="w-full bg-primary text-primary-foreground font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors cursor-pointer text-sm">
                              <QrCode className="w-4 h-4" />
                              チケットを開く
                            </span>
                          </Link>
                        </div>
                      ) : res.status === 'pending' ? (
                        <Link href={`/checkout/${res.id}`}>
                          <span className="w-full bg-foreground text-background font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-foreground/90 transition-colors cursor-pointer">
                            決済へ進む <ExternalLink className="w-4 h-4" />
                          </span>
                        </Link>
                      ) : res.status === 'picked_up' ? (
                        <div className="w-full space-y-2">
                          <p className="text-xs text-muted-foreground">受け取りありがとうございました！</p>
                          {alreadyReviewed ? (
                            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-xl py-2 px-3">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              口コミ投稿済み
                            </div>
                          ) : (
                            <button
                              onClick={() => setReviewTarget({ id: res.id, storeId: res.storeId ?? res.store?.id ?? 0, store: res.store })}
                              className="w-full flex items-center justify-center gap-2 bg-amber-500 text-white font-bold py-2.5 px-4 rounded-xl hover:bg-amber-600 active:scale-[0.98] transition-all shadow-sm shadow-amber-200 text-sm"
                            >
                              <PenLine className="w-4 h-4" />
                              口コミを書く
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm font-medium text-muted-foreground">
                          この予約はキャンセルされました
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
