import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRoute, useLocation } from 'wouter';
import { Layout } from '@/components/Layout';
import { useGetReservation, useCancelReservation } from '@workspace/api-client-react';
import {
  CheckCircle2, ShieldCheck, CreditCard, ChevronLeft,
  Clock, AlertTriangle, X, Lock,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PK ?? '');

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
      if (remaining <= 0) { setSecondsLeft(0); setExpired(true); }
      else { setSecondsLeft(remaining); }
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

/* ── インアプリ決済フォーム（Elements内部） ─────────────────── */
interface PaymentFormProps {
  reservationId: number;
  amount: number;
  expired: boolean;
  onSuccess: () => void;
  onCancel: () => void;
  showCancelConfirm: boolean;
  setShowCancelConfirm: (v: boolean) => void;
  cancelPending: boolean;
}

function PaymentForm({
  reservationId, amount, expired,
  onSuccess, onCancel,
  showCancelConfirm, setShowCancelConfirm, cancelPending,
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isPaying, setIsPaying] = useState(false);
  const [elementsReady, setElementsReady] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || expired) return;
    setIsPaying(true);

    try {
      const result = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
        confirmParams: {
          return_url: `${window.location.origin}${BASE}/success?reservation_id=${reservationId}`,
        },
      });

      if (result.error) {
        toast({
          title: '決済エラー',
          description: result.error.message || 'カード情報を確認してください。',
          variant: 'destructive',
        });
        setIsPaying(false);
        return;
      }

      if (result.paymentIntent?.status === 'succeeded') {
        await fetch('/api/payment/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reservationId,
            paymentIntentId: result.paymentIntent.id,
            status: 'confirmed',
          }),
        }).catch(() => {});
        onSuccess();
      }
    } catch (err: any) {
      toast({
        title: '決済エラー',
        description: err.message || 'もう一度お試しください。',
        variant: 'destructive',
      });
      setIsPaying(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Stripe Payment Element */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="bg-card border border-border rounded-2xl p-5 shadow-sm"
      >
        <h2 className="text-base font-black mb-4">お支払い情報</h2>
        <PaymentElement
          onReady={() => setElementsReady(true)}
          options={{
            layout: 'tabs',
            fields: { billingDetails: { name: 'auto' } },
          }}
        />
        {!elementsReady && (
          <div className="flex items-center justify-center h-24">
            <div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <div className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
          <Lock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p>カード情報はSSLで暗号化され、Osusowakeのサーバーには一切保存されません。</p>
        </div>
      </motion.div>

      {/* Pay Button */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <button
          type="submit"
          disabled={!stripe || !elementsReady || isPaying || expired}
          className={`w-full h-14 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2.5 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
            expired ? 'bg-gray-400' : 'bg-primary hover:bg-primary/90 active:scale-[0.98]'
          }`}
        >
          {isPaying ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              決済処理中...
            </>
          ) : expired ? (
            <>
              <AlertTriangle className="w-5 h-5" />
              期限切れ
            </>
          ) : (
            <>
              <ShieldCheck className="w-5 h-5" />
              ¥{amount.toLocaleString()}を支払う
            </>
          )}
        </button>
      </motion.div>

      {/* Cancel */}
      {!expired && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="pb-6">
          <AnimatePresence mode="wait">
            {!showCancelConfirm ? (
              <motion.button
                key="cancel-btn" type="button"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setShowCancelConfirm(true)}
                disabled={isPaying || cancelPending}
                className="w-full h-11 rounded-2xl font-medium text-sm text-muted-foreground border border-border bg-secondary/50 hover:bg-secondary hover:text-foreground transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <X className="w-4 h-4" />
                仮押さえをキャンセルする
              </motion.button>
            ) : (
              <motion.div
                key="cancel-confirm"
                initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
                className="rounded-2xl border border-red-200 bg-red-50 p-4 space-y-3"
              >
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-red-700">キャンセルしますか？</p>
                    <p className="text-xs text-red-600/80 mt-0.5">仮押さえが解除され、他のユーザーが購入できるようになります。</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCancelConfirm(false)}
                    disabled={cancelPending}
                    className="flex-1 h-10 rounded-xl text-sm font-medium border border-border bg-white text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
                  >
                    戻る
                  </button>
                  <button
                    type="button"
                    onClick={onCancel}
                    disabled={cancelPending}
                    className="flex-1 h-10 rounded-xl text-sm font-bold bg-red-500 text-white hover:bg-red-600 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {cancelPending ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <><X className="w-4 h-4" />キャンセルする</>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </form>
  );
}

/* ── メインページ ────────────────────────────────────────────── */
export default function Checkout() {
  const [, params] = useRoute('/checkout/:id');
  const reservationId = params?.id ? parseInt(params.id) : 0;
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const expiredAlerted = useRef(false);
  const cancelMutation = useCancelReservation();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [intentError, setIntentError] = useState<string | null>(null);
  const creatingIntent = useRef(false);

  const { data: reservation, isLoading } = useGetReservation(reservationId);
  const fromPath: string = (window.history.state as any)?.from || '';

  const { secondsLeft, expired } = useCountdown(reservation?.createdAt, reservation?.status);

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

  useEffect(() => { if (expired) handleExpiry(); }, [expired, handleExpiry]);

  useEffect(() => {
    if (!reservation || reservation.paymentStatus === 'paid' || clientSecret || creatingIntent.current) return;
    creatingIntent.current = true;

    fetch('/api/payment/create-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reservationId, userId: user?.id }),
    })
      .then(async (r) => {
        if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.message || '決済の準備に失敗しました'); }
        return r.json();
      })
      .then((d) => { if (d.clientSecret) setClientSecret(d.clientSecret); else throw new Error('決済情報が取得できませんでした'); })
      .catch((err) => { setIntentError(err.message); creatingIntent.current = false; });
  }, [reservation, reservationId, user?.id, clientSecret]);

  const handleCancel = async () => {
    try {
      await cancelMutation.mutateAsync({ reservationId });
      toast({ title: 'キャンセルしました', description: '仮押さえを解除しました。', duration: 2000 });
      navigate(`${BASE}/`);
    } catch {
      toast({ title: 'キャンセルに失敗しました', description: 'もう一度お試しください。', variant: 'destructive' });
    }
  };

  const handleSuccess = useCallback(() => {
    toast({ title: '✅ お支払い完了', description: 'ご購入ありがとうございます！' });
    navigate(`${BASE}/success?reservation_id=${reservationId}`);
  }, [navigate, reservationId, toast]);

  if (isLoading || !reservation) {
    return (
      <Layout showBottomNav={false}>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  const isUrgent = secondsLeft !== null && secondsLeft <= 60;
  const isConfirmed = reservation.status === 'confirmed';
  const total = Math.round(reservation.totalPrice);

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

          {/* Countdown Timer */}
          <AnimatePresence>
            {!isConfirmed && secondsLeft !== null && !expired && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                className={`rounded-2xl px-4 py-3 flex items-center gap-3 border ${
                  isUrgent ? 'bg-red-50 border-red-200 text-red-700' : 'bg-orange-50 border-orange-200 text-orange-700'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isUrgent ? 'bg-red-100' : 'bg-orange-100'}`}>
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
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
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
                  <div className="font-black text-lg text-primary">¥{total.toLocaleString()}</div>
                </div>
              </div>
            </div>
            <div className="bg-secondary/50 rounded-xl p-3.5 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">受取予定時間</span>
              <span className="font-bold text-foreground">{reservation.bag?.pickupStart} - {reservation.bag?.pickupEnd}</span>
            </div>
          </motion.div>

          {/* Total */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-card border border-border rounded-2xl p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="font-black text-foreground">お支払い合計</span>
              <span className="font-black text-xl text-primary">¥{total.toLocaleString()}</span>
            </div>
          </motion.div>

          {/* Payment Element or loading/error */}
          {intentError ? (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700">
              <p className="font-bold">決済の準備に失敗しました</p>
              <p className="text-xs mt-1">{intentError}</p>
            </div>
          ) : !clientSecret ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="bg-card border border-border rounded-2xl p-8 shadow-sm flex items-center justify-center"
            >
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground">決済を準備中...</p>
              </div>
            </motion.div>
          ) : (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                locale: 'ja',
                appearance: {
                  theme: 'stripe',
                  variables: {
                    colorPrimary: '#F26419',
                    colorBackground: '#ffffff',
                    colorText: '#1a1a1a',
                    borderRadius: '12px',
                    fontFamily: '"Helvetica Neue", Arial, sans-serif',
                  },
                },
              }}
            >
              <PaymentForm
                reservationId={reservationId}
                amount={total}
                expired={expired}
                onSuccess={handleSuccess}
                onCancel={handleCancel}
                showCancelConfirm={showCancelConfirm}
                setShowCancelConfirm={setShowCancelConfirm}
                cancelPending={cancelMutation.isPending}
              />
            </Elements>
          )}
        </div>
      </div>
    </Layout>
  );
}
