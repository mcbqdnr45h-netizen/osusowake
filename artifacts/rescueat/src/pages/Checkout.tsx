import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRoute, useLocation } from 'wouter';
import { Layout } from '@/components/Layout';
import { useGetReservation, useCancelReservation } from '@workspace/api-client-react';
import { CheckCircle2, ShieldCheck, CreditCard, ChevronLeft, ExternalLink, Clock, AlertTriangle, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

const HOLD_MINUTES = 5;
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

function useCountdown(createdAt: string | Date | undefined, status: string | undefined) {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!createdAt || status === 'confirmed' || status === 'cancelled') {
      setSecondsLeft(null);
      return;
    }

    const expiresAt = new Date(createdAt).getTime() + HOLD_MINUTES * 60 * 1000;

    const tick = () => {
      const remaining = Math.floor((expiresAt - Date.now()) / 1000);
      if (remaining <= 0) {
        setSecondsLeft(0);
        setExpired(true);
      } else {
        setSecondsLeft(remaining);
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [createdAt, status]);

  return { secondsLeft, expired };
}

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function Checkout() {
  const [, params] = useRoute('/checkout/:id');
  const reservationId = params?.id ? parseInt(params.id) : 0;
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const { user } = useAuth();
  const expiredAlerted = useRef(false);
  const cancelMutation = useCancelReservation();

  const { data: reservation, isLoading } = useGetReservation(reservationId);
  const fromPath: string = (window.history.state as any)?.from || '';

  const { secondsLeft, expired } = useCountdown(
    reservation?.createdAt,
    reservation?.status
  );

  const handleExpiry = useCallback(() => {
    if (expiredAlerted.current) return;
    expiredAlerted.current = true;

    toast({
      title: '⏰ 期限が切れました',
      description: '5分以内に決済が完了しなかったため、仮押さえが解除されました。',
      variant: 'destructive',
    });

    setTimeout(() => navigate(`${BASE}/`), 2000);
  }, [toast, navigate]);

  useEffect(() => {
    if (expired) handleExpiry();
  }, [expired, handleExpiry]);

  if (isLoading || !reservation) {
    return (
      <Layout showBottomNav={false}>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  const handleStripeCheckout = async () => {
    if (expired) {
      toast({ title: '期限切れ', description: '仮押さえの期限が切れています。', variant: 'destructive' });
      return;
    }
    setIsRedirecting(true);
    try {
      const base = import.meta.env.BASE_URL?.replace(/\/$/, '') || '';
      const origin = window.location.origin;
      const successUrl = `${origin}${base}/success?session_id={CHECKOUT_SESSION_ID}&reservation_id=${reservationId}`;
      const cancelUrl = `${origin}${base}/cancel?reservation_id=${reservationId}`;

      const res = await fetch('/api/checkout/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservationId, successUrl, cancelUrl, userId: user?.id }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'セッション作成に失敗しました');
      }

      const { url } = await res.json();
      if (!url) throw new Error('Stripe URLが取得できませんでした');

      window.location.replace(url);
    } catch (err: any) {
      toast({
        title: '決済エラー',
        description: err.message || 'やり直してください。',
        variant: 'destructive',
      });
      setIsRedirecting(false);
    }
  };

  const handleCancel = async () => {
    try {
      await cancelMutation.mutateAsync({ reservationId });
      toast({
        title: 'キャンセルしました',
        description: '仮押さえを解除しました。在庫は他のユーザーが購入できるようになりました。',
      });
      navigate(`${BASE}/`);
    } catch {
      toast({
        title: 'キャンセルに失敗しました',
        description: 'もう一度お試しください。',
        variant: 'destructive',
      });
    }
  };

  const isUrgent = secondsLeft !== null && secondsLeft <= 60;
  const isConfirmed = reservation.status === 'confirmed';

  return (
    <Layout showBottomNav={false}>
      <div className="max-w-xl mx-auto py-8 px-4">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(fromPath || `${BASE}/bags/${reservation.bagId}?from=checkout`)}
            className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-black text-foreground">お支払い</h1>
        </div>

        <div className="space-y-4">

          {/* Countdown Timer Banner */}
          <AnimatePresence>
            {!isConfirmed && secondsLeft !== null && !expired && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                className={`rounded-2xl px-4 py-3 flex items-center gap-3 border ${
                  isUrgent
                    ? 'bg-red-50 border-red-200 text-red-700'
                    : 'bg-orange-50 border-orange-200 text-orange-700'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  isUrgent ? 'bg-red-100' : 'bg-orange-100'
                }`}>
                  <Clock className={`w-4 h-4 ${isUrgent ? 'text-red-500' : 'text-orange-500'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold leading-tight">仮押さえ中 — 期限内に決済してください</p>
                  <p className="text-[11px] opacity-80 mt-0.5">期限を過ぎると在庫が解放されます</p>
                </div>
                <div className={`text-2xl font-black tabular-nums shrink-0 ${isUrgent ? 'text-red-600 animate-pulse' : 'text-orange-600'}`}>
                  {formatCountdown(secondsLeft)}
                </div>
              </motion.div>
            )}

            {!isConfirmed && expired && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-2xl px-4 py-3 flex items-center gap-3 bg-red-50 border border-red-200"
              >
                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                <div>
                  <p className="text-sm font-black text-red-700">期限が切れました</p>
                  <p className="text-xs text-red-600/80">仮押さえが解除されました。トップへ戻ります…</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-2xl p-5 shadow-sm"
          >
            <h2 className="text-base font-black mb-4 border-b border-border pb-3">注文内容</h2>

            <div className="flex gap-4 mb-4">
              <div className="w-20 h-20 bg-muted rounded-xl overflow-hidden shrink-0">
                <img
                  src={reservation.store?.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80'}
                  alt="Bag"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <div className="text-sm text-muted-foreground">{reservation.store?.name}</div>
                <div className="font-bold text-foreground line-clamp-2">{reservation.bag?.title}</div>
                <div className="mt-1 flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">数量: {reservation.quantity}</div>
                  <div className="font-black text-lg text-primary">¥{reservation.totalPrice.toLocaleString()}</div>
                </div>
              </div>
            </div>

            <div className="bg-secondary/50 rounded-xl p-3.5 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">受取予定時間</span>
              <span className="font-bold text-foreground">{reservation.bag?.pickupStart} - {reservation.bag?.pickupEnd}</span>
            </div>
          </motion.div>

          {/* Fee Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-card border border-border rounded-2xl p-5 shadow-sm"
          >
            <h2 className="text-base font-black mb-3">お支払い内訳</h2>
            {(() => {
              const total       = Math.round(reservation.totalPrice);
              const platformFee = Math.floor(total * 0.25);          // OsusOwake 25%（全額ベース）
              const stripeFee   = Math.round(total * 0.036);         // Stripe 決済手数料 3.6%（店舗負担）
              const shopAmount  = total - platformFee - stripeFee;   // 店舗実受取額
              return (
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">商品代金</span>
                    <span className="font-bold">¥{total.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <span className="inline-block w-2 h-2 rounded-full bg-primary/40" />
                      OsusOwake プラットフォーム手数料 (25%)
                    </span>
                    <span className="text-muted-foreground">-¥{platformFee.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <span className="inline-block w-2 h-2 rounded-full bg-orange-300" />
                      Stripe 決済手数料 (3.6%)
                    </span>
                    <span className="text-muted-foreground">-¥{stripeFee.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs bg-emerald-50 border border-emerald-100 rounded-lg px-2 py-1.5">
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                      店舗受取予定額
                    </span>
                    <span className="text-emerald-700 font-black">¥{shopAmount.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-border pt-2 mt-1 flex items-center justify-between">
                    <span className="font-black text-foreground">お支払い合計</span>
                    <span className="font-black text-lg text-primary">¥{total.toLocaleString()}</span>
                  </div>
                </div>
              );
            })()}
          </motion.div>

          {/* Payment Method */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="bg-card border border-border rounded-2xl p-5 shadow-sm"
          >
            <h2 className="text-base font-black mb-4">お支払い方法</h2>

            <div className="border border-primary bg-primary/5 rounded-xl p-4 flex items-center gap-4 relative overflow-hidden">
              <div className="w-10 h-10 bg-primary/20 text-primary rounded-full flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold">クレジットカード / その他</div>
                <div className="text-xs text-muted-foreground">Stripe Checkout で安全に決済</div>
              </div>
              <div className="absolute top-0 right-0 bottom-0 w-1 bg-primary" />
            </div>

            <div className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p>決済はStripeの安全なページで処理されます。カード情報が当アプリに保存されることはありません。</p>
            </div>
          </motion.div>

          {/* Stripe Pay Button */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <button
              onClick={handleStripeCheckout}
              disabled={isRedirecting || expired || cancelMutation.isPending}
              className={`w-full h-14 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2.5 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                expired
                  ? 'bg-gray-400'
                  : 'bg-[#635BFF] hover:bg-[#5851e8] shadow-[#635BFF]/30 active:scale-[0.98]'
              }`}
            >
              {isRedirecting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Stripeへ移動中...
                </>
              ) : expired ? (
                <>
                  <AlertTriangle className="w-5 h-5" />
                  期限切れ
                </>
              ) : (
                <>
                  <ExternalLink className="w-5 h-5" />
                  ¥{reservation.totalPrice.toLocaleString()} を Stripe で支払う
                </>
              )}
            </button>

            {!expired && (
              <p className="text-center text-[11px] text-muted-foreground mt-2.5">
                Stripeのテスト環境です。カード番号: 4242 4242 4242 4242
              </p>
            )}
          </motion.div>

          {/* Cancel Button */}
          {!isConfirmed && !expired && (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              className="pb-6"
            >
              <AnimatePresence mode="wait">
                {!showCancelConfirm ? (
                  <motion.button
                    key="cancel-btn"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowCancelConfirm(true)}
                    disabled={isRedirecting || cancelMutation.isPending}
                    className="w-full h-11 rounded-2xl font-medium text-sm text-muted-foreground border border-border bg-secondary/50 hover:bg-secondary hover:text-foreground transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <X className="w-4 h-4" />
                    仮押さえをキャンセルする
                  </motion.button>
                ) : (
                  <motion.div
                    key="cancel-confirm"
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    className="rounded-2xl border border-red-200 bg-red-50 p-4 space-y-3"
                  >
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-red-700">キャンセルしますか？</p>
                        <p className="text-xs text-red-600/80 mt-0.5">
                          仮押さえが解除され、他のユーザーが購入できるようになります。
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowCancelConfirm(false)}
                        disabled={cancelMutation.isPending}
                        className="flex-1 h-10 rounded-xl text-sm font-medium border border-border bg-white text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
                      >
                        戻る
                      </button>
                      <button
                        onClick={handleCancel}
                        disabled={cancelMutation.isPending}
                        className="flex-1 h-10 rounded-xl text-sm font-bold bg-red-500 text-white hover:bg-red-600 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        {cancelMutation.isPending ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            処理中...
                          </>
                        ) : (
                          <>
                            <X className="w-4 h-4" />
                            キャンセルする
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>
    </Layout>
  );
}
