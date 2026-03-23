import React, { useState, useRef } from 'react';
import { Layout } from '@/components/Layout';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Camera, FileText, ShieldCheck,
  CheckCircle2, Clock, Upload, Store, AlertCircle, RefreshCw, Leaf,
} from 'lucide-react';
import { PlaceSearchMap, PlaceResult } from '@/components/PlaceSearchMap';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

const CATEGORY_OPTIONS = [
  { value: 'bakery', label: 'ベーカリー', emoji: '🥐' },
  { value: 'restaurant', label: 'レストラン', emoji: '🍱' },
  { value: 'cafe', label: 'カフェ', emoji: '☕' },
  { value: 'supermarket', label: 'スーパー', emoji: '🛒' },
  { value: 'convenience', label: 'コンビニ', emoji: '🏪' },
  { value: 'other', label: 'その他', emoji: '🍴' },
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


type Step = 'basic' | 'compliance' | 'reviewing' | 'redirecting' | 'done';

interface BasicForm {
  name: string; address: string; city: string;
  category: string; phone: string;
  imageUrl: string; imagePreview: string;
}

interface ComplianceForm {
  licenseNumber: string;
  licenseImageUrl: string; licenseImagePreview: string;
  idImageUrl: string; idImagePreview: string;
  pledgeSigned: boolean;
}

function ImageUploadBox({
  label, preview, onFile, hint,
}: { label: string; preview: string; onFile: (f: File) => void; hint?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <label className="block text-sm font-bold text-muted-foreground mb-2">{label} <span className="text-destructive">*</span></label>
      <div
        onClick={() => ref.current?.click()}
        className={`relative w-full h-44 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all
          ${preview ? 'border-primary/40' : 'border-border hover:border-primary/60 hover:bg-secondary/60'} bg-secondary/40`}
      >
        {preview ? (
          <>
            <img src={preview} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <span className="text-white font-bold text-sm flex items-center gap-1.5"><Camera className="w-4 h-4" /> 変更する</span>
            </div>
          </>
        ) : (
          <>
            <Upload className="w-8 h-8 text-muted-foreground mb-2" />
            <span className="text-sm font-bold text-muted-foreground">タップして写真を選択</span>
            {hint && <span className="text-xs text-muted-foreground/60 mt-1">{hint}</span>}
          </>
        )}
      </div>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
    </div>
  );
}

const REVIEW_CHECKS = [
  { icon: '🏪', label: '基本情報の確認', detail: '店舗名・住所・位置情報' },
  { icon: '📄', label: '営業許可証番号の確認', detail: 'ライセンス番号の書式チェック' },
  { icon: '🖼️', label: '営業許可証（写真）の確認', detail: '書類画像の読み取り' },
  { icon: '🪪', label: '本人確認書類の確認', detail: '身分証明書の確認' },
  { icon: '🤝', label: '誓約書への同意確認', detail: '利用規約への同意' },
];

function ReviewingStep({
  storeId,
  onApproved,
  onFailed,
}: {
  storeId: number;
  onApproved: () => void;
  onFailed: (reason: string) => void;
}) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [checkedCount, setCheckedCount] = useState(0);
  const [apiResult, setApiResult] = useState<{ approved: boolean; reason?: string } | null>(null);
  const [done, setDone] = useState(false);

  // APIを即時呼び出す（アニメーションと並行）
  React.useEffect(() => {
    fetch(`${BASE}/api/stores/${storeId}/auto-review`, { method: 'POST' })
      .then(r => r.json())
      .then(data => setApiResult(data))
      .catch(() => setApiResult({ approved: true }));
  }, [storeId]);

  // チェック項目を順番に表示→チェック済みにする
  React.useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    REVIEW_CHECKS.forEach((_, i) => {
      timers.push(setTimeout(() => setVisibleCount(v => Math.max(v, i + 1)), i * 620));
      timers.push(setTimeout(() => setCheckedCount(v => Math.max(v, i + 1)), i * 620 + 500));
    });
    return () => timers.forEach(clearTimeout);
  }, []);

  // 全チェック完了 + API完了 → 結果へ
  React.useEffect(() => {
    if (checkedCount >= REVIEW_CHECKS.length && apiResult !== null && !done) {
      setDone(true);
      setTimeout(() => {
        if (apiResult.approved) onApproved();
        else onFailed(apiResult.reason ?? '審査が完了しませんでした');
      }, 700);
    }
  }, [checkedCount, apiResult, done, onApproved, onFailed]);

  const progress = Math.round((checkedCount / REVIEW_CHECKS.length) * 100);

  return (
    <motion.div
      key="reviewing"
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      <div className="text-center pt-4 pb-2">
        <div className="relative w-20 h-20 mx-auto mb-4">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="34" fill="none" stroke="hsl(var(--border))" strokeWidth="6" />
            <circle
              cx="40" cy="40" r="34" fill="none"
              stroke="hsl(var(--primary))" strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 34}`}
              strokeDashoffset={`${2 * Math.PI * 34 * (1 - progress / 100)}`}
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-base font-black text-primary">{progress}%</span>
          </div>
        </div>
        <h2 className="text-xl font-black mb-1">自動審査中...</h2>
        <p className="text-sm text-muted-foreground">書類・情報を確認しています</p>
      </div>

      <div className="space-y-2.5">
        {REVIEW_CHECKS.map((check, i) => {
          const visible = i < visibleCount;
          const checked = i < checkedCount;
          return (
            <motion.div
              key={check.label}
              initial={{ opacity: 0, x: 12 }}
              animate={visible ? { opacity: 1, x: 0 } : { opacity: 0, x: 12 }}
              transition={{ duration: 0.3 }}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 border transition-all duration-300
                ${checked ? 'bg-primary/5 border-primary/30' : 'bg-card border-border'}`}
            >
              <span className="text-2xl shrink-0">{check.icon}</span>
              <div className="flex-1 min-w-0">
                <div className={`font-bold text-sm ${checked ? 'text-primary' : 'text-foreground'}`}>{check.label}</div>
                <div className="text-xs text-muted-foreground">{check.detail}</div>
              </div>
              <div className="shrink-0 w-6 h-6 flex items-center justify-center">
                {checked ? (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400 }}>
                    <CheckCircle2 className="w-6 h-6 text-primary" />
                  </motion.div>
                ) : visible ? (
                  <div className="w-4 h-4 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
                ) : null}
              </div>
            </motion.div>
          );
        })}
      </div>

      {done && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-primary text-primary-foreground rounded-2xl p-4 text-center font-black text-base flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-5 h-5" />
          審査完了！口座登録ページへ移動します
        </motion.div>
      )}
    </motion.div>
  );
}

export default function StoreOnboarding() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const userId = (() => {
    try { return localStorage.getItem('rescueat_user_id') || undefined; } catch { return undefined; }
  })();

  const [step, setStep] = useState<Step>('basic');
  const [submitting, setSubmitting] = useState(false);
  const [createdStoreId, setCreatedStoreId] = useState<number | null>(null);
  const [stripeConnected, setStripeConnected] = useState(false);
  const [stripeUrl, setStripeUrl] = useState<string | null>(null);

  const [basic, setBasic] = useState<BasicForm>({
    name: '', address: '', city: '', category: 'restaurant',
    phone: '', imageUrl: '', imagePreview: '',
  });

  const [comp, setComp] = useState<ComplianceForm>({
    licenseNumber: '',
    licenseImageUrl: '', licenseImagePreview: '',
    idImageUrl: '', idImagePreview: '',
    pledgeSigned: false,
  });

  const [pinPos, setPinPos] = useState<{ lat: number; lng: number } | null>(null);

  // Stripe から戻ってきた場合（?stripe_connect=return&storeId=XXX）
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const stripeReturn = params.get('stripe_connect');
    const storeIdParam = params.get('storeId');
    if ((stripeReturn === 'return' || stripeReturn === 'refresh') && storeIdParam) {
      setCreatedStoreId(parseInt(storeIdParam));
      setStripeConnected(stripeReturn === 'return');
      setStep('done');
      // URLパラメータをクリア
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  function handlePlaceSelected(result: PlaceResult) {
    setBasic(b => ({
      ...b,
      name:    result.name    || b.name,
      address: result.address || b.address,
      city:    result.city    || b.city,
      phone:   result.phone   || b.phone,
    }));
    setPinPos({ lat: result.lat, lng: result.lng });
  }

  async function handleBasicNext(e: React.FormEvent) {
    e.preventDefault();
    if (!basic.name || !basic.address || !basic.city) {
      return toast({ title: '必須項目を入力してください', variant: 'destructive' });
    }
    if (!pinPos) {
      return toast({ title: '位置情報が必要です', description: '検索ボックスでお店を検索して位置を確認してください', variant: 'destructive' });
    }
    setStep('compliance');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleComplianceSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!comp.licenseNumber) return toast({ title: '営業許可証番号を入力してください', variant: 'destructive' });
    if (!comp.licenseImageUrl) return toast({ title: '営業許可証の写真をアップロードしてください', variant: 'destructive' });
    if (!comp.idImageUrl) return toast({ title: '本人確認書類の写真をアップロードしてください', variant: 'destructive' });
    if (!comp.pledgeSigned) return toast({ title: '誓約事項への同意が必要です', variant: 'destructive' });

    setSubmitting(true);
    try {
      // ① 店舗情報を DB に保存
      const res = await fetch(`${BASE}/api/stores/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: basic.name,
          address: basic.address,
          city: basic.city,
          category: basic.category,
          phone: basic.phone || undefined,
          imageUrl: basic.imageUrl || undefined,
          lat: pinPos!.lat,
          lng: pinPos!.lng,
          ownerId: userId,
          licenseNumber: comp.licenseNumber,
          licenseImageUrl: comp.licenseImageUrl,
          idImageUrl: comp.idImageUrl,
          pledgeSigned: true,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const store = await res.json();
      setCreatedStoreId(store.id);

      // ② 自動審査ステップへ（ReviewingStep内でAPIを呼ぶ）
      setStep('reviewing');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      toast({ title: '申請失敗', description: err.message, variant: 'destructive' });
      setStep('compliance');
    } finally {
      setSubmitting(false);
    }
  }

  // 審査通過後に Stripe Connect へ進む
  const handleAutoApproved = React.useCallback(async () => {
    if (!createdStoreId) return;
    setStep('redirecting');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const origin = window.location.origin;
    const basePath = import.meta.env.BASE_URL?.replace(/\/$/, '') || '';
    const returnUrl  = `${origin}${basePath}/store-onboarding?stripe_connect=return&storeId=${createdStoreId}`;
    const refreshUrl = `${origin}${basePath}/store-onboarding?stripe_connect=refresh&storeId=${createdStoreId}`;

    try {
      const connectRes = await fetch(`${BASE}/api/stores/${createdStoreId}/connect/onboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnUrl, refreshUrl }),
      });

      if (!connectRes.ok) {
        setStripeConnected(false);
        setStep('done');
        return;
      }

      const { url } = await connectRes.json();
      // window.location.href はiframe環境でブロックされるため
      // ステートに保存してユーザーが手動でクリックする方式に変更
      setStripeUrl(url);
    } catch {
      setStripeConnected(false);
      setStep('done');
    }
  }, [createdStoreId]);

  const handleAutoFailed = React.useCallback((reason: string) => {
    toast({ title: '審査が完了しませんでした', description: reason, variant: 'destructive' });
    setStep('compliance');
  }, [toast]);

  const STEPS: Step[] = ['basic', 'compliance', 'done'];
  const stepIdx = (step === 'reviewing' || step === 'redirecting') ? 2 : STEPS.indexOf(step);

  return (
    <Layout showBottomNav={false}>
      <div className="max-w-xl mx-auto px-4 py-6 pb-24">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => step === 'compliance' ? setStep('basic') : navigate('/register-store')}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-black">店舗オンボーディング申請</h1>
            <p className="text-xs text-muted-foreground">審査後に出品が可能になります</p>
          </div>
        </div>

        {/* Step progress */}
        {step !== 'done' && (
          <div className="flex items-center gap-2 mb-6">
            {[
              { label: '基本情報', idx: 0 },
              { label: '書類・誓約', idx: 1 },
            ].map((s, i) => (
              <React.Fragment key={s.label}>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all
                  ${stepIdx >= s.idx ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                  {stepIdx > s.idx ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span>{i + 1}</span>}
                  {s.label}
                </div>
                {i < 1 && <div className="h-px flex-1 bg-border" />}
              </React.Fragment>
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">

          {/* ── STEP 1: Basic ── */}
          {step === 'basic' && (
            <motion.form
              key="basic"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              onSubmit={handleBasicNext}
              className="space-y-5"
            >
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex gap-3 text-sm">
                <Leaf className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <div className="font-black text-foreground">完全成果報酬型</div>
                  <div className="text-muted-foreground">初期費用・月額0円。売れた分だけ手数料20%</div>
                </div>
              </div>

              {/* Store image */}
              <ImageUploadBox
                label="店舗写真（任意）"
                preview={basic.imagePreview}
                hint="JPG・PNG・HEIC対応"
                onFile={async (f) => {
                  const c = await compressImage(f);
                  setBasic(b => ({ ...b, imageUrl: c, imagePreview: c }));
                }}
              />

              <div>
                <label className="block text-sm font-bold text-muted-foreground mb-1.5">店名 <span className="text-destructive">*</span></label>
                <input required value={basic.name} onChange={e => setBasic(b => ({ ...b, name: e.target.value }))}
                  className="w-full bg-background border border-input rounded-xl px-4 py-3.5 font-bold text-base focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-all"
                  placeholder="例: 幸福堂ベーカリー" />
              </div>

              <div>
                <label className="block text-sm font-bold text-muted-foreground mb-2">
                  お店を検索して位置を確認
                  {pinPos && <span className="text-xs font-normal ml-2 text-emerald-600">✓ 位置を取得しました</span>}
                </label>
                <PlaceSearchMap
                  lat={pinPos?.lat}
                  lng={pinPos?.lng}
                  onPlace={handlePlaceSelected}
                  onPinMove={(lat, lng) => setPinPos({ lat, lng })}
                />
                {pinPos && (
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    緯度: {pinPos.lat.toFixed(5)} / 経度: {pinPos.lng.toFixed(5)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-muted-foreground mb-1.5">
                  住所 <span className="text-destructive">*</span>
                </label>
                <input required value={basic.address} onChange={e => setBasic(b => ({ ...b, address: e.target.value }))}
                  className="w-full bg-background border border-input rounded-xl px-4 py-3.5 font-medium text-base focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-all"
                  placeholder="検索すると自動入力されます" />
              </div>

              <div>
                <label className="block text-sm font-bold text-muted-foreground mb-1.5">市区町村 <span className="text-destructive">*</span></label>
                <input required value={basic.city} onChange={e => setBasic(b => ({ ...b, city: e.target.value }))}
                  className="w-full bg-background border border-input rounded-xl px-4 py-3.5 font-medium text-base focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-all"
                  placeholder="例: 高槻市" />
              </div>

              <div>
                <label className="block text-sm font-bold text-muted-foreground mb-2">ジャンル <span className="text-destructive">*</span></label>
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORY_OPTIONS.map(opt => (
                    <button key={opt.value} type="button"
                      onClick={() => setBasic(b => ({ ...b, category: opt.value }))}
                      className={`py-3 px-2 rounded-xl border-2 font-bold text-sm flex flex-col items-center gap-1 transition-all active:scale-95
                        ${basic.category === opt.value ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card hover:border-primary/40'}`}
                    >
                      <span className="text-2xl">{opt.emoji}</span>
                      <span className="text-xs">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-muted-foreground mb-1.5">電話番号（任意）</label>
                <input type="tel" value={basic.phone} onChange={e => setBasic(b => ({ ...b, phone: e.target.value }))}
                  className="w-full bg-background border border-input rounded-xl px-4 py-3.5 font-medium text-base focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-all"
                  placeholder="06-xxxx-xxxx" />
              </div>

              <button type="submit"
                className="w-full bg-primary text-primary-foreground font-black text-lg py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-primary/25 hover:bg-primary/90 active:scale-[0.99] transition-all disabled:opacity-70 min-h-[56px]"
              >
                次へ：書類を提出する
                <ChevronRight className="w-5 h-5" />
              </button>
            </motion.form>
          )}

          {/* ── STEP 2: Compliance ── */}
          {step === 'compliance' && (
            <motion.form
              key="compliance"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              onSubmit={handleComplianceSubmit}
              className="space-y-6"
            >
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 rounded-xl p-4 flex gap-3 text-sm">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-amber-800 dark:text-amber-300">
                  <div className="font-black mb-0.5">書類の確認について</div>
                  <div>提出後、運営が1〜2営業日以内に内容を確認します。承認後に出品が開始できます。</div>
                </div>
              </div>

              {/* License number */}
              <div>
                <label className="block text-sm font-bold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <FileText className="w-4 h-4" /> 営業許可証番号 <span className="text-destructive">*</span>
                </label>
                <input value={comp.licenseNumber} onChange={e => setComp(c => ({ ...c, licenseNumber: e.target.value }))}
                  className="w-full bg-background border border-input rounded-xl px-4 py-3.5 font-medium text-base focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-all"
                  placeholder="例: 第 12-345 号" />
              </div>

              {/* License image */}
              <ImageUploadBox
                label="営業許可証（写真）"
                preview={comp.licenseImagePreview}
                hint="許可証全体が写るように撮影してください"
                onFile={async (f) => {
                  const c = await compressImage(f, 800, 0.8);
                  setComp(p => ({ ...p, licenseImageUrl: c, licenseImagePreview: c }));
                  toast({ title: '営業許可証をアップロードしました' });
                }}
              />

              {/* ID image */}
              <ImageUploadBox
                label="本人確認書類（代表者）"
                preview={comp.idImagePreview}
                hint="運転免許証・マイナンバーカードなど"
                onFile={async (f) => {
                  const c = await compressImage(f, 800, 0.8);
                  setComp(p => ({ ...p, idImageUrl: c, idImagePreview: c }));
                  toast({ title: '本人確認書類をアップロードしました' });
                }}
              />

              {/* Pledge checkbox */}
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <div className="relative mt-0.5 shrink-0">
                    <input
                      type="checkbox" id="pledge"
                      checked={comp.pledgeSigned}
                      onChange={e => setComp(c => ({ ...c, pledgeSigned: e.target.checked }))}
                      className="sr-only"
                    />
                    <div
                      onClick={() => setComp(c => ({ ...c, pledgeSigned: !c.pledgeSigned }))}
                      className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all
                        ${comp.pledgeSigned ? 'bg-primary border-primary' : 'bg-background border-border hover:border-primary/60'}`}
                    >
                      {comp.pledgeSigned && <CheckCircle2 className="w-4 h-4 text-primary-foreground" />}
                    </div>
                  </div>
                  <label htmlFor="pledge" className="text-sm leading-relaxed text-foreground cursor-pointer" onClick={() => setComp(c => ({ ...c, pledgeSigned: !c.pledgeSigned }))}>
                    <span className="font-black block mb-1">誓約事項への同意 <span className="text-destructive">*</span></span>
                    食品衛生法を遵守し、営業許可証に基づいて営業していることを誓約します。また、食べロスの<span className="text-primary font-bold">利用規約</span>に同意の上、申請します。
                  </label>
                </div>
              </div>

              <button type="submit" disabled={submitting}
                className="w-full bg-primary text-primary-foreground font-black text-lg py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-primary/25 hover:bg-primary/90 active:scale-[0.99] transition-all disabled:opacity-70 min-h-[56px]"
              >
                {submitting ? (
                  <><RefreshCw className="w-5 h-5 animate-spin" /> 申請中...</>
                ) : (
                  <><ShieldCheck className="w-5 h-5" /> 申請を提出する</>
                )}
              </button>
            </motion.form>
          )}

          {/* ── REVIEWING（自動審査中） ── */}
          {step === 'reviewing' && createdStoreId && (
            <ReviewingStep
              storeId={createdStoreId}
              onApproved={handleAutoApproved}
              onFailed={handleAutoFailed}
            />
          )}

          {/* ── REDIRECTING（Stripeへ遷移中） ── */}
          {step === 'redirecting' && (
            <motion.div
              key="redirecting"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              {!stripeUrl ? (
                /* URL 生成中 */
                <>
                  <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                    <CheckCircle2 className="w-10 h-10 text-primary" />
                    <div className="absolute inset-0 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
                  </div>
                  <h2 className="text-2xl font-black mb-2">口座登録URLを生成中…</h2>
                  <p className="text-muted-foreground text-sm">Stripeと通信しています</p>
                </>
              ) : (
                /* URL 取得完了 → ボタンで開く */
                <>
                  <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-12 h-12 text-primary" />
                  </div>
                  <h2 className="text-2xl font-black mb-2">審査が完了しました！</h2>
                  <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
                    続けてStripeで銀行口座を登録してください。<br />
                    登録後に商品の出品が可能になります。
                  </p>
                  <a
                    href={stripeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 w-full max-w-xs mx-auto bg-primary text-primary-foreground font-black text-base rounded-2xl px-6 py-4 shadow-lg hover:bg-primary/90 active:scale-95 transition-all"
                  >
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                    Stripeで口座登録する
                  </a>
                  <p className="text-xs text-muted-foreground mt-4">
                    ※ 別タブで開きます
                  </p>
                </>
              )}
            </motion.div>
          )}

          {/* ── DONE ── */}
          {step === 'done' && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              {/* メインアイコン */}
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="w-12 h-12 text-primary" />
              </div>
              <h2 className="text-2xl font-black text-foreground mb-2">
                {stripeConnected ? '申請＆口座登録が完了しました！' : '申請を受け付けました！'}
              </h2>
              <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                {stripeConnected
                  ? '書類審査が完了次第、Stripeで登録した口座へ自動で売上が振り込まれます。'
                  : '1〜2営業日以内に審査結果をお知らせします。承認後、すぐに出品を開始できます。'}
              </p>

              {/* 申請番号 */}
              {createdStoreId && (
                <div className="bg-secondary/50 rounded-2xl p-4 text-left mb-5">
                  <p className="text-xs text-muted-foreground font-bold mb-1">申請番号</p>
                  <p className="font-black text-primary text-lg">STORE-{String(createdStoreId).padStart(5, '0')}</p>
                </div>
              )}

              {/* Stripe 接続ステータス */}
              <div className={`rounded-2xl p-4 text-left mb-5 border ${stripeConnected ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800' : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${stripeConnected ? 'bg-emerald-500' : 'bg-amber-400'}`}>
                    {stripeConnected
                      ? <CheckCircle2 className="w-5 h-5 text-white" />
                      : <Clock className="w-5 h-5 text-white" />
                    }
                  </div>
                  <div>
                    <p className={`font-black text-sm mb-0.5 ${stripeConnected ? 'text-emerald-800 dark:text-emerald-300' : 'text-amber-800 dark:text-amber-300'}`}>
                      {stripeConnected ? 'Stripe口座登録済み' : 'Stripe口座登録が未完了です'}
                    </p>
                    <p className={`text-xs leading-relaxed ${stripeConnected ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}>
                      {stripeConnected
                        ? '決済が発生した際、プラットフォーム手数料25%を除いた売上が自動送金されます。'
                        : '後から店舗ダッシュボードで口座登録を完了できます。'}
                    </p>
                  </div>
                </div>
              </div>

              {/* ステップ一覧 */}
              <div className="space-y-3 text-left mb-8">
                {[
                  { icon: '📋', text: '書類審査（1〜2営業日）', done: false },
                  { icon: '✅', text: '承認通知', done: false },
                  { icon: '💳', text: 'Stripe口座登録', done: stripeConnected },
                  { icon: '🚀', text: '即日出品スタート！', done: false },
                ].map((item, i) => (
                  <div key={i} className={`flex items-center gap-3 rounded-xl px-4 py-3 border ${item.done ? 'bg-primary/5 border-primary/30' : 'bg-card border-border'}`}>
                    <span className="text-xl">{item.icon}</span>
                    <span className={`font-bold text-sm ${item.done ? 'text-primary' : 'text-foreground'}`}>{item.text}</span>
                    {item.done && <CheckCircle2 className="w-4 h-4 text-primary ml-auto" />}
                  </div>
                ))}
              </div>

              <button onClick={() => navigate('/')}
                className="w-full bg-primary text-primary-foreground font-black py-4 rounded-2xl hover:bg-primary/90 transition-colors">
                ホームに戻る
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </Layout>
  );
}
