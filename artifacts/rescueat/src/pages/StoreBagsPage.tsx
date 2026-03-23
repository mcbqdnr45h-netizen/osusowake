import React, { useState } from 'react';
import { StoreLayout } from '@/components/StoreLayout';
import { useMyStore } from '@/hooks/use-my-store';
import { useListStoreBags, useCreateBag } from '@workspace/api-client-react';
import {
  Plus, Package2, Clock, AlertCircle, Loader2,
  ChevronUp, ChevronDown, ToggleLeft, ToggleRight, Trash2,
} from 'lucide-react';
import { ImageUpload } from '@/components/ImageUpload';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, '') || '';

interface Bag {
  id: number;
  title: string;
  discountedPrice: number;
  originalPrice: number;
  stockCount: number;
  pickupStart: string | null;
  pickupEnd: string | null;
  isActive: boolean;
  createdAt: string;
}

type BagRealStatus = 'active' | 'expired' | 'soldout' | 'inactive';

function getBagStatus(bag: Bag, now: Date): BagRealStatus {
  if (!bag.isActive) return 'inactive';

  if (bag.pickupEnd) {
    const created = new Date(bag.createdAt);
    const isCreatedToday =
      created.getFullYear() === now.getFullYear() &&
      created.getMonth()    === now.getMonth()    &&
      created.getDate()     === now.getDate();
    if (!isCreatedToday) return 'expired';
    const [h, m] = bag.pickupEnd.split(':').map(Number);
    const endTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h || 0, m || 0, 0);
    if (now > endTime) return 'expired';
  }

  if (bag.stockCount === 0) return 'soldout';
  return 'active';
}

const STATUS_BADGE: Record<BagRealStatus, { text: string; cls: string }> = {
  active:   { text: '公開中',   cls: 'bg-green-50 text-green-700 border border-green-200' },
  expired:  { text: '受付終了', cls: 'bg-slate-100 text-slate-500 border border-slate-200' },
  soldout:  { text: '完売',     cls: 'bg-red-50 text-red-500 border border-red-200' },
  inactive: { text: '非公開',   cls: 'bg-gray-100 text-gray-500 border border-gray-200' },
};

export default function StoreBagsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { store, loading: storeLoading } = useMyStore();
  const storeId = store?.id ?? null;

  const { data: bags = [], isLoading } = useListStoreBags(storeId ?? 0, { query: { enabled: !!storeId } });
  const createBag = useCreateBag();

  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [togglingId, setTogglingId]   = useState<number | null>(null);
  const [deletingId, setDeletingId]   = useState<number | null>(null);
  const [confirmId, setConfirmId]     = useState<number | null>(null);
  const [imageUrl, setImageUrl]       = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    originalPrice: 1000,
    discountedPrice: 350,
    stockCount: 3,
    pickupStart: '18:00',
    pickupEnd: '20:00',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!storeId || !form.title.trim()) return;
    if (!imageUrl) {
      toast({ title: '写真を追加してください', variant: 'destructive' });
      return;
    }
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
          imageUrl,
        },
      });
      toast({ title: '出品しました！' });
      queryClient.invalidateQueries({ queryKey: [`/api/stores/${storeId}/bags`] });
      setShowForm(false);
      setImageUrl(null);
      setForm({ title: '', originalPrice: 1000, discountedPrice: 350, stockCount: 3, pickupStart: '18:00', pickupEnd: '20:00' });
    } catch {
      toast({ title: '出品に失敗しました', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  }

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
      queryClient.invalidateQueries({ queryKey: [`/api/stores/${storeId}/bags`] });
      toast({ title: bag.isActive ? '非公開にしました' : '公開しました' });
    } catch {
      toast({ title: '更新に失敗しました', variant: 'destructive' });
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(bag: Bag) {
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
      queryClient.invalidateQueries({ queryKey: [`/api/stores/${storeId}/bags`] });
      toast({ title: '商品を削除しました' });
    } catch (err: any) {
      toast({ title: err.message ?? '削除に失敗しました', variant: 'destructive' });
    } finally {
      setDeletingId(null);
    }
  }

  if (storeLoading) {
    return (
      <StoreLayout>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-7 h-7 animate-spin text-primary" />
        </div>
      </StoreLayout>
    );
  }

  if (!store) {
    return (
      <StoreLayout>
        <div className="flex-1 flex items-center justify-center px-6 text-center">
          <div>
            <AlertCircle className="w-10 h-10 text-orange-400 mx-auto mb-3" />
            <p className="font-black text-lg">店舗情報が見つかりません</p>
          </div>
        </div>
      </StoreLayout>
    );
  }

  const now = new Date();
  const allBags    = bags as Bag[];
  const trulyActive  = allBags.filter(b => getBagStatus(b, now) === 'active');
  const sortedBags   = [...allBags].sort((a, b) => {
    const ORDER: Record<BagRealStatus, number> = { active: 0, soldout: 1, expired: 2, inactive: 3 };
    return (ORDER[getBagStatus(a, now)] ?? 9) - (ORDER[getBagStatus(b, now)] ?? 9);
  });

  return (
    <StoreLayout>
      <div className="max-w-2xl mx-auto w-full px-4 py-5 space-y-5">

        {/* ── ヘッダー ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-foreground">出品・在庫管理</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              出品中 {trulyActive.length}件 / 全{allBags.length}件
            </p>
          </div>
          <button
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-2 bg-primary text-white font-black text-sm px-4 py-2.5 rounded-xl shadow-md shadow-primary/20 hover:bg-primary/90 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            新規出品
          </button>
        </div>

        {/* ── 新規出品フォーム ── */}
        <AnimatePresence>
          {showForm && (
            <motion.form
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              onSubmit={handleSubmit}
              className="bg-white border-2 border-primary/20 rounded-2xl p-5 shadow-lg space-y-4"
            >
              <h3 className="font-black text-foreground">新しいサプライズバッグ</h3>

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5">商品名</label>
                <input
                  required
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="例: 本日のパン詰め合わせ"
                  className="w-full bg-secondary/40 border-2 border-border rounded-xl px-4 py-3 font-bold placeholder:text-muted-foreground/50 placeholder:font-normal focus:border-primary outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1.5">通常価格</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm">¥</span>
                    <input
                      type="number" inputMode="numeric" required
                      value={form.originalPrice || ''}
                      onChange={e => setForm({ ...form, originalPrice: e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0) })}
                      className="w-full bg-secondary/40 border-2 border-border rounded-xl pl-7 pr-3 py-3 font-bold focus:border-primary outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1.5">販売価格</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary font-bold text-sm">¥</span>
                    <input
                      type="number" inputMode="numeric" required
                      value={form.discountedPrice || ''}
                      onChange={e => setForm({ ...form, discountedPrice: e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0) })}
                      className="w-full bg-secondary/40 border-2 border-primary/30 rounded-xl pl-7 pr-3 py-3 font-black text-primary focus:border-primary outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5">在庫数</label>
                <div className="flex items-center w-36 bg-secondary/40 border-2 border-border rounded-xl overflow-hidden h-12">
                  <button type="button" onClick={() => setForm({ ...form, stockCount: Math.max(1, form.stockCount - 1) })}
                    className="w-10 h-full flex items-center justify-center hover:bg-muted transition-colors font-bold text-xl">−</button>
                  <input
                    type="number" inputMode="numeric" required min="1"
                    value={form.stockCount}
                    onChange={e => setForm({ ...form, stockCount: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                    className="flex-1 text-center font-bold text-lg bg-transparent border-none focus:ring-0 p-0 outline-none"
                  />
                  <button type="button" onClick={() => setForm({ ...form, stockCount: form.stockCount + 1 })}
                    className="w-10 h-full flex items-center justify-center hover:bg-muted transition-colors font-bold text-xl">＋</button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1.5">受取開始</label>
                  <input type="time" required value={form.pickupStart}
                    onChange={e => setForm({ ...form, pickupStart: e.target.value })}
                    className="w-full bg-secondary/40 border-2 border-border rounded-xl px-3 py-3 font-bold focus:border-primary outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1.5">受取終了</label>
                  <input type="time" required value={form.pickupEnd}
                    onChange={e => setForm({ ...form, pickupEnd: e.target.value })}
                    className="w-full bg-secondary/40 border-2 border-border rounded-xl px-3 py-3 font-bold focus:border-primary outline-none transition-all" />
                </div>
              </div>

              <ImageUpload value={imageUrl} onChange={setImageUrl} required />

              <div className="flex gap-3">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-3 rounded-xl border-2 border-border font-bold text-muted-foreground hover:bg-muted transition-colors">
                  キャンセル
                </button>
                <button type="submit" disabled={isSubmitting || !form.title.trim() || !imageUrl}
                  className="flex-1 py-3 rounded-xl bg-primary text-white font-black flex items-center justify-center gap-2 shadow-md shadow-primary/20 disabled:opacity-60 disabled:cursor-not-allowed hover:bg-primary/90 transition-all">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" />出品する</>}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* ── 出品中リスト ── */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">読み込み中...</span>
          </div>
        ) : (bags as Bag[]).length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-border p-10 text-center">
            <Package2 className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="font-bold text-foreground">まだ商品がありません</p>
            <p className="text-xs text-muted-foreground mt-1">「新規出品」から商品を追加しましょう</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedBags.map(bag => {
              const realStatus = getBagStatus(bag, now);
              const badge      = STATUS_BADGE[realStatus];
              const isExpired  = realStatus === 'expired';
              const isFaded    = realStatus !== 'active';
              return (
              <div
                key={bag.id}
                className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-opacity ${
                  realStatus === 'active' ? 'border-orange-100' : 'border-border opacity-60'
                }`}
              >
                <div className="px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${badge.cls}`}>
                          {badge.text}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-medium">
                          在庫 {bag.stockCount}個
                        </span>
                      </div>
                      <p className="font-black text-foreground">{bag.title}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs line-through text-muted-foreground">¥{bag.originalPrice.toLocaleString()}</span>
                        <span className="text-sm font-black text-primary">¥{bag.discountedPrice.toLocaleString()}</span>
                        <span className="text-[10px] font-bold bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded-full">
                          {Math.round((1 - bag.discountedPrice / bag.originalPrice) * 100)}%OFF
                        </span>
                      </div>
                      {(bag.pickupStart || bag.pickupEnd) && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" />
                          {bag.pickupStart}〜{bag.pickupEnd}
                        </p>
                      )}
                    </div>

                    {/* 右側ボタン群 */}
                    <div className="shrink-0 flex flex-col items-center gap-2">
                      {/* 公開/非公開トグル（受付終了は操作不可）*/}
                      <button
                        onClick={() => { setConfirmId(null); handleToggleActive(bag); }}
                        disabled={togglingId === bag.id || deletingId === bag.id || isExpired}
                        title={isExpired ? '受付時間が終了しているため変更できません' : undefined}
                        className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {togglingId === bag.id
                          ? <Loader2 className="w-6 h-6 animate-spin" />
                          : bag.isActive
                            ? <ToggleRight className={`w-8 h-8 ${isExpired ? 'text-slate-300' : 'text-primary'}`} />
                            : <ToggleLeft className="w-8 h-8" />
                        }
                        <span className="text-[9px] font-bold">{badge.text}</span>
                      </button>

                      {/* 削除ボタン（非公開のみ表示）*/}
                      {!bag.isActive && (
                        <div className="flex flex-col items-center gap-1">
                          {confirmId === bag.id ? (
                            // 確認ステップ
                            <div className="flex flex-col items-center gap-1">
                              <button
                                onClick={() => handleDelete(bag)}
                                disabled={deletingId === bag.id}
                                className="text-[9px] font-black text-white bg-red-500 px-2 py-1 rounded-lg active:scale-95 transition-transform disabled:opacity-50"
                              >
                                {deletingId === bag.id ? <Loader2 className="w-3 h-3 animate-spin" /> : '削除する'}
                              </button>
                              <button
                                onClick={() => setConfirmId(null)}
                                className="text-[9px] text-muted-foreground underline"
                              >
                                戻る
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmId(bag.id)}
                              disabled={togglingId === bag.id}
                              className="flex flex-col items-center gap-0.5 text-red-500 hover:text-red-700 transition-colors disabled:opacity-30"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span className="text-[9px] font-bold">削除</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>
    </StoreLayout>
  );
}
