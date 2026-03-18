import React, { useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { Layout } from '@/components/Layout';
import { useGetBag, useCreateReservation } from '@workspace/api-client-react';
import { getCategoryImage, getCategoryIcon } from '@/components/BagCard';
import { Clock, MapPin, AlertCircle, ChevronLeft, Minus, Plus, Info } from 'lucide-react';
import { useUserId } from '@/hooks/use-user';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

export default function BagDetail() {
  const [, params] = useRoute('/bags/:id');
  const bagId = params?.id ? parseInt(params.id) : 0;
  const userId = useUserId();
  const { toast } = useToast();
  
  const { data: bag, isLoading } = useGetBag(bagId);
  const createReservation = useCreateReservation();
  
  const [, navigate] = useLocation();
  const [quantity, setQuantity] = useState(1);

  if (isLoading) {
    return (
      <Layout showBottomNav={false}>
        <div className="p-4 md:p-8 max-w-3xl mx-auto animate-pulse">
          <div className="h-64 bg-muted rounded-3xl mb-8" />
          <div className="h-8 bg-muted rounded w-1/2 mb-4" />
          <div className="h-4 bg-muted rounded w-1/3" />
        </div>
      </Layout>
    );
  }

  if (!bag) {
    return (
      <Layout>
        <div className="p-8 text-center">バッグが見つかりません</div>
      </Layout>
    );
  }

  const discountPercent = Math.round((1 - bag.discountedPrice / bag.originalPrice) * 100);
  const isSoldOut = bag.stockCount <= 0;

  const handleReserve = () => {
    if (!userId) return;
    
    createReservation.mutate({
      data: {
        bagId: bag.id,
        quantity,
        userId
      }
    }, {
      onSuccess: (data) => {
        navigate(`/checkout/${data.id}`);
      },
      onError: (err) => {
        toast({
          title: "予約に失敗しました",
          description: err.message || "もう一度お試しください。",
          variant: "destructive"
        });
      }
    });
  };

  return (
    <Layout showBottomNav={false}>
      <div className="max-w-3xl mx-auto md:py-8 md:px-4">
        
        {/* Mobile Header Back Button */}
        <div className="absolute top-4 left-4 z-50 md:hidden">
          <button 
            onClick={() => window.history.back()}
            className="w-10 h-10 bg-background/80 backdrop-blur rounded-full flex items-center justify-center shadow-md border border-border"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card md:rounded-3xl shadow-sm border-x border-b md:border border-border/50 overflow-hidden"
        >
          {/* Hero Image */}
          <div className="relative h-72 md:h-96 w-full">
            <img 
              src={bag.store.imageUrl || getCategoryImage(bag.store.category)} 
              alt={bag.store.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            
            <div className="absolute top-4 right-4 bg-accent text-accent-foreground font-bold px-4 py-1.5 rounded-full text-sm shadow-lg shadow-accent/20">
              {discountPercent}% OFF
            </div>

            <div className="absolute bottom-6 left-6 right-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full text-sm font-medium border border-white/30 flex items-center gap-1.5">
                  <span>{getCategoryIcon(bag.store.category)}</span>
                  {bag.store.name}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-2 leading-tight">
                {bag.title}
              </h1>
            </div>
          </div>

          <div className="p-6 md:p-8 space-y-8">
            {/* Price and Details row */}
            <div className="flex flex-wrap gap-6 justify-between items-start">
              <div>
                <div className="text-sm text-muted-foreground line-through mb-1">
                  通常価格 ¥{bag.originalPrice.toLocaleString()}
                </div>
                <div className="text-4xl font-display font-bold text-primary flex items-baseline gap-1">
                  ¥{bag.discountedPrice.toLocaleString()}
                  <span className="text-sm text-muted-foreground font-normal">/個</span>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="bg-secondary/50 rounded-2xl p-4 min-w-[120px]">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs font-semibold">受取時間</span>
                  </div>
                  <div className="font-bold text-foreground">
                    {bag.pickupStart} - {bag.pickupEnd}
                  </div>
                </div>
                <div className="bg-secondary/50 rounded-2xl p-4 min-w-[120px]">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <MapPin className="w-4 h-4" />
                    <span className="text-xs font-semibold">場所</span>
                  </div>
                  <div className="font-bold text-foreground truncate max-w-[100px]">
                    {bag.store.city}
                  </div>
                </div>
              </div>
            </div>

            <hr className="border-border" />

            {/* Description */}
            <div>
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                <Info className="w-5 h-5 text-primary" /> バッグの内容
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {bag.description || `${bag.store.name}の余剰商品がランダムに入ったお得なサプライズバッグです。美味しく食べられるのに廃棄されてしまう食品をレスキューしましょう！`}
              </p>
            </div>

            <hr className="border-border" />

            {/* Store Info */}
            <div>
              <h3 className="font-bold text-lg mb-3">店舗情報</h3>
              <div className="flex items-start gap-3 text-muted-foreground">
                <MapPin className="w-5 h-5 shrink-0 text-primary mt-0.5" />
                <div>
                  <div className="font-medium text-foreground">{bag.store.name}</div>
                  <div className="text-sm">{bag.store.address}</div>
                </div>
              </div>
            </div>

            {/* Warning box */}
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-2xl p-4 flex gap-3 text-amber-800 dark:text-amber-200">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <div className="text-sm">
                <p className="font-bold mb-1">アレルギーについて</p>
                <p>サプライズバッグの内容は日によって異なります。重度のアレルギーをお持ちの方はご遠慮ください。</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Bottom Sticky CTA */}
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border shadow-[0_-20px_40px_rgba(0,0,0,0.05)] p-4 pb-safe z-50 md:sticky md:bg-transparent md:border-none md:shadow-none md:mt-6 md:p-0">
          <div className="max-w-3xl mx-auto flex items-center gap-4">
            
            <div className="bg-secondary rounded-2xl flex items-center p-1 h-14 border border-border/50">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1 || isSoldOut}
                className="w-12 h-full flex items-center justify-center rounded-xl text-foreground hover:bg-background disabled:opacity-50 transition-colors"
              >
                <Minus className="w-5 h-5" />
              </button>
              <div className="w-10 text-center font-bold text-lg">
                {quantity}
              </div>
              <button 
                onClick={() => setQuantity(Math.min(bag.stockCount, quantity + 1))}
                disabled={quantity >= bag.stockCount || isSoldOut}
                className="w-12 h-full flex items-center justify-center rounded-xl text-foreground hover:bg-background disabled:opacity-50 transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={handleReserve}
              disabled={isSoldOut || createReservation.isPending}
              className={`flex-1 h-14 rounded-2xl font-bold text-lg shadow-lg transition-all duration-200 flex items-center justify-center gap-2
                ${isSoldOut 
                  ? 'bg-muted text-muted-foreground shadow-none cursor-not-allowed' 
                  : 'bg-primary text-primary-foreground hover:bg-primary/90 hover:-translate-y-1 hover:shadow-primary/30 active:translate-y-0 active:shadow-sm'
                }`}
            >
              {createReservation.isPending ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : isSoldOut ? (
                '完売しました'
              ) : (
                `予約する (¥${(bag.discountedPrice * quantity).toLocaleString()})`
              )}
            </button>
          </div>
          {!isSoldOut && (
            <div className="text-center mt-3 text-xs text-muted-foreground md:hidden">
              残りわずか{bag.stockCount}個！お早めに。
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
