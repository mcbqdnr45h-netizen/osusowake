import React, { useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { Layout } from '@/components/Layout';
import { useGetReservation, useCreatePaymentIntent, useConfirmPayment } from '@workspace/api-client-react';
import { CheckCircle2, ShieldCheck, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

export default function Checkout() {
  const [, params] = useRoute('/checkout/:id');
  const reservationId = params?.id ? parseInt(params.id) : 0;
  const { toast } = useToast();
  
  const { data: reservation, isLoading } = useGetReservation(reservationId);
  const createPayment = useCreatePaymentIntent();
  const confirmPayment = useConfirmPayment();

  const [, navigate] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);

  if (isLoading || !reservation) {
    return (
      <Layout showBottomNav={false}>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  // Simplified Mock Payment Flow
  const handleMockPayment = async () => {
    setIsProcessing(true);
    try {
      // 1. Create intent
      const intent = await createPayment.mutateAsync({
        data: { reservationId }
      });
      
      // Simulate network delay for realistic feel
      await new Promise(res => setTimeout(res, 1500));
      
      // 2. Confirm payment
      await confirmPayment.mutateAsync({
        data: {
          reservationId,
          paymentIntentId: intent.paymentIntentId
        }
      });
      
      toast({
        title: "決済完了！🎉",
        description: "ご予約が確定しました。",
      });
      
      navigate('/my-reservations');
    } catch (err: any) {
      toast({
        title: "決済エラー",
        description: err.message || "やり直してください。",
        variant: "destructive"
      });
      setIsProcessing(false);
    }
  };

  return (
    <Layout showBottomNav={false}>
      <div className="max-w-xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold text-foreground mb-6">お支払い</h1>
        
        <div className="space-y-6">
          {/* Order Summary */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-2xl p-6 shadow-sm"
          >
            <h2 className="text-lg font-bold mb-4 border-b border-border pb-4">注文内容</h2>
            
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
                  <div className="text-sm">数量: {reservation.quantity}</div>
                  <div className="font-bold text-lg">¥{reservation.totalPrice.toLocaleString()}</div>
                </div>
              </div>
            </div>
            
            <div className="bg-secondary/50 rounded-xl p-4 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">受取予定時間</span>
              <span className="font-bold text-foreground">{reservation.bag?.pickupStart} - {reservation.bag?.pickupEnd}</span>
            </div>
          </motion.div>

          {/* Payment Method */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-card border border-border rounded-2xl p-6 shadow-sm"
          >
            <h2 className="text-lg font-bold mb-4">お支払い方法</h2>
            
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
            
            <div className="mt-6 flex items-start gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
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
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
