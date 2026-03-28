import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { StoreLayout } from '@/components/StoreLayout';
import { useUserId } from '@/hooks/use-user';
import { useAuth } from '@/contexts/AuthContext';
import { useListReservations, useCancelReservation } from '@workspace/api-client-react';
import { format, parseISO } from 'date-fns';
import { Ticket, MapPin, Clock, ExternalLink, Star, PenLine, X, CheckCircle2, CreditCard, Ban, Trash2 } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { ReviewModal } from '@/components/ReviewModal';
import type { ReviewTarget } from '@/components/ReviewModal';

/**
 * 受け取り期限切れ判定
 * ① 予約の作成日が今日以外 → 必ず期限切れ（日またぎ含め）
 * ② 今日作成の場合 → pickupEnd (HH:MM) を現在時刻と比較
 */
const HOLD_MS = 5 * 60 * 1000;
function isHoldExpired(createdAt: string): boolean {
  return Date.now() > new Date(createdAt).getTime() + HOLD_MS;
}

function isPickupExpired(pickupEnd?: string | null, createdAt?: string): boolean {
  const now = new Date();

  // 作成日チェック（JST: UTC+9 を考慮して比較）
  if (createdAt) {
    const created = new Date(createdAt);
    const sameDay =
      created.getFullYear() === now.getFullYear() &&
      created.getMonth()    === now.getMonth()    &&
      created.getDate()     === now.getDate();
    if (!sameDay) return true; // 別の日の予約は常に期限切れ
  }

  // 同日：pickupEnd がなければ未判定（期限切れとしない）
  if (!pickupEnd) return false;
  const [hStr, mStr] = pickupEnd.split(':');
  const h = parseInt(hStr ?? '0', 10);
  const m = parseInt(mStr ?? '0', 10);
  if (isNaN(h) || isNaN(m)) return false;
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0);
  return now > end;
}

export default function MyReservations() {
  const userId = useUserId();
  const { profile } = useAuth();
  const { toast } = useToast();
  const { data: reservations, isLoading, refetch } = useListReservations(
    { userId: userId || '' },
    { query: { enabled: !!userId, refetchOnMount: 'always', staleTime: 0 } },
  );

  const cancelMutation = useCancelReservation();
  const [, navigate] = useLocation();

  const [reviewTarget,  setReviewTarget]  = useState<ReviewTarget | null>(null);
  const [reviewedIds,   setReviewedIds]   = useState<Set<number>>(new Set());
  // ローカルで非表示にしたカード ID（削除後に即消去するため）
  const [dismissedIds,  setDismissedIds]  = useState<Set<number>>(new Set());
  // 削除確認ダイアログを開いているカード ID
  const [confirmingId,  setConfirmingId]  = useState<number | null>(null);
  const [cancelling,    setCancelling]    = useState(false);

  const isStoreOwner = profile?.role === 'store_owner';
  const PageWrapper = isStoreOwner ? StoreLayout : Layout;
  const wrapperProps = isStoreOwner ? { showHeader: false } : {};

  const statusConfig = (status: string, expired = false) => {
    if (status === 'pending' && expired) {
      return {
        label: '受取期限切れ', icon: <Clock className="w-3.5 h-3.5" />,
        badge: 'bg-slate-100 text-slate-500 border border-slate-200',
        border: 'border-l-slate-300', bg: 'bg-slate-50/50', dot: null,
      };
    }
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

  async function handleDismiss(resId: number) {
    setCancelling(true);
    try {
      await cancelMutation.mutateAsync({ reservationId: resId });
      setDismissedIds(prev => new Set([...prev, resId]));
      setConfirmingId(null);
      toast({ title: '予約を削除しました' });
    } catch {
      toast({ title: '削除に失敗しました', description: 'しばらくしてからもう一度お試しください', variant: 'destructive' });
    } finally {
      setCancelling(false);
    }
  }

  return (
    <PageWrapper {...wrapperProps as any}>
      {/* レビューモーダル */}
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

      {/* 削除確認ダイアログ */}
      <AnimatePresence>
        {confirmingId !== null && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => !cancelling && setConfirmingId(null)}
          >
            <motion.div
              className="bg-card rounded-3xl shadow-2xl w-full max-w-sm p-6 pb-8"
              initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex flex-col items-center text-center gap-3 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
                  <Trash2 className="w-7 h-7 text-red-500" />
                </div>
                <h2 className="text-lg font-black text-foreground">この履歴を削除しますか？</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  受取期限が切れた予約をリストから削除します。<br />この操作は取り消せません。
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmingId(null)}
                  disabled={cancelling}
                  className="flex-1 py-3 rounded-2xl border border-border font-bold text-sm text-muted-foreground hover:bg-secondary transition-colors disabled:opacity-50"
                >
                  キャンセル
                </button>
                <button
                  onClick={() => handleDismiss(confirmingId)}
                  disabled={cancelling}
                  className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {cancelling
                    ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />削除中…</>
                    : <><Trash2 className="w-4 h-4" />削除する</>
                  }
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-3xl mx-auto pt-6 pb-24">
        <h1 className="text-2xl font-display font-bold text-foreground mb-5 px-4">マイバック</h1>

        {isLoading ? (
          <div className="divide-y divide-border/40 border-t border-border/40">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-28 bg-card animate-pulse" />
            ))}
          </div>
        ) : !reservations || reservations.length === 0 ? (
          <div className="mx-4 text-center py-20 bg-card border border-border border-dashed rounded-3xl">
            <Ticket className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h2 className="text-lg font-bold text-foreground mb-2">まだ予約がありません</h2>
            <p className="text-muted-foreground mb-6 text-sm">気になるおすそわけバッグを見つけて、<br />フードロス削減に貢献しましょう！</p>
            <Link href="/">
              <span className="bg-primary text-primary-foreground font-bold px-6 py-3 rounded-full shadow-md shadow-primary/20 hover:shadow-lg transition-all inline-block cursor-pointer">
                バッグを探す
              </span>
            </Link>
          </div>
        ) : (() => {
          const sorted = [...reservations]
            .filter(r => {
              if (dismissedIds.has(r.id)) return false;
              if (r.status === 'cancelled') return false;
              // 仮押さえ期限切れ（5分）の pending は非表示
              if (r.status === 'pending' && isHoldExpired(r.createdAt)) return false;
              return true;
            })
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

          if (sorted.length === 0) {
            return (
              <div className="mx-4 text-center py-20 bg-card border border-border border-dashed rounded-3xl">
                <Ticket className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h2 className="text-lg font-bold text-foreground mb-2">まだ予約がありません</h2>
                <p className="text-muted-foreground mb-6 text-sm">気になるおすそわけバッグを見つけて、<br />フードロス削減に貢献しましょう！</p>
                <Link href="/"><span className="bg-primary text-primary-foreground font-bold px-6 py-3 rounded-full shadow-md shadow-primary/20 hover:shadow-lg transition-all inline-block cursor-pointer">バッグを探す</span></Link>
              </div>
            );
          }

          const active  = sorted.filter(r => r.status === 'confirmed' || r.status === 'pending');
          const history = sorted.filter(r => r.status === 'picked_up');

          const renderCard = (res: typeof sorted[0], i: number) => {
            const expired    = isPickupExpired(res.bag?.pickupEnd, res.createdAt);
            const cfg        = statusConfig(res.status, expired);
            const alreadyReviewed = (res as any).hasReview || reviewedIds.has(res.id);
            const isFaded    = res.status === 'picked_up' || res.status === 'cancelled' || (res.status === 'pending' && expired);
            const showDismiss = res.status === 'pending' && expired;

            return (
              <motion.div
                key={res.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 60, transition: { duration: 0.2 } }}
                transition={{ delay: i * 0.05 }}
                className={`relative border-l-4 ${cfg.border} ${cfg.bg} overflow-hidden ${isFaded ? 'opacity-65' : ''}`}
              >
                {/* 削除ボタン */}
                {showDismiss && (
                  <button
                    type="button"
                    onClick={() => setConfirmingId(res.id)}
                    className="absolute top-2.5 right-2.5 z-10 w-6 h-6 rounded-full bg-slate-200 hover:bg-red-100 hover:text-red-500 flex items-center justify-center text-slate-400 transition-colors tap-scale-sm"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}

                <div className="px-3.5 py-3 space-y-2">
                  {/* ── 1行目：ステータス ＋ 購入日時 ── */}
                  <div className="flex items-center justify-between pr-6">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${cfg.badge}`}>
                      {cfg.dot && <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />}
                      {cfg.icon}
                      {cfg.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground tabular-nums">
                      {format(parseISO(res.createdAt), 'M月d日 HH:mm')}
                    </span>
                  </div>

                  {/* ── 2行目：画像 ＋ 店名・商品・価格 ── */}
                  <div className="flex items-center gap-3">
                    <Link href={`/stores/${res.storeId ?? res.store?.id}`} className="shrink-0">
                      {res.store?.imageUrl ? (
                        <img
                          src={res.store.imageUrl}
                          alt={res.store.name}
                          className={`w-12 h-12 rounded-xl object-cover active:scale-95 transition-transform ${isFaded ? 'grayscale' : ''}`}
                        />
                      ) : (
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl active:scale-95 transition-transform ${isFaded ? 'bg-slate-100 grayscale' : 'bg-primary/10'}`}>
                          🛍️
                        </div>
                      )}
                    </Link>

                    <div className="flex-1 min-w-0">
                      {/* 店名（最も目立つ） */}
                      <Link href={`/stores/${res.storeId ?? res.store?.id}`}>
                        <p className={`font-bold text-sm leading-tight truncate active:opacity-70 ${isFaded ? 'text-muted-foreground' : 'text-foreground'}`}>
                          {res.store?.name}
                        </p>
                      </Link>
                      {/* 商品名 × 個数（控えめ） */}
                      <p className="text-[11px] text-muted-foreground leading-tight mt-0.5 truncate">
                        {res.bag?.title}
                        <span className="font-semibold ml-1">× {res.quantity}</span>
                      </p>
                      {/* 受取時間＋場所（最小） */}
                      <div className="flex items-center gap-2 mt-1">
                        {(res.bag?.pickupStart || res.bag?.pickupEnd) && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground/70">
                            <Clock className="w-2.5 h-2.5 shrink-0" />
                            {res.bag?.pickupStart}–{res.bag?.pickupEnd}
                          </span>
                        )}
                        {(res.store?.city || res.store?.address) && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground/70 truncate">
                            <MapPin className="w-2.5 h-2.5 shrink-0" />
                            <span className="truncate">{res.store?.city || res.store?.address}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 価格（右端・最も目立つ色） */}
                    <div className="shrink-0 text-right">
                      <p className={`text-base font-black leading-none ${isFaded ? 'text-muted-foreground' : 'text-primary'}`}>
                        ¥{res.totalPrice.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* ── 3行目：アクションボタン ── */}
                  {res.status === 'confirmed' && (
                    <Link href={`/orders/${res.id}`}>
                      <span className="w-full bg-primary text-primary-foreground font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-[0.98] transition-all cursor-pointer text-sm shadow-sm shadow-primary/20">
                        <Ticket className="w-4 h-4" />
                        電子チケットを開く
                      </span>
                    </Link>
                  )}

                  {res.status === 'pending' && (
                    expired ? (
                      <div className="space-y-1">
                        <div className="w-full flex items-center justify-center gap-2 bg-slate-100 text-slate-400 font-bold py-2.5 rounded-xl text-sm cursor-not-allowed select-none border border-slate-200">
                          <Clock className="w-4 h-4" />
                          受取時間が終了しました
                        </div>
                        <p className="text-[10px] text-muted-foreground text-center">
                          {res.bag?.pickupEnd ? `〜${res.bag.pickupEnd} を過ぎているため決済できません` : '受取期限を過ぎているため決済できません'}
                        </p>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => navigate(`/checkout/${res.id}`, { state: { from: '/my-reservations' } })}
                        className="w-full bg-amber-500 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-amber-600 active:scale-[0.98] transition-all text-sm shadow-sm shadow-amber-300/40"
                      >
                        <CreditCard className="w-4 h-4" />
                        決済を完了する
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    )
                  )}

                  {res.status === 'picked_up' && (
                    alreadyReviewed ? (
                      <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-xl py-2 px-3">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        口コミ投稿済み
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setReviewTarget({ id: res.id, storeId: res.storeId ?? res.store?.id ?? 0, store: res.store })}
                        className="w-full flex items-center justify-center gap-2 bg-white text-amber-700 border border-amber-300 font-bold py-2.5 px-4 rounded-xl hover:bg-amber-50 active:scale-[0.98] transition-all text-sm"
                      >
                        <PenLine className="w-4 h-4" />
                        口コミを書く
                      </button>
                    )
                  )}
                </div>
              </motion.div>
            );
          };

          return (
            <div className="space-y-6">
              {active.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 px-4 pb-2">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <h2 className="text-sm font-bold text-foreground">アクティブ</h2>
                    <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{active.length}件</span>
                  </div>
                  <AnimatePresence mode="popLayout">
                    <div className="border-t border-border/40 divide-y divide-border/30">{active.map((r, i) => renderCard(r, i))}</div>
                  </AnimatePresence>
                </section>
              )}
              {history.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 px-4 pb-2">
                    <span className="w-2 h-2 rounded-full bg-slate-300" />
                    <h2 className="text-sm font-bold text-muted-foreground">履歴</h2>
                    <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{history.length}件</span>
                  </div>
                  <AnimatePresence mode="popLayout">
                    <div className="border-t border-border/40 divide-y divide-border/30">{history.map((r, i) => renderCard(r, active.length + i))}</div>
                  </AnimatePresence>
                </section>
              )}
            </div>
          );
        })()}
      </div>
    </PageWrapper>
  );
}
