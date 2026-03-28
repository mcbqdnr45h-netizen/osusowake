import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { StoreLayout } from '@/components/StoreLayout';
import { useUserId } from '@/hooks/use-user';
import { useAuth } from '@/contexts/AuthContext';
import { useListReservations, useCancelReservation } from '@workspace/api-client-react';
import { format, parseISO, isToday, isYesterday } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Ticket, Clock, ExternalLink, Star, PenLine, X, CheckCircle2, CreditCard, Ban, Trash2, Package } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { ReviewModal } from '@/components/ReviewModal';
import type { ReviewTarget } from '@/components/ReviewModal';

const HOLD_MS = 5 * 60 * 1000;

function isHoldExpired(createdAt: string): boolean {
  return Date.now() > new Date(createdAt).getTime() + HOLD_MS;
}

function isPickupExpired(pickupEnd?: string | null, createdAt?: string): boolean {
  const now = new Date();
  if (createdAt) {
    const created = new Date(createdAt);
    const sameDay =
      created.getFullYear() === now.getFullYear() &&
      created.getMonth()    === now.getMonth()    &&
      created.getDate()     === now.getDate();
    if (!sameDay) return true;
  }
  if (!pickupEnd) return false;
  const [hStr, mStr] = pickupEnd.split(':');
  const h = parseInt(hStr ?? '0', 10);
  const m = parseInt(mStr ?? '0', 10);
  if (isNaN(h) || isNaN(m)) return false;
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0);
  return now > end;
}

function dateLabel(dateStr: string): string {
  const d = parseISO(dateStr);
  if (isToday(d))     return '今日';
  if (isYesterday(d)) return '昨日';
  return format(d, 'M月d日（E）', { locale: ja });
}

export default function MyReservations() {
  const userId    = useUserId();
  const { profile } = useAuth();
  const { toast } = useToast();
  const { data: reservations, isLoading } = useListReservations(
    { userId: userId || '' },
    { query: { enabled: !!userId, refetchOnMount: 'always', staleTime: 0 } },
  );

  const cancelMutation = useCancelReservation();
  const [, navigate]   = useLocation();

  const [reviewTarget,  setReviewTarget]  = useState<ReviewTarget | null>(null);
  const [reviewedIds,   setReviewedIds]   = useState<Set<number>>(new Set());
  const [dismissedIds,  setDismissedIds]  = useState<Set<number>>(new Set());
  const [confirmingId,  setConfirmingId]  = useState<number | null>(null);
  const [cancelling,    setCancelling]    = useState(false);

  const isStoreOwner  = profile?.role === 'store_owner';
  const PageWrapper   = isStoreOwner ? StoreLayout : Layout;
  const wrapperProps  = isStoreOwner ? { showHeader: false } : {};

  const statusConfig = (status: string, expired = false) => {
    if (status === 'pending' && expired) return {
      label: '期限切れ', icon: <Clock className="w-3 h-3" />,
      badge: 'bg-slate-100 text-slate-400 border border-slate-200',
      bar: 'bg-slate-300',
    };
    switch (status) {
      case 'confirmed': return {
        label: '予約確定', icon: <CheckCircle2 className="w-3 h-3" />,
        badge: 'bg-primary/10 text-primary border border-primary/25',
        bar: 'bg-primary',
      };
      case 'picked_up': return {
        label: '受取済み', icon: <CheckCircle2 className="w-3 h-3" />,
        badge: 'bg-slate-100 text-slate-400 border border-slate-200',
        bar: 'bg-slate-300',
      };
      case 'cancelled': return {
        label: 'キャンセル', icon: <Ban className="w-3 h-3" />,
        badge: 'bg-red-50 text-red-400 border border-red-200',
        bar: 'bg-red-300',
      };
      default: return {
        label: '未払い', icon: <CreditCard className="w-3 h-3" />,
        badge: 'bg-amber-50 text-amber-700 border border-amber-300',
        bar: 'bg-amber-400',
      };
    }
  };

  async function handleDismiss(resId: number) {
    setCancelling(true);
    try {
      await cancelMutation.mutateAsync({ reservationId: resId });
      setDismissedIds(prev => new Set([...prev, resId]));
      setConfirmingId(null);
      toast({ title: '履歴を削除しました' });
    } catch {
      toast({ title: '削除に失敗しました', variant: 'destructive' });
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

      {/* ── ページ本体 ── */}
      <div className="max-w-2xl mx-auto pt-5 pb-28">
        <h1 className="text-xl font-display font-bold text-foreground mb-4 px-4">マイバック</h1>

        {isLoading ? (
          <div className="divide-y divide-border/40">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="px-4 py-3.5 flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-muted animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
                  <div className="h-2.5 bg-muted rounded animate-pulse w-1/2" />
                </div>
                <div className="w-14 h-5 bg-muted rounded animate-pulse shrink-0" />
              </div>
            ))}
          </div>
        ) : (() => {
          const sorted = [...(reservations ?? [])]
            .filter(r => {
              if (dismissedIds.has(r.id)) return false;
              if (r.status === 'cancelled')   return false;
              if (r.status === 'pending' && isHoldExpired(r.createdAt)) return false;
              return true;
            })
            // ★ 購入日時の新しい順（降順）
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

          if (sorted.length === 0) {
            return (
              <div className="mx-4 text-center py-20 bg-card border border-border border-dashed rounded-3xl">
                <Package className="w-14 h-14 text-muted-foreground mx-auto mb-4 opacity-40" />
                <h2 className="text-base font-bold text-foreground mb-2">まだ購入履歴がありません</h2>
                <p className="text-muted-foreground mb-6 text-sm">
                  気になるおすそわけバッグを見つけて、<br />フードロス削減に貢献しましょう！
                </p>
                <Link href="/">
                  <span className="bg-primary text-primary-foreground font-bold px-6 py-2.5 rounded-full shadow-md shadow-primary/20 inline-block cursor-pointer text-sm">
                    バッグを探す
                  </span>
                </Link>
              </div>
            );
          }

          // 日付ごとにグルーピング
          const groups: { label: string; items: typeof sorted }[] = [];
          for (const res of sorted) {
            const label = dateLabel(res.createdAt);
            const last  = groups[groups.length - 1];
            if (last && last.label === label) {
              last.items.push(res);
            } else {
              groups.push({ label, items: [res] });
            }
          }

          return (
            <div>
              {groups.map(group => (
                <div key={group.label}>
                  {/* 日付ヘッダー */}
                  <div className="px-4 pt-3 pb-1.5 flex items-center gap-2">
                    <span className="text-[11px] font-bold text-muted-foreground tracking-wide">{group.label}</span>
                    <div className="flex-1 h-px bg-border/50" />
                  </div>

                  <AnimatePresence mode="popLayout">
                    <div className="divide-y divide-border/30">
                      {group.items.map((res, i) => {
                        const expired         = isPickupExpired(res.bag?.pickupEnd, res.createdAt);
                        const cfg             = statusConfig(res.status, expired);
                        const alreadyReviewed = (res as any).hasReview || reviewedIds.has(res.id);
                        const isFaded         = res.status === 'picked_up' || (res.status === 'pending' && expired);
                        const showDismiss     = res.status === 'pending' && expired;

                        return (
                          <motion.div
                            key={res.id}
                            layout
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: isFaded ? 0.6 : 1, y: 0 }}
                            exit={{ opacity: 0, x: 60, transition: { duration: 0.2 } }}
                            transition={{ delay: i * 0.04 }}
                            className="relative bg-card"
                          >
                            {/* 左アクセントバー */}
                            <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${cfg.bar}`} />

                            <div className="pl-4 pr-3 py-3">
                              {/* ── 1行目：ステータス + 日時 ── */}
                              <div className="flex items-center justify-between mb-2">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold leading-none ${cfg.badge}`}>
                                  {cfg.icon}
                                  {cfg.label}
                                </span>
                                <span className="text-[10px] text-muted-foreground tabular-nums">
                                  {format(parseISO(res.createdAt), 'HH:mm')}
                                </span>
                              </div>

                              {/* ── 2行目：画像 | テキスト | 価格+ボタン ── */}
                              <div className="flex items-start gap-2.5">

                                {/* 店舗画像 */}
                                <Link href={`/stores/${res.storeId ?? res.store?.id}`} className="shrink-0">
                                  {res.store?.imageUrl ? (
                                    <img
                                      src={res.store.imageUrl}
                                      alt={res.store.name}
                                      className={`w-11 h-11 rounded-xl object-cover active:scale-95 transition-transform ${isFaded ? 'grayscale' : ''}`}
                                    />
                                  ) : (
                                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg active:scale-95 transition-transform ${isFaded ? 'bg-slate-100' : 'bg-primary/10'}`}>
                                      🛍️
                                    </div>
                                  )}
                                </Link>

                                {/* 中央テキスト */}
                                <div className="flex-1 min-w-0">
                                  {/* 店名（最大の文字） */}
                                  <Link href={`/stores/${res.storeId ?? res.store?.id}`}>
                                    <p className={`font-bold text-[13px] leading-tight truncate active:opacity-70 ${isFaded ? 'text-muted-foreground' : 'text-foreground'}`}>
                                      {res.store?.name}
                                    </p>
                                  </Link>
                                  {/* 商品名 × 個数 */}
                                  <p className="text-[11px] text-muted-foreground leading-snug mt-0.5 truncate">
                                    {res.bag?.title}
                                    <span className="font-semibold ml-1 text-foreground/60">×{res.quantity}</span>
                                  </p>
                                  {/* 受取時間 */}
                                  {(res.bag?.pickupStart || res.bag?.pickupEnd) && (
                                    <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground/60 mt-0.5">
                                      <Clock className="w-2.5 h-2.5 shrink-0" />
                                      {res.bag?.pickupStart}–{res.bag?.pickupEnd}
                                    </span>
                                  )}
                                </div>

                                {/* 右カラム：価格 + アクションボタン（幅固定で絶対に切れない） */}
                                <div className="shrink-0 flex flex-col items-end gap-1.5 w-[76px]">
                                  {/* 価格（最大フォント） */}
                                  <p className={`text-[15px] font-black leading-none tabular-nums ${isFaded ? 'text-muted-foreground' : 'text-primary'}`}>
                                    ¥{res.totalPrice.toLocaleString()}
                                  </p>

                                  {/* confirmed → 電子チケット */}
                                  {res.status === 'confirmed' && (
                                    <Link href={`/orders/${res.id}`}>
                                      <span className="inline-flex items-center gap-1 bg-primary text-white text-[10px] font-bold px-2 py-1.5 rounded-lg whitespace-nowrap shadow-sm shadow-primary/20">
                                        <Ticket className="w-2.5 h-2.5" />
                                        チケット
                                      </span>
                                    </Link>
                                  )}

                                  {/* pending 未決済 → 決済ボタン */}
                                  {res.status === 'pending' && !expired && (
                                    <button
                                      type="button"
                                      onClick={() => navigate(`/checkout/${res.id}`, { state: { from: '/my-reservations' } })}
                                      className="inline-flex items-center gap-1 bg-amber-500 text-white text-[10px] font-bold px-2 py-1.5 rounded-lg whitespace-nowrap shadow-sm shadow-amber-300/30"
                                    >
                                      <CreditCard className="w-2.5 h-2.5" />
                                      決済する
                                    </button>
                                  )}

                                  {/* picked_up → 口コミ（コンパクト） */}
                                  {res.status === 'picked_up' && (
                                    alreadyReviewed ? (
                                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-500">
                                        <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                                        投稿済
                                      </span>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => setReviewTarget({ id: res.id, storeId: res.storeId ?? res.store?.id ?? 0, store: res.store })}
                                        className="inline-flex items-center gap-1 bg-amber-50 border border-amber-300 text-amber-700 text-[10px] font-bold px-2 py-1.5 rounded-lg whitespace-nowrap"
                                      >
                                        <PenLine className="w-2.5 h-2.5" />
                                        口コミ
                                      </button>
                                    )
                                  )}
                                </div>
                              </div>

                              {/* 削除ボタン（期限切れpendingのみ・右上） */}
                              {showDismiss && (
                                <button
                                  type="button"
                                  onClick={() => setConfirmingId(res.id)}
                                  className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-slate-100 hover:bg-red-100 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </AnimatePresence>
                </div>
              ))}
            </div>
          );
        })()}
      </div>
    </PageWrapper>
  );
}
