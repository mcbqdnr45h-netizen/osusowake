import React, { useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { Layout } from '@/components/Layout';
import { useGetReservation } from '@workspace/api-client-react';
import { CheckCircle2, ShieldCheck, CreditCard, Coins, Lock, Sparkles, ChevronLeft, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { Link } from 'wouter';

const POINT_RATE = 0.03;

export default function Checkout() {
  const [, params] = useRoute('/checkout/:id');
  const reservationId = params?.id ? parseInt(params.id) : 0;
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const { data: reservation, isLoading } = useGetReservation(reservationId);

  if (isLoading || !reservation) {
    return (
      <Layout showBottomNav={false}>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  const pointsToEarn = Math.floor(reservation.totalPrice * POINT_RATE);

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
        body: JSON.stringify({ reservationId, successUrl, cancelUrl }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'セッション作成に失敗しました');
      }

      const { url } = await res.json();
      if (!url) throw new Error('Stripe URLが取得できませんでした');

      window.location.href = url;
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
          <Link href={`/bags/${reservation.bagId}`}>
            <button className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
          </Link>
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

          {/* Points Preview */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                <Coins className="w-5 h-5 text-amber-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-black text-amber-800">今回の購入で獲得予定</p>
                <p className="text-xs text-amber-600 mt-0.5">決済完了後に付与されます（{(POINT_RATE * 100).toFixed(0)}%還元）</p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-2xl font-black text-amber-500">+{pointsToEarn}</span>
                <span className="text-sm font-bold text-amber-500 ml-0.5">pt</span>
              </div>
            </div>
          </motion.div>

          {/* Points Redemption — Coming Soon */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-card border border-border rounded-2xl p-5 shadow-sm relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] z-10 rounded-2xl" />
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20 gap-2">
              <div className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full">
                <Lock className="w-3.5 h-3.5" />
                <span className="text-xs font-black">Coming Soon</span>
              </div>
              <p className="text-xs text-muted-foreground font-medium text-center px-4">
                ポイント利用機能は準備中です。<br />今のうちにポイントを貯めておきましょう！
              </p>
            </div>
            <div className="pointer-events-none select-none opacity-40">
              <h2 className="text-base font-black mb-3 flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-500" />
                ポイントを利用する
              </h2>
              <div className="flex items-center justify-between bg-secondary/50 rounded-xl p-4">
                <div>
                  <p className="text-sm text-muted-foreground">保有ポイント</p>
                  <p className="text-xl font-black text-foreground">0 pt</p>
                </div>
                <div className="w-10 h-6 bg-muted rounded-full relative">
                  <div className="absolute left-1 top-1 w-4 h-4 bg-muted-foreground/30 rounded-full" />
                </div>
              </div>
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

            <p className="text-center text-xs text-amber-600 font-bold mt-2.5 flex items-center justify-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              決済後に {pointsToEarn}pt を獲得できます
            </p>
            <p className="text-center text-[11px] text-muted-foreground mt-1">
              Stripeのテスト環境です。カード番号: 4242 4242 4242 4242
            </p>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
