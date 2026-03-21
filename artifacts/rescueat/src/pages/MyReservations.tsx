import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { useUserId } from '@/hooks/use-user';
import { useListReservations } from '@workspace/api-client-react';
import { format, parseISO } from 'date-fns';
import { Ticket, MapPin, Clock, ExternalLink, Star, PenLine, X, ChevronDown, QrCode, CheckCircle2, AlertCircle, CreditCard, Ban } from 'lucide-react';
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

  const STATUS_ORDER: Record<string, number> = { confirmed: 0, pending: 1, picked_up: 2, cancelled: 3 };

  const statusConfig = (status: string) => {
    switch (status) {
      case 'confirmed': return {
        label: '予約確定', icon: <CheckCircle2 className="w-3.5 h-3.5" />,
        badge: 'bg-primary/15 text-primary border border-primary/30',
        border: 'border-l-primary', bg: 'bg-primary/[0.03]', dot: 'bg-primary animate-pulse',
      };
      case 'picked_up': return {
        label: '受取済み', icon: <CheckCircle2 className="w-3.5 h-3.5" />,
        badge: 'bg-slate-100 text-slate-500 border border-slate-200',
        border: 'border-l-slate-300', bg: 'bg-slate-50/60', dot: null,
      };
      case 'cancelled': return {
        label: 'キャンセル', icon: <Ban className="w-3.5 h-3.5" />,
        badge: 'bg-red-50 text-red-500 border border-red-200',
        border: 'border-l-red-300', bg: 'bg-red-50/40', dot: null,
      };
      default: return {
        label: '未払い', icon: <CreditCard className="w-3.5 h-3.5" />,
        badge: 'bg-amber-50 text-amber-700 border border-amber-300',
        border: 'border-l-amber-400', bg: 'bg-amber-50/50', dot: 'bg-amber-400 animate-pulse',
      };
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
        ) : (() => {
          const sorted = [...reservations].sort(
            (a, b) => (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9)
          );
          const active = sorted.filter(r => r.status === 'confirmed' || r.status === 'pending');
          const history = sorted.filter(r => r.status === 'picked_up' || r.status === 'cancelled');

          const renderCard = (res: typeof sorted[0], i: number) => {
            const cfg = statusConfig(res.status);
            const alreadyReviewed = reviewedIds.has(res.id);
            const isFaded = res.status === 'picked_up' || res.status === 'cancelled';
            return (
              <motion.div
                key={res.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className={`rounded-2xl border border-border border-l-4 ${cfg.border} ${cfg.bg} overflow-hidden shadow-sm ${isFaded ? 'opacity-70' : 'shadow-sm hover:shadow-md transition-shadow'}`}
              >
                <div className="p-4 space-y-3">
                  {/* ── ヘッダー行 ── */}
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${cfg.badge}`}>
                      {cfg.dot && <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />}
                      {cfg.icon}
                      {cfg.label}
                    </span>
                    <span className="text-xs text-muted-foreground">{format(parseISO(res.createdAt), 'yyyy/MM/dd')}</span>
                  </div>

                  {/* ── 店舗・商品情報 ── */}
                  <div className="flex items-start gap-3">
                    {res.store?.imageUrl ? (
                      <img src={res.store.imageUrl} alt={res.store.name} className={`w-14 h-14 rounded-xl object-cover flex-shrink-0 ${isFaded ? 'grayscale' : ''}`} />
                    ) : (
                      <div className={`w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center text-2xl ${isFaded ? 'bg-slate-100 grayscale' : 'bg-primary/10'}`}>
                        🛍️
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold text-base leading-tight mb-0.5 ${isFaded ? 'text-muted-foreground' : 'text-foreground'}`}>
                        {res.store?.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {res.bag?.title} <span className="font-medium">× {res.quantity}</span>
                      </p>
                      <p className={`text-lg font-display font-bold mt-1 ${isFaded ? 'text-muted-foreground' : 'text-foreground'}`}>
                        ¥{res.totalPrice.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* ── 詳細メタ ── */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground border-t border-border/50 pt-2">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {res.bag?.pickupStart} – {res.bag?.pickupEnd}
                    </span>
                    <span className="flex items-center gap-1 truncate">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="truncate">{res.store?.city || res.store?.address}</span>
                    </span>
                  </div>

                  {/* ── アクション ── */}
                  {res.status === 'confirmed' && (
                    <Link href={`/orders/${res.id}`}>
                      <span className="mt-1 w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-[0.98] transition-all cursor-pointer text-sm shadow-md shadow-primary/20">
                        <Ticket className="w-4 h-4" />
                        電子チケットを開く
                      </span>
                    </Link>
                  )}
                  {res.status === 'pending' && (
                    <Link href={`/checkout/${res.id}`}>
                      <span className="mt-1 w-full bg-amber-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-amber-600 active:scale-[0.98] transition-all cursor-pointer text-sm shadow-md shadow-amber-300/50">
                        <CreditCard className="w-4 h-4" />
                        決済を完了する
                        <ExternalLink className="w-3.5 h-3.5" />
                      </span>
                    </Link>
                  )}
                  {res.status === 'picked_up' && (
                    <div className="mt-1 space-y-2">
                      {alreadyReviewed ? (
                        <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-xl py-2.5 px-3">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          口コミ投稿済み
                        </div>
                      ) : (
                        <button
                          onClick={() => setReviewTarget({ id: res.id, storeId: res.storeId ?? res.store?.id ?? 0, store: res.store })}
                          className="w-full flex items-center justify-center gap-2 bg-white text-amber-700 border border-amber-300 font-bold py-2.5 px-4 rounded-xl hover:bg-amber-50 active:scale-[0.98] transition-all text-sm"
                        >
                          <PenLine className="w-4 h-4" />
                          口コミを書く
                        </button>
                      )}
                    </div>
                  )}
                  {res.status === 'cancelled' && (
                    <div className="mt-1 text-xs text-muted-foreground text-center py-1.5">この予約はキャンセルされました</div>
                  )}
                </div>
              </motion.div>
            );
          };

          return (
            <div className="space-y-8">
              {active.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <h2 className="text-sm font-bold text-foreground">アクティブ</h2>
                    <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{active.length}件</span>
                  </div>
                  <div className="space-y-3">{active.map((r, i) => renderCard(r, i))}</div>
                </section>
              )}
              {history.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-slate-300" />
                    <h2 className="text-sm font-bold text-muted-foreground">履歴</h2>
                    <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{history.length}件</span>
                  </div>
                  <div className="space-y-3">{history.map((r, i) => renderCard(r, active.length + i))}</div>
                </section>
              )}
            </div>
          );
        })()}
      </div>
    </Layout>
  );
}
