import React, { useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { Layout } from '@/components/Layout';
import { useGetBag, useCreateReservation } from '@workspace/api-client-react';
import { getCategoryImage, getCategoryIcon } from '@/components/BagCard';
import { Clock, MapPin, AlertCircle, ChevronLeft, Minus, Plus, Info, Flag, X, ChevronDown } from 'lucide-react';
import { useUserId } from '@/hooks/use-user';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

const REPORT_TYPES = [
  { value: 'closed', label: '閉店している' },
  { value: 'temp_closed', label: '一時休業中・長期休業中' },
  { value: 'wrong_hours', label: '営業時間が違う' },
  { value: 'wrong_info', label: '住所・電話番号などの情報が間違っている' },
  { value: 'other', label: 'その他' },
] as const;

type ReportType = typeof REPORT_TYPES[number]['value'];

function ReportModal({ storeId, storeName, userId, onClose }: {
  storeId: number;
  storeName: string;
  userId: string;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [reportType, setReportType] = useState<ReportType | ''>('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    if (!reportType) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`${BASE}/api/stores/${storeId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, reportType, comment }),
      });
      if (res.status === 429) {
        toast({ title: '報告済みです', description: 'この店舗は24時間以内に既に報告されています', variant: 'destructive' });
        onClose();
        return;
      }
      if (!res.ok) throw new Error('failed');
      setDone(true);
    } catch {
      toast({ title: '送信に失敗しました', description: 'もう一度お試しください', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-card w-full md:max-w-md md:rounded-2xl rounded-t-3xl shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 md:hidden">
          <div className="w-10 h-1 bg-border rounded-full" />
        </div>

        <div className="px-6 py-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-black">店舗情報を報告する</h3>
              <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[220px]">{storeName}</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {done ? (
            <div className="py-6 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Flag className="w-8 h-8 text-primary" />
              </div>
              <h4 className="font-black text-lg mb-2">ご報告ありがとうございます</h4>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                報告内容を受け付けました。管理者が確認し、必要に応じて店舗情報を更新します。
              </p>
              <button
                onClick={onClose}
                className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl hover:bg-primary/90 transition-all"
              >
                閉じる
              </button>
            </div>
          ) : (
            <>
              {/* Report Type */}
              <div className="mb-4">
                <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wide">
                  報告の種類 <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <select
                    value={reportType}
                    onChange={e => setReportType(e.target.value as ReportType)}
                    className="w-full appearance-none bg-secondary border border-border rounded-xl px-4 py-3 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary pr-10"
                  >
                    <option value="">選択してください</option>
                    {REPORT_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* Comment */}
              <div className="mb-5">
                <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wide">
                  詳細（任意）
                </label>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="具体的な状況をご記入ください（例：2025年5月に閉店しました）"
                  maxLength={300}
                  rows={3}
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                />
                <div className="text-right text-xs text-muted-foreground/60 mt-1">{comment.length}/300</div>
              </div>

              {/* Notice */}
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-3 mb-5 text-xs text-amber-800 dark:text-amber-300 flex gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>虚偽の報告はサービス利用制限の対象となります。報告は24時間に1回のみ受け付けます。</p>
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={!reportType || isSubmitting}
                className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-xl hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Flag className="w-4 h-4" />
                    報告を送信する
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function BagDetail() {
  const [, params] = useRoute('/bags/:id');
  const bagId = params?.id ? parseInt(params.id) : 0;
  const userId = useUserId();
  const { toast } = useToast();

  const { data: bag, isLoading } = useGetBag(bagId);
  const createReservation = useCreateReservation();

  const [, navigate] = useLocation();
  const [quantity, setQuantity] = useState(1);
  const [showReport, setShowReport] = useState(false);

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
      <AnimatePresence>
        {showReport && userId && (
          <ReportModal
            storeId={bag.store.id}
            storeName={bag.store.name}
            userId={userId}
            onClose={() => setShowReport(false)}
          />
        )}
      </AnimatePresence>

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

            {/* Report Button */}
            <div className="pt-2">
              <button
                onClick={() => {
                  if (!userId) {
                    toast({ title: 'ユーザー情報が見つかりません', description: 'ページを再読み込みしてください', variant: 'destructive' });
                    return;
                  }
                  setShowReport(true);
                }}
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-destructive transition-colors py-1"
              >
                <Flag className="w-3.5 h-3.5" />
                この店舗の情報を報告する
              </button>
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
