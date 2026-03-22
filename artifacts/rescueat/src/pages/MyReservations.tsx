import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { useUserId } from '@/hooks/use-user';
import { useListReservations, useCancelReservation } from '@workspace/api-client-react';
import { format, parseISO } from 'date-fns';
import { Ticket, MapPin, Clock, ExternalLink, Star, PenLine, X, CheckCircle2, CreditCard, Ban, Trash2 } from 'lucide-react';
import { Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { ReviewModal } from '@/components/ReviewModal';
import type { ReviewTarget } from '@/components/ReviewModal';

/**
 * 受け取り期限切れ判定
 * ① 予約の作成日が今日以外 → 必ず期限切れ（日またぎ含め）
 * ② 今日作成の場合 → pickupEnd (HH:MM) を現在時刻と比較
 */
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
  const { toast } = useToast();
  const { data: reservations, isLoading, refetch } = useListReservations(
    { userId: userId || '' },
    { query: { enabled: !!userId } },
  );

  const cancelMutation = useCancelReservation();

  const [reviewTarget,  setReviewTarget]  = useState<ReviewTarget | null>(null);
  const [reviewedIds,   setReviewedIds]   = useState<Set<number>>(new Set());
  // ローカルで非表示にしたカード ID（削除後に即消去するため）
  const [dismissedIds,  setDismissedIds]  = useState<Set<number>>(new Set());
  // 削除確認ダイアログを開いているカード ID
  const [confirmingId,  setConfirmingId]  = useState<number | null>(null);
  const [cancelling,    setCancelling]    = useState(false);

  const STATUS_ORDER: Record<string, number> = { confirmed: 0, pending: 1, picked_up: 2, cancelled: 3 };

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
      await cancelMutation.mutateAsync(resId);
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
    <Layout>
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
          const sorted = [...reservations]
            .filter(r => !dismissedIds.has(r.id))
            .sort((a, b) => (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9));

          const active  = sorted.filter(r => r.status === 'confirmed' || r.status === 'pending');
          const history = sorted.filter(r => r.status === 'picked_up' || r.status === 'cancelled');

          const renderCard = (res: typeof sorted[0], i: number) => {
            const expired    = isPickupExpired(res.bag?.pickupEnd, res.createdAt);
            const cfg        = statusConfig(res.status, expired);
            const alreadyReviewed = reviewedIds.has(res.id);
            const isFaded    = res.status === 'picked_up' || res.status === 'cancelled' || (res.status === 'pending' && expired);
            const showDismiss = res.status === 'pending' && expired;

            return (
              <motion.div
                key={res.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 60, transition: { duration: 0.2 } }}
                transition={{ delay: i * 0.06 }}
                className={`relative rounded-2xl border border-border border-l-4 ${cfg.border} ${cfg.bg} overflow-hidden shadow-sm ${isFaded ? 'opacity-70' : 'hover:shadow-md transition-shadow'}`}
              >
                {/* ── 期限切れ × 削除ボタン ── */}
                {showDismiss && (
                  <button
                    onClick={() => setConfirmingId(res.id)}
                    className="absolute top-3 right-3 z-10 w-6 h-6 rounded-full bg-slate-200 hover:bg-red-100 hover:text-red-500 flex items-center justify-center text-slate-400 transition-colors tap-scale-sm"
                    title="この履歴を削除"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}

                <div className="p-4 space-y-3">
                  {/* ── ヘッダー行 ── */}
                  <div className="flex items-center justify-between pr-7">
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
                      <img
                        src={res.store.imageUrl}
                        alt={res.store.name}
                        className={`w-14 h-14 rounded-xl object-cover flex-shrink-0 ${isFaded ? 'grayscale' : ''}`}
                      />
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

                  {/* 確定済みチケット */}
                  {res.status === 'confirmed' && (
                    <Link href={`/orders/${res.id}`}>
                      <span className="mt-1 w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-[0.98] transition-all cursor-pointer text-sm shadow-md shadow-primary/20">
                        <Ticket className="w-4 h-4" />
                        電子チケットを開く
                      </span>
                    </Link>
                  )}

                  {/* 未払い：期限内 → 決済ボタン、期限切れ → ロック表示 */}
                  {res.status === 'pending' && (
                    expired ? (
                      <div className="mt-1 space-y-1.5">
                        <div className="w-full flex items-center justify-center gap-2 bg-slate-100 text-slate-400 font-bold py-3 rounded-xl text-sm cursor-not-allowed select-none border border-slate-200">
                          <Clock className="w-4 h-4" />
                          受取時間が終了しました
                        </div>
                        <p className="text-[11px] text-muted-foreground text-center leading-snug">
                          {res.bag?.pickupEnd
                            ? `受取時間（〜${res.bag.pickupEnd}）を過ぎているため決済できません`
                            : '受取期限を過ぎているため決済できません'}
                        </p>
                      </div>
                    ) : (
                      <Link href={`/checkout/${res.id}`}>
                        <span className="mt-1 w-full bg-amber-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-amber-600 active:scale-[0.98] transition-all cursor-pointer text-sm shadow-md shadow-amber-300/50">
                          <CreditCard className="w-4 h-4" />
                          決済を完了する
                          <ExternalLink className="w-3.5 h-3.5" />
                        </span>
                      </Link>
                    )
                  )}

                  {/* 受取済み：口コミボタン */}
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

                  {/* キャンセル済み */}
                  {res.status === 'cancelled' && (
                    <div className="mt-1 text-xs text-muted-foreground text-center py-1.5">
                      この予約はキャンセルされました
                    </div>
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
                  <AnimatePresence mode="popLayout">
                    <div className="space-y-3">{active.map((r, i) => renderCard(r, i))}</div>
                  </AnimatePresence>
                </section>
              )}
              {history.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-slate-300" />
                    <h2 className="text-sm font-bold text-muted-foreground">履歴</h2>
                    <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{history.length}件</span>
                  </div>
                  <AnimatePresence mode="popLayout">
                    <div className="space-y-3">{history.map((r, i) => renderCard(r, active.length + i))}</div>
                  </AnimatePresence>
                </section>
              )}
            </div>
          );
        })()}
      </div>
    </Layout>
  );
}
