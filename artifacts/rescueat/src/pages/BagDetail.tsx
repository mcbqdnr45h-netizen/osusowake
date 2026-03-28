import React, { useState, useCallback } from 'react';
import { useRoute, useLocation } from 'wouter';
import { Layout } from '@/components/Layout';
import { useGetBag, useCreateReservation } from '@workspace/api-client-react';
import { getCategoryImage, getCategoryIcon } from '@/lib/category-utils';
import { Clock, MapPin, AlertCircle, ChevronLeft, Minus, Plus, Info, Flag, X, ChevronDown, Star, MessageSquare, Heart, Navigation, Phone, CalendarDays, Timer, UtensilsCrossed, Store } from 'lucide-react';
import { useUserId } from '@/hooks/use-user';
import { useToast } from '@/hooks/use-toast';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useAuth } from '@/contexts/AuthContext';
import { LoginNudgeSheet } from '@/components/LoginNudgeSheet';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { WalkTime } from '@/components/WalkTime';
import { useUserLocation, haversineMeters, metersToWalkMinutes, formatDistanceLabel } from '@/hooks/use-user-location';

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

function StarsDisplay({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) {
  const cls = size === 'lg' ? 'w-6 h-6' : size === 'md' ? 'w-5 h-5' : 'w-4 h-4';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star
          key={n}
          className={`${cls} ${n <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'fill-none text-border'}`}
        />
      ))}
    </div>
  );
}

interface ReviewData {
  reviews: Array<{ id: number; userId: string; rating: number; comment: string | null; createdAt: string; reply: string | null; repliedAt: string | null }>;
  avgRating: number | null;
  count: number;
}

export default function BagDetail() {
  const [, params] = useRoute('/bags/:id');
  const bagId = params?.id ? parseInt(params.id) : 0;
  const userId = useUserId();
  const { user } = useAuth();
  const { toast } = useToast();
  const { isFavorite, toggle } = useFavorites();

  const { data: bag, isLoading, error } = useGetBag(bagId);
  const createReservation = useCreateReservation();

  const [, navigate] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const cameFromCheckout = searchParams.get('from') === 'checkout';
  const [quantity, setQuantity] = useState(1);
  const [showReport,    setShowReport]    = useState(false);
  const [heroImgLoaded, setHeroImgLoaded] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [showLoginNudge, setShowLoginNudge] = useState(false);
  const [loginNudgeReason, setLoginNudgeReason] = useState<'favorite' | 'purchase'>('purchase');

  function requireLogin(reason: 'favorite' | 'purchase') {
    setLoginNudgeReason(reason);
    setShowLoginNudge(true);
  }
  const { coords: userCoords } = useUserLocation();

  // 受取時間が過ぎているか判定（JST基準・深夜またぎ対応）
  const isExpired = React.useMemo(() => {
    if (!bag?.pickupEnd) return false;
    const nowJST       = new Date(Date.now() + 9 * 60 * 60 * 1000);
    const createdJST   = new Date(new Date(bag.createdAt as string).getTime() + 9 * 60 * 60 * 1000);
    const todayStr     = nowJST.toISOString().slice(0, 10);
    const yesterdayStr = new Date(nowJST.getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const createdStr   = createdJST.toISOString().slice(0, 10);
    const currentTime  = nowJST.toISOString().slice(11, 16);

    // 深夜またぎバッグ（例: pickupStart=23:00, pickupEnd=01:00）
    const isOvernightBag = bag.pickupStart != null && bag.pickupEnd < bag.pickupStart;
    if (isOvernightBag) {
      if (createdStr === todayStr)     return false;           // 今日出品 → 翌日まで有効
      if (createdStr === yesterdayStr) return currentTime > bag.pickupEnd; // 昨日出品
      return true;
    }

    // 通常バッグ
    if (createdStr !== todayStr) return true;
    return currentTime > bag.pickupEnd;
  }, [bag]);

  const { data: reviewData } = useQuery<ReviewData>({
    queryKey: ['store-reviews', bag?.store?.id],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/stores/${bag!.store.id}/reviews`);
      if (!res.ok) throw new Error('failed');
      return res.json();
    },
    enabled: !!bag?.store?.id,
  });

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

  // 410 (期限切れ) または 404 (存在しない)
  if (!bag) {
    const isExpiredError = (error as any)?.status === 410;
    if (isExpiredError) {
      return (
        <Layout showBottomNav={false}>
          <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="w-full max-w-sm"
            >
              {/* Icon */}
              <div className="relative w-28 h-28 mx-auto mb-6">
                <div className="w-28 h-28 rounded-full bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center">
                  <Clock className="w-14 h-14 text-amber-500" />
                </div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
                  className="absolute -bottom-1 -right-1 w-9 h-9 bg-destructive rounded-full flex items-center justify-center border-2 border-background"
                >
                  <AlertCircle className="w-5 h-5 text-white" />
                </motion.div>
              </div>

              {/* Text */}
              <h2 className="text-2xl font-black mb-3">受取時間が終了しました</h2>
              <p className="text-muted-foreground text-sm leading-relaxed mb-8">
                この商品の受取時間は既に過ぎています。<br />
                他のおすそわけバッグを見てみましょう！
              </p>

              {/* CTA: 商品を探す */}
              <motion.a
                href={`${BASE}/`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center justify-center gap-2 w-full bg-primary text-primary-foreground font-black text-base rounded-2xl px-6 py-4 shadow-lg hover:bg-primary/90 active:scale-95 transition-all mb-3"
              >
                🛍️ 他の商品を探す
              </motion.a>

              {/* サブ: 前のページへ */}
              <button
                onClick={() => window.history.back()}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2 underline underline-offset-2"
              >
                前のページに戻る
              </button>
            </motion.div>
          </div>
        </Layout>
      );
    }
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center p-12 text-center gap-4">
          <p className="text-muted-foreground">バッグが見つかりません</p>
          <a href={`${BASE}/`} className="px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-bold text-sm hover:bg-primary/90 transition-colors">
            商品を探す
          </a>
        </div>
      </Layout>
    );
  }

  const discountPercent = bag.originalPrice > 0
    ? Math.round((1 - bag.discountedPrice / bag.originalPrice) * 100)
    : 0;
  const isSoldOut = bag.stockCount <= 0;
  const isUnavailable = isExpired || isSoldOut;

  const handleReserve = () => {
    if (!user) { requireLogin('purchase'); return; }

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

  return (<>
    <LoginNudgeSheet
      isOpen={showLoginNudge}
      onClose={() => setShowLoginNudge(false)}
      reason={loginNudgeReason}
    />
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
            onClick={() => cameFromCheckout ? navigate('/') : window.history.back()}
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
          {/* Hero Image（shimmer + フェードイン）*/}
          <div className="relative h-72 md:h-96 w-full overflow-hidden bg-muted">
            {/* shimmer スケルトン（ロード前） */}
            {!heroImgLoaded && (
              <div className="absolute inset-0 skeleton-shimmer" />
            )}
            <img
              src={bag.imageUrl || bag.store.imageUrl || getCategoryImage(bag.store.category)}
              alt={bag.store.name}
              loading="eager"
              decoding="async"
              onLoad={() => setHeroImgLoaded(true)}
              className={`w-full h-full object-cover transition-opacity duration-500 ${heroImgLoaded ? 'opacity-100' : 'opacity-0'}`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

            <div className="absolute bottom-6 left-6 right-6">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full text-sm font-medium border border-white/30 flex items-center gap-1.5">
                  <span>{getCategoryIcon(bag.store.category)}</span>
                  {bag.store.name}
                </span>
                {/* 徒歩時間バッジ */}
                {bag.store.lat && bag.store.lng && userCoords && (() => {
                  const meters  = haversineMeters(userCoords.lat, userCoords.lng, bag.store.lat!, bag.store.lng!);
                  const minutes = metersToWalkMinutes(meters);
                  const color   = minutes <= 5 ? 'text-green-300' : minutes <= 15 ? 'text-orange-300' : 'text-sky-300';
                  return (
                    <span className={`bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold border border-white/20 flex items-center gap-1.5 ${color}`}>
                      <Navigation className="w-3.5 h-3.5" />
                      {formatDistanceLabel(meters)}
                    </span>
                  );
                })()}
              </div>
              <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-2 leading-tight">
                {bag.title}
              </h1>
            </div>
          </div>

          <div className="p-6 md:p-8 space-y-8">
            {/* 受取時間終了バナー */}
            {isExpired && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl overflow-hidden border border-amber-300 dark:border-amber-700"
              >
                <div className="bg-amber-50 dark:bg-amber-950/40 px-5 py-4 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-400/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-amber-900 dark:text-amber-200 text-base mb-0.5">
                      受取時間が終了しました
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                      この商品の受取時間（〜{bag.pickupEnd}）は既に過ぎています。<br />
                      他のおすそわけバッグを探してみましょう！
                    </p>
                  </div>
                </div>
                <a
                  href={`${BASE}/`}
                  className="flex items-center justify-center gap-2 w-full bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white font-black text-sm py-3.5 transition-all"
                >
                  🛍️ 他の商品を探す
                </a>
              </motion.div>
            )}

            {/* ── 価格ブロック ──────────────────────────────────── */}
            <div>
              {/* 価格行 */}
              <div className="flex items-baseline gap-3 flex-wrap">
                {/* メイン価格：¥ を小さく、数字を大きく */}
                <div className="flex items-baseline gap-0.5">
                  <span className="text-2xl font-semibold text-slate-400 dark:text-slate-500 leading-none">¥</span>
                  <span className="text-5xl font-black text-slate-800 dark:text-slate-100 leading-none tracking-tight tabular-nums">
                    {bag.discountedPrice.toLocaleString()}
                  </span>
                </div>
                {bag.originalPrice > bag.discountedPrice && (
                  <div className="flex flex-col gap-0.5 pb-1">
                    <span className="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-wide">通常価格</span>
                    <span className="text-sm text-muted-foreground/70 line-through font-medium">
                      ¥{bag.originalPrice.toLocaleString()}
                    </span>
                  </div>
                )}
                {discountPercent > 0 && (
                  <span className="pb-1 bg-primary/10 text-primary font-black text-sm px-3 py-1 rounded-full border border-primary/20">
                    {discountPercent}% OFF
                  </span>
                )}
              </div>

              {/* ステータスバー */}
              <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                {isSoldOut ? (
                  <span className="inline-flex items-center gap-1.5 bg-muted text-muted-foreground font-bold text-xs px-3 py-1.5 rounded-full">
                    完売しました
                  </span>
                ) : (
                  <span className={`inline-flex items-center gap-1.5 font-bold text-xs px-3 py-1.5 rounded-full ${
                    bag.stockCount <= 2
                      ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                      : bag.stockCount <= 5
                      ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400'
                      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-500'
                  }`}>
                    {bag.stockCount <= 2 ? '🔥' : bag.stockCount <= 5 ? '⚡' : '✅'} 残り{bag.stockCount}個
                  </span>
                )}
                {bag.pickupStart && (
                  <span className="inline-flex items-center gap-1.5 bg-secondary text-foreground font-semibold text-xs px-3 py-1.5 rounded-full">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    受取 {bag.pickupStart}{bag.pickupEnd ? `〜${bag.pickupEnd}` : '〜'}
                  </span>
                )}
                {bag.store.lat && bag.store.lng && userCoords && (() => {
                  const meters  = haversineMeters(userCoords.lat, userCoords.lng, bag.store.lat!, bag.store.lng!);
                  const minutes = metersToWalkMinutes(meters);
                  const colorCls = minutes <= 5 ? 'text-emerald-700 bg-emerald-100' : minutes <= 15 ? 'text-orange-700 bg-orange-100' : 'text-foreground bg-secondary';
                  return (
                    <span className={`inline-flex items-center gap-1.5 font-semibold text-xs px-3 py-1.5 rounded-full ${colorCls}`}>
                      <Navigation className="w-3.5 h-3.5" />
                      {formatDistanceLabel(meters)}
                    </span>
                  );
                })()}
              </div>
            </div>

            <hr className="border-border" />

            {/* Description */}
            <div>
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                <Info className="w-5 h-5 text-primary" /> バッグの内容
              </h3>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {bag.description || bag.store.description || `${bag.store.name}のお料理がランダムに入ったお得なサプライズバッグです。お店の味を、ぜひ受け取ってください！`}
              </p>
              {bag.description && bag.store.description && (
                <div className="mt-3 bg-secondary/50 rounded-xl px-3.5 py-3">
                  <p className="text-xs font-bold text-primary mb-1">お店のPR</p>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{bag.store.description}</p>
                </div>
              )}
            </div>

            <hr className="border-border" />

            {/* ── 店舗情報（完全版）──────────────────────────────── */}
            <div>
              <h3 className="font-black text-lg mb-4 flex items-center gap-2">
                <Store className="w-5 h-5 text-primary" />
                店舗情報
              </h3>

              <div className="rounded-2xl border border-border/60 overflow-hidden divide-y divide-border/40">

                {/* 店舗名 + フォローボタン */}
                <div className="flex items-center justify-between gap-3 px-4 py-3.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-lg leading-none">{getCategoryIcon(bag.store.category)}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="font-black text-base text-foreground truncate">{bag.store.name}</div>
                      {bag.store.city && (
                        <div className="text-xs text-muted-foreground mt-0.5">{bag.store.city}</div>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { if (!user) { requireLogin('favorite'); return; } toggle(bag.store.id); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all active:scale-95 shrink-0
                      ${isFavorite(bag.store.id)
                        ? 'bg-rose-500 text-white border-rose-500'
                        : 'bg-card text-rose-500 border-rose-200 hover:bg-rose-50'
                      }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${isFavorite(bag.store.id) ? 'fill-white stroke-white' : 'fill-none stroke-rose-500'}`} />
                    {isFavorite(bag.store.id) ? 'フォロー中' : 'フォロー'}
                  </button>
                </div>

                {/* 住所 */}
                {bag.store.address && (
                  <div className="flex items-start gap-3 px-4 py-3.5">
                    <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">住所</div>
                      <div className="text-sm text-foreground font-medium leading-relaxed">{bag.store.address}</div>
                    </div>
                  </div>
                )}

                {/* 電話番号 */}
                {(bag.store as any).phone && (
                  <div className="flex items-center gap-3 px-4 py-3.5">
                    <Phone className="w-4 h-4 text-primary shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">電話番号</div>
                      <a
                        href={`tel:${(bag.store as any).phone}`}
                        className="text-sm font-bold text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
                      >
                        {(bag.store as any).phone}
                      </a>
                    </div>
                  </div>
                )}

                {/* 営業時間 */}
                {((bag.store as any).openTime || (bag.store as any).closeTime) && (
                  <div className="flex items-start gap-3 px-4 py-3.5">
                    <Clock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">営業時間</div>
                      <div className="text-sm font-bold text-foreground">
                        {(bag.store as any).openTime ?? '—'}
                        {(bag.store as any).closeTime ? ` 〜 ${(bag.store as any).closeTime}` : ''}
                      </div>
                    </div>
                  </div>
                )}

                {/* 受取時間の説明文 */}
                {(bag.store as any).pickupHours && (
                  <div className="flex items-start gap-3 px-4 py-3.5">
                    <Timer className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">受取時間について</div>
                      <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{(bag.store as any).pickupHours}</div>
                    </div>
                  </div>
                )}

                {/* 定休日 */}
                {(bag.store as any).holiday && (
                  <div className="flex items-start gap-3 px-4 py-3.5">
                    <CalendarDays className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">定休日</div>
                      <div className="text-sm text-foreground font-medium">{(bag.store as any).holiday}</div>
                    </div>
                  </div>
                )}

                {/* アレルギー情報 */}
                {bag.allergyInfo && (
                  <div className="flex items-start gap-3 px-4 py-3.5 bg-amber-50/60 dark:bg-amber-950/20">
                    <UtensilsCrossed className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-0.5">アレルギー情報</div>
                      <div className="text-sm text-amber-900 dark:text-amber-200 leading-relaxed whitespace-pre-wrap">{bag.allergyInfo}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bag-specific pickup note */}
            {bag.pickupNote && (
              <div className="bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900 rounded-2xl p-4 flex gap-3 text-sky-800 dark:text-sky-200">
                <Info className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-bold mb-1">受取メモ</p>
                  <p className="whitespace-pre-wrap">{bag.pickupNote}</p>
                </div>
              </div>
            )}

            {/* 汎用アレルギー注意（allergyInfo未設定時のみ表示） */}
            {!bag.allergyInfo && (
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-2xl p-4 flex gap-3 text-amber-800 dark:text-amber-200">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <div className="text-sm">
                  <p className="font-bold mb-1">アレルギーについて</p>
                  <p>サプライズバッグの内容は日によって異なります。重度のアレルギーをお持ちの方はご遠慮ください。</p>
                </div>
              </div>
            )}

            {/* Reviews Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" /> 口コミ・評価
                </h3>
                {reviewData && reviewData.count > 0 && (
                  <span className="text-xs text-muted-foreground">{reviewData.count}件</span>
                )}
              </div>

              {/* Avg rating summary */}
              {reviewData && reviewData.avgRating !== null ? (
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-5 mb-5">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-5xl font-black text-amber-500 leading-none">{reviewData.avgRating.toFixed(1)}</div>
                      <div className="mt-1.5"><StarsDisplay rating={reviewData.avgRating} size="md" /></div>
                      <div className="text-xs text-muted-foreground mt-1">{reviewData.count}件の口コミ</div>
                    </div>
                    <div className="flex-1 space-y-1.5">
                      {[5, 4, 3, 2, 1].map(star => {
                        const starCount = reviewData.reviews.filter(r => r.rating === star).length;
                        const pct = reviewData.count > 0 ? (starCount / reviewData.count) * 100 : 0;
                        return (
                          <div key={star} className="flex items-center gap-2 text-xs">
                            <span className="w-3 text-right font-bold text-muted-foreground">{star}</span>
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
                            <div className="flex-1 h-2 bg-amber-100 dark:bg-amber-900/40 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-amber-400 rounded-full transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="w-4 text-muted-foreground">{starCount}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : reviewData && reviewData.count === 0 ? (
                <div className="rounded-2xl p-8 text-center mb-5 bg-gradient-to-br from-amber-50/70 to-orange-50/50 border border-amber-100/60">
                  <div className="text-5xl mb-3 leading-none select-none" aria-hidden>🍱</div>
                  <p className="font-black text-foreground text-[15px] mb-1.5">まだ口コミがありません</p>
                  <p className="text-sm text-muted-foreground/80 leading-relaxed">
                    最初のレビュアーになりませんか？<br />
                    受け取った感想が次のお客様の<br />大きな参考になります
                  </p>
                </div>
              ) : (
                <div className="h-20 bg-secondary/50 rounded-2xl animate-pulse mb-5" />
              )}

              {/* Review list */}
              {reviewData && reviewData.reviews.length > 0 && (
                <div className="space-y-3">
                  {(showAllReviews ? reviewData.reviews : reviewData.reviews.slice(0, 3)).map((review, idx) => (
                    <motion.div
                      key={review.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-secondary/30 rounded-2xl p-4 border border-border/50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center text-xs font-black text-primary">
                            {review.userId.slice(0, 2).toUpperCase()}
                          </div>
                          <StarsDisplay rating={review.rating} size="sm" />
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                          {format(parseISO(review.createdAt), 'yyyy/MM/dd')}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-foreground leading-relaxed pl-9">{review.comment}</p>
                      )}
                      {review.reply && (
                        <div className="mt-3 ml-9 bg-primary/5 border border-primary/15 rounded-xl px-3 py-2.5">
                          <p className="text-[11px] font-black text-primary mb-1">オーナーより</p>
                          <p className="text-xs text-foreground leading-relaxed">{review.reply}</p>
                        </div>
                      )}
                    </motion.div>
                  ))}

                  {reviewData.reviews.length > 3 && (
                    <button
                      onClick={() => setShowAllReviews(v => !v)}
                      className="w-full flex items-center justify-center gap-1.5 py-3 text-sm font-bold text-primary hover:bg-primary/5 rounded-xl transition-colors border border-primary/20"
                    >
                      {showAllReviews ? '口コミを閉じる' : `すべての口コミを見る（${reviewData.reviews.length}件）`}
                      <ChevronDown className={`w-4 h-4 transition-transform ${showAllReviews ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                </div>
              )}
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

        {/* Bottom Sticky CTA（safe-area対応）*/}
        <div
          className="fixed bottom-0 left-0 right-0 bg-background border-t border-border shadow-[0_-20px_40px_rgba(0,0,0,0.05)] z-50 md:sticky md:bg-transparent md:border-none md:shadow-none md:mt-6"
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0px)' }}
        >
          <div className="px-4 pt-4 max-w-3xl mx-auto"><div className="flex items-center gap-4">

            <div className="bg-secondary rounded-2xl flex items-center p-1 h-14 border border-border/50">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1 || isUnavailable}
                className="w-12 h-full flex items-center justify-center rounded-xl text-foreground hover:bg-background disabled:opacity-50 transition-colors tap-scale"
              >
                <Minus className="w-5 h-5" />
              </button>
              <div className="w-10 text-center font-bold text-lg select-none">
                {quantity}
              </div>
              <button
                onClick={() => setQuantity(Math.min(bag.stockCount, quantity + 1))}
                disabled={quantity >= bag.stockCount || isUnavailable}
                className="w-12 h-full flex items-center justify-center rounded-xl text-foreground hover:bg-background disabled:opacity-50 transition-colors tap-scale"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={handleReserve}
              disabled={isUnavailable || createReservation.isPending}
              className={`flex-1 h-14 rounded-2xl font-bold text-lg shadow-lg transition-all duration-200 flex items-center justify-center gap-2
                ${isUnavailable
                  ? 'bg-muted text-muted-foreground shadow-none cursor-not-allowed'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90 hover:-translate-y-1 hover:shadow-primary/30 active:translate-y-0 active:shadow-sm'
                }`}
            >
              {createReservation.isPending ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : isExpired ? (
                <span className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  受取時間が終了しました
                </span>
              ) : isSoldOut ? (
                '完売しました'
              ) : (
                `購入する (¥${(bag.discountedPrice * quantity).toLocaleString()})`
              )}
            </button>
          </div>
          {!isUnavailable && (
            <div className="text-center mt-3 text-xs text-muted-foreground md:hidden pb-1">
              残りわずか{bag.stockCount}個！お早めに。
            </div>
          )}
          {isExpired && (
            <div className="text-center mt-3 text-xs text-muted-foreground md:hidden flex items-center justify-center gap-1 pb-1">
              <Clock className="w-3 h-3" />
              本日の受取時間（〜{bag.pickupEnd}）が終了しました
            </div>
          )}
          </div>
        </div>
      </div>

      {/* 特商法リンク */}
      <div className="text-center py-4 px-4 border-t border-border/30">
        <a
          href="/legal"
          className="text-xs text-muted-foreground/60 hover:text-muted-foreground underline transition-colors"
        >
          特定商取引法に基づく表記
        </a>
      </div>
    </Layout>
  </>);
}
