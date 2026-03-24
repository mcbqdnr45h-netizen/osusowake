import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { StoreLayout } from '@/components/StoreLayout';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { useUserId } from '@/hooks/use-user';
import { useListReservations } from '@workspace/api-client-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Receipt, ShoppingBag, CheckCircle2, XCircle,
  Clock, Store, Download, Share2, ChevronRight, X,
  QrCode, Leaf,
} from 'lucide-react';

type ReservationStatus = 'pending' | 'confirmed' | 'picked_up' | 'cancelled' | 'no_show';

const STATUS_META: Record<ReservationStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  picked_up: {
    label: '受取完了',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
  confirmed: {
    label: '確認済み',
    color: 'text-blue-600',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
  pending: {
    label: '処理中',
    color: 'text-amber-600',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  cancelled: {
    label: 'キャンセル',
    color: 'text-rose-500',
    bg: 'bg-rose-50 dark:bg-rose-900/20',
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
  no_show: {
    label: '未受取',
    color: 'text-slate-500',
    bg: 'bg-slate-50 dark:bg-slate-900/20',
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
};

function formatDate(dateStr?: string | null) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('ja-JP', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatDateShort(dateStr?: string | null) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', year: 'numeric' });
}

function ReceiptModal({ reservation, onClose }: { reservation: any; onClose: () => void }) {
  const status = (reservation.status as ReservationStatus) || 'pending';
  const meta = STATUS_META[status] || STATUS_META.pending;
  const orderId = `ORD-${String(reservation.id).padStart(8, '0')}`;
  const co2Saved = status === 'picked_up' ? 2.5 : 0;

  async function handleShare() {
    const text = `食べロス レシート\n${reservation.store?.name}\n${reservation.bag?.title}\n¥${reservation.totalPrice.toLocaleString()} | ${meta.label}`;
    if (navigator.share) {
      try { await navigator.share({ title: '食べロス 電子領収書', text }); } catch {}
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-end"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 280, damping: 28 }}
          className="w-full max-w-md mx-auto bg-background rounded-t-3xl overflow-hidden shadow-2xl max-h-[92dvh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-border rounded-full" />
          </div>

          {/* Receipt header */}
          <div className="px-5 pt-2 pb-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-black text-foreground">電子領収書</h2>
                <p className="text-xs text-muted-foreground">{orderId}</p>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Status banner */}
            <div className={`${meta.bg} ${meta.color} rounded-2xl px-4 py-3 flex items-center gap-2 mb-5`}>
              {meta.icon}
              <span className="font-black text-sm">{meta.label}</span>
              <span className="ml-auto text-xs font-medium opacity-70">{formatDate(reservation.createdAt)}</span>
            </div>

            {/* Store info */}
            <div className="flex items-start gap-3 mb-5 pb-5 border-b border-border border-dashed">
              <div className="w-12 h-12 bg-muted rounded-xl overflow-hidden shrink-0">
                <img
                  src={reservation.store?.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&q=70'}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <p className="font-black text-foreground">{reservation.store?.name || '店舗不明'}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{reservation.bag?.title || 'サプライズバッグ'}</p>
                <p className="text-xs text-muted-foreground mt-0.5">数量: {reservation.quantity}個</p>
              </div>
            </div>

            {/* Price breakdown */}
            <div className="space-y-2.5 mb-5 pb-5 border-b border-border border-dashed">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">小計</span>
                <span className="font-medium text-foreground">¥{reservation.totalPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-black text-base border-t border-border pt-2.5 mt-2.5">
                <span>合計</span>
                <span className="text-primary">¥{reservation.totalPrice.toLocaleString()}</span>
              </div>
            </div>

            {/* Eco */}
            {status === 'picked_up' && (
              <div className="mb-5">
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 text-center">
                  <Leaf className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
                  <p className="text-lg font-black text-emerald-600">{co2Saved}kg</p>
                  <p className="text-[10px] text-emerald-500 font-bold">CO2削減</p>
                </div>
              </div>
            )}

            {/* QR code placeholder */}
            <div className="bg-secondary/50 rounded-2xl p-4 flex items-center gap-4 mb-5">
              <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-inner shrink-0">
                <QrCode className="w-8 h-8 text-slate-600" />
              </div>
              <div>
                <p className="font-bold text-sm text-foreground">電子チケット</p>
                <p className="text-xs text-muted-foreground mt-0.5">店舗でQRコードを提示してください</p>
                <p className="text-[10px] text-muted-foreground/70 font-mono mt-1">{orderId}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleShare}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-border text-foreground font-bold text-sm hover:bg-secondary transition-colors"
              >
                <Share2 className="w-4 h-4" />
                シェア
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-border text-foreground font-bold text-sm hover:bg-secondary transition-colors"
              >
                <Download className="w-4 h-4" />
                保存
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function Orders() {
  const userId = useUserId() || '';
  const { profile } = useAuth();
  const [, navigate] = useLocation();
  const { data: reservations, isLoading } = useListReservations(
    { userId },
    { query: { enabled: !!userId } }
  );
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [filter, setFilter] = useState<'all' | 'picked_up' | 'cancelled'>('all');

  const isStoreOwner = profile?.role === 'store_owner';

  const filtered = (reservations || []).filter(r => {
    if (filter === 'all') return true;
    if (filter === 'picked_up') return r.status === 'picked_up';
    if (filter === 'cancelled') return r.status === 'cancelled' || r.status === 'no_show';
    return true;
  });

  const selected = reservations?.find(r => r.id === selectedId);

  const totalSpent = (reservations || [])
    .filter(r => r.status === 'picked_up')
    .reduce((s, r) => s + r.totalPrice, 0);

  const PageWrapper = isStoreOwner ? StoreLayout : Layout;
  const wrapperProps = isStoreOwner ? { showHeader: false } : { showBottomNav: false };

  return (
    <PageWrapper {...wrapperProps as any}>
      <div className="max-w-md mx-auto pb-16">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-4 sticky bg-background/90 backdrop-blur-sm z-10 border-b border-border/50"
          style={{ top: 'calc(4rem + env(safe-area-inset-top))' }}>
          <button
            onClick={() => navigate('/mypage')}
            className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-black text-foreground leading-tight">購入履歴</h1>
            <p className="text-xs text-muted-foreground">Order History</p>
          </div>
        </div>

        <div className="px-4 pt-5">
          {/* Summary card */}
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-4 mb-5 flex gap-4">
            <div className="flex-1 text-center">
              <p className="text-2xl font-black text-primary">{reservations?.filter(r => r.status === 'picked_up').length ?? 0}</p>
              <p className="text-[11px] font-bold text-primary/70 mt-0.5">レスキュー完了</p>
            </div>
            <div className="w-px bg-primary/20" />
            <div className="flex-1 text-center">
              <p className="text-2xl font-black text-primary">¥{totalSpent.toLocaleString()}</p>
              <p className="text-[11px] font-bold text-primary/70 mt-0.5">総購入額</p>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 mb-4">
            {[
              { key: 'all', label: 'すべて' },
              { key: 'picked_up', label: '完了' },
              { key: 'cancelled', label: 'キャンセル' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key as typeof filter)}
                className={`px-3 py-1.5 rounded-full text-xs font-black transition-all
                  ${filter === key
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-secondary text-muted-foreground hover:text-foreground'
                  }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Orders list */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-secondary/50 rounded-2xl p-10 text-center">
              <ShoppingBag className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-bold text-muted-foreground text-sm">注文履歴がありません</p>
              <p className="text-xs text-muted-foreground mt-1">食品をレスキューすると、ここに表示されます</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(r => {
                const status = (r.status as ReservationStatus) || 'pending';
                const meta = STATUS_META[status] || STATUS_META.pending;
                return (
                  <motion.button
                    key={r.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => setSelectedId(r.id)}
                    className="w-full bg-card border border-border rounded-2xl p-4 text-left hover:bg-secondary/30 active:scale-[0.99] transition-all shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      {/* Store image */}
                      <div className="w-12 h-12 bg-muted rounded-xl overflow-hidden shrink-0">
                        <img
                          src={r.store?.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&q=70'}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Main info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-black text-sm text-foreground truncate">{r.store?.name || '店舗不明'}</p>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">{r.bag?.title || 'サプライズバッグ'}</p>
                          </div>
                          <div className={`flex items-center gap-1 ${meta.bg} ${meta.color} px-2 py-1 rounded-full text-[10px] font-black shrink-0`}>
                            {meta.icon}
                            {meta.label}
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Store className="w-3 h-3" />
                            <span>{formatDateShort(r.createdAt)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-foreground">¥{r.totalPrice.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Receipt modal */}
      <AnimatePresence>
        {selected && (
          <ReceiptModal reservation={selected} onClose={() => setSelectedId(null)} />
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}
