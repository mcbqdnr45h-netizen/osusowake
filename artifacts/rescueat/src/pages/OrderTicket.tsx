import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { Layout } from '@/components/Layout';
import { useGetReservation } from '@workspace/api-client-react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import {
  ChevronLeft, Store, Clock, MapPin, CheckCircle2,
  ChevronRight, AlertCircle, Leaf, Coins,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// ─── Helpers ────────────────────────────────────────────────────────────────

function pickupStorageKey(id: number) {
  return `rescueat_ticket_${id}`;
}

function wasPickedUp(id: number): boolean {
  try { return localStorage.getItem(pickupStorageKey(id)) === 'picked_up'; } catch { return false; }
}

function markPickedUp(id: number) {
  try { localStorage.setItem(pickupStorageKey(id), 'picked_up'); } catch {}
}

function formatDate(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ja-JP', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

const POINT_RATE = 0.03;

// ─── Swipe Slider ───────────────────────────────────────────────────────────

function SwipeSlider({ onConfirm, disabled }: { onConfirm: () => Promise<void>; disabled?: boolean }) {
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);

  const THUMB_SIZE = 56;
  const TRACK_PADDING = 4;

  const trackWidth = trackRef.current?.offsetWidth ?? 320;
  const maxX = trackWidth - THUMB_SIZE - TRACK_PADDING * 2;

  const bgOpacity = useTransform(x, [0, maxX * 0.6], [0, 1]);
  const labelOpacity = useTransform(x, [0, maxX * 0.3], [1, 0]);
  const arrowOpacity = useTransform(x, [0, maxX * 0.5], [0.4, 0]);

  const handleDragEnd = useCallback(async () => {
    if (disabled || confirming) return;
    const currentX = x.get();
    if (currentX >= maxX * 0.75) {
      setConfirming(true);
      await animate(x, maxX, { duration: 0.15 });
      try {
        await onConfirm();
        setDone(true);
      } catch {
        await animate(x, 0, { type: 'spring', stiffness: 300, damping: 30 });
      } finally {
        setConfirming(false);
      }
    } else {
      animate(x, 0, { type: 'spring', stiffness: 300, damping: 30 });
    }
  }, [disabled, confirming, x, maxX, onConfirm]);

  if (done) return null;

  return (
    <div
      ref={trackRef}
      className={`relative h-16 rounded-2xl overflow-hidden select-none ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      style={{ background: '#e2e8f0' }}
    >
      {/* Green fill behind the thumb */}
      <motion.div
        className="absolute inset-0 rounded-2xl"
        style={{
          background: 'linear-gradient(90deg, #2D5A51, #3d7a6e)',
          opacity: bgOpacity,
        }}
      />

      {/* Label */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ opacity: labelOpacity }}
      >
        <span className="text-sm font-black text-slate-500 tracking-wide flex items-center gap-2">
          右にスワイプして受取完了
          <motion.span style={{ opacity: arrowOpacity }}>
            <ChevronRight className="w-4 h-4" />
          </motion.span>
        </span>
      </motion.div>

      {/* Thumb */}
      <motion.div
        drag={disabled || confirming ? false : 'x'}
        dragConstraints={{ left: 0, right: maxX }}
        dragElastic={0}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className="absolute top-[4px] left-[4px] w-14 h-14 rounded-xl bg-[#2D5A51] shadow-lg shadow-primary/30 flex items-center justify-center cursor-grab active:cursor-grabbing z-10"
      >
        {confirming ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <ChevronRight className="w-6 h-6 text-white" />
        )}
      </motion.div>
    </div>
  );
}

// ─── Picked-Up Stamp ────────────────────────────────────────────────────────

function PickedUpStamp() {
  return (
    <motion.div
      initial={{ scale: 0.5, opacity: 0, rotate: -12 }}
      animate={{ scale: 1, opacity: 1, rotate: -6 }}
      transition={{ type: 'spring', stiffness: 280, damping: 18 }}
      className="flex items-center justify-center"
    >
      <div className="relative border-4 border-slate-400 rounded-2xl px-8 py-5 text-center"
        style={{ boxShadow: 'inset 0 0 0 2px #94a3b8' }}
      >
        <CheckCircle2 className="w-10 h-10 text-slate-400 mx-auto mb-1" />
        <p className="text-2xl font-black text-slate-400 tracking-widest uppercase">受取済み</p>
        <p className="text-xs font-bold text-slate-400/70 mt-0.5">PICKED UP ✅</p>
      </div>
    </motion.div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function OrderTicket() {
  const [, params] = useRoute('/orders/:id');
  const reservationId = params?.id ? parseInt(params.id) : 0;
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: reservation, isLoading, refetch } = useGetReservation(reservationId);

  // Check localStorage first — prevents showing code after refresh
  const [isPickedUp, setIsPickedUp] = useState(() => wasPickedUp(reservationId));

  // Sync with server state on load
  useEffect(() => {
    if (reservation?.status === 'picked_up') {
      markPickedUp(reservationId);
      setIsPickedUp(true);
    }
  }, [reservation?.status, reservationId]);

  const handleConfirmPickup = useCallback(async () => {
    const res = await fetch(`/api/reservations/${reservationId}/pickup`, { method: 'POST' });
    if (res.status === 409) {
      toast({ title: 'このチケットは既に使用済みです', variant: 'destructive' });
      markPickedUp(reservationId);
      setIsPickedUp(true);
      refetch();
      throw new Error('already_used');
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast({ title: 'エラーが発生しました', description: err.message, variant: 'destructive' });
      throw new Error('failed');
    }
    markPickedUp(reservationId);
    setIsPickedUp(true);
    await refetch();
    toast({ title: '受取完了 ✅', description: 'お食事をお楽しみください！' });
  }, [reservationId, refetch, toast]);

  if (isLoading || !reservation) {
    return (
      <Layout showBottomNav={false}>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  const alreadyPickedUp = isPickedUp || reservation.status === 'picked_up';
  const isCancelled = reservation.status === 'cancelled';
  const points = Math.floor(reservation.totalPrice * POINT_RATE);
  const qrValue = reservation.pickupCode
    ? `RESCUEAT:${reservation.pickupCode}:${reservationId}`
    : `RESCUEAT:${reservationId}`;

  return (
    <Layout showBottomNav={false}>
      <div className="max-w-md mx-auto pb-8">

        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-10 pb-4 sticky top-0 bg-background/90 backdrop-blur-sm z-10 border-b border-border/40">
          <button
            onClick={() => navigate('/my-reservations')}
            className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-black text-foreground leading-tight">電子チケット</h1>
            <p className="text-xs text-muted-foreground font-mono">{reservation.pickupCode ?? `#${reservationId}`}</p>
          </div>
          <div className="ml-auto">
            {alreadyPickedUp ? (
              <span className="bg-slate-100 text-slate-500 text-xs font-black px-3 py-1 rounded-full">受取済み</span>
            ) : isCancelled ? (
              <span className="bg-rose-50 text-rose-500 text-xs font-black px-3 py-1 rounded-full">キャンセル</span>
            ) : (
              <span className="bg-primary/10 text-primary text-xs font-black px-3 py-1 rounded-full animate-pulse">未受取</span>
            )}
          </div>
        </div>

        <div className="px-4 pt-5 space-y-4">

          {/* 案内バナー */}
          {!alreadyPickedUp && !isCancelled && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-primary text-primary-foreground rounded-2xl px-4 py-3.5 flex items-center gap-3 shadow-lg shadow-primary/20"
            >
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                <Store className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-black leading-snug">
                お店の人にこの画面を見せてください
              </p>
            </motion.div>
          )}

          {/* Store info */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className={`bg-card border border-border rounded-2xl p-4 shadow-sm ${alreadyPickedUp ? 'opacity-60 grayscale' : ''}`}
          >
            <div className="flex gap-3 items-start mb-3">
              <div className="w-14 h-14 bg-muted rounded-xl overflow-hidden shrink-0">
                <img
                  src={reservation.store?.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&q=70'}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-foreground text-base">{reservation.store?.name}</p>
                <p className="text-sm text-muted-foreground truncate mt-0.5">{reservation.bag?.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">数量: {reservation.quantity}個　¥{reservation.totalPrice.toLocaleString()}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-secondary/50 rounded-xl p-2.5 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="text-xs font-bold text-foreground">{reservation.bag?.pickupStart} - {reservation.bag?.pickupEnd}</span>
              </div>
              <div className="bg-secondary/50 rounded-xl p-2.5 flex items-center gap-2 overflow-hidden">
                <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="text-xs font-bold text-foreground truncate">{reservation.store?.address}</span>
              </div>
            </div>
          </motion.div>

          {/* ── チケット本体 ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className={`bg-card border-2 rounded-3xl overflow-hidden shadow-md transition-all duration-500
              ${alreadyPickedUp ? 'border-slate-200 grayscale' : 'border-primary/30 shadow-primary/10'}`}
          >
            {/* Ticket top notch decoration */}
            <div className={`h-2 w-full ${alreadyPickedUp ? 'bg-slate-200' : 'bg-gradient-to-r from-primary to-[#3d7a6e]'}`} />

            <div className="px-6 py-6 text-center">
              {alreadyPickedUp ? (
                /* 受取済みスタンプ */
                <div className="py-6">
                  <PickedUpStamp />
                  <p className="text-xs text-muted-foreground mt-5">
                    {formatDate(reservation.createdAt)} に予約
                  </p>
                  {points > 0 && (
                    <div className="mt-4 flex items-center justify-center gap-4 bg-secondary/50 rounded-2xl py-3">
                      <div className="flex items-center gap-1.5 text-amber-500">
                        <Coins className="w-4 h-4" />
                        <span className="font-black">+{points}pt 獲得</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-600">
                        <Leaf className="w-4 h-4" />
                        <span className="font-black">CO₂ 2.5kg削減</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : isCancelled ? (
                <div className="py-8 flex flex-col items-center gap-3">
                  <AlertCircle className="w-12 h-12 text-rose-400" />
                  <p className="font-black text-rose-500 text-lg">キャンセル済み</p>
                  <p className="text-xs text-muted-foreground">この予約はキャンセルされました</p>
                </div>
              ) : (
                /* アクティブ チケット */
                <>
                  <p className="text-xs font-bold text-primary/70 uppercase tracking-widest mb-4">受取用コード</p>

                  {/* QR Code */}
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-white rounded-2xl shadow-inner border border-slate-100 inline-block">
                      <QRCodeSVG
                        value={qrValue}
                        size={160}
                        level="M"
                        fgColor="#2D5A51"
                        bgColor="#FFFFFF"
                      />
                    </div>
                  </div>

                  {/* 6桁コード */}
                  <div className="mb-2">
                    <div className="inline-flex items-center gap-1 bg-primary/5 border border-primary/20 rounded-xl px-5 py-3">
                      {(reservation.pickupCode ?? `RES-${String(reservationId).padStart(4, '0')}`).split('').map((ch, i) => (
                        <span
                          key={i}
                          className={`font-mono font-black text-xl ${ch === '-' ? 'text-primary/30 mx-0.5' : 'text-primary'}`}
                        >
                          {ch}
                        </span>
                      ))}
                    </div>
                  </div>

                  <p className="text-[11px] text-muted-foreground mb-1">
                    予約日時: {formatDate(reservation.createdAt)}
                  </p>
                </>
              )}
            </div>

            {/* Dashed divider + bottom perforation */}
            {!isCancelled && (
              <>
                <div className="flex items-center px-4 py-1">
                  <div className="w-5 h-5 rounded-full bg-background border border-border shrink-0 -ml-8" />
                  <div className="flex-1 border-t-2 border-dashed border-border mx-1" />
                  <div className="w-5 h-5 rounded-full bg-background border border-border shrink-0 -mr-8" />
                </div>
                <div className="px-6 py-4 bg-secondary/30 flex justify-between items-center text-xs text-muted-foreground font-mono">
                  <span>{`#${String(reservationId).padStart(8, '0')}`}</span>
                  <span>食べロス</span>
                  <span>¥{reservation.totalPrice.toLocaleString()}</span>
                </div>
              </>
            )}
          </motion.div>

          {/* ── スワイプアクション or 使用済みメッセージ ── */}
          {!isCancelled && (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            >
              {alreadyPickedUp ? (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-slate-400 shrink-0" />
                  <p className="text-sm font-bold text-slate-400">
                    このチケットは既に使用済みです
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-center text-muted-foreground font-bold">
                    お店の方と一緒にスワイプしてください
                  </p>
                  <SwipeSlider onConfirm={handleConfirmPickup} disabled={alreadyPickedUp} />
                </div>
              )}
            </motion.div>
          )}

        </div>
      </div>
    </Layout>
  );
}
