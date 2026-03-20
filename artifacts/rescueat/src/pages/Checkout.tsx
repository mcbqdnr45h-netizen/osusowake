import React, { useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { Layout } from '@/components/Layout';
import { useGetReservation, useCreatePaymentIntent, useConfirmPayment } from '@workspace/api-client-react';
import { CheckCircle2, ShieldCheck, CreditCard, Coins, Lock, Sparkles, ChevronLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'wouter';

const POINT_RATE = 0.03;

function PointsSuccessScreen({ points, totalPrice, onDone }: {
  points: number;
  totalPrice: number;
  onDone: () => void;
}) {
  React.useEffect(() => {
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-background px-6 text-center">
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 240, damping: 20 }}
        className="flex flex-col items-center"
      >
        {/* Success Icon */}
        <div className="relative mb-6">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-14 h-14 text-primary" />
          </div>
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 1] }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="absolute -top-1 -right-1 w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center shadow-lg"
          >
            <Sparkles className="w-4 h-4 text-white" />
          </motion.div>
        </div>

        <h2 className="text-2xl font-black text-foreground mb-1">レスキュー完了！</h2>
        <p className="text-muted-foreground text-sm mb-8">ご予約が確定しました 🎉</p>

        {/* Points earned card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="w-full max-w-xs bg-gradient-to-br from-amber-400 to-orange-400 rounded-3xl p-5 shadow-lg shadow-amber-200 mb-4"
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <Coins className="w-5 h-5 text-white" />
            <span className="text-white font-bold text-sm">今回のレスキューで獲得</span>
          </div>
          <div className="text-white text-center">
            <span className="text-5xl font-black">+{points}</span>
            <span className="text-xl font-bold ml-1">pt</span>
          </div>
          <p className="text-white/80 text-xs text-center mt-2">
            ¥{totalPrice.toLocaleString()} × {(POINT_RATE * 100).toFixed(0)}% = {points}ポイント
          </p>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="text-xs text-muted-foreground"
        >
          予約一覧へ移動します...
        </motion.p>
      </motion.div>
    </div>
  );
}

export default function Checkout() {
  const [, params] = useRoute('/checkout/:id');
  const reservationId = params?.id ? parseInt(params.id) : 0;
  const { toast } = useToast();

  const { data: reservation, isLoading } = useGetReservation(reservationId);
  const createPayment = useCreatePaymentIntent();
  const confirmPayment = useConfirmPayment();

  const [, navigate] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState<number | null>(null);

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

  const handleMockPayment = async () => {
    setIsProcessing(true);
    try {
      const intent = await createPayment.mutateAsync({ data: { reservationId } });
      await new Promise(res => setTimeout(res, 1500));
      await confirmPayment.mutateAsync({
        data: { reservationId, paymentIntentId: intent.paymentIntentId }
      });
      setEarnedPoints(pointsToEarn);
    } catch (err: any) {
      toast({
        title: '決済エラー',
        description: err.message || 'やり直してください。',
        variant: 'destructive',
      });
      setIsProcessing(false);
    }
  };

  // Show success screen with points animation
  if (earnedPoints !== null) {
    return (
      <PointsSuccessScreen
        points={earnedPoints}
        totalPrice={reservation.totalPrice}
        onDone={() => navigate('/my-reservations')}
      />
    );
  }

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

          {/* Points Accrual Preview */}
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
            {/* Frosted overlay */}
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

            {/* Background content (blurred/disabled) */}
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

            <div className="border border-primary bg-primary/5 rounded-xl p-4 flex items-center gap-4 cursor-pointer relative overflow-hidden">
              <div className="w-10 h-10 bg-primary/20 text-primary rounded-full flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold">クレジットカード (Mock)</div>
                <div className="text-xs text-muted-foreground">テスト環境です。実際の請求はされません。</div>
              </div>
              <div className="absolute top-0 right-0 bottom-0 w-1 bg-primary" />
            </div>

            <div className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p>決済は安全に処理されます。店舗で商品を受け取れなかった場合、自動的に返金されます。</p>
            </div>
          </motion.div>

          {/* Pay Button */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <button
              onClick={handleMockPayment}
              disabled={isProcessing}
              className="w-full h-14 bg-foreground text-background rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-foreground/90 transition-colors shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <div className="w-6 h-6 border-2 border-background/30 border-t-background rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  ¥{reservation.totalPrice.toLocaleString()} を支払う
                </>
              )}
            </button>

            <p className="text-center text-xs text-amber-600 font-bold mt-2.5 flex items-center justify-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              決済後に {pointsToEarn}pt を獲得できます
            </p>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
