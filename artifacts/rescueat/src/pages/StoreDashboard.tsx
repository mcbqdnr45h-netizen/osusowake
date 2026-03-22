import React, { useState, useEffect } from 'react';
import { StoreLayout } from '@/components/StoreLayout';
import { useMyStore } from '@/hooks/use-my-store';
import {
  useListReservations,
  useListStoreBags,
  useCreateBag,
  useUpdateReservationStatus,
} from '@workspace/api-client-react';
import {
  Plus, Clock, CheckCircle2, Package2, X, ChevronUp, ChevronDown,
  Loader2, AlertCircle, BarChart2, RefreshCw, Ticket,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { format, isToday, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';

// ─── 型 ────────────────────────────────────────────────────────────────────
type ReservationStatus = 'pending' | 'confirmed' | 'picked_up' | 'cancelled';

interface Reservation {
  id: number;
  userId: string;
  status: ReservationStatus;
  pickupCode: string | null;
  quantity: number;
  totalPrice: number;
  createdAt: string;
  bag: {
    id: number;
    title: string;
    pickupStart: string | null;
    pickupEnd: string | null;
    discountedPrice: number;
    originalPrice: number;
  } | null;
}

// ─── ヘルパー ───────────────────────────────────────────────────────────────
function isTodaysReservation(r: Reservation) {
  try { return isToday(parseISO(r.createdAt)); } catch { return false; }
}

function statusLabel(s: ReservationStatus) {
  if (s === 'pending')    return { text: '決済待ち', cls: 'bg-amber-50 text-amber-700 border-amber-200' };
  if (s === 'confirmed')  return { text: '確認済み', cls: 'bg-blue-50 text-blue-700 border-blue-200' };
  if (s === 'picked_up')  return { text: '受取済み', cls: 'bg-green-50 text-green-700 border-green-200' };
  return { text: 'キャンセル', cls: 'bg-gray-100 text-gray-500 border-gray-200' };
}

// ─── クイック出品テンプレート ────────────────────────────────────────────
const TEMPLATES = [
  { emoji: '🍞', label: 'パン詰め合わせ',   title: '本日のパン詰め合わせ',   originalPrice: 1200, discountedPrice: 400, pickupStart: '18:00', pickupEnd: '20:00' },
  { emoji: '🍱', label: 'お弁当セット',     title: '本日のお弁当セット',     originalPrice: 900,  discountedPrice: 300, pickupStart: '19:00', pickupEnd: '21:00' },
  { emoji: '🎂', label: 'スイーツセット',   title: '本日のスイーツセット',   originalPrice: 1500, discountedPrice: 500, pickupStart: '17:00', pickupEnd: '19:00' },
  { emoji: '🥗', label: 'サラダ・惣菜',     title: '本日のサラダ・惣菜セット', originalPrice: 800,  discountedPrice: 280, pickupStart: '19:30', pickupEnd: '21:30' },
  { emoji: '🍣', label: 'お寿司セット',     title: '本日のお寿司セット',     originalPrice: 2000, discountedPrice: 700, pickupStart: '20:00', pickupEnd: '22:00' },
  { emoji: '☕', label: 'カフェセット',     title: '本日のカフェセット',     originalPrice: 1000, discountedPrice: 350, pickupStart: '16:00', pickupEnd: '18:00' },
];

// ─── 出品モーダル ────────────────────────────────────────────────────────
function PostBagModal({
  storeId,
  onClose,
  onSuccess,
}: {
  storeId: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const createBag = useCreateBag();
  const [mode, setMode] = useState<'quick' | 'manual'>('quick');
  const [selected, setSelected] = useState<typeof TEMPLATES[0] | null>(null);
  const [qty, setQty] = useState(3);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 手動フォーム
  const [form, setForm] = useState({
    title: '',
    originalPrice: 1000,
    discountedPrice: 350,
    stockCount: 3,
    pickupStart: '18:00',
    pickupEnd: '20:00',
  });

  async function handleQuickSubmit() {
    if (!selected) return;
    setIsSubmitting(true);
    try {
      await createBag.mutateAsync({
        storeId,
        data: {
          title: selected.title,
          description: '',
          originalPrice: selected.originalPrice,
          discountedPrice: selected.discountedPrice,
          stockCount: qty,
          pickupStart: selected.pickupStart,
          pickupEnd: selected.pickupEnd,
        },
      });
      toast({ title: '出品しました！', description: `${selected.emoji} ${selected.label} × ${qty}個` });
      onSuccess();
    } catch {
      toast({ title: '出品に失敗しました', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || form.discountedPrice <= 0) return;
    setIsSubmitting(true);
    try {
      await createBag.mutateAsync({
        storeId,
        data: {
          title: form.title,
          description: '',
          originalPrice: form.originalPrice,
          discountedPrice: form.discountedPrice,
          stockCount: form.stockCount,
          pickupStart: form.pickupStart,
          pickupEnd: form.pickupEnd,
        },
      });
      toast({ title: '出品しました！' });
      onSuccess();
    } catch {
      toast({ title: '出品に失敗しました', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-end"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        className="w-full max-h-[90dvh] bg-white rounded-t-3xl overflow-hidden flex flex-col"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* モーダルヘッダー */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border shrink-0">
          <div>
            <h2 className="text-lg font-black text-foreground">サプライズバッグを出品する</h2>
            <p className="text-xs text-muted-foreground mt-0.5">今日おすそ分けできる商品を選んでください</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/70 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* モード切替 */}
        <div className="px-5 pt-4 shrink-0">
          <div className="flex bg-secondary rounded-xl p-1 gap-1">
            <button
              onClick={() => setMode('quick')}
              className={`flex-1 py-2 rounded-lg text-sm font-black transition-all ${
                mode === 'quick' ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              ⚡ クイック出品
            </button>
            <button
              onClick={() => setMode('manual')}
              className={`flex-1 py-2 rounded-lg text-sm font-black transition-all ${
                mode === 'manual' ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              ✏️ 手動で入力
            </button>
          </div>
        </div>

        {/* スクロールエリア */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {mode === 'quick' && (
            <>
              {/* テンプレートグリッド */}
              <div>
                <p className="text-xs font-bold text-muted-foreground mb-3">カテゴリーを選ぶ</p>
                <div className="grid grid-cols-3 gap-2">
                  {TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.label}
                      onClick={() => setSelected(tpl)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all ${
                        selected?.label === tpl.label
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-border bg-card hover:border-primary/40'
                      }`}
                    >
                      <span className="text-2xl">{tpl.emoji}</span>
                      <span className="text-[10px] font-bold text-foreground leading-tight text-center">{tpl.label}</span>
                      <span className="text-[10px] font-black text-primary">¥{tpl.discountedPrice}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 個数選択 */}
              <AnimatePresence>
                {selected && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-primary/5 border-2 border-primary/20 rounded-2xl p-4"
                  >
                    <p className="text-xs font-bold text-muted-foreground mb-3">出品する個数</p>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center bg-white border-2 border-border rounded-xl overflow-hidden shadow-sm">
                        <button
                          type="button"
                          onClick={() => setQty(Math.max(1, qty - 1))}
                          className="w-12 h-12 flex items-center justify-center hover:bg-muted transition-colors text-xl font-black"
                        >
                          <ChevronDown className="w-5 h-5" />
                        </button>
                        <span className="w-14 text-center text-2xl font-black">{qty}</span>
                        <button
                          type="button"
                          onClick={() => setQty(Math.min(99, qty + 1))}
                          className="w-12 h-12 flex items-center justify-center hover:bg-muted transition-colors text-xl font-black"
                        >
                          <ChevronUp className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="flex-1 bg-white rounded-xl p-3 border border-border">
                        <p className="text-sm font-black">{selected.emoji} {selected.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                          <Clock className="w-3 h-3" />
                          {selected.pickupStart}〜{selected.pickupEnd}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs line-through text-muted-foreground">¥{selected.originalPrice}</span>
                          <span className="text-sm font-black text-primary">¥{selected.discountedPrice}</span>
                          <span className="text-[10px] font-bold bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full">
                            {Math.round((1 - selected.discountedPrice / selected.originalPrice) * 100)}%OFF
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 出品ボタン */}
              <button
                onClick={handleQuickSubmit}
                disabled={!selected || isSubmitting}
                className={`w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 transition-all ${
                  selected && !isSubmitting
                    ? 'bg-primary text-white shadow-lg shadow-primary/25 active:scale-[0.98]'
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                }`}
              >
                {isSubmitting
                  ? <Loader2 className="w-5 h-5 animate-spin" />
                  : selected
                    ? <><Plus className="w-5 h-5" />{selected.emoji} {qty}個を今すぐ出品する</>
                    : 'カテゴリーを選んでください'
                }
              </button>
            </>
          )}

          {mode === 'manual' && (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              {/* 商品名 */}
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5">商品名</label>
                <input
                  required
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="例: 本日のパン詰め合わせ"
                  className="w-full bg-card border-2 border-border rounded-xl px-4 py-3 font-bold text-foreground placeholder:text-muted-foreground/50 placeholder:font-normal focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                />
              </div>

              {/* 価格 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1.5">通常価格</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm">¥</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      required
                      value={form.originalPrice || ''}
                      onChange={e => setForm({ ...form, originalPrice: e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0) })}
                      className="w-full bg-card border-2 border-border rounded-xl pl-7 pr-3 py-3 font-bold focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1.5">販売価格</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary font-bold text-sm">¥</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      required
                      value={form.discountedPrice || ''}
                      onChange={e => setForm({ ...form, discountedPrice: e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0) })}
                      className="w-full bg-card border-2 border-primary/30 rounded-xl pl-7 pr-3 py-3 font-black text-primary focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                    />
                  </div>
                  {form.originalPrice > 0 && form.discountedPrice > 0 && (
                    <p className="text-[10px] font-bold text-orange-500 mt-1">
                      {Math.round((1 - form.discountedPrice / form.originalPrice) * 100)}% OFF
                    </p>
                  )}
                </div>
              </div>

              {/* 在庫 */}
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5">在庫数</label>
                <div className="flex items-center w-36 bg-card border-2 border-border rounded-xl overflow-hidden h-12">
                  <button type="button" onClick={() => setForm({ ...form, stockCount: Math.max(1, form.stockCount - 1) })}
                    className="w-10 h-full flex items-center justify-center hover:bg-muted transition-colors font-bold text-xl">−</button>
                  <input
                    type="number"
                    inputMode="numeric"
                    required
                    min="1"
                    value={form.stockCount}
                    onChange={e => setForm({ ...form, stockCount: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                    className="flex-1 text-center font-bold text-lg bg-transparent border-none focus:ring-0 p-0 outline-none"
                  />
                  <button type="button" onClick={() => setForm({ ...form, stockCount: form.stockCount + 1 })}
                    className="w-10 h-full flex items-center justify-center hover:bg-muted transition-colors font-bold text-xl">＋</button>
                </div>
              </div>

              {/* 受取時間 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1.5">受取開始</label>
                  <input type="time" required value={form.pickupStart}
                    onChange={e => setForm({ ...form, pickupStart: e.target.value })}
                    className="w-full bg-card border-2 border-border rounded-xl px-3 py-3 font-bold focus:border-primary outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1.5">受取終了</label>
                  <input type="time" required value={form.pickupEnd}
                    onChange={e => setForm({ ...form, pickupEnd: e.target.value })}
                    className="w-full bg-card border-2 border-border rounded-xl px-3 py-3 font-bold focus:border-primary outline-none transition-all" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !form.title.trim() || form.discountedPrice <= 0}
                className={`w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 transition-all ${
                  !isSubmitting && form.title.trim() && form.discountedPrice > 0
                    ? 'bg-primary text-white shadow-lg shadow-primary/25 active:scale-[0.98]'
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                }`}
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Plus className="w-5 h-5" />出品する</>}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── 予約カード ──────────────────────────────────────────────────────────
function ReservationCard({
  res,
  onPickedUp,
  loading,
}: {
  res: Reservation;
  onPickedUp: (id: number) => void;
  loading: boolean;
}) {
  const badge = statusLabel(res.status);
  const code = res.pickupCode ?? '------';
  const customerShort = res.userId.slice(-6).toUpperCase();

  return (
    <div className="bg-white rounded-2xl border border-orange-100 shadow-[0_2px_12px_rgba(255,140,0,0.06)] overflow-hidden">
      {/* 上部バー */}
      <div className="flex items-center gap-3 px-4 pt-3 pb-2">
        {/* ピックアップコード */}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground font-medium">受取コード</p>
          <p className="text-xl font-black tracking-widest text-foreground font-mono">{code}</p>
        </div>
        {/* ステータスバッジ */}
        <span className={`text-xs font-black px-2.5 py-1 rounded-full border ${badge.cls}`}>
          {badge.text}
        </span>
      </div>

      <div className="px-4 pb-3 border-t border-gray-50">
        {/* バッグ名 */}
        <p className="text-sm font-black text-foreground mt-2 mb-1">{res.bag?.title ?? '商品名なし'}</p>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {res.bag?.pickupStart}〜{res.bag?.pickupEnd}
          </span>
          <span className="flex items-center gap-1">
            <Package2 className="w-3.5 h-3.5" />
            {res.quantity}個
          </span>
          <span className="flex items-center gap-1 font-bold text-primary">
            ¥{res.totalPrice.toLocaleString()}
          </span>
        </div>

        <p className="text-[10px] text-muted-foreground/60 mt-1.5">顧客ID: #{customerShort}</p>
      </div>

      {/* 受取済みボタン */}
      {(res.status === 'pending' || res.status === 'confirmed') && (
        <div className="px-4 pb-4">
          <button
            onClick={() => onPickedUp(res.id)}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-50 border border-green-200 text-green-700 font-black text-sm hover:bg-green-100 active:scale-[0.98] transition-all disabled:opacity-60"
          >
            {loading
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <><CheckCircle2 className="w-4 h-4" />受取済みにする</>
            }
          </button>
        </div>
      )}
    </div>
  );
}

// ─── メインページ ─────────────────────────────────────────────────────────
export default function StoreDashboard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { store, loading: storeLoading } = useMyStore();
  const storeId = store?.id ?? null;

  const [showPostModal, setShowPostModal] = useState(false);
  const [markingId, setMarkingId] = useState<number | null>(null);

  const { data: reservations = [], isLoading: resLoading, refetch } =
    useListReservations({ storeId: storeId ?? 0 }, { query: { enabled: !!storeId } });

  const { data: bags = [] } =
    useListStoreBags(storeId ?? 0, { query: { enabled: !!storeId } });

  const updateStatus = useUpdateReservationStatus();

  // 今日の未受取予約
  const todayPending = (reservations as Reservation[]).filter(
    r => isTodaysReservation(r) && (r.status === 'pending' || r.status === 'confirmed')
  );
  const todayPickedUp = (reservations as Reservation[]).filter(
    r => isTodaysReservation(r) && r.status === 'picked_up'
  );
  const activeBags = (bags as any[]).filter((b: any) => b.isActive);

  // 受取済みにする
  async function handlePickedUp(id: number) {
    setMarkingId(id);
    try {
      await updateStatus.mutateAsync({ reservationId: id, data: { status: 'picked_up' } });
      queryClient.invalidateQueries({ queryKey: [`/api/reservations`] });
      toast({ title: '受取済みにしました ✓' });
    } catch {
      toast({ title: '更新に失敗しました', variant: 'destructive' });
    } finally {
      setMarkingId(null);
    }
  }

  // ─── ローディング ────────────────────────────────────────────────────
  if (storeLoading) {
    return (
      <StoreLayout>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground font-medium">店舗情報を読み込み中...</p>
          </div>
        </div>
      </StoreLayout>
    );
  }

  // ─── 店舗未登録 ──────────────────────────────────────────────────────
  if (!store) {
    return (
      <StoreLayout>
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-orange-400" />
            </div>
            <h2 className="text-xl font-black mb-2">店舗が見つかりません</h2>
            <p className="text-sm text-muted-foreground mb-6">先に店舗登録を行ってください。</p>
            <a
              href="/store-onboarding"
              className="inline-flex items-center gap-2 bg-primary text-white font-bold px-6 py-3 rounded-2xl hover:bg-primary/90 transition-colors"
            >
              店舗登録を始める
            </a>
          </div>
        </div>
      </StoreLayout>
    );
  }

  const today = format(new Date(), 'M月d日（E）', { locale: ja });

  return (
    <StoreLayout>
      <div className="max-w-2xl mx-auto w-full px-4 py-5 space-y-5">

        {/* ── 今日の日付 + グリーティング ── */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-muted-foreground">{today}</p>
            <h1 className="text-xl font-black text-foreground mt-0.5">おはようございます 👋</h1>
          </div>
          <button
            onClick={() => refetch()}
            className="w-9 h-9 rounded-full bg-white border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-colors shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* ── 大きなCTAボタン ── */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowPostModal(true)}
          className="w-full bg-primary text-white rounded-2xl py-5 flex items-center justify-center gap-3 shadow-xl shadow-primary/25 hover:bg-primary/90 transition-all"
        >
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
            <Plus className="w-6 h-6" />
          </div>
          <div className="text-left">
            <p className="font-black text-base leading-tight">本日のサプライズバッグを出品する</p>
            <p className="text-xs text-white/75 font-medium mt-0.5">おすそ分けで食品ロスを減らそう</p>
          </div>
        </motion.button>

        {/* ── クイックサマリー ── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: '出品中', value: activeBags.length, unit: '件', color: 'text-primary', bg: 'bg-orange-50', border: 'border-orange-100' },
            { label: '本日の予約', value: todayPending.length, unit: '件', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
            { label: '本日受取済', value: todayPickedUp.length, unit: '件', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
          ].map(item => (
            <div key={item.label} className={`${item.bg} border ${item.border} rounded-2xl p-3 text-center`}>
              <p className={`text-2xl font-black ${item.color}`}>{item.value}</p>
              <p className="text-[10px] font-bold text-muted-foreground mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>

        {/* ── 本日の受取予定リスト ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-black text-foreground flex items-center gap-2">
              <Ticket className="w-5 h-5 text-primary" />
              本日の受取予定
            </h2>
            <span className="text-xs font-bold text-muted-foreground bg-secondary px-2.5 py-1 rounded-full">
              {todayPending.length}件
            </span>
          </div>

          {resLoading ? (
            <div className="flex items-center justify-center py-10 gap-2 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm font-medium">読み込み中...</span>
            </div>
          ) : todayPending.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-border p-8 text-center">
              <p className="text-3xl mb-3">📭</p>
              <p className="text-sm font-bold text-foreground">本日の予約はまだありません</p>
              <p className="text-xs text-muted-foreground mt-1">上のボタンから商品を出品してみましょう</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayPending.map(res => (
                <ReservationCard
                  key={res.id}
                  res={res as Reservation}
                  onPickedUp={handlePickedUp}
                  loading={markingId === res.id}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── 本日受取済み（折りたたみ） ── */}
        {todayPickedUp.length > 0 && (
          <details className="group">
            <summary className="flex items-center gap-2 cursor-pointer select-none text-sm font-bold text-muted-foreground list-none">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              本日の受取済み（{todayPickedUp.length}件）
              <span className="ml-auto text-xs text-muted-foreground/60 group-open:hidden">▼ 表示</span>
              <span className="ml-auto text-xs text-muted-foreground/60 hidden group-open:inline">▲ 閉じる</span>
            </summary>
            <div className="mt-3 space-y-3 opacity-60">
              {todayPickedUp.map(res => (
                <ReservationCard
                  key={res.id}
                  res={res as Reservation}
                  onPickedUp={handlePickedUp}
                  loading={false}
                />
              ))}
            </div>
          </details>
        )}
      </div>

      {/* ── 出品モーダル ── */}
      <AnimatePresence>
        {showPostModal && storeId && (
          <PostBagModal
            storeId={storeId}
            onClose={() => setShowPostModal(false)}
            onSuccess={() => {
              setShowPostModal(false);
              queryClient.invalidateQueries({ queryKey: [`/api/stores/${storeId}/bags`] });
              refetch();
            }}
          />
        )}
      </AnimatePresence>
    </StoreLayout>
  );
}
