import React, { useState, useRef } from 'react';
import { Layout } from '@/components/Layout';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Camera, MapPin, FileText, ShieldCheck,
  CheckCircle2, Clock, Upload, Store, AlertCircle, RefreshCw, Leaf,
} from 'lucide-react';

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

async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address + ' Japan')}&format=json&limit=1&countrycodes=jp`,
      { headers: { 'Accept-Language': 'ja', 'User-Agent': 'taberos-app/1.0' } }
    );
    const data = await res.json();
    if (data?.[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {}
  return null;
}

type Step = 'basic' | 'compliance' | 'done';

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

export default function StoreOnboarding() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>('basic');
  const [submitting, setSubmitting] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [createdStoreId, setCreatedStoreId] = useState<number | null>(null);

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

  const geocodeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pinPos, setPinPos] = useState<{ lat: number; lng: number } | null>(null);

  function handleAddressChange(val: string) {
    setBasic(b => ({ ...b, address: val }));
    if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
    if (val.length < 6) return;
    geocodeTimer.current = setTimeout(async () => {
      setGeocoding(true);
      const r = await geocodeAddress(val);
      setGeocoding(false);
      if (r) setPinPos(r);
    }, 1200);
  }

  async function handleBasicNext(e: React.FormEvent) {
    e.preventDefault();
    if (!basic.name || !basic.address || !basic.city) {
      return toast({ title: '必須項目を入力してください', variant: 'destructive' });
    }
    if (!pinPos) {
      setGeocoding(true);
      const r = await geocodeAddress(basic.address);
      setGeocoding(false);
      if (!r) return toast({ title: '住所を確認してください', description: '都道府県から入力してください', variant: 'destructive' });
      setPinPos(r);
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
          licenseNumber: comp.licenseNumber,
          licenseImageUrl: comp.licenseImageUrl,
          idImageUrl: comp.idImageUrl,
          pledgeSigned: true,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const store = await res.json();
      setCreatedStoreId(store.id);
      setStep('done');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      toast({ title: '申請失敗', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }

  const STEPS: Step[] = ['basic', 'compliance', 'done'];
  const stepIdx = STEPS.indexOf(step);

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
                <label className="block text-sm font-bold text-muted-foreground mb-1.5">
                  住所 <span className="text-destructive">*</span>
                  {geocoding && <span className="text-xs font-normal ml-2 text-primary animate-pulse">検索中...</span>}
                  {!geocoding && pinPos && <span className="text-xs font-normal ml-2 text-emerald-600">✓ 確認済</span>}
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input required value={basic.address} onChange={e => handleAddressChange(e.target.value)}
                    className="w-full bg-background border border-input rounded-xl pl-10 pr-4 py-3.5 font-medium text-base focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-all"
                    placeholder="例: 大阪府高槻市城西町1-1" />
                </div>
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

              <button type="submit" disabled={geocoding}
                className="w-full bg-primary text-primary-foreground font-black text-lg py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-primary/25 hover:bg-primary/90 active:scale-[0.99] transition-all disabled:opacity-70 min-h-[56px]"
              >
                {geocoding ? <RefreshCw className="w-5 h-5 animate-spin" /> : null}
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

          {/* ── DONE ── */}
          {step === 'done' && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-5">
                <Clock className="w-12 h-12 text-primary" />
              </div>
              <h2 className="text-2xl font-black text-foreground mb-2">申請を受け付けました！</h2>
              <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                1〜2営業日以内に審査結果をお知らせします。<br />
                承認後、すぐに出品を開始できます。
              </p>

              {createdStoreId && (
                <div className="bg-secondary/50 rounded-2xl p-4 text-left mb-6">
                  <p className="text-xs text-muted-foreground font-bold mb-1">申請番号</p>
                  <p className="font-black text-primary text-lg">STORE-{String(createdStoreId).padStart(5, '0')}</p>
                </div>
              )}

              <div className="space-y-3 text-left mb-8">
                {[
                  { icon: '📋', text: '書類審査（1〜2営業日）' },
                  { icon: '✅', text: '承認通知（メール）' },
                  { icon: '🚀', text: '即日出品スタート！' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3">
                    <span className="text-xl">{item.icon}</span>
                    <span className="font-bold text-sm text-foreground">{item.text}</span>
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
