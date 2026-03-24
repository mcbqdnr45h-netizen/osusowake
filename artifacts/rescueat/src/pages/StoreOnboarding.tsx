import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useMyStore } from '@/hooks/use-my-store';
import { motion } from 'framer-motion';
import {
  ChevronLeft, CheckCircle2, Leaf, Loader2,
} from 'lucide-react';
import { PlaceSearchMap, PlaceResult } from '@/components/PlaceSearchMap';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

const CATEGORY_OPTIONS = [
  { value: 'bakery',       label: 'ベーカリー',   emoji: '🥐' },
  { value: 'restaurant',   label: 'お弁当・惣菜', emoji: '🍱' },
  { value: 'cafe',         label: 'カフェ',       emoji: '☕' },
  { value: 'supermarket',  label: 'スーパー',     emoji: '🛒' },
  { value: 'convenience',  label: 'コンビニ',     emoji: '🏪' },
  { value: 'sweets',       label: 'スイーツ',     emoji: '🍰' },
  { value: 'produce',      label: '野菜・果物',   emoji: '🍎' },
  { value: 'meat',         label: '肉・魚',       emoji: '🥩' },
  { value: 'noodles',      label: '麺類',         emoji: '🍜' },
  { value: 'drinks',       label: 'ドリンク',     emoji: '🥤' },
  { value: 'other',        label: 'その他',       emoji: '🍴' },
];

async function compressImage(file: File, maxPx = 1000, quality = 0.75): Promise<string> {
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

export default function StoreOnboarding() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { store: existingStore, loading: storeLoading } = useMyStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pledgeSigned, setPledgeSigned] = useState(false);
  const [pinPos, setPinPos] = useState<{ lat: number; lng: number } | null>(null);
  const [imagePreview, setImagePreview] = useState('');

  const [form, setForm] = useState({
    name: '',
    address: '',
    city: '',
    category: '',
    phone: '',
    imageUrl: '',
  });

  // 既存の店舗があれば適切な画面に遷移
  useEffect(() => {
    if (storeLoading) return;
    if (!existingStore) return;
    if (existingStore.stripeAccountId) {
      navigate('/store/dashboard');
    } else {
      navigate('/store/bank-setup');
    }
  }, [existingStore, storeLoading, navigate]);

  const handlePlaceSelected = (place: PlaceResult) => {
    setForm(f => ({
      ...f,
      address: place.address || '',
      city: place.city || '',
      name: f.name || place.name || '',
    }));
    if (place.lat && place.lng) setPinPos({ lat: place.lat, lng: place.lng });
  };

  const handleImageFile = async (f: File) => {
    const compressed = await compressImage(f);
    setForm(prev => ({ ...prev, imageUrl: compressed }));
    setImagePreview(compressed);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({ title: 'ログインが必要です', variant: 'destructive' });
      return;
    }
    if (!form.name.trim() || !form.address.trim() || !form.city.trim() || !form.category) {
      toast({ title: '必須項目を入力してください', variant: 'destructive' });
      return;
    }
    if (!pledgeSigned) {
      toast({ title: '利用規約への同意が必要です', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);

    // 2秒タイムアウト — タイムアウトしても bank-setup へ遷移
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, 2000);

    try {
      const res = await fetch(`${BASE}/api/stores/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          ownerId: user.id,
          name: form.name.trim(),
          address: form.address.trim(),
          city: form.city.trim(),
          category: form.category,
          phone: form.phone.trim() || null,
          imageUrl: form.imageUrl || null,
          lat: pinPos?.lat ?? null,
          lng: pinPos?.lng ?? null,
          pledgeSigned: true,
        }),
      });

      clearTimeout(timeout);

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        // 既存店舗エラーは無視して bank-setup へ
        if (err?.error !== 'already_exists') {
          throw new Error(err?.message || '登録に失敗しました');
        }
      }
    } catch (err: unknown) {
      clearTimeout(timeout);
      const isAbort = err instanceof Error && err.name === 'AbortError';
      if (!isAbort) {
        console.warn('[StoreOnboarding] apply error:', err);
        // エラーでも続行 — bank-setup へ遷移
      }
    } finally {
      setIsSubmitting(false);
    }

    // 常に bank-setup へ遷移
    console.log('[StoreOnboarding] → /store/bank-setup');
    navigate('/store/bank-setup');
  };

  // ロード中
  if (storeLoading) {
    return (
      <Layout showBottomNav={false}>
        <div className="flex-1 flex items-center justify-center min-h-dvh">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout showBottomNav={false}>
      <div className="max-w-xl mx-auto px-4 py-6 pb-24">

        {/* ヘッダー */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate('/register-store')}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-black">店舗を登録する</h1>
            <p className="text-xs text-muted-foreground">基本情報を入力して口座設定へ</p>
          </div>
        </div>

        <motion.form
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          {/* 料金案内 */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex gap-3 text-sm">
            <Leaf className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <div className="font-black text-foreground">完全成果報酬型</div>
              <div className="text-muted-foreground">初期費用・月額0円。売れた分だけ手数料20%</div>
            </div>
          </div>

          {/* 店舗写真 */}
          <div>
            <label className="block text-sm font-bold text-muted-foreground mb-2">店舗写真（任意）</label>
            <label className="block cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={e => e.target.files?.[0] && handleImageFile(e.target.files[0])}
              />
              <div className={`relative w-full aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 overflow-hidden transition-all
                ${imagePreview ? 'border-primary/40' : 'border-border bg-secondary/40 hover:border-primary/40 hover:bg-primary/5'}`}>
                {imagePreview ? (
                  <img src={imagePreview} alt="" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">📷</div>
                    <span className="text-sm font-bold text-muted-foreground">タップして写真を追加</span>
                    <span className="text-xs text-muted-foreground/60">JPG・PNG・HEIC対応</span>
                  </>
                )}
              </div>
            </label>
          </div>

          {/* 店名 */}
          <div>
            <label className="block text-sm font-bold text-muted-foreground mb-1.5">
              店名 <span className="text-destructive">*</span>
            </label>
            <input
              required
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full bg-background border border-input rounded-xl px-4 py-3.5 font-bold text-base focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-all"
              placeholder="例: 幸福堂ベーカリー"
            />
          </div>

          {/* 地図検索 */}
          <div>
            <label className="block text-sm font-bold text-muted-foreground mb-2">
              お店の場所
              {pinPos && <span className="text-xs font-normal ml-2 text-emerald-600">✓ 位置を取得しました</span>}
            </label>
            <PlaceSearchMap
              lat={pinPos?.lat}
              lng={pinPos?.lng}
              onPlace={handlePlaceSelected}
              onPinMove={(lat, lng) => setPinPos({ lat, lng })}
            />
          </div>

          {/* 住所 */}
          <div>
            <label className="block text-sm font-bold text-muted-foreground mb-1.5">
              住所 <span className="text-destructive">*</span>
            </label>
            <input
              required
              value={form.address}
              onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
              className="w-full bg-background border border-input rounded-xl px-4 py-3.5 font-medium text-base focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-all"
              placeholder="検索すると自動入力されます"
            />
          </div>

          {/* 市区町村 */}
          <div>
            <label className="block text-sm font-bold text-muted-foreground mb-1.5">
              市区町村 <span className="text-destructive">*</span>
            </label>
            <input
              required
              value={form.city}
              onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
              className="w-full bg-background border border-input rounded-xl px-4 py-3.5 font-medium text-base focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-all"
              placeholder="例: 高槻市"
            />
          </div>

          {/* ジャンル */}
          <div>
            <label className="block text-sm font-bold text-muted-foreground mb-2">
              ジャンル <span className="text-destructive">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, category: opt.value }))}
                  className={`py-3 px-2 rounded-xl border-2 font-bold text-sm flex flex-col items-center gap-1 transition-all active:scale-95
                    ${form.category === opt.value ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card hover:border-primary/40'}`}
                >
                  <span className="text-2xl">{opt.emoji}</span>
                  <span className="text-xs">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 電話番号 */}
          <div>
            <label className="block text-sm font-bold text-muted-foreground mb-1.5">電話番号（任意）</label>
            <input
              type="tel"
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              className="w-full bg-background border border-input rounded-xl px-4 py-3.5 font-medium text-base focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-all"
              placeholder="06-xxxx-xxxx"
            />
          </div>

          {/* 誓約チェック */}
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <div
                onClick={() => setPledgeSigned(v => !v)}
                className={`mt-0.5 shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all
                  ${pledgeSigned ? 'bg-primary border-primary' : 'bg-background border-border hover:border-primary/60'}`}
              >
                {pledgeSigned && <CheckCircle2 className="w-4 h-4 text-primary-foreground" />}
              </div>
              <p
                className="text-sm leading-relaxed text-foreground cursor-pointer"
                onClick={() => setPledgeSigned(v => !v)}
              >
                <span className="font-black block mb-1">利用規約への同意 <span className="text-destructive">*</span></span>
                食品衛生法を遵守し、営業許可証に基づいて営業していることを誓約します。また、食べロスの
                <span className="text-primary font-bold">利用規約</span>に同意の上、申請します。
              </p>
            </div>
          </div>

          {/* 送信ボタン */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary text-primary-foreground font-black text-lg py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-primary/25 hover:bg-primary/90 active:scale-[0.99] transition-all disabled:opacity-70 min-h-[56px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                登録中...
              </>
            ) : (
              '登録して口座設定へ →'
            )}
          </button>

          <p className="text-center text-xs text-muted-foreground pb-4">
            登録後すぐに口座情報の入力へ進みます
          </p>
        </motion.form>
      </div>
    </Layout>
  );
}
