import React, { useState, useEffect, useRef } from 'react';
import { StoreLayout } from '@/components/StoreLayout';
import { Layout } from '@/components/Layout';
import { useMyStores } from '@/hooks/use-my-stores';
import { StoreSelector } from '@/components/StoreSelector';
import {
  useListReservations,
  useListStoreBags,
  useCreateBag,
  useUpdateReservationStatus,
} from '@workspace/api-client-react';
import {
  Plus, Minus, Clock, CheckCircle2, Package2, X, ChevronUp, ChevronDown,
  Loader2, AlertCircle, BarChart2, RefreshCw, Ticket, Eye, ArrowRight,
  History, CreditCard, Zap, Pencil, Trash2, Save, Store, XCircle,
} from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, isToday, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { ImageUpload } from '@/components/ImageUpload';
import { BagManageCard, getBagStatus, type Bag, type BagRealStatus } from '@/components/BagManageCard';
import { CategoryPicker } from '@/components/CategoryPicker';

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

function formatPurchasedAt(iso: string) {
  try {
    return format(parseISO(iso), 'M/d HH:mm', { locale: ja });
  } catch { return '—'; }
}

function statusLabel(s: ReservationStatus) {
  if (s === 'pending')    return { text: '決済待ち', cls: 'bg-amber-50 text-amber-700 border-amber-200' };
  if (s === 'confirmed')  return { text: '確認済み', cls: 'bg-blue-50 text-blue-700 border-blue-200' };
  if (s === 'picked_up')  return { text: '受取済み', cls: 'bg-green-50 text-green-700 border-green-200' };
  return { text: 'キャンセル', cls: 'bg-gray-100 text-gray-500 border-gray-200' };
}

// ─── 過去出品の型 ─────────────────────────────────────────────────────────
interface PastBag {
  id: number;
  title: string;
  originalPrice: number;
  discountedPrice: number;
  imageUrl: string | null;
  category?: string | null;
  itemType?: string;
}


// ─── 出品モーダル ────────────────────────────────────────────────────────
function PostBagModal({
  storeId,
  storeName,
  pastBags,
  onClose,
  onSuccess,
}: {
  storeId: number;
  storeName: string;
  pastBags: PastBag[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const createBag = useCreateBag();
  const [mode, setMode] = useState<'quick' | 'manual'>('quick');
  const [pastBag, setPastBag] = useState<PastBag | null>(null);
  const [bagCategory, setBagCategory] = useState<string>('');
  const [aiSuggested, setAiSuggested] = useState<string | null>(null);
  const [classifying, setClassifying] = useState(false);
  const [qty, setQty] = useState(3);
  const [quickPickupStart, setQuickPickupStart] = useState('18:00');
  const [quickPickupEnd, setQuickPickupEnd] = useState('20:00');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [itemType, setItemType] = useState<'bag' | 'item'>('bag');

  // クイックモード追加情報
  const [quickAllergyInfo, setQuickAllergyInfo] = useState('');
  const [quickPickupNote, setQuickPickupNote] = useState('');

  // 手動フォーム
  const [form, setForm] = useState({
    title: '',
    description: '',
    allergyInfo: '',
    pickupNote: '',
    originalPrice: 0,
    discountedPrice: 0,
    stockCount: 3,
    pickupStart: '18:00',
    pickupEnd: '20:00',
  });
  const [editingStock, setEditingStock] = useState(false);
  const stockInputRef = useRef<HTMLInputElement>(null);

  // 画像変更ハンドラ：アップロード後に AI 自動分類を実行
  const handleImageChange = React.useCallback(async (url: string | null) => {
    setImageUrl(url);
    if (!url || url.startsWith('http')) {
      // 外部URLや null は分類しない（過去出品引き継ぎ時も含む）
      return;
    }
    try {
      setClassifying(true);
      const apiBase = import.meta.env.VITE_API_URL ?? '';
      const res = await fetch(`${apiBase}/api/suggest-category`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: url }),
      });
      if (res.ok) {
        const data = (await res.json()) as { category: string | null };
        if (data.category) {
          setAiSuggested(data.category);
          setBagCategory(prev => prev || data.category!); // 未選択なら自動適用
        }
      }
    } catch {
      // 分類失敗は無視
    } finally {
      setClassifying(false);
    }
  }, []);

  // 過去の出品を選択したとき、画像・カテゴリを引き継ぐ
  // pastBag が変わるたびに両方を更新（category がない場合はリセット）
  React.useEffect(() => {
    if (!pastBag) return;
    if (pastBag.imageUrl) setImageUrl(pastBag.imageUrl);
    setBagCategory(pastBag.category ?? '');
  }, [pastBag]);

  async function handleQuickSubmit() {
    if (!pastBag) {
      toast({ title: '商品を選択してください', variant: 'destructive' });
      return;
    }
    if (!bagCategory) {
      toast({ title: 'カテゴリを選択してください', variant: 'destructive' });
      return;
    }
    if (!imageUrl) {
      toast({ title: '写真を追加してください', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      const cleanTitle = (pastBag.title?.trim().length >= 4)
        ? pastBag.title.trim()
        : `${storeName}のおすそわけバッグ`;
      await createBag.mutateAsync({
        storeId,
        data: {
          title: cleanTitle,
          description: `${storeName}の美味しいおすそわけです！`,
          originalPrice: Number(pastBag.originalPrice),
          discountedPrice: Number(pastBag.discountedPrice),
          stockCount: qty,
          pickupStart: quickPickupStart,
          pickupEnd: quickPickupEnd,
          imageUrl,
          category: bagCategory || undefined,
          allergyInfo: quickAllergyInfo.trim() || undefined,
          pickupNote: quickPickupNote.trim() || undefined,
          itemType: (pastBag.itemType as 'bag' | 'item') ?? 'bag',
        } as any,
      });
      toast({ title: '出品しました！', description: `${pastBag.title} × ${qty}個` });
      onSuccess();
    } catch (err: any) {
      console.error('[handleQuickSubmit] error:', err);
      const msg = err?.data?.message ?? err?.message ?? '出品に失敗しました';
      toast({ title: '出品に失敗しました', description: msg, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (itemType === 'item' && !form.title.trim()) return;
    if (form.discountedPrice <= 0) return;
    if (!bagCategory) {
      toast({ title: 'カテゴリを選択してください', variant: 'destructive' });
      return;
    }
    if (!imageUrl) {
      toast({ title: '写真を追加してください', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      await createBag.mutateAsync({
        storeId,
        data: {
          title: form.title.trim().length >= 2 ? form.title.trim() : (itemType === 'bag' ? 'おすそわけ袋' : `${storeName}の商品`),
          description: form.description.trim() || `${storeName}の美味しいおすそわけです！`,
          originalPrice: Number(form.originalPrice),
          discountedPrice: Number(form.discountedPrice),
          stockCount: Number(form.stockCount),
          pickupStart: form.pickupStart,
          pickupEnd: form.pickupEnd,
          imageUrl,
          category: bagCategory || undefined,
          allergyInfo: form.allergyInfo.trim() || undefined,
          pickupNote: form.pickupNote.trim() || undefined,
          itemType,
        } as any,
      });
      toast({ title: '出品しました！' });
      onSuccess();
    } catch (err: any) {
      console.error('[handleManualSubmit] error:', err);
      const msg = err?.data?.message ?? err?.message ?? '出品に失敗しました';
      toast({ title: '出品に失敗しました', description: msg, variant: 'destructive' });
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
        className="w-full max-w-full max-h-[90dvh] bg-white rounded-t-3xl overflow-hidden flex flex-col"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* モーダルヘッダー */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border shrink-0">
          <div>
            <h2 className="text-lg font-black text-foreground">本日のOsusowakeを出品する</h2>
            <p className="text-xs text-muted-foreground mt-0.5">今日おすそわけできる商品を選んでください</p>
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
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-5 py-4 space-y-4">

          {mode === 'quick' && (
            <>
              {/* ─ 過去の出品履歴リスト ─ */}
              <div>
                <p className="text-xs font-bold text-muted-foreground mb-3 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5" />
                  過去の出品から選ぶ
                </p>

                {pastBags.length === 0 ? (
                  /* 履歴なし */
                  <div className="bg-muted/50 rounded-2xl p-6 text-center border border-dashed border-border">
                    <Package2 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm font-bold text-foreground">まだ出品履歴がありません</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      「手動で入力」タブから最初の商品を登録してください
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {pastBags.map((bag) => {
                      const isSelected = pastBag?.id === bag.id;
                      const offPct = bag.originalPrice > 0
                        ? Math.round((1 - bag.discountedPrice / bag.originalPrice) * 100)
                        : 0;
                      return (
                        <button
                          key={bag.id}
                          type="button"
                          onClick={() => setPastBag(isSelected ? null : bag)}
                          className={`w-full flex items-center gap-3 p-3 rounded-2xl border-2 text-left transition-all ${
                            isSelected
                              ? 'border-primary bg-primary/5 shadow-sm'
                              : 'border-border bg-card hover:border-primary/30'
                          }`}
                        >
                          {/* サムネイル */}
                          {bag.imageUrl ? (
                            <img
                              src={bag.imageUrl}
                              alt={bag.title}
                              className="w-14 h-14 rounded-xl object-cover shrink-0"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center shrink-0">
                              <Package2 className="w-6 h-6 text-muted-foreground" />
                            </div>
                          )}

                          {/* テキスト */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-foreground truncate">{bag.title}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs line-through text-muted-foreground">¥{bag.originalPrice.toLocaleString()}</span>
                              <span className="text-sm font-black text-primary">¥{bag.discountedPrice.toLocaleString()}</span>
                              {offPct > 0 && (
                                <span className="text-[10px] font-bold bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full">
                                  {offPct}%OFF
                                </span>
                              )}
                            </div>
                          </div>

                          {/* チェック */}
                          {isSelected && (
                            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                              <CheckCircle2 className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ─ 詳細設定（個数・受取時間・写真）─ */}
              <AnimatePresence>
                {pastBag && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="space-y-4 border-t border-border pt-4"
                  >
                    {/* 個数 + 受取時間 */}
                    <div className="grid grid-cols-2 gap-3">
                      {/* 個数 */}
                      <div>
                        <p className="text-xs font-bold text-muted-foreground mb-2">出品数</p>
                        <div className="flex items-center bg-white border-2 border-border rounded-xl overflow-hidden shadow-sm h-12">
                          <button
                            type="button"
                            onClick={() => setQty(Math.max(1, qty - 1))}
                            className="w-10 h-full flex items-center justify-center hover:bg-muted transition-colors font-black text-lg"
                          >−</button>
                          <span className="flex-1 text-center text-xl font-black">{qty}</span>
                          <button
                            type="button"
                            onClick={() => setQty(Math.min(99, qty + 1))}
                            className="w-10 h-full flex items-center justify-center hover:bg-muted transition-colors font-black text-lg"
                          >＋</button>
                        </div>
                      </div>

                      {/* 受取時間 */}
                      <div>
                        <p className="text-xs font-bold text-muted-foreground mb-2">受取時間</p>
                        <div className="space-y-1.5">
                          <input
                            type="time"
                            value={quickPickupStart}
                            onChange={e => setQuickPickupStart(e.target.value)}
                            className="w-full bg-white border-2 border-border rounded-xl px-3 py-2 font-bold text-sm focus:border-primary outline-none transition-all"
                          />
                          <input
                            type="time"
                            value={quickPickupEnd}
                            onChange={e => setQuickPickupEnd(e.target.value)}
                            className="w-full bg-white border-2 border-border rounded-xl px-3 py-2 font-bold text-sm focus:border-primary outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 写真（過去の画像を引き継ぎ、変更も可） */}
                    <ImageUpload value={imageUrl} onChange={handleImageChange} required />

                    {/* ラベル（必須） */}
                    <CategoryPicker
                      value={bagCategory}
                      onChange={setBagCategory}
                      classifying={classifying}
                      aiSuggested={aiSuggested}
                      required
                    />

                    {/* アレルギー情報 */}
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground mb-1.5">
                        アレルギー情報 <span className="font-normal text-muted-foreground/60">（任意）</span>
                      </label>
                      <textarea
                        value={quickAllergyInfo}
                        onChange={e => setQuickAllergyInfo(e.target.value)}
                        placeholder="例：小麦、卵、乳を含む可能性があります"
                        rows={2}
                        className="w-full bg-secondary/40 border-2 border-border rounded-xl px-3 py-2.5 text-sm focus:border-primary outline-none transition-all resize-none"
                      />
                    </div>

                    {/* 受取メモ */}
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground mb-1.5">
                        受取メモ <span className="font-normal text-muted-foreground/60">（任意）</span>
                      </label>
                      <textarea
                        value={quickPickupNote}
                        onChange={e => setQuickPickupNote(e.target.value)}
                        placeholder="例：店頭でスタッフにアプリ画面をご提示ください"
                        rows={2}
                        className="w-full bg-secondary/40 border-2 border-border rounded-xl px-3 py-2.5 text-sm focus:border-primary outline-none transition-all resize-none"
                      />
                    </div>

                    {/* 出品ボタン */}
                    <button
                      type="button"
                      onClick={handleQuickSubmit}
                      disabled={!imageUrl || !bagCategory || isSubmitting}
                      className={`w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 transition-all ${
                        imageUrl && bagCategory && !isSubmitting
                          ? 'bg-primary text-white shadow-lg shadow-primary/25 active:scale-[0.98]'
                          : 'bg-muted text-muted-foreground cursor-not-allowed'
                      }`}
                    >
                      {isSubmitting
                        ? <Loader2 className="w-5 h-5 animate-spin" />
                        : !imageUrl
                          ? '写真を追加してください'
                          : !bagCategory
                            ? 'カテゴリを選択してください'
                            : <><Plus className="w-5 h-5" />{qty}個を今すぐ出品する</>
                      }
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}

          {mode === 'manual' && (
            <form onSubmit={handleManualSubmit} className="space-y-4" noValidate>

              {/* 商品タイプ選択 */}
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-2">商品タイプ</label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { value: 'bag',  emoji: '🛍', label: 'おすそわけ袋', sub: 'おまかせ詰め合わせ' },
                    { value: 'item', emoji: '🥡', label: '単品商品',    sub: '特定の商品を販売' },
                  ] as const).map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setItemType(opt.value);
                        setForm(f => ({ ...f, title: '', description: '' }));
                      }}
                      className={`flex flex-col items-center py-3 px-2 rounded-2xl border-2 transition-all ${
                        itemType === opt.value
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border bg-secondary/30 text-muted-foreground'
                      }`}
                    >
                      <span className="text-2xl mb-1">{opt.emoji}</span>
                      <span className="text-xs font-black">{opt.label}</span>
                      <span className="text-[10px] mt-0.5 opacity-70">{opt.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 商品名 */}
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5">
                  商品名
                  {itemType === 'bag' && <span className="ml-1 text-[10px] font-normal text-muted-foreground/60">（デフォルト：おすそわけ袋）</span>}
                </label>
                <input
                  required
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder={itemType === 'bag' ? 'おすそわけ袋' : '例：本日の焼きたてパン、日替わり弁当など'}
                  className="w-full bg-secondary/40 border-2 border-border rounded-xl px-4 py-3 font-bold placeholder:text-muted-foreground/50 placeholder:font-normal focus:border-primary outline-none transition-all"
                />
              </div>

              {/* バッグの内容（説明） */}
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5">
                  {itemType === 'bag' ? 'バッグの内容' : '商品の説明'} <span className="font-normal text-muted-foreground/60">（空欄で自動入力）</span>
                </label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder={`例：${storeName}の美味しいおすそわけです！`}
                  rows={3}
                  className="w-full bg-secondary/40 border-2 border-border rounded-xl px-4 py-3 text-sm placeholder:text-muted-foreground/50 focus:border-primary outline-none transition-all resize-none"
                />
                {!form.description.trim() && (
                  <p className="text-[11px] text-muted-foreground/70 mt-1 pl-1">
                    空欄のまま出品すると「{storeName}の美味しいおすそわけです！」が自動セットされます
                  </p>
                )}
              </div>

              {/* 価格（割引率リアルタイム表示付き） */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-muted-foreground">価格設定</label>
                  {form.originalPrice > 0 && form.discountedPrice > 0 && form.discountedPrice < form.originalPrice && (
                    <span className="flex items-center gap-1 text-xs font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      <Zap className="w-3 h-3" />
                      {Math.round((1 - form.discountedPrice / form.originalPrice) * 100)}% OFF
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1">通常価格</p>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm">¥</span>
                      <input
                        type="number" inputMode="numeric" required
                        value={form.originalPrice === 0 ? '' : form.originalPrice}
                        onFocus={e => e.target.select()}
                        onChange={e => {
                          const raw = e.target.value.replace(/^0+(?=\d)/, '');
                          setForm({ ...form, originalPrice: raw === '' ? 0 : Math.max(0, parseInt(raw, 10) || 0) });
                        }}
                        className="w-full bg-secondary/40 border-2 border-border rounded-xl pl-7 pr-3 py-3 font-bold focus:border-primary outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1">販売価格</p>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary font-bold text-sm">¥</span>
                      <input
                        type="number" inputMode="numeric" required
                        value={form.discountedPrice === 0 ? '' : form.discountedPrice}
                        onFocus={e => e.target.select()}
                        onChange={e => {
                          const raw = e.target.value.replace(/^0+(?=\d)/, '');
                          setForm({ ...form, discountedPrice: raw === '' ? 0 : Math.max(0, parseInt(raw, 10) || 0) });
                        }}
                        className="w-full bg-secondary/40 border-2 border-primary/30 rounded-xl pl-7 pr-3 py-3 font-black text-primary focus:border-primary outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 在庫数（大きなステッパー＋タップ展開） */}
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-2">在庫数</label>
                <div style={{ display: 'grid', gridTemplateColumns: '56px 1fr 56px', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, stockCount: Math.max(1, f.stockCount - 1) }))}
                    disabled={form.stockCount <= 1}
                    style={{ height: '56px', minWidth: '56px' }}
                    className="flex items-center justify-center rounded-xl bg-secondary border-2 border-border text-foreground hover:bg-muted active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Minus className="w-5 h-5" strokeWidth={2.5} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingStock(true);
                      setTimeout(() => {
                        stockInputRef.current?.focus();
                        stockInputRef.current?.select();
                      }, 30);
                    }}
                    style={{ height: '56px' }}
                    className={`flex flex-col items-center justify-center rounded-xl border-2 transition-all ${
                      editingStock ? 'bg-primary/5 border-primary' : 'bg-secondary/40 border-border'
                    }`}
                  >
                    <span className="text-2xl font-black leading-none">{form.stockCount}</span>
                    <span className="text-[10px] text-muted-foreground mt-0.5">
                      {editingStock ? '編集中…' : '個（タップで入力）'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, stockCount: f.stockCount + 1 }))}
                    style={{ height: '56px', minWidth: '56px' }}
                    className="flex items-center justify-center rounded-xl bg-primary text-white hover:bg-primary/90 active:scale-95 transition-all shadow-md shadow-primary/25"
                  >
                    <Plus className="w-5 h-5" strokeWidth={2.5} />
                  </button>
                </div>
                <AnimatePresence>
                  {editingStock && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, y: -6, height: 0 }}
                      style={{ overflow: 'hidden', marginTop: '8px' }}
                    >
                      <div style={{ position: 'relative' }}>
                        <input
                          ref={stockInputRef}
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={String(form.stockCount)}
                          onChange={e => {
                            const v = parseInt(e.target.value.replace(/[^0-9]/g, ''), 10);
                            setForm(f => ({ ...f, stockCount: isNaN(v) ? 1 : Math.max(1, v) }));
                          }}
                          onFocus={e => {
                            const t = e.target;
                            setTimeout(() => t.setSelectionRange(0, t.value.length), 0);
                            setTimeout(() => stockInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 350);
                          }}
                          onBlur={() => setEditingStock(false)}
                          style={{
                            display: 'block', width: '100%', height: '56px',
                            boxSizing: 'border-box', padding: '0',
                            margin: '0', textAlign: 'center',
                            fontSize: '28px', fontWeight: 900, lineHeight: '56px',
                            border: '2px solid var(--primary)', borderRadius: '12px',
                            outline: 'none', backgroundColor: 'transparent',
                            WebkitAppearance: 'none' as React.CSSProperties['WebkitAppearance'],
                            appearance: 'none' as React.CSSProperties['appearance'],
                            color: 'var(--foreground)',
                          }}
                        />
                        <span style={{
                          position: 'absolute', right: '14px', top: '50%',
                          transform: 'translateY(-50%)', fontSize: '13px',
                          fontWeight: 700, color: 'var(--muted-foreground)',
                          pointerEvents: 'none', userSelect: 'none',
                        }}>個</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 受取時間（開始に「今すぐ」ボタン） */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1.5">受取開始</label>
                  <div className="flex gap-1.5">
                    <input type="time" required value={form.pickupStart}
                      onChange={e => setForm({ ...form, pickupStart: e.target.value })}
                      className="flex-1 min-w-0 bg-secondary/40 border-2 border-border rounded-xl px-2 py-3 font-bold focus:border-primary outline-none transition-all text-sm" />
                    <button
                      type="button"
                      onClick={() => {
                        const now = new Date();
                        const hh = now.getHours().toString().padStart(2, '0');
                        const mm = now.getMinutes().toString().padStart(2, '0');
                        setForm({ ...form, pickupStart: `${hh}:${mm}` });
                      }}
                      className="shrink-0 px-2 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-lg hover:bg-primary/20 active:bg-primary/30 transition-colors leading-tight text-center"
                    >
                      今<br />すぐ
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1.5">受取終了</label>
                  <input type="time" required value={form.pickupEnd}
                    onChange={e => setForm({ ...form, pickupEnd: e.target.value })}
                    className="w-full bg-secondary/40 border-2 border-border rounded-xl px-3 py-3 font-bold focus:border-primary outline-none transition-all" />
                </div>
              </div>

              {/* 商品写真 */}
              <ImageUpload value={imageUrl} onChange={handleImageChange} required />

              {/* ラベル（AI対応・必須） */}
              <CategoryPicker
                value={bagCategory}
                onChange={setBagCategory}
                classifying={classifying}
                aiSuggested={aiSuggested}
                required
              />

              {/* アレルギー情報 */}
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5">
                  アレルギー情報 <span className="font-normal text-muted-foreground/60">（任意）</span>
                </label>
                <textarea
                  value={form.allergyInfo}
                  onChange={e => setForm({ ...form, allergyInfo: e.target.value })}
                  placeholder="例：小麦、卵、乳を含む可能性があります"
                  rows={2}
                  className="w-full bg-secondary/40 border-2 border-border rounded-xl px-4 py-3 text-sm placeholder:text-muted-foreground/50 focus:border-primary outline-none transition-all resize-none"
                />
              </div>

              {/* 受取メモ */}
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5">
                  受取メモ <span className="font-normal text-muted-foreground/60">（任意）</span>
                </label>
                <textarea
                  value={form.pickupNote}
                  onChange={e => setForm({ ...form, pickupNote: e.target.value })}
                  placeholder="例：店頭でスタッフにアプリ画面をご提示ください"
                  rows={2}
                  className="w-full bg-secondary/40 border-2 border-border rounded-xl px-4 py-3 text-sm placeholder:text-muted-foreground/50 focus:border-primary outline-none transition-all resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || (itemType === 'item' && !form.title.trim()) || form.discountedPrice <= 0 || !imageUrl || !bagCategory}
                className={`w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 transition-all ${
                  !isSubmitting && (itemType === 'bag' || form.title.trim()) && form.discountedPrice > 0 && imageUrl && bagCategory
                    ? 'bg-primary text-white shadow-lg shadow-primary/25 active:scale-[0.98]'
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                }`}
              >
                {isSubmitting
                  ? <Loader2 className="w-5 h-5 animate-spin" />
                  : !bagCategory
                    ? 'カテゴリを選択してください'
                    : <><Plus className="w-5 h-5" />出品する</>
                }
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── バッグ編集モーダル ────────────────────────────────────────────────────
function EditBagModal({
  bag,
  storeId,
  BASE,
  onClose,
  onSaved,
  onDeleted,
}: {
  bag: Bag;
  storeId: number;
  BASE: string;
  onClose: () => void;
  onSaved: () => void;
  onDeleted: () => void;
}) {
  const { toast } = useToast();
  const [form, setForm] = React.useState({
    title:          bag.title,
    stockCount:     bag.stockCount,
    pickupStart:    bag.pickupStart ?? '',
    pickupEnd:      bag.pickupEnd   ?? '',
    originalPrice:  bag.originalPrice,
    discountedPrice: bag.discountedPrice,
    itemType:       (bag.itemType ?? 'bag') as 'bag' | 'item',
  });
  const [saving,   setSaving]   = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`${BASE}/api/stores/${storeId}/bags/${bag.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:           form.title.trim(),
          stockCount:      form.stockCount,
          pickupStart:     form.pickupStart || null,
          pickupEnd:       form.pickupEnd   || null,
          originalPrice:   form.originalPrice,
          discountedPrice: form.discountedPrice,
          itemType:        form.itemType,
        }),
      });
      if (!res.ok) throw new Error();
      toast({ title: '商品情報を更新しました ✓' });
      onSaved();
    } catch {
      toast({ title: '更新に失敗しました', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      // 公開中の場合は先に非公開にしてから削除
      if (bag.isActive) {
        await fetch(`${BASE}/api/stores/${storeId}/bags/${bag.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive: false }),
        });
      }
      const res = await fetch(`${BASE}/api/stores/${storeId}/bags/${bag.id}`, {
        method: 'DELETE',
      });
      if (!res.ok && res.status !== 204) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? '削除に失敗しました');
      }
      toast({ title: '商品を削除しました' });
      onDeleted();
    } catch (err: any) {
      toast({ title: err.message ?? '削除に失敗しました', variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  }

  const discountPct = form.originalPrice > 0
    ? Math.round((1 - form.discountedPrice / form.originalPrice) * 100)
    : 0;

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex flex-col justify-end"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      {/* 背景オーバーレイ */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* モーダル本体 */}
      <motion.div
        className="relative bg-background rounded-t-3xl shadow-2xl max-h-[92dvh] w-full max-w-full overflow-hidden flex flex-col"
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <Pencil className="w-4 h-4 text-primary" />
            <h2 className="text-lg font-black text-foreground">商品を編集</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* フォーム */}
        <div className="overflow-y-auto overflow-x-hidden flex-1 px-5 py-5 space-y-5">

          {/* 商品タイプ */}
          <div>
            <label className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-2 block">商品タイプ</label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { value: 'bag',  emoji: '🛍', label: 'おすそわけ袋' },
                { value: 'item', emoji: '🥡', label: '単品商品' },
              ] as const).map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, itemType: opt.value }))}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-black transition-all ${
                    form.itemType === opt.value
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border bg-secondary/30 text-muted-foreground'
                  }`}
                >
                  <span>{opt.emoji}</span>{opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* タイトル */}
          <div>
            <label className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-1.5 block">商品名</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full border border-border rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/40 bg-background"
              placeholder={form.itemType === 'bag' ? 'おすそわけ袋' : '例：本日のおすすめセット'}
            />
          </div>

          {/* 在庫数 */}
          <div>
            <label className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-1.5 block">在庫数</label>
            <div className="flex items-center gap-3">
              <button type="button"
                onClick={() => setForm(f => ({ ...f, stockCount: Math.max(0, f.stockCount - 1) }))}
                className="w-10 h-10 rounded-xl border border-border bg-secondary flex items-center justify-center hover:bg-muted active:scale-90 transition-all"
              ><Minus className="w-4 h-4" /></button>
              <span className="w-12 text-center text-2xl font-black tabular-nums">{form.stockCount}</span>
              <button type="button"
                onClick={() => setForm(f => ({ ...f, stockCount: f.stockCount + 1 }))}
                className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary/90 active:scale-90 transition-all"
              ><Plus className="w-4 h-4" /></button>
              <span className="text-sm text-muted-foreground font-medium">個</span>
            </div>
          </div>

          {/* 受け取り時間 */}
          <div>
            <label className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-1.5 block">受け取り時間</label>
            <div className="flex items-center gap-3">
              <input type="time" value={form.pickupStart}
                onChange={e => setForm(f => ({ ...f, pickupStart: e.target.value }))}
                className="flex-1 border border-border rounded-xl px-3 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/40 bg-background"
              />
              <span className="text-muted-foreground font-bold">〜</span>
              <input type="time" value={form.pickupEnd}
                onChange={e => setForm(f => ({ ...f, pickupEnd: e.target.value }))}
                className="flex-1 border border-border rounded-xl px-3 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/40 bg-background"
              />
            </div>
          </div>

          {/* 価格 */}
          <div>
            <label className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-1.5 block">価格</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground mb-1">元値（税込）</p>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm">¥</span>
                  <input type="number" inputMode="numeric" min={0}
                    value={form.originalPrice === 0 ? '' : form.originalPrice}
                    onFocus={e => e.target.select()}
                    onChange={e => {
                      const raw = e.target.value.replace(/^0+(?=\d)/, '');
                      setForm(f => ({ ...f, originalPrice: raw === '' ? 0 : Math.max(0, parseInt(raw, 10) || 0) }));
                    }}
                    className="w-full border border-border rounded-xl pl-7 pr-3 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/40 bg-background [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground mb-1">販売価格（税込）</p>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm">¥</span>
                  <input type="number" inputMode="numeric" min={0}
                    value={form.discountedPrice === 0 ? '' : form.discountedPrice}
                    onFocus={e => e.target.select()}
                    onChange={e => {
                      const raw = e.target.value.replace(/^0+(?=\d)/, '');
                      setForm(f => ({ ...f, discountedPrice: raw === '' ? 0 : Math.max(0, parseInt(raw, 10) || 0) }));
                    }}
                    className="w-full border border-border rounded-xl pl-7 pr-3 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/40 bg-background [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>
            </div>
            {discountPct > 0 && (
              <p className="text-xs font-bold text-primary mt-2">{discountPct}% OFF で販売</p>
            )}
          </div>

          {/* 削除 */}
          <div className="pt-2 border-t border-border/60">
            {confirmDelete ? (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                <p className="text-sm font-black text-red-700 mb-1">本当に削除しますか？</p>
                <p className="text-xs text-red-500 mb-3">この操作は取り消せません。{bag.isActive ? '公開中の場合は先に非公開にしてから削除されます。' : ''}</p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setConfirmDelete(false)}
                    className="flex-1 py-2 rounded-xl border border-border text-sm font-bold text-muted-foreground hover:bg-muted transition-colors">
                    キャンセル
                  </button>
                  <button type="button" onClick={handleDelete} disabled={deleting}
                    className="flex-1 py-2 rounded-xl bg-red-500 text-white text-sm font-black hover:bg-red-600 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-1">
                    {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Trash2 className="w-4 h-4" />削除する</>}
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => setConfirmDelete(true)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-red-200 text-red-500 text-sm font-bold hover:bg-red-50 transition-colors">
                <Trash2 className="w-4 h-4" />
                この商品を削除する
              </button>
            )}
          </div>
        </div>

        {/* 保存ボタン */}
        <div className="px-5 pb-6 pt-3 shrink-0 border-t border-border/60 bg-background"
          style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
          <button type="button" onClick={handleSave} disabled={saving || !form.title.trim()}
            className="w-full py-4 rounded-2xl bg-primary text-white font-black text-base flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 shadow-md shadow-primary/20">
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" />変更を保存する</>}
          </button>
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
          <p className="text-[11px] text-muted-foreground mt-0.5">購入: {formatPurchasedAt(res.createdAt)}</p>
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
  const { currentStore: store, loading: storeLoading, fetchError: storeFetchError, refetch: refetchStore, stores } = useMyStores();
  const [, navigate] = useLocation();
  const storeId = store?.id ?? null;

  // 各状態に応じて自動遷移
  useEffect(() => {
    if (storeLoading) return;
    if (!store && !storeFetchError) {
      // 店舗未登録
      navigate('/store-onboarding', { replace: true });
      return;
    }
    if (store) {
      // applied / approved / pending_review すべてダッシュボード内で処理する
      // ※ 口座未登録の場合でも自動リダイレクトはしない（ループの原因になるため）
      //   マイページのバナーから手動で /store/bank-setup に遷移してもらう
    }
  }, [store, storeLoading, storeFetchError, navigate]);

  const [showPostModal, setShowPostModal] = useState(false);
  const [syncingStripe, setSyncingStripe] = useState(false);
  const [stripeError, setStripeError]     = useState<string | null>(null);
  const [markingId, setMarkingId]         = useState<number | null>(null);
  const [togglingId, setTogglingId]       = useState<number | null>(null);
  const [adjustingId, setAdjustingId]     = useState<number | null>(null);
  const [deletingId, setDeletingId]       = useState<number | null>(null);
  const [confirmId, setConfirmId]         = useState<number | null>(null);
  const [editingBag, setEditingBag]       = useState<Bag | null>(null);
  const [showPickedUp, setShowPickedUp]   = useState(false);
  const [showExpiredActive, setShowExpiredActive] = useState(false);

  // サマリーカードのスクロール先 ref
  const activeBagsRef   = useRef<HTMLDivElement>(null);
  const pendingRef      = useRef<HTMLDivElement>(null);
  const pickedUpRef     = useRef<HTMLDivElement>(null);

  function scrollToSection(ref: React.RefObject<HTMLDivElement | null>, open?: boolean) {
    if (open) setShowPickedUp(true);
    setTimeout(() => {
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, open ? 50 : 0);
  }

  const BASE = import.meta.env.BASE_URL?.replace(/\/$/, '') || '';

  const { data: reservations = [], isLoading: resLoading, refetch } =
    useListReservations({ storeId: storeId ?? 0 }, { query: { enabled: !!storeId } });

  const { data: bags = [], refetch: refetchBags } =
    useListStoreBags(storeId ?? 0, {
      query: {
        enabled: !!storeId,
        staleTime: 0,             // 常に古いと見なし必ず再取得チェック
        refetchOnMount: 'always', // 画面に戻るたびサーバーから最新取得
      },
    });

  // Stripe 残高・ペイアウト情報
  const { data: balanceData, isLoading: balanceLoading } = useQuery({
    queryKey: [`/api/stores/${storeId}/connect/balance`],
    queryFn: async () => {
      if (!storeId) return null;
      const res = await fetch(`${BASE}/api/stores/${storeId}/connect/balance`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!storeId && !!store?.stripeAccountId,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  // Stripe ライブステータス（requirements / payouts_enabled / charges_enabled）
  const { data: stripeStatus, isLoading: stripeStatusLoading } = useQuery<{
    connected: boolean;
    accountId?: string;
    chargesEnabled?: boolean;
    payoutsEnabled?: boolean;
    requirements?: {
      currentlyDue: string[];
      eventuallyDue: string[];
      errors: { code: string; reason: string; requirement: string }[];
      pendingVerification: string[];
      disabledReason: string | null;
    };
  } | null>({
    queryKey: [`/api/stores/${storeId}/connect/status`],
    queryFn: async () => {
      if (!storeId) return null;
      const res = await fetch(`${BASE}/api/stores/${storeId}/connect/status`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!storeId && !!store?.stripeAccountId,
    staleTime: 60_000,
    refetchOnMount: 'always',
  });

  const updateStatus = useUpdateReservationStatus();

  // 今日の未受取予約
  const todayPending = (reservations as Reservation[]).filter(
    r => isTodaysReservation(r) && (r.status === 'pending' || r.status === 'confirmed')
  );
  const todayPickedUp = (reservations as Reservation[]).filter(
    r => isTodaysReservation(r) && r.status === 'picked_up'
  );
  const now = new Date();
  const activeBags     = (bags as any[]).filter((b: any) => getBagStatus(b, now) === 'active');
  // 出品中（active・soldout のみ — expired は除外）
  const nonIdleBags = [...(bags as any[])]
    .filter((b: any) => b.isActive && getBagStatus(b, now) !== 'expired')
    .sort((a: any, b: any) => {
      // 公開中(0) → 完売(1)
      const ORD: Record<string, number> = { active: 0, soldout: 1 };
      const sa = getBagStatus(a, now);
      const sb = getBagStatus(b, now);
      const diff = (ORD[sa] ?? 9) - (ORD[sb] ?? 9);
      if (diff !== 0) return diff;
      // 公開中の中は受取開始時間が早い順
      if (sa === 'active') return (a.pickupStart || '').localeCompare(b.pickupStart || '');
      return 0;
    });
  // 受付終了（isActive=true のまま時間切れ） → 折りたたみ表示
  const expiredActiveBags = [...(bags as any[])]
    .filter((b: any) => b.isActive && getBagStatus(b, now) === 'expired');

  // クイック出品用: title で重複排除（最新 id を優先）
  const deduplicatedBags: PastBag[] = React.useMemo(() => {
    const seen = new Map<string, PastBag>();
    [...(bags as any[])]
      .sort((a: any, b: any) => b.id - a.id)
      .forEach((b: any) => {
        if (!seen.has(b.title)) {
          seen.set(b.title, {
            id: b.id,
            title: b.title,
            originalPrice: b.originalPrice,
            discountedPrice: b.discountedPrice,
            imageUrl: b.imageUrl ?? null,
            category: b.category ?? null,
            itemType: b.itemType ?? 'bag',
          });
        }
      });
    return Array.from(seen.values()).slice(0, 5);
  }, [bags]);

  // Stripe ステータスを再同期
  async function syncStripeStatus() {
    if (!storeId) return;
    setSyncingStripe(true);
    try {
      const res = await fetch(`${BASE}/api/stores/${storeId}/stripe-sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (res.ok) {
        if (data.stripeError) {
          setStripeError(data.stripeError);
          toast({ title: '⚠️ 決済連携エラーを検出しました', description: `エラーコード: ${data.stripeError}`, variant: 'destructive' });
        } else {
          setStripeError(null);
          toast({
            title: '✅ 決済情報を更新しました',
            description: `決済: ${data.chargesEnabled ? '有効' : '制限中'} / 入金: ${data.payoutsEnabled ? '有効' : '停止中'}`,
          });
          queryClient.invalidateQueries({ queryKey: [`/api/stores/${storeId}/connect/balance`] });
          queryClient.invalidateQueries({ queryKey: [`/api/stores/${storeId}/connect/status`] });
        }
      } else {
        toast({ title: 'エラー', description: '再同期に失敗しました', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'エラー', description: 'サーバーへの接続に失敗しました', variant: 'destructive' });
    } finally {
      setSyncingStripe(false);
    }
  }

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

  // 公開/非公開トグル
  async function handleToggleActive(bag: Bag) {
    if (!storeId) return;
    setTogglingId(bag.id);
    try {
      const res = await fetch(`${BASE}/api/stores/${storeId}/bags/${bag.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !bag.isActive }),
      });
      if (!res.ok) throw new Error();
      queryClient.refetchQueries({ queryKey: [`/api/stores/${storeId}/bags`], type: 'all' });
      toast({ title: bag.isActive ? '非公開にしました' : '公開しました' });
    } catch {
      toast({ title: '更新に失敗しました', variant: 'destructive' });
    } finally {
      setTogglingId(null);
    }
  }

  // 在庫調整
  async function handleStockAdjust(bag: Bag, delta: number) {
    if (!storeId) return;
    const next = Math.max(0, bag.stockCount + delta);
    setAdjustingId(bag.id);
    try {
      const res = await fetch(`${BASE}/api/stores/${storeId}/bags/${bag.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stockCount: next }),
      });
      if (!res.ok) throw new Error();
      queryClient.refetchQueries({ queryKey: [`/api/stores/${storeId}/bags`], type: 'all' });
    } catch {
      toast({ title: '在庫の更新に失敗しました', variant: 'destructive' });
    } finally {
      setAdjustingId(null);
    }
  }

  // 削除（非公開バッグのみ）
  async function handleDeleteBag(bag: Bag) {
    if (!storeId) return;
    setDeletingId(bag.id);
    setConfirmId(null);
    try {
      const res = await fetch(`${BASE}/api/stores/${storeId}/bags/${bag.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? '削除に失敗しました');
      }
      queryClient.refetchQueries({ queryKey: [`/api/stores/${storeId}/bags`], type: 'all' });
      toast({ title: '商品を削除しました' });
    } catch (err: any) {
      toast({ title: err.message ?? '削除に失敗しました', variant: 'destructive' });
    } finally {
      setDeletingId(null);
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

  // ─── 却下 ────────────────────────────────────────────────────────────
  if (store.status === 'rejected') {
    return (
      <Layout>
        <div className="flex-1 flex items-center justify-center px-6 min-h-dvh">
          <div className="text-center max-w-sm">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <XCircle className="w-10 h-10 text-red-400" />
            </div>
            <h2 className="text-xl font-black mb-2">店舗申請が却下されました</h2>
            <p className="text-sm text-muted-foreground mb-2 leading-relaxed">
              {store.rejectionReason
                ? `却下理由：${store.rejectionReason}`
                : '申請内容を再確認のうえ、再申請してください。'}
            </p>
            <p className="text-xs text-muted-foreground mb-6">ご不明な点はLINEサポートまでお問い合わせください。</p>
            <a
              href="/store/bank-setup"
              className="inline-flex items-center gap-2 bg-primary text-white font-bold px-6 py-3 rounded-2xl hover:bg-primary/90 transition-colors"
            >
              再申請する
            </a>
          </div>
        </div>
      </Layout>
    );
  }

  // ─── 口座登録済み・Stripe KYC審査待ち ─────────────────────────────────
  if (store.status === 'applied') {
    return (
      <Layout>
        <div className="flex-1 flex items-center justify-center px-6 min-h-dvh">
          <div className="text-center max-w-sm">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <Clock className="w-10 h-10 text-blue-400" />
            </div>
            <h2 className="text-xl font-black mb-2">決済の本人確認中</h2>
            <p className="text-sm text-muted-foreground mb-2 leading-relaxed">
              口座情報を受け付けました。決済システムによる本人確認がバックグラウンドで進行中です。
            </p>
            <p className="text-xs text-muted-foreground mb-6">通常3〜5営業日で完了します。完了次第、自動で出品が開始できるようになります。</p>
            <a
              href="/mypage"
              className="inline-flex items-center gap-2 bg-secondary text-foreground font-bold px-6 py-3 rounded-2xl hover:bg-secondary/80 transition-colors"
            >
              マイページへ
            </a>
          </div>
        </div>
      </Layout>
    );
  }

  // ─── 口座登録未完了（bank-setup誘導）────────────────────────────────────
  if (store.status === 'pending') {
    return (
      <Layout>
        <div className="flex-1 flex items-center justify-center px-6 min-h-dvh">
          <div className="text-center max-w-sm">
            <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <CreditCard className="w-10 h-10 text-orange-400" />
            </div>
            <h2 className="text-xl font-black mb-2">口座登録を完了してください</h2>
            <p className="text-sm text-muted-foreground mb-2 leading-relaxed">
              出品を開始するには、振込先口座と本人確認の登録が必要です。
            </p>
            <p className="text-xs text-muted-foreground mb-6">登録完了後、決済システムの確認（通常3〜5営業日）が通り次第、自動で出品が開始できます。</p>
            <a
              href="/store/bank-setup"
              className="inline-flex items-center gap-2 bg-primary text-white font-bold px-6 py-3 rounded-2xl hover:bg-primary/90 transition-colors"
            >
              口座登録に進む
            </a>
          </div>
        </div>
      </Layout>
    );
  }

  // ─── 通報フラグ（管理者確認中）────────────────────────────────────────
  if (store.status === 'pending_review') {
    return (
      <Layout>
        <div className="flex-1 flex items-center justify-center px-6 min-h-dvh">
          <div className="text-center max-w-sm">
            <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <Eye className="w-10 h-10 text-amber-500" />
            </div>
            <h2 className="text-xl font-black mb-2">確認中</h2>
            <p className="text-sm text-muted-foreground mb-2 leading-relaxed">
              現在、運営スタッフがアカウントを確認しています。
            </p>
            <p className="text-xs text-muted-foreground mb-6">完了次第ご連絡します。ご不明な点はLINEサポートへお問い合わせください。</p>
            <a
              href="/mypage"
              className="inline-flex items-center gap-2 bg-secondary text-foreground font-bold px-6 py-3 rounded-2xl hover:bg-secondary/80 transition-colors"
            >
              マイページへ
            </a>
          </div>
        </div>
      </Layout>
    );
  }

  const today = format(new Date(), 'M月d日（E）', { locale: ja });

  return (
    <StoreLayout>
      <div className="max-w-2xl mx-auto w-full space-y-5">

        {/* ── 店舗セレクター（複数店舗の場合に表示） ── */}
        {stores.length > 1 && (
          <StoreSelector className="px-0" />
        )}
        {stores.length === 1 && store && (
          <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-3 py-2.5">
            <Store className="w-4 h-4 text-orange-500 shrink-0" />
            <span className="text-sm font-bold text-orange-800 truncate">{store.name}</span>
            <span className="text-[10px] font-bold text-orange-500 ml-auto shrink-0">操作中</span>
          </div>
        )}

        {/* ── カバー写真バナー ── */}
        <div className="relative w-full overflow-hidden" style={{ aspectRatio: '2/1', maxHeight: 220 }}>
          {store.imageUrl ? (
            <img
              src={store.imageUrl}
              alt={store.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-orange-100 via-amber-50 to-orange-200 flex items-center justify-center">
              <Package2 className="w-14 h-14 text-orange-300" />
            </div>
          )}
          {/* グラデーション + 店名オーバーレイ */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-3 flex items-end justify-between">
            <div>
              <p className="text-white/70 text-xs font-bold mb-0.5">{today}</p>
              <h1 className="text-white text-xl font-black leading-tight drop-shadow-md">{store.name}</h1>
            </div>
            <button
              onClick={() => { refetch(); refetchBags(); }}
              className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
          {/* プロフィール編集リンク */}
          <Link href="/store/profile-edit">
            <div className="absolute top-3 right-3 bg-white/25 backdrop-blur-sm rounded-lg px-2.5 py-1 flex items-center gap-1.5 cursor-pointer hover:bg-white/40 transition-colors">
              <Pencil className="w-3 h-3 text-white" />
              <span className="text-white text-[11px] font-bold">編集</span>
            </div>
          </Link>
        </div>

        <div className="px-4 space-y-5">

        {/* ── PR文（おすそわけメッセージ）── */}
        {store.description ? (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-base">✍️</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-amber-700 mb-1">お店からのメッセージ</p>
              <p className="text-sm text-amber-900 leading-relaxed">{store.description}</p>
            </div>
            <Link href="/store/profile-edit">
              <button className="w-7 h-7 rounded-lg bg-amber-100 hover:bg-amber-200 flex items-center justify-center transition-colors shrink-0">
                <Pencil className="w-3.5 h-3.5 text-amber-600" />
              </button>
            </Link>
          </div>
        ) : (
          <Link href="/store/profile-edit">
            <div className="border-2 border-dashed border-amber-200 bg-amber-50/60 rounded-2xl p-4 flex items-center gap-3 cursor-pointer hover:bg-amber-50 transition-colors group">
              <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-amber-200 transition-colors">
                <span className="text-base">✍️</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-black text-amber-800">プロフィールが未設定です</p>
                <p className="text-xs text-amber-600 mt-0.5">お客さんへのメッセージを追加してアピールしましょう！</p>
              </div>
              <ArrowRight className="w-4 h-4 text-amber-400 group-hover:text-amber-600 transition-colors" />
            </div>
          </Link>
        )}

        {/* ── 振込先口座未登録のお知らせ（自動リダイレクトなし・手動遷移のみ）── */}
        {store.status === 'approved' && !store.stripeAccountId && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
            <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
              <CreditCard className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-blue-900 text-sm">振込先口座の登録が必要です</p>
              <p className="text-xs text-blue-600 mt-0.5 leading-relaxed">売上を受け取るために口座を登録してください。登録するまで出品した商品の決済は保留されます。</p>
              <button
                onClick={() => navigate('/store/bank-setup')}
                className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-black text-blue-700 bg-blue-100 hover:bg-blue-200 px-3 py-1.5 rounded-lg transition-colors"
              >
                <CreditCard className="w-3.5 h-3.5" />
                口座を登録する
              </button>
            </div>
          </div>
        )}

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
            <p className="font-black text-base leading-tight">本日のOsusowakeを出品する</p>
          </div>
        </motion.button>

        {/* ── クイックサマリー（タップで各セクションへジャンプ）── */}
        <div className="grid grid-cols-3 gap-3">
          {/* 出品中 → 出品中商品セクション */}
          <button
            onClick={() => scrollToSection(activeBagsRef)}
            className="bg-orange-50 border border-orange-100 rounded-2xl p-3 text-center active:scale-95 transition-transform hover:bg-orange-100/60 cursor-pointer"
          >
            <p className="text-2xl font-black text-primary">{activeBags.length}</p>
            <p className="text-[10px] font-bold text-muted-foreground mt-0.5">出品中</p>
            <p className="text-[10px] text-orange-500/70 mt-1 font-bold">確認 →</p>
          </button>

          {/* 本日の予約 → 受取予定セクション */}
          <button
            onClick={() => scrollToSection(pendingRef)}
            className="bg-blue-50 border border-blue-100 rounded-2xl p-3 text-center active:scale-95 transition-transform hover:bg-blue-100/60 cursor-pointer"
          >
            <p className="text-2xl font-black text-blue-600">{todayPending.length}</p>
            <p className="text-[10px] font-bold text-muted-foreground mt-0.5">本日の予約</p>
            <p className="text-[10px] text-blue-500/70 mt-1 font-bold">確認 →</p>
          </button>

          {/* 本日受取済 → 受取済みセクション（展開して表示） */}
          <button
            onClick={() => scrollToSection(pickedUpRef, true)}
            className="bg-green-50 border border-green-100 rounded-2xl p-3 text-center active:scale-95 transition-transform hover:bg-green-100/60 cursor-pointer"
          >
            <p className="text-2xl font-black text-green-600">{todayPickedUp.length}</p>
            <p className="text-[10px] font-bold text-muted-foreground mt-0.5">本日受取済</p>
            <p className="text-[10px] text-green-500/70 mt-1 font-bold">確認 →</p>
          </button>
        </div>

        {/* ── Stripe 残高カード ── */}
        {store.stripeAccountId && (
          <div className="bg-white border border-orange-100 rounded-2xl p-4 shadow-[0_2px_12px_rgba(255,140,0,0.06)]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-orange-50 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-primary" />
                </div>
                <p className="text-sm font-black text-foreground">売上残高</p>
              </div>
              {(balanceLoading || stripeStatusLoading) && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
            </div>

            {/* Stripe ライブ requirements（APIから直接取得） */}
            {stripeStatus?.requirements && (
              <div className="mb-3 rounded-xl border border-border/60 bg-secondary/20 p-3 space-y-1.5">
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <span>📡</span> 決済 最新ステータス（ライブ）
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${stripeStatus.chargesEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    決済: {stripeStatus.chargesEnabled ? '✅ 有効' : '❌ 制限中'}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${stripeStatus.payoutsEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    入金: {stripeStatus.payoutsEnabled ? '✅ 有効' : '⚠️ 停止中'}
                  </span>
                </div>

                {stripeStatus.requirements.disabledReason && (
                  <div className="flex items-start gap-1.5 bg-red-50 border border-red-200 rounded-lg px-2 py-1.5">
                    <AlertCircle className="w-3 h-3 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-black text-red-700">アカウント停止理由</p>
                      <p className="text-[10px] text-red-600 font-mono">{stripeStatus.requirements.disabledReason}</p>
                    </div>
                  </div>
                )}

                {stripeStatus.requirements.currentlyDue.length > 0 ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-2">
                    <p className="text-[10px] font-black text-amber-800 mb-1">⚠️ 提出が必要な書類 ({stripeStatus.requirements.currentlyDue.length}件)</p>
                    {stripeStatus.requirements.currentlyDue.map((item, i) => (
                      <p key={i} className="text-[10px] text-amber-700 font-mono leading-relaxed">{item}</p>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-emerald-700 font-bold">✅ 必要書類はすべて提出済みです</p>
                )}

                {stripeStatus.requirements.errors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg px-2.5 py-2">
                    <p className="text-[10px] font-black text-red-800 mb-1">🚫 エラー ({stripeStatus.requirements.errors.length}件)</p>
                    {stripeStatus.requirements.errors.map((e, i) => (
                      <p key={i} className="text-[10px] text-red-700 font-mono">[{e.code}] {e.requirement}</p>
                    ))}
                  </div>
                )}

                {stripeStatus.requirements.pendingVerification.length > 0 && (
                  <p className="text-[10px] text-blue-600 font-semibold">
                    🔄 審査中: {stripeStatus.requirements.pendingVerification.join(', ')}
                  </p>
                )}
              </div>
            )}


            {balanceData && (
              <div className="space-y-2.5">
                {/* 残高2列 */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-center">
                    <p className="text-xs font-bold text-amber-600 mb-0.5">保留中</p>
                    <p className="text-xl font-black text-amber-800">¥{balanceData.pending.toLocaleString()}</p>
                  </div>
                  <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-center">
                    <p className="text-xs font-bold text-green-600 mb-0.5">振込可能</p>
                    <p className="text-xl font-black text-green-800">¥{balanceData.available.toLocaleString()}</p>
                  </div>
                </div>

                {/* 保留中の説明 */}
                {balanceData.pending > 0 && (
                  <div className="bg-amber-50/60 border border-amber-100 rounded-xl px-3 py-2 flex items-start gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-amber-700 font-bold">保留中とは？</p>
                      <p className="text-[11px] text-amber-600 leading-relaxed mt-0.5">
                        決済から{balanceData.delayDays ?? 7}日後に「振込可能」へ移動します。振込可能になった次の月曜日に振込されます。
                      </p>
                    </div>
                  </div>
                )}

                {/* ペイアウトスケジュール */}
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-0.5">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {balanceData.payoutSchedule?.interval === 'weekly'
                      ? '週次振込（毎週月曜）'
                      : balanceData.payoutSchedule?.interval === 'monthly'
                        ? '月次振込'
                        : '自動振込'}
                  </span>
                  {balanceData.nextPayoutDate && (
                    <span className="font-bold text-foreground/70">
                      次回: {balanceData.nextPayoutDate.replace(/-/g, '/')}
                    </span>
                  )}
                </div>

                {/* ── 振込状況まとめ表示 ── */}
                {(() => {
                  const payouts  = (balanceData.recentPayouts   ?? []) as Array<{ id: string; amount: number; arrivalDate: string; status: string }>;
                  const transfers = (balanceData.platformTransfers ?? []) as Array<{ id: string; amount: number; createdDate: string; available_on: string | null }>;
                  const hasActivePayouts = payouts.some(p => p.status === 'in_transit' || p.status === 'pending' || p.status === 'paid');

                  return (
                    <div className="border-t border-border/40 pt-2 mt-1 space-y-2">

                      {/* ケース①: 銀行への振込処理が進行中または完了 */}
                      {payouts.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wide">銀行振込履歴</p>
                          {payouts.map(p => (
                            <div key={p.id} className="flex items-start justify-between gap-2">
                              <div>
                                <span className="text-[11px] text-muted-foreground">{p.arrivalDate.replace(/-/g, '/')} 銀行着金予定</span>
                                {p.status === 'in_transit' && (
                                  <span className="ml-1.5 text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">送金中</span>
                                )}
                                {p.status === 'paid' && (
                                  <span className="ml-1.5 text-[10px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">着金済</span>
                                )}
                                {p.status === 'pending' && (
                                  <span className="ml-1.5 text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">処理中</span>
                                )}
                                {p.status === 'failed' && (
                                  <span className="ml-1.5 text-[10px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">失敗</span>
                                )}
                              </div>
                              <span className={`text-[11px] font-bold shrink-0 ${p.status === 'paid' ? 'text-green-700' : p.status === 'failed' ? 'text-red-600' : 'text-amber-700'}`}>
                                ¥{p.amount.toLocaleString()}
                              </span>
                            </div>
                          ))}

                          {/* in_transit / paid の時は説明メッセージ */}
                          {payouts.some(p => p.status === 'in_transit') && (
                            <p className="text-[11px] text-amber-700 bg-amber-50 rounded-xl px-3 py-2">
                              🏦 現在銀行口座へ送金中です。着金予定日の翌営業日までにご確認ください。
                            </p>
                          )}
                          {payouts.every(p => p.status === 'paid') && balanceData.pending === 0 && balanceData.available === 0 && (
                            <p className="text-[11px] text-muted-foreground bg-secondary/40 rounded-xl px-3 py-2">
                              💳 振込が完了しています。銀行口座の入金をご確認ください。
                            </p>
                          )}
                        </div>
                      )}

                      {/* ケース②: Osusowakeからの送金はあるが、まだ銀行振込になっていない */}
                      {!hasActivePayouts && transfers.length > 0 && balanceData.pending === 0 && balanceData.available === 0 && (
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wide">Osusowakeからの送金</p>
                          {transfers.map(t => (
                            <div key={t.id} className="flex items-center justify-between">
                              <span className="text-[11px] text-muted-foreground">
                                {t.createdDate.replace(/-/g, '/')} 送金済み
                                {t.available_on && <span className="ml-1 text-amber-600">→ {t.available_on.replace(/-/g, '/')} 振込可能予定</span>}
                              </span>
                              <span className="text-[11px] font-bold text-amber-700">¥{t.amount.toLocaleString()}</span>
                            </div>
                          ))}
                          <p className="text-[10px] text-amber-700 leading-relaxed">
                            ⏳ 振込可能日になると保留中から移動し、次の月曜日に銀行へ振り込まれます。
                          </p>
                        </div>
                      )}

                      {/* ケース③: 送金履歴も振込履歴もなく残高¥0（送金漏れの可能性） */}
                      {!hasActivePayouts && transfers.length === 0 && balanceData.pending === 0 && balanceData.available === 0 && (
                        <p className="text-[11px] text-muted-foreground bg-secondary/40 rounded-xl px-3 py-2">
                          売上があるのに残高が¥0の場合は、LINEサポートへご連絡ください。
                        </p>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {!balanceData && !balanceLoading && (
              <p className="text-xs text-muted-foreground text-center py-2">残高情報を取得できませんでした</p>
            )}

            {/* Stripe 連携エラー表示 */}
            {stripeError && (
              <div className="mt-2 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-black text-red-700">🔴 決済連携エラー</p>
                  <p className="text-[11px] text-red-600 mt-0.5">エラーコード: {stripeError}</p>
                  <p className="text-[11px] text-red-500 mt-0.5">サポートまでお問い合わせください: hello.osusowake@gmail.com</p>
                </div>
              </div>
            )}

            {/* 再同期ボタン */}
            <button
              type="button"
              onClick={syncStripeStatus}
              disabled={syncingStripe}
              className="mt-3 w-full flex items-center justify-center gap-1.5 bg-orange-50 hover:bg-orange-100 text-primary font-bold text-xs py-2 rounded-xl transition-colors border border-orange-200 disabled:opacity-50"
            >
              {syncingStripe
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />同期中…</>
                : <><RefreshCw className="w-3.5 h-3.5" />決済情報を最新に更新する</>
              }
            </button>
          </div>
        )}

        {/* ── 出品中の商品（active・soldout のみ）── */}
        {nonIdleBags.length > 0 && (
          <div ref={activeBagsRef}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-black text-foreground flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                出品中の商品
              </h2>
              <Link
                href="/store/bags"
                className="flex items-center gap-1 text-xs font-bold text-primary hover:underline"
              >
                すべて管理 <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="space-y-3">
              {nonIdleBags.map((bag: any) => (
                <BagManageCard
                  key={bag.id}
                  bag={bag as Bag}
                  togglingId={togglingId}
                  deletingId={deletingId}
                  adjustingId={adjustingId}
                  confirmId={confirmId}
                  onToggle={handleToggleActive}
                  onDelete={handleDeleteBag}
                  onStockAdjust={handleStockAdjust}
                  onConfirmChange={setConfirmId}
                  onEdit={bag => setEditingBag(bag)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── 受付終了（isActive のまま時間切れ）── 折りたたみ */}
        {expiredActiveBags.length > 0 && (
          <div>
            <button
              onClick={() => setShowExpiredActive(v => !v)}
              className="flex items-center gap-2 w-full text-left text-sm font-bold text-muted-foreground select-none bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 hover:bg-slate-100 transition-colors"
            >
              <Clock className="w-4 h-4 text-slate-400" />
              受付終了（本日分・{expiredActiveBags.length}件）
              <span className="ml-auto text-xs text-muted-foreground/60">
                {showExpiredActive ? '▲ 閉じる' : '▼ 表示'}
              </span>
              {showExpiredActive ? <ChevronUp className="w-4 h-4 shrink-0" /> : <ChevronDown className="w-4 h-4 shrink-0" />}
            </button>
            <AnimatePresence>
              {showExpiredActive && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-3 mt-3 opacity-70">
                    {expiredActiveBags.map((bag: any) => (
                      <BagManageCard
                        key={bag.id}
                        bag={bag as Bag}
                        togglingId={togglingId}
                        deletingId={deletingId}
                        adjustingId={adjustingId}
                        confirmId={confirmId}
                        onToggle={handleToggleActive}
                        onDelete={handleDeleteBag}
                        onStockAdjust={handleStockAdjust}
                        onConfirmChange={setConfirmId}
                        onEdit={bag => setEditingBag(bag)}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ── 本日の受取予定リスト ── */}
        <div ref={pendingRef}>
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

        {/* ── 本日受取済み（折りたたみ）── */}
        {todayPickedUp.length > 0 && (
          <div ref={pickedUpRef}>
            <button
              onClick={() => setShowPickedUp(v => !v)}
              className="flex items-center gap-2 w-full text-left text-sm font-bold text-muted-foreground select-none"
            >
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              本日の受取済み（{todayPickedUp.length}件）
              <span className="ml-auto text-xs text-muted-foreground/60">
                {showPickedUp ? '▲ 閉じる' : '▼ 表示'}
              </span>
            </button>
            <AnimatePresence>
              {showPickedUp && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
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
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        </div>{/* /px-4 space-y-5 */}
      </div>

      {/* ── 出品モーダル ── */}
      <AnimatePresence>
        {showPostModal && storeId && (
          <PostBagModal
            storeId={storeId}
            storeName={store.name}
            pastBags={deduplicatedBags}
            onClose={() => setShowPostModal(false)}
            onSuccess={() => {
              setShowPostModal(false);
              queryClient.refetchQueries({ queryKey: [`/api/stores/${storeId}/bags`], type: 'all' });
              refetch();
            }}
          />
        )}
      </AnimatePresence>

      {/* ── 編集モーダル ── */}
      <AnimatePresence>
        {editingBag && storeId && (
          <EditBagModal
            bag={editingBag}
            storeId={storeId}
            BASE={BASE}
            onClose={() => setEditingBag(null)}
            onSaved={() => {
              setEditingBag(null);
              queryClient.refetchQueries({ queryKey: [`/api/stores/${storeId}/bags`], type: 'all' });
            }}
            onDeleted={() => {
              setEditingBag(null);
              queryClient.refetchQueries({ queryKey: [`/api/stores/${storeId}/bags`], type: 'all' });
            }}
          />
        )}
      </AnimatePresence>
    </StoreLayout>
  );
}
