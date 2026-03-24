import React, { useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { Layout } from '@/components/Layout';
import { useGetReservation } from '@workspace/api-client-react';
import { CheckCircle2, ShieldCheck, CreditCard, ChevronLeft, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

export default function Checkout() {
  const [, params] = useRoute('/checkout/:id');
  const reservationId = params?.id ? parseInt(params.id) : 0;
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const { user } = useAuth();

  const { data: reservation, isLoading } = useGetReservation(reservationId);
  const fromPath: string = (window.history.state as any)?.from || '';

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

  return (
    <Layout showBottomNav={false}>
      <div className="max-w-xl mx-auto py-8 px-4">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(fromPath || `/bags/${reservation.bagId}`)}
            className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-black text-foreground">お支払い</h1>
        </div>

        <div className="space-y-4">

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
              disabled={isRedirecting}
              className="w-full h-14 bg-[#635BFF] hover:bg-[#5851e8] text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2.5 transition-colors shadow-lg shadow-[#635BFF]/30 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isRedirecting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Stripeへ移動中...
                </>
              ) : (
                <>
                  <ExternalLink className="w-5 h-5" />
                  ¥{reservation.totalPrice.toLocaleString()} を Stripe で支払う
                </>
              )}
            </button>

            <p className="text-center text-[11px] text-muted-foreground mt-2.5">
              Stripeのテスト環境です。カード番号: 4242 4242 4242 4242
            </p>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
