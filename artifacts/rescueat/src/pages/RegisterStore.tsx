import React, { useState, useRef } from 'react';
import { Layout } from '@/components/Layout';
import { useCreateStore, useCreateBag } from '@workspace/api-client-react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { Store, ChevronLeft, CheckCircle, Camera, MapPin, RefreshCw, Info } from 'lucide-react';

const CATEGORY_OPTIONS = [
  { value: 'bakery', label: 'ベーカリー', emoji: '🥐' },
  { value: 'restaurant', label: 'レストラン', emoji: '🍱' },
  { value: 'cafe', label: 'カフェ', emoji: '☕' },
  { value: 'supermarket', label: 'スーパー', emoji: '🛒' },
  { value: 'convenience', label: 'コンビニ', emoji: '🏪' },
  { value: 'other', label: 'その他', emoji: '🍴' },
];

interface StoreForm {
  name: string;
  address: string;
  city: string;
  category: string;
  phone: string;
  imageUrl: string;
  imagePreview: string;
}

interface BagForm {
  title: string;
  originalPrice: number;
  discountedPrice: number;
  stockCount: number;
  pickupStart: string;
  pickupEnd: string;
  description: string;
}

async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const q = encodeURIComponent(address + ' Japan');
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`, {
      headers: { 'Accept-Language': 'ja' }
    });
    const data = await res.json();
    if (data && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
    return null;
  } catch {
    return null;
  }
}

export default function RegisterStore() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<'store' | 'bag' | 'done'>('store');
  const [geocoding, setGeocoding] = useState(false);
  const [createdStoreId, setCreatedStoreId] = useState<number | null>(null);

  const createStore = useCreateStore();
  const createBag = useCreateBag();

  const [storeForm, setStoreForm] = useState<StoreForm>({
    name: '',
    address: '',
    city: '',
    category: 'restaurant',
    phone: '',
    imageUrl: '',
    imagePreview: '',
  });

  const [bagForm, setBagForm] = useState<BagForm>({
    title: '',
    originalPrice: 1500,
    discountedPrice: 500,
    stockCount: 5,
    pickupStart: '18:00',
    pickupEnd: '21:00',
    description: '',
  });

  const discountPct = bagForm.originalPrice > 0
    ? Math.round((1 - bagForm.discountedPrice / bagForm.originalPrice) * 100)
    : 0;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setStoreForm(f => ({ ...f, imageUrl: result, imagePreview: result }));
    };
    reader.readAsDataURL(file);
  };

  const handleStoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeocoding(true);

    const fullAddress = `${storeForm.address}`;
    const geo = await geocodeAddress(fullAddress);
    setGeocoding(false);

    if (!geo) {
      toast({
        title: '住所を確認してください',
        description: '住所から位置情報を取得できませんでした。より詳しい住所を入力してください。',
        variant: 'destructive'
      });
      return;
    }

    try {
      const store = await createStore.mutateAsync({
        data: {
          name: storeForm.name,
          address: storeForm.address,
          city: storeForm.city || '大阪',
          category: storeForm.category as any,
          lat: geo.lat,
          lng: geo.lng,
          phone: storeForm.phone || undefined,
          imageUrl: storeForm.imageUrl || undefined,
        }
      });
      setCreatedStoreId(store.id);
      setStep('bag');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      toast({ title: '登録失敗', description: err.message, variant: 'destructive' });
    }
  };

  const handleBagSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createdStoreId) return;
    try {
      await createBag.mutateAsync({
        storeId: createdStoreId,
        data: {
          title: bagForm.title,
          originalPrice: bagForm.originalPrice,
          discountedPrice: bagForm.discountedPrice,
          stockCount: bagForm.stockCount,
          pickupStart: bagForm.pickupStart,
          pickupEnd: bagForm.pickupEnd,
          description: bagForm.description || undefined,
        }
      });
      setStep('done');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      toast({ title: '出品失敗', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <Layout>
      <div className="max-w-xl mx-auto px-4 py-6 pb-24">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => step === 'bag' ? setStep('store') : navigate('/')}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-black">お店を登録する</h1>
            <p className="text-xs text-muted-foreground">食べロスに参加して、フードロスを減らしましょう</p>
          </div>
        </div>

        {/* Steps Indicator */}
        {step !== 'done' && (
          <div className="flex items-center gap-2 mb-6">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold transition-all ${step === 'store' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
              <span>1</span> 店舗情報
            </div>
            <div className="h-px flex-1 bg-border" />
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold transition-all ${step === 'bag' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
              <span>2</span> サプライズバッグ
            </div>
          </div>
        )}

        {/* Fee Info Banner */}
        {step !== 'done' && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6 flex gap-3">
            <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="text-sm">
              <div className="font-bold text-foreground mb-1">完全成果報酬型</div>
              <div className="text-muted-foreground leading-relaxed">
                <span className="font-bold text-foreground">初期費用・月額0円</span>。売れた場合のみ手数料20%が発生する成果報酬型です。売れなければ完全無料です。
              </div>
            </div>
          </div>
        )}

        {/* STEP 1: Store Form */}
        {step === 'store' && (
          <form onSubmit={handleStoreSubmit} className="space-y-5">

            {/* Photo Upload */}
            <div>
              <label className="block text-sm font-bold text-muted-foreground mb-2">店舗写真（任意）</label>
              <div
                onClick={() => fileRef.current?.click()}
                className="relative w-full h-40 bg-secondary/50 border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-secondary/80 transition-colors overflow-hidden"
              >
                {storeForm.imagePreview ? (
                  <img src={storeForm.imagePreview} alt="preview" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <Camera className="w-8 h-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground font-medium">タップして写真を追加</span>
                    <span className="text-xs text-muted-foreground/70 mt-1">JPG・PNG対応</span>
                  </>
                )}
                {storeForm.imagePreview && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <span className="text-white font-bold text-sm">変更する</span>
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </div>

            <div>
              <label className="block text-sm font-bold text-muted-foreground mb-1.5">店名 <span className="text-destructive">*</span></label>
              <input
                required
                value={storeForm.name}
                onChange={e => setStoreForm(f => ({ ...f, name: e.target.value }))}
                className="w-full bg-background border border-input rounded-xl px-4 py-3.5 font-bold text-base focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-all"
                placeholder="例: 渋谷ベーカリー 幸福堂"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-muted-foreground mb-1.5">
                住所 <span className="text-destructive">*</span>
                <span className="text-xs font-normal ml-2 text-muted-foreground/70">（地図表示に使用されます）</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  required
                  value={storeForm.address}
                  onChange={e => setStoreForm(f => ({ ...f, address: e.target.value }))}
                  className="w-full bg-background border border-input rounded-xl pl-10 pr-4 py-3.5 font-medium text-base focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-all"
                  placeholder="例: 大阪府吹田市江坂町1-2-3"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-muted-foreground mb-1.5">市区町村 <span className="text-destructive">*</span></label>
              <input
                required
                value={storeForm.city}
                onChange={e => setStoreForm(f => ({ ...f, city: e.target.value }))}
                className="w-full bg-background border border-input rounded-xl px-4 py-3.5 font-medium text-base focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-all"
                placeholder="例: 大阪市、吹田市"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-muted-foreground mb-2">ジャンル <span className="text-destructive">*</span></label>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORY_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setStoreForm(f => ({ ...f, category: opt.value }))}
                    className={`py-3 px-2 rounded-xl border-2 font-bold text-sm flex flex-col items-center gap-1 transition-all active:scale-95 ${
                      storeForm.category === opt.value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-card text-foreground hover:border-primary/40'
                    }`}
                  >
                    <span className="text-2xl">{opt.emoji}</span>
                    <span className="text-xs">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-muted-foreground mb-1.5">電話番号（任意）</label>
              <input
                type="tel"
                value={storeForm.phone}
                onChange={e => setStoreForm(f => ({ ...f, phone: e.target.value }))}
                className="w-full bg-background border border-input rounded-xl px-4 py-3.5 font-medium text-base focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-all"
                placeholder="06-xxxx-xxxx"
              />
            </div>

            <button
              type="submit"
              disabled={createStore.isPending || geocoding}
              className="w-full bg-primary text-primary-foreground font-black text-lg py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-primary/25 hover:bg-primary/90 active:scale-[0.99] transition-all disabled:opacity-70 min-h-[56px]"
            >
              {(createStore.isPending || geocoding) ? (
                <><RefreshCw className="w-5 h-5 animate-spin" /> 処理中...</>
              ) : (
                '次へ：サプライズバッグを設定'
              )}
            </button>
          </form>
        )}

        {/* STEP 2: Bag Form */}
        {step === 'bag' && (
          <form onSubmit={handleBagSubmit} className="space-y-5">
            <div className="bg-secondary/50 rounded-xl p-4 text-sm text-muted-foreground font-medium">
              💡 サプライズバッグは、閉店前に余った食品をまとめて安価に販売する商品です。内容は「お楽しみ」でOKです。
            </div>

            <div>
              <label className="block text-sm font-bold text-muted-foreground mb-1.5">バッグ名 <span className="text-destructive">*</span></label>
              <input
                required
                value={bagForm.title}
                onChange={e => setBagForm(f => ({ ...f, title: e.target.value }))}
                className="w-full bg-background border border-input rounded-xl px-4 py-3.5 font-bold text-base focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-all"
                placeholder="例: 本日のパン詰め合わせ"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-bold text-muted-foreground mb-1.5">通常価格</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">¥</span>
                  <input
                    type="number" required min="100"
                    value={bagForm.originalPrice}
                    onChange={e => setBagForm(f => ({ ...f, originalPrice: Number(e.target.value) }))}
                    className="w-full bg-background border border-input rounded-xl pl-8 pr-4 py-3.5 font-bold text-base focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-muted-foreground mb-1.5">販売価格</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary font-bold">¥</span>
                  <input
                    type="number" required min="100"
                    value={bagForm.discountedPrice}
                    onChange={e => setBagForm(f => ({ ...f, discountedPrice: Number(e.target.value) }))}
                    className="w-full bg-background border-2 border-primary/30 rounded-xl pl-8 pr-4 py-3.5 font-black text-primary text-base focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {discountPct > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex justify-between items-center">
                <span className="text-sm font-bold text-amber-800">割引率プレビュー</span>
                <span className="text-2xl font-black text-amber-600">{discountPct}% OFF</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-muted-foreground mb-1.5">在庫数</label>
              <div className="flex items-center w-36 h-14 bg-background border border-input rounded-xl overflow-hidden">
                <button type="button" onClick={() => setBagForm(f => ({ ...f, stockCount: Math.max(1, f.stockCount - 1) }))}
                  className="w-12 h-full flex items-center justify-center bg-secondary hover:bg-secondary/80 font-bold text-xl active:scale-90 transition-transform">−</button>
                <input type="number" required min="1"
                  value={bagForm.stockCount}
                  onChange={e => setBagForm(f => ({ ...f, stockCount: Number(e.target.value) }))}
                  className="flex-1 text-center font-black text-lg bg-transparent border-none focus:ring-0 p-0" />
                <button type="button" onClick={() => setBagForm(f => ({ ...f, stockCount: f.stockCount + 1 }))}
                  className="w-12 h-full flex items-center justify-center bg-secondary hover:bg-secondary/80 font-bold text-xl active:scale-90 transition-transform">＋</button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-bold text-muted-foreground mb-1.5">受取開始</label>
                <input type="time" required
                  value={bagForm.pickupStart}
                  onChange={e => setBagForm(f => ({ ...f, pickupStart: e.target.value }))}
                  className="w-full bg-background border border-input rounded-xl px-4 py-3.5 font-bold text-base focus:ring-2 focus:ring-primary/40 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-muted-foreground mb-1.5">受取終了</label>
                <input type="time" required
                  value={bagForm.pickupEnd}
                  onChange={e => setBagForm(f => ({ ...f, pickupEnd: e.target.value }))}
                  className="w-full bg-background border border-input rounded-xl px-4 py-3.5 font-bold text-base focus:ring-2 focus:ring-primary/40 outline-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-muted-foreground mb-1.5">説明文（任意）</label>
              <textarea
                value={bagForm.description}
                onChange={e => setBagForm(f => ({ ...f, description: e.target.value }))}
                className="w-full bg-background border border-input rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/40 outline-none resize-none text-base"
                rows={3}
                placeholder="アレルギー情報、内容の例など"
              />
            </div>

            <button
              type="submit"
              disabled={createBag.isPending}
              className="w-full bg-primary text-primary-foreground font-black text-lg py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-primary/25 hover:bg-primary/90 active:scale-[0.99] transition-all disabled:opacity-70 min-h-[56px]"
            >
              {createBag.isPending
                ? <><RefreshCw className="w-5 h-5 animate-spin" /> 登録中...</>
                : '今すぐ出品して登録完了'
              }
            </button>
          </form>
        )}

        {/* STEP 3: Done */}
        {step === 'done' && (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-black mb-3">登録完了！</h2>
            <p className="text-muted-foreground mb-2 text-base leading-relaxed">
              お店の情報とサプライズバッグが登録されました。<br />
              地図上にピンが表示されます。
            </p>
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-8 text-sm text-left mt-6">
              <div className="font-bold mb-2 text-foreground">次のステップ</div>
              <ul className="space-y-1 text-muted-foreground">
                <li>✅ 予約が入るとメールでお知らせします</li>
                <li>✅ 店舗ダッシュボードから予約を管理できます</li>
                <li>✅ 毎日の閉店前に在庫数を更新してください</li>
              </ul>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => navigate('/')}
                className="w-full bg-primary text-primary-foreground font-black py-4 rounded-2xl text-lg hover:bg-primary/90 active:scale-[0.99] transition-all min-h-[56px]"
              >
                地図で確認する
              </button>
              <button
                onClick={() => navigate('/store-dashboard')}
                className="w-full bg-secondary text-secondary-foreground font-bold py-4 rounded-2xl text-base hover:bg-secondary/80 active:scale-[0.99] transition-all min-h-[56px]"
              >
                店舗ダッシュボードへ
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
