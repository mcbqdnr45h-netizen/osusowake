import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Layout } from '@/components/Layout';
import { 
  useListStoreBags, 
  useListReservations, 
  useCreateBag, 
  useUpdateReservationStatus 
} from '@workspace/api-client-react';
import { 
  Plus, Check, Store as StoreIcon, RefreshCw, Box, Leaf, 
  Zap, ChevronUp, ChevronDown, BarChart2, Bell, Rocket,
  Clock, TrendingUp, Camera, Sparkles, ImagePlus,
  Building2, CheckCircle2, AlertCircle, ExternalLink, Loader2,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { getStoreEcoRank, getStoreProgress } from '@/lib/eco-rank';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

// ─── 画像圧縮 ────────────────────────────────────────────────────────────────
async function compressImage(file: File, maxPx = 1200, quality = 0.75): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxPx || height > maxPx) {
          if (width >= height) { height = Math.round(height * maxPx / width); width = maxPx; }
          else { width = Math.round(width * maxPx / height); height = maxPx; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

// ─── テンプレート定義 ────────────────────────────────────────────────────────
const TEMPLATES = [
  { id: 1, emoji: '🍞', label: 'パン詰め合わせ', title: '本日のパン詰め合わせ', originalPrice: 1200, discountedPrice: 400, pickupStart: '18:00', pickupEnd: '20:00', description: '本日焼き上げたパンをランダムで詰め合わせ' },
  { id: 2, emoji: '🎂', label: 'ケーキセット',   title: '本日のケーキセット',   originalPrice: 1500, discountedPrice: 500, pickupStart: '17:00', pickupEnd: '19:00', description: 'その日のケーキ・スイーツを詰め合わせ' },
  { id: 3, emoji: '🥗', label: 'サラダ弁当',     title: 'サラダ弁当セット',     originalPrice: 900,  discountedPrice: 300, pickupStart: '19:00', pickupEnd: '21:00', description: '本日のサラダ・惣菜弁当セット' },
  { id: 4, emoji: '🍱', label: 'おかずセット',   title: '本日のおかずセット',   originalPrice: 1000, discountedPrice: 350, pickupStart: '20:00', pickupEnd: '21:30', description: '本日の余りおかずをパック詰め' },
  { id: 5, emoji: '🥐', label: 'クロワッサン',   title: 'クロワッサンセット',   originalPrice: 800,  discountedPrice: 280, pickupStart: '16:00', pickupEnd: '18:00', description: '当日焼き上げクロワッサン詰め合わせ' },
  { id: 6, emoji: '🍣', label: 'お寿司セット',   title: '本日のお寿司セット',   originalPrice: 2000, discountedPrice: 700, pickupStart: '20:30', pickupEnd: '22:00', description: '当日仕込みの余り寿司パック' },
];

// ─── ダミー分析データ ─────────────────────────────────────────────────────────
const hourlyData = [
  { hour: '11時', sales: 2 },
  { hour: '12時', sales: 8 },
  { hour: '13時', sales: 5 },
  { hour: '14時', sales: 3 },
  { hour: '15時', sales: 4 },
  { hour: '16時', sales: 6 },
  { hour: '17時', sales: 12 },
  { hour: '18時', sales: 18 },
  { hour: '19時', sales: 22 },
  { hour: '20時', sales: 15 },
  { hour: '21時', sales: 7 },
];

const weeklyData = [
  { day: '月', sales: 14, rate: 65 },
  { day: '火', sales: 11, rate: 55 },
  { day: '水', sales: 17, rate: 80 },
  { day: '木', sales: 10, rate: 48 },
  { day: '金', sales: 24, rate: 95 },
  { day: '土', sales: 28, rate: 100 },
  { day: '日', sales: 20, rate: 78 },
];

// ─── 通知トースト ─────────────────────────────────────────────────────────────
function NotificationBlast({ visible, count, title, onClose }: { visible: boolean; count: number; title: string; onClose: () => void }) {
  useEffect(() => {
    if (visible) {
      const t = setTimeout(onClose, 5000);
      return () => clearTimeout(t);
    }
  }, [visible, onClose]);

  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-8 pointer-events-none">
      <div
        className="pointer-events-auto w-full max-w-sm bg-gradient-to-br from-[#2D5A51] to-[#1a3830] text-white rounded-2xl shadow-2xl p-5 animate-in slide-in-from-bottom-8 duration-500"
        style={{ animation: 'slideUp 0.5s cubic-bezier(0.34,1.56,0.64,1) both' }}
      >
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
            <Rocket className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-black text-base">通知を送信しました！</span>
              <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-amber-400 opacity-75 relative" />
            </div>
            <p className="text-sm text-white/85 leading-relaxed">
              周辺のお気に入り登録ユーザー
              <span className="text-amber-300 font-black text-lg mx-1">{count}</span>
              人に<br />
              「今、{title}がお得です！」と通知しました🚀
            </p>
            <div className="mt-3 flex items-center gap-2">
              {[...Array(Math.min(count, 8))].map((_, i) => (
                <div
                  key={i}
                  className="w-6 h-6 rounded-full bg-white/30 border border-white/40 flex items-center justify-center text-[10px]"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  👤
                </div>
              ))}
              {count > 8 && <span className="text-xs text-white/70">+{count - 8}人</span>}
            </div>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white text-lg leading-none mt-0.5">×</button>
        </div>
      </div>
    </div>
  );
}

// ─── Connect ステータス型 ─────────────────────────────────────────────────────
interface ConnectStatus {
  connected: boolean;
  accountId?: string;
  detailsSubmitted?: boolean;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
}

// ─── メイン ──────────────────────────────────────────────────────────────────
export default function StoreDashboard() {
  const STORE_ID = 19;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'quick' | 'reservations' | 'bags' | 'analytics'>('quick');

  // ── Stripe Connect State ──
  const [connectStatus, setConnectStatus] = useState<ConnectStatus | null>(null);
  const [connectLoading, setConnectLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);

  // Connect ステータスを取得
  const fetchConnectStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/stores/${STORE_ID}/connect/status`);
      if (res.ok) {
        const data = await res.json();
        setConnectStatus(data);
      }
    } catch (e) {
      console.error('Connect status fetch error:', e);
    } finally {
      setStatusLoading(false);
    }
  }, [STORE_ID]);

  useEffect(() => {
    fetchConnectStatus();

    // Stripe オンボーディングから戻ってきた場合を検出
    const params = new URLSearchParams(window.location.search);
    if (params.get('stripe_connect') === 'return') {
      toast({ title: '振込先登録の処理が完了しました', description: 'Stripeによる審査後に有効になります' });
      // URLクエリパラメータをクリア
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [fetchConnectStatus]);

  // オンボーディング開始
  const handleConnectOnboard = async () => {
    setConnectLoading(true);
    try {
      const base = `${window.location.origin}${import.meta.env.BASE_URL?.replace(/\/$/, '') || ''}`;
      const returnUrl  = `${base}/store-dashboard?stripe_connect=return`;
      const refreshUrl = `${base}/store-dashboard?stripe_connect=refresh`;

      const res = await fetch(`/api/stores/${STORE_ID}/connect/onboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnUrl, refreshUrl }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'オンボーディングリンクの取得に失敗しました');
      }

      const { url } = await res.json();
      window.location.href = url;
    } catch (err: any) {
      toast({ title: 'エラー', description: err.message, variant: 'destructive' });
      setConnectLoading(false);
    }
  };

  // Quick listing state
  const [selectedTemplate, setSelectedTemplate] = useState<typeof TEMPLATES[0] | null>(null);
  const [quickQty, setQuickQty] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notifyVisible, setNotifyVisible] = useState(false);
  const [notifyCount, setNotifyCount] = useState(0);
  const [notifyTitle, setNotifyTitle] = useState('');

  // Photo-first quick list state
  const photoFileRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoTitle, setPhotoTitle] = useState('本日のサプライズバッグ');
  const [photoOriginal, setPhotoOriginal] = useState(1500);
  const [photoDiscounted, setPhotoDiscounted] = useState(500);
  const [photoQty, setPhotoQty] = useState(1);
  const now = new Date();
  const defaultPickupStart = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  const defaultPickupEnd = `${String((now.getHours() + 2) % 24).padStart(2,'0')}:00`;
  const [photoPickupStart, setPhotoPickupStart] = useState(defaultPickupStart);
  const [photoPickupEnd, setPhotoPickupEnd] = useState(defaultPickupEnd);
  const [photoSubmitting, setPhotoSubmitting] = useState(false);
  const [photoPublished, setPhotoPublished] = useState(false);

  const photoDiscountPct = photoOriginal > 0 ? Math.round((1 - photoDiscounted / photoOriginal) * 100) : 0;

  const handlePhotoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const c = await compressImage(file);
    setPhotoPreview(c);
    setPhotoUrl(c);
    toast({ title: `写真を追加しました！あとは値段と数量を設定するだけ ✓` });
  };

  const handlePhotoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhotoSubmitting(true);
    try {
      await createBag.mutateAsync({
        storeId: STORE_ID,
        data: {
          title: photoTitle,
          description: '本日の余り食材をたっぷり詰め合わせました',
          originalPrice: photoOriginal,
          discountedPrice: photoDiscounted,
          stockCount: photoQty,
          pickupStart: photoPickupStart,
          pickupEnd: photoPickupEnd,
          imageUrl: photoUrl || undefined,
        }
      });
      queryClient.invalidateQueries({ queryKey: ['/api/stores/19/bags'] });
      setPhotoPublished(true);
      const count = Math.floor(Math.random() * 60) + 20;
      setNotifyCount(count);
      setNotifyTitle(photoTitle);
      setNotifyVisible(true);
      // Reset form
      setTimeout(() => {
        setPhotoPublished(false);
        setPhotoPreview('');
        setPhotoUrl('');
        setPhotoTitle('本日のサプライズバッグ');
        setPhotoOriginal(1500);
        setPhotoDiscounted(500);
        setPhotoQty(1);
      }, 2500);
    } catch (err: any) {
      toast({ title: 'エラー', description: err.message, variant: 'destructive' });
    } finally {
      setPhotoSubmitting(false);
    }
  };

  // Manual create state
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: '', description: '',
    originalPrice: 1000, discountedPrice: 300,
    stockCount: 5, pickupStart: '18:00', pickupEnd: '20:00'
  });

  const { data: bags, isLoading: isLoadingBags } = useListStoreBags(STORE_ID);
  const { data: reservations, isLoading: isLoadingRes } = useListReservations({ storeId: STORE_ID });
  const createBag = useCreateBag();
  const updateResStatus = useUpdateReservationStatus();

  const pickedUpCount = reservations?.filter(r => r.status === 'picked_up').length ?? 0;
  const co2Saved = +(pickedUpCount * 2.5).toFixed(1);
  const ecoRank = getStoreEcoRank(co2Saved);
  const progress = getStoreProgress(co2Saved, ecoRank);
  const discountPercent = formData.originalPrice > 0 ? Math.round((1 - formData.discountedPrice / formData.originalPrice) * 100) : 0;

  // ── クイック出品 ──
  const handleQuickSubmit = async () => {
    if (!selectedTemplate) return;
    setIsSubmitting(true);
    try {
      await createBag.mutateAsync({
        storeId: STORE_ID,
        data: {
          title: selectedTemplate.title,
          description: selectedTemplate.description,
          originalPrice: selectedTemplate.originalPrice,
          discountedPrice: selectedTemplate.discountedPrice,
          stockCount: quickQty,
          pickupStart: selectedTemplate.pickupStart,
          pickupEnd: selectedTemplate.pickupEnd,
        }
      });
      queryClient.invalidateQueries({ queryKey: ['/api/stores/19/bags'] });

      // 通知演出
      const count = Math.floor(Math.random() * 60) + 20;
      setNotifyCount(count);
      setNotifyTitle(selectedTemplate.label);
      setNotifyVisible(true);

      setSelectedTemplate(null);
      setQuickQty(5);
    } catch (err: any) {
      toast({ title: "エラー", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── 手動出品 ──
  const handleCreateBag = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createBag.mutateAsync({ storeId: STORE_ID, data: formData });
      toast({ title: "出品しました！" });
      setIsCreating(false);
      setFormData({ ...formData, title: '', description: '' });
      queryClient.invalidateQueries({ queryKey: ['/api/stores/19/bags'] });
    } catch (err: any) {
      toast({ title: "エラー", description: err.message, variant: "destructive" });
    }
  };

  const handleCompletePickup = async (reservationId: number) => {
    try {
      await updateResStatus.mutateAsync({ reservationId, data: { status: 'picked_up' } });
      toast({ title: "受取を完了しました" });
      queryClient.invalidateQueries({ queryKey: ['/api/reservations'] });
    } catch (err: any) {
      toast({ title: "エラー", description: err.message, variant: "destructive" });
    }
  };

  const TABS = [
    { key: 'quick',        label: 'クイック出品', icon: <Zap className="w-3.5 h-3.5" /> },
    { key: 'reservations', label: '予約管理',     icon: <Check className="w-3.5 h-3.5" /> },
    { key: 'bags',         label: '出品一覧',     icon: <Box className="w-3.5 h-3.5" /> },
    { key: 'analytics',   label: '分析',         icon: <BarChart2 className="w-3.5 h-3.5" /> },
  ] as const;

  return (
    <Layout>
      <NotificationBlast
        visible={notifyVisible}
        count={notifyCount}
        title={notifyTitle}
        onClose={() => setNotifyVisible(false)}
      />

      <div className="max-w-3xl mx-auto py-6 px-4">

        {/* ── ストアヘッダー ── */}
        <div className="flex items-center gap-4 mb-4 bg-card border border-border p-4 rounded-2xl shadow-sm">
          <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
            <StoreIcon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-black truncate">渋谷ベーカリー 幸福堂</h1>
            <p className="text-xs text-muted-foreground font-medium">店舗管理ダッシュボード</p>
          </div>
          <div className={`text-xs font-black px-3 py-1.5 rounded-full flex items-center gap-1 ${ecoRank.badgeBg} ${ecoRank.badgeText}`}>
            <span>{ecoRank.icon}</span> {ecoRank.label}
          </div>
        </div>

        {/* ── エコランク ── */}
        <div className={`border-2 rounded-2xl p-4 mb-4 shadow-sm ${ecoRank.sectionBg} ${ecoRank.sectionBorder}`}>
          <div className="flex items-end gap-2 mb-2">
            <Leaf className={`w-5 h-5 ${ecoRank.valueText}`} />
            <span className={`text-3xl font-black leading-none ${ecoRank.valueText}`}>{co2Saved}</span>
            <span className={`text-sm font-bold mb-0.5 ${ecoRank.labelText}`}>kg CO2削減</span>
            <span className={`text-xs font-bold mb-1 ml-1 ${ecoRank.labelText}`}>/ {pickedUpCount}食レスキュー</span>
          </div>
          {ecoRank.rank < 3 && (
            <>
              <div className={`w-full h-1.5 rounded-full overflow-hidden ${ecoRank.rank === 1 ? 'bg-green-200' : 'bg-emerald-300'}`}>
                <div className={`h-full rounded-full transition-all duration-700 ${ecoRank.progressColor}`} style={{ width: `${Math.max(4, progress)}%` }} />
              </div>
              <p className={`text-[10px] font-bold mt-1 ${ecoRank.labelText}`}>{ecoRank.sublabel}</p>
            </>
          )}
        </div>

        {/* ── 売上振込先カード ── */}
        {(() => {
          const isComplete = connectStatus?.detailsSubmitted && connectStatus?.chargesEnabled;
          const isPending  = connectStatus?.connected && !isComplete;

          return (
            <div className={`mb-4 rounded-2xl border p-4 shadow-sm transition-colors
              ${isComplete ? 'bg-green-50 border-green-200' : isPending ? 'bg-amber-50 border-amber-200' : 'bg-card border-border'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0
                  ${isComplete ? 'bg-green-100' : isPending ? 'bg-amber-100' : 'bg-primary/10'}`}>
                  {statusLoading
                    ? <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
                    : isComplete
                      ? <CheckCircle2 className="w-5 h-5 text-green-600" />
                      : isPending
                        ? <AlertCircle className="w-5 h-5 text-amber-500" />
                        : <Building2 className="w-5 h-5 text-primary" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-black
                    ${isComplete ? 'text-green-800' : isPending ? 'text-amber-800' : 'text-foreground'}`}>
                    {isComplete ? '振込先の登録が完了しています' : isPending ? '振込先の審査中・設定中' : '売上振込先を登録する'}
                  </p>
                  <p className={`text-[11px] mt-0.5 leading-relaxed
                    ${isComplete ? 'text-green-700' : isPending ? 'text-amber-700' : 'text-muted-foreground'}`}>
                    {isComplete
                      ? `決済が自動的に振り込まれます (ID: ${connectStatus?.accountId?.slice(0, 18)}…)`
                      : isPending
                        ? 'Stripeで審査が完了すると振込が有効になります'
                        : '決済の売上を受け取るには銀行口座の登録が必要です'}
                  </p>
                </div>
                {!statusLoading && !isComplete && (
                  <button
                    onClick={handleConnectOnboard}
                    disabled={connectLoading}
                    className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all active:scale-95 shadow-sm
                      ${isPending
                        ? 'bg-amber-500 text-white hover:bg-amber-600'
                        : 'bg-primary text-primary-foreground hover:bg-primary/90'
                      }`}
                  >
                    {connectLoading
                      ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />処理中</>
                      : <><ExternalLink className="w-3.5 h-3.5" />{isPending ? '続きを設定' : '登録する'}</>
                    }
                  </button>
                )}
              </div>
            </div>
          );
        })()}

        {/* ── タブ ── */}
        <div className="flex bg-muted p-1 rounded-xl mb-5 gap-1">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${activeTab === tab.key ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════
            ステップ1: クイック出品
        ══════════════════════════════════════ */}
        {activeTab === 'quick' && (
          <div>

            {/* ══ 超速フォト出品 ══ */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-black">超速フォト出品</h2>
                <span className="text-[10px] bg-primary/10 text-primary font-black px-2 py-1 rounded-full">写真を載せるだけ！</span>
              </div>

              <form onSubmit={handlePhotoSubmit} className="space-y-3">
                {/* Photo area — takes center stage */}
                <div
                  onClick={() => photoFileRef.current?.click()}
                  className={`relative w-full rounded-2xl overflow-hidden cursor-pointer group transition-all
                    ${photoPreview ? 'h-56' : 'h-52 border-2 border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10'}`}
                >
                  {photoPreview ? (
                    <>
                      <img src={photoPreview} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="text-white text-center">
                          <Camera className="w-8 h-8 mx-auto mb-1" />
                          <span className="text-sm font-bold">写真を変更</span>
                        </div>
                      </div>
                      {photoPublished && (
                        <div className="absolute inset-0 bg-primary/90 flex flex-col items-center justify-center">
                          <div className="text-white text-center">
                            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                              <Zap className="w-8 h-8" />
                            </div>
                            <p className="text-xl font-black">公開しました！</p>
                            <p className="text-sm opacity-80 mt-1">ホーム画面に即時反映されました</p>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mb-3">
                        <ImagePlus className="w-8 h-8 text-primary" />
                      </div>
                      <p className="font-black text-primary">タップして写真を追加</p>
                      <p className="text-xs text-primary/60 mt-1">カメラロール・撮影どちらでも OK</p>
                    </div>
                  )}
                </div>
                <input ref={photoFileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoFile} />

                {/* Title */}
                <input
                  value={photoTitle}
                  onChange={e => setPhotoTitle(e.target.value)}
                  className="w-full bg-background border border-input rounded-xl px-4 py-3 font-black text-base focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none"
                  placeholder="例: 本日のサプライズバッグ"
                />

                {/* Price row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1">定価</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm">¥</span>
                      <input type="number" min="100" value={photoOriginal} onChange={e => setPhotoOriginal(Number(e.target.value))}
                        className="w-full bg-background border border-input rounded-xl pl-7 pr-3 py-3 font-bold text-base focus:ring-2 focus:ring-primary/40 outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1">
                      販売価格
                      {photoDiscountPct > 0 && <span className="ml-1.5 text-amber-600 font-black">{photoDiscountPct}% OFF</span>}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary font-bold text-sm">¥</span>
                      <input type="number" min="100" value={photoDiscounted} onChange={e => setPhotoDiscounted(Number(e.target.value))}
                        className="w-full bg-background border-2 border-primary/30 rounded-xl pl-7 pr-3 py-3 font-black text-primary text-base focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
                    </div>
                  </div>
                </div>

                {/* Pickup time */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1">受取開始</label>
                    <input type="time" value={photoPickupStart} onChange={e => setPhotoPickupStart(e.target.value)}
                      className="w-full bg-background border border-input rounded-xl px-3 py-3 font-bold focus:ring-2 focus:ring-primary/40 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1">受取終了</label>
                    <input type="time" value={photoPickupEnd} onChange={e => setPhotoPickupEnd(e.target.value)}
                      className="w-full bg-background border border-input rounded-xl px-3 py-3 font-bold focus:ring-2 focus:ring-primary/40 outline-none" />
                  </div>
                </div>

                {/* Quantity */}
                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold text-muted-foreground shrink-0">数量</span>
                  <div className="flex items-center bg-background border border-input rounded-xl overflow-hidden h-12">
                    <button type="button" onClick={() => setPhotoQty(q => Math.max(1, q - 1))}
                      className="w-11 h-full flex items-center justify-center bg-secondary hover:bg-secondary/80 font-bold text-xl active:scale-90 transition-transform text-foreground">−</button>
                    <span className="w-12 text-center font-black text-lg text-foreground">{photoQty}</span>
                    <button type="button" onClick={() => setPhotoQty(q => q + 1)}
                      className="w-11 h-full flex items-center justify-center bg-secondary hover:bg-secondary/80 font-bold text-xl active:scale-90 transition-transform text-foreground">＋</button>
                  </div>
                  <span className="text-xs text-muted-foreground">個</span>
                </div>

                {/* Submit */}
                <button type="submit" disabled={photoSubmitting || photoPublished}
                  className="w-full bg-primary text-primary-foreground font-black text-lg py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-primary/30 hover:bg-primary/90 active:scale-[0.99] transition-all disabled:opacity-70 min-h-[58px]"
                >
                  {photoSubmitting
                    ? <><RefreshCw className="w-5 h-5 animate-spin" /> 公開中...</>
                    : photoPublished
                    ? <><Zap className="w-5 h-5" /> 公開しました！</>
                    : <><Zap className="w-5 h-5" /> 今すぐ出品する</>
                  }
                </button>
                <p className="text-center text-xs text-muted-foreground">即時公開 — ユーザーのホーム画面に反映されます</p>
              </form>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs font-bold text-muted-foreground">またはテンプレートから</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-black">30秒クイック出品</h2>
              <span className="text-xs bg-amber-100 text-amber-700 font-bold px-2 py-1 rounded-full">3タップで完了</span>
            </div>

            {/* STEP 1: テンプレート選択 */}
            <div className="mb-5">
              <p className="text-xs font-bold text-muted-foreground mb-3 flex items-center gap-1">
                <span className="w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-[10px] font-black">1</span>
                出品するメニューをタップ
              </p>
              <div className="grid grid-cols-3 gap-2.5">
                {TEMPLATES.map(tpl => (
                  <button
                    key={tpl.id}
                    onClick={() => { setSelectedTemplate(tpl); setQuickQty(5); }}
                    className={`relative p-3 rounded-2xl border-2 text-left transition-all active:scale-95 ${
                      selectedTemplate?.id === tpl.id
                        ? 'border-primary bg-primary/5 shadow-md shadow-primary/20 scale-[1.02]'
                        : 'border-border bg-card hover:border-primary/40 hover:bg-secondary/30'
                    }`}
                  >
                    {selectedTemplate?.id === tpl.id && (
                      <div className="absolute top-2 right-2 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                    <div className="text-2xl mb-1.5">{tpl.emoji}</div>
                    <div className="text-xs font-black text-foreground leading-tight mb-1">{tpl.label}</div>
                    <div className="text-[10px] text-muted-foreground">
                      <span className="line-through">¥{tpl.originalPrice}</span>
                      <span className="text-primary font-bold ml-1">¥{tpl.discountedPrice}</span>
                    </div>
                    <div className="text-[9px] text-muted-foreground mt-0.5 flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />{tpl.pickupStart}〜{tpl.pickupEnd}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* STEP 2: 数量選択（テンプレート選択後に表示） */}
            {selectedTemplate && (
              <div className="mb-5 bg-primary/5 border-2 border-primary/20 rounded-2xl p-4 transition-all">
                <p className="text-xs font-bold text-muted-foreground mb-3 flex items-center gap-1">
                  <span className="w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-[10px] font-black">2</span>
                  個数を選ぶ
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center bg-background border-2 border-border rounded-2xl overflow-hidden shadow-sm">
                    <button
                      onClick={() => setQuickQty(Math.max(1, quickQty - 1))}
                      className="w-14 h-14 flex items-center justify-center bg-secondary hover:bg-secondary/70 active:bg-secondary/50 text-xl font-black transition-colors"
                    >
                      <ChevronDown className="w-6 h-6" />
                    </button>
                    <span className="w-16 text-center text-3xl font-black">{quickQty}</span>
                    <button
                      onClick={() => setQuickQty(Math.min(99, quickQty + 1))}
                      className="w-14 h-14 flex items-center justify-center bg-secondary hover:bg-secondary/70 active:bg-secondary/50 text-xl font-black transition-colors"
                    >
                      <ChevronUp className="w-6 h-6" />
                    </button>
                  </div>
                  <div className="text-sm text-muted-foreground font-medium">個</div>
                  <div className="flex-1 bg-background rounded-xl p-3 border border-border">
                    <div className="text-lg font-black">{selectedTemplate.emoji} {selectedTemplate.label}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                      <span className="line-through">¥{selectedTemplate.originalPrice}</span>
                      <span className="text-primary font-bold text-sm">¥{selectedTemplate.discountedPrice}</span>
                      <span className="bg-orange-100 text-orange-600 font-bold px-1.5 rounded text-[10px]">
                        {Math.round((1 - selectedTemplate.discountedPrice / selectedTemplate.originalPrice) * 100)}%OFF
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: 出品ボタン */}
            <div>
              <p className={`text-xs font-bold mb-3 flex items-center gap-1 ${selectedTemplate ? 'text-muted-foreground' : 'text-muted-foreground/40'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${selectedTemplate ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>3</span>
                出品する
              </p>
              <button
                onClick={handleQuickSubmit}
                disabled={!selectedTemplate || isSubmitting}
                className={`w-full py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all ${
                  selectedTemplate
                    ? 'bg-primary text-primary-foreground shadow-xl shadow-primary/30 hover:bg-primary/90 hover:-translate-y-0.5 active:translate-y-0 active:shadow-md'
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                }`}
              >
                {isSubmitting ? (
                  <RefreshCw className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <Zap className="w-6 h-6" />
                    {selectedTemplate ? `${selectedTemplate.emoji} ${quickQty}個を今すぐ出品する` : 'メニューを選んでください'}
                  </>
                )}
              </button>
            </div>

            {/* 最近の出品 */}
            {bags && bags.length > 0 && (
              <div className="mt-8">
                <h3 className="text-sm font-black text-muted-foreground mb-3 flex items-center gap-1">
                  <Box className="w-4 h-4" /> 出品中（{bags.length}件）
                </h3>
                <div className="space-y-2">
                  {bags.slice(0, 3).map(bag => (
                    <div key={bag.id} className="bg-card border border-border rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm truncate">{bag.title}</div>
                        <div className="text-xs text-muted-foreground">{bag.pickupStart} – {bag.pickupEnd}</div>
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        <span className={`text-xs font-bold px-2 py-1 rounded-lg ${bag.stockCount > 0 ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
                          残{bag.stockCount}個
                        </span>
                        <span className="font-black text-primary">¥{bag.discountedPrice}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════
            予約管理
        ══════════════════════════════════════ */}
        {activeTab === 'reservations' && (
          <div className="space-y-4">
            <h2 className="text-lg font-black mb-4">本日の受取予定</h2>
            {isLoadingRes ? (
              <div className="h-32 bg-card rounded-2xl animate-pulse" />
            ) : !reservations?.filter(r => r.status === 'confirmed').length ? (
              <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-border rounded-2xl bg-card flex flex-col items-center">
                <Check className="w-12 h-12 text-muted-foreground/30 mb-3" />
                未処理の予約はありません
              </div>
            ) : (
              <div className="grid gap-4">
                {reservations!.filter(r => r.status === 'confirmed').map(res => (
                  <div key={res.id} className="bg-card border border-border rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm hover:shadow-md transition-shadow">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="bg-secondary font-mono px-3 py-1 rounded-md text-sm font-black tracking-widest border border-border">{res.pickupCode}</span>
                        <span className="text-muted-foreground text-sm font-bold bg-muted px-2 py-1 rounded">{res.bag?.pickupStart} - {res.bag?.pickupEnd}</span>
                      </div>
                      <div className="font-bold text-lg">{res.bag?.title} <span className="text-primary font-black ml-2">× {res.quantity}</span></div>
                    </div>
                    <button
                      onClick={() => handleCompletePickup(res.id)}
                      disabled={updateResStatus.isPending}
                      className="bg-primary text-primary-foreground font-bold px-6 py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-sm active:scale-95"
                    >
                      <Check className="w-5 h-5" /> 受渡完了にする
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════
            出品一覧 + 手動フォーム
        ══════════════════════════════════════ */}
        {activeTab === 'bags' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-black">出品中のバッグ</h2>
              <button
                onClick={() => setIsCreating(!isCreating)}
                className="bg-foreground text-background font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm hover:bg-foreground/90 transition-all shadow-md active:scale-95"
              >
                {isCreating ? 'キャンセル' : <><Plus className="w-4 h-4" /> 詳細入力で出品</>}
              </button>
            </div>

            {isCreating && (
              <form onSubmit={handleCreateBag} className="bg-card border-2 border-primary/20 rounded-2xl p-6 mb-8 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
                <h3 className="font-black text-lg mb-4">詳細出品フォーム</h3>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-muted-foreground mb-1.5">商品名</label>
                    <input required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full bg-background border border-input rounded-xl px-4 py-3 font-bold text-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all placeholder:text-muted-foreground/50 placeholder:font-normal" placeholder="例: 本日のパン詰め合わせ" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-muted-foreground mb-1.5">通常価格</label>
                      <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">¥</span><input type="number" required value={formData.originalPrice} onChange={e => setFormData({ ...formData, originalPrice: Number(e.target.value) })} className="w-full bg-background border border-input rounded-xl pl-8 pr-4 py-3 font-bold focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all" /></div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-muted-foreground mb-1.5">割引価格</label>
                      <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold">¥</span><input type="number" required value={formData.discountedPrice} onChange={e => setFormData({ ...formData, discountedPrice: Number(e.target.value) })} className="w-full bg-background border-2 border-primary/30 rounded-xl pl-8 pr-4 py-3 font-black text-primary focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all" /></div>
                    </div>
                  </div>
                  {discountPercent > 0 && (
                    <div className="bg-accent/10 border border-accent/20 rounded-xl p-3 flex justify-between items-center text-sm font-bold">
                      <span>割引率</span><span className="text-xl text-accent bg-accent/20 px-3 py-1 rounded-lg">{discountPercent}% OFF</span>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-bold text-muted-foreground mb-1.5">在庫数</label>
                    <div className="flex items-center w-32 bg-background border border-input rounded-xl overflow-hidden h-12">
                      <button type="button" onClick={() => setFormData({ ...formData, stockCount: Math.max(1, formData.stockCount - 1) })} className="w-10 h-full flex items-center justify-center bg-secondary hover:bg-secondary/80 font-bold text-xl">-</button>
                      <input type="number" required min="1" value={formData.stockCount} onChange={e => setFormData({ ...formData, stockCount: Number(e.target.value) })} className="flex-1 text-center font-bold text-lg bg-transparent border-none focus:ring-0 p-0" />
                      <button type="button" onClick={() => setFormData({ ...formData, stockCount: formData.stockCount + 1 })} className="w-10 h-full flex items-center justify-center bg-secondary hover:bg-secondary/80 font-bold text-xl">+</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-bold text-muted-foreground mb-1.5">受取開始</label><input type="time" required value={formData.pickupStart} onChange={e => setFormData({ ...formData, pickupStart: e.target.value })} className="w-full bg-background border border-input rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-primary/50 outline-none" /></div>
                    <div><label className="block text-sm font-bold text-muted-foreground mb-1.5">受取終了</label><input type="time" required value={formData.pickupEnd} onChange={e => setFormData({ ...formData, pickupEnd: e.target.value })} className="w-full bg-background border border-input rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-primary/50 outline-none" /></div>
                  </div>
                  <div><label className="block text-sm font-bold text-muted-foreground mb-1.5">説明文 (任意)</label><textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full bg-background border border-input rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50 outline-none transition-all resize-none" rows={2} /></div>
                </div>
                <button type="submit" disabled={createBag.isPending} className="w-full mt-6 bg-primary text-primary-foreground font-black text-lg py-4 rounded-xl flex items-center justify-center shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all">
                  {createBag.isPending ? <RefreshCw className="w-6 h-6 animate-spin" /> : '今すぐ出品する'}
                </button>
              </form>
            )}

            {isLoadingBags ? (
              <div className="space-y-4">{[1, 2].map(i => <div key={i} className="h-32 bg-card rounded-2xl animate-pulse" />)}</div>
            ) : (
              <div className="grid gap-4">
                {bags?.map(bag => (
                  <div key={bag.id} className="bg-card border border-border rounded-xl p-5 flex flex-col md:flex-row gap-4 hover:shadow-md transition-shadow relative overflow-hidden">
                    <div className="flex-1">
                      <h3 className="font-bold text-foreground text-lg truncate pr-2 mb-2">{bag.title}</h3>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3 font-medium">
                        <span className="bg-secondary px-2 py-1 rounded">受取: {bag.pickupStart} - {bag.pickupEnd}</span>
                        <span className={`px-2 py-1 rounded font-bold flex items-center gap-1 ${bag.stockCount > 0 ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
                          <Box className="w-3.5 h-3.5" /> 在庫: {bag.stockCount}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground line-clamp-1">{bag.description || '説明なし'}</div>
                    </div>
                    <div className="flex items-end justify-between md:flex-col md:justify-center md:items-end bg-secondary/30 p-4 rounded-lg md:w-40 border border-border/50">
                      <span className="text-xs font-bold text-muted-foreground line-through decoration-destructive/50">¥{bag.originalPrice}</span>
                      <span className="font-black text-xl text-primary">¥{bag.discountedPrice}</span>
                    </div>
                  </div>
                ))}
                {!bags?.length && !isCreating && (
                  <div className="text-center py-12 text-muted-foreground bg-card rounded-xl border border-dashed border-border">出品中のバッグはありません</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════
            ステップ3: 分析グラフ
        ══════════════════════════════════════ */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-black">販売分析</h2>
              <span className="text-xs bg-primary/10 text-primary font-bold px-2 py-1 rounded-full">過去30日</span>
            </div>

            {/* KPI カード */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: '総販売数', value: '147', unit: '個', color: 'text-primary', bg: 'bg-primary/10' },
                { label: '売上合計', value: '¥52,150', unit: '', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: '購入率', value: '84', unit: '%', color: 'text-amber-600', bg: 'bg-amber-50' },
              ].map(kpi => (
                <div key={kpi.label} className={`${kpi.bg} rounded-2xl p-4 text-center`}>
                  <div className={`text-xl font-black ${kpi.color}`}>{kpi.value}<span className="text-sm">{kpi.unit}</span></div>
                  <div className="text-xs text-muted-foreground font-bold mt-1">{kpi.label}</div>
                </div>
              ))}
            </div>

            {/* 時間帯別グラフ */}
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-primary" />
                <h3 className="font-black text-sm">時間帯別の販売数（今週平均）</h3>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={hourlyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="hour" tick={{ fontSize: 10, fontWeight: 700, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#1f2937', border: 'none', borderRadius: '10px', color: 'white', fontSize: 12 }}
                    formatter={(v: number) => [`${v}個`, '販売数']}
                  />
                  <Bar dataKey="sales" radius={[6, 6, 0, 0]}>
                    {hourlyData.map((entry, i) => (
                      <Cell key={i} fill={entry.sales >= 15 ? '#2D5A51' : entry.sales >= 8 ? '#4a8a7a' : '#a8d5cb'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="flex items-center justify-end gap-4 mt-2 text-[10px] font-bold text-muted-foreground">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-[#2D5A51] inline-block" />15個以上</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-[#4a8a7a] inline-block" />8〜14個</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-[#a8d5cb] inline-block" />〜7個</span>
              </div>
            </div>

            {/* 曜日別グラフ */}
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 className="w-4 h-4 text-primary" />
                <h3 className="font-black text-sm">曜日別の人気度</h3>
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {weeklyData.map(d => (
                  <div key={d.day} className="flex flex-col items-center gap-1">
                    <div className="text-xs font-black text-muted-foreground">{d.day}</div>
                    <div className="relative w-full flex justify-center">
                      <div className="w-full max-w-[36px] h-24 bg-secondary rounded-xl overflow-hidden flex items-end">
                        <div
                          className={`w-full rounded-xl transition-all duration-700 ${d.rate >= 90 ? 'bg-[#2D5A51]' : d.rate >= 70 ? 'bg-[#4a8a7a]' : 'bg-[#a8d5cb]'}`}
                          style={{ height: `${d.rate}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-[10px] font-black text-foreground">{d.sales}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-600 shrink-0" />
                <p className="text-xs font-bold text-amber-700">
                  <span className="font-black">金・土曜</span>が最も売れています。前日夜に多めに準備すると効果的です。
                </p>
              </div>
            </div>

            {/* 人気商品ランキング */}
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
              <h3 className="font-black text-sm mb-4 flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" />人気商品 TOP3
              </h3>
              <div className="space-y-3">
                {[
                  { rank: 1, emoji: '🍞', name: 'パン詰め合わせ', count: 58, pct: 100 },
                  { rank: 2, emoji: '🎂', name: 'ケーキセット',   count: 42, pct: 72 },
                  { rank: 3, emoji: '🥗', name: 'サラダ弁当',     count: 31, pct: 53 },
                ].map(item => (
                  <div key={item.rank} className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${item.rank === 1 ? 'bg-amber-400 text-white' : item.rank === 2 ? 'bg-gray-300 text-gray-700' : 'bg-orange-300 text-white'}`}>{item.rank}</span>
                    <span className="text-base">{item.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-bold truncate">{item.name}</span>
                        <span className="text-sm font-black text-primary shrink-0 ml-2">{item.count}個</span>
                      </div>
                      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${item.pct}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
