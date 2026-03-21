import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { useUserId } from '@/hooks/use-user';
import { useListReservations } from '@workspace/api-client-react';
import { format, parseISO } from 'date-fns';
import { Ticket, MapPin, Clock, ExternalLink, Star, PenLine, X, ChevronDown, QrCode, CheckCircle2, AlertCircle, CreditCard, Ban } from 'lucide-react';
import { Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { ReviewModal } from '@/components/ReviewModal';
import type { ReviewTarget } from '@/components/ReviewModal';

export default function MyReservations() {
  const userId = useUserId();
  const { toast } = useToast();
  const { data: reservations, isLoading, refetch } = useListReservations({ userId: userId || '' }, {
    query: { enabled: !!userId }
  });

  const [reviewTarget, setReviewTarget] = useState<ReviewTarget | null>(null);

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
