import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { StoreLayout } from '@/components/StoreLayout';
import { useMyStore } from '@/hooks/use-my-store';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, Save, Scale, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, '') || '';

type LegalForm = {
  legalName: string;
  legalRepresentative: string;
  legalAddress: string;
  legalPhone: string;
  legalEmail: string;
  legalOther: string;
};

const EMPTY: LegalForm = {
  legalName: '',
  legalRepresentative: '',
  legalAddress: '',
  legalPhone: '',
  legalEmail: '',
  legalOther: '',
};

type StripePrefill = {
  available: boolean;
  legalName?: string;
  representative?: string;
  legalAddress?: string;
  legalPhone?: string;
  legalEmail?: string;
};

function Field({ label, required, hint, badge, children }: { label: string; required?: boolean; hint?: string; badge?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1 mb-1.5">
        <label className="text-xs font-bold text-muted-foreground">
          {label}{required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {badge}
      </div>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground mt-1 leading-tight">{hint}</p>}
    </div>
  );
}

function AutoFillBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5 ml-2">
      <Sparkles className="w-2.5 h-2.5" />
      Stripe取得
    </span>
  );
}

export default function StoreLegal() {
  const [, navigate] = useLocation();
  const { store, loading } = useMyStore();
  const { toast } = useToast();

  const [form, setForm] = useState<LegalForm>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [stripeFilled, setStripeFilled] = useState<Set<keyof LegalForm>>(new Set());
  const [stripeAutoCount, setStripeAutoCount] = useState(0);
  const [prefillDone, setPrefillDone] = useState(false);

  const set = (key: keyof LegalForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [key]: e.target.value }));
    setStripeFilled(prev => { const n = new Set(prev); n.delete(key); return n; });
  };

  useEffect(() => {
    if (!store) return;

    const loadAll = async () => {
      // 1) 保存済みの特商法データを取得
      const savedRes = await fetch(`${BASE}/api/stores/${store.id}/legal`).catch(() => null);
      const savedData: Partial<LegalForm> & { name?: string } = savedRes?.ok ? await savedRes.json() : {};

      const base: LegalForm = {
        legalName: savedData.legalName ?? '',
        legalRepresentative: savedData.legalRepresentative ?? '',
        legalAddress: savedData.legalAddress ?? '',
        legalPhone: savedData.legalPhone ?? '',
        legalEmail: savedData.legalEmail ?? '',
        legalOther: savedData.legalOther ?? '',
      };

      // 2) Stripe からの自動取得（空欄フィールドのみ補完）
      try {
        const stripeRes = await fetch(`${BASE}/api/stores/${store.id}/connect/stripe-prefill`);
        if (stripeRes.ok) {
          const prefill: StripePrefill = await stripeRes.json();
          if (prefill.available) {
            const filled = new Set<keyof LegalForm>();
            const merged = { ...base };

            const tryFill = (key: keyof LegalForm, value: string | undefined) => {
              if (!merged[key] && value) {
                merged[key] = value;
                filled.add(key);
              }
            };

            tryFill('legalName', prefill.legalName);
            tryFill('legalRepresentative', prefill.representative);
            tryFill('legalAddress', prefill.legalAddress);
            tryFill('legalPhone', prefill.legalPhone);
            tryFill('legalEmail', prefill.legalEmail);

            setForm(merged);
            setStripeFilled(filled);
            setStripeAutoCount(filled.size);
            setPrefillDone(filled.size > 0);
            return;
          }
        }
      } catch {
        // Stripe prefill 失敗は無視して保存済みデータで続行
      }

      setForm(base);
    };

    loadAll();
  }, [store]);

  const handleSave = async () => {
    if (!store) return;
    if (!form.legalName || !form.legalRepresentative || !form.legalAddress) {
      toast({ title: '入力エラー', description: '販売事業者名・代表者名・所在地は必須です', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${BASE}/api/stores/${store.id}/legal`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('保存失敗');
      toast({ title: '保存しました', description: '特定商取引法の情報を更新しました' });
      navigate('/mypage');
    } catch {
      toast({ title: 'エラー', description: '保存に失敗しました', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <StoreLayout showHeader={false} showBottomNav={false}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout showHeader={false} showBottomNav={false}>
      <div className="max-w-xl mx-auto w-full flex flex-col"
        style={{ paddingBottom: 'calc(96px + env(safe-area-inset-bottom))' }}>

        {/* 固定ヘッダー */}
        <div
          className="sticky z-20 bg-background/95 backdrop-blur-md border-b border-border/50 shadow-sm"
          style={{ top: 0, paddingTop: 'env(safe-area-inset-top)' }}
        >
          <div className="flex items-center gap-3 px-4 h-14">
            <button
              onClick={() => navigate('/mypage')}
              className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors shrink-0"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-black text-foreground truncate">特定商取引法に基づく表記</h1>
              <p className="text-[10px] text-muted-foreground leading-tight">販売に必要な法定表示事項</p>
            </div>
          </div>
        </div>

        <div className="px-4 pt-5 pb-4 space-y-4">

          {/* Stripe 自動入力バナー */}
          <AnimatePresence>
            {prefillDone && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex gap-3"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-emerald-800">Stripe から {stripeAutoCount} 項目を自動入力しました</p>
                  <p className="text-xs text-emerald-700 mt-0.5 leading-relaxed">
                    内容をご確認のうえ、必要に応じて修正してから保存してください。
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 説明バナー */}
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-blue-800">特定商取引法とは？</p>
              <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                インターネット上で商品・サービスを販売する際は、消費者保護のために事業者情報の明示が法律で義務づけられています。
                ここで入力した情報は、店舗詳細ページに公開されます。
              </p>
            </div>
          </motion.div>

          {/* フォーム */}
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 pt-5 pb-3 border-b border-border/50">
              <h2 className="font-black text-sm flex items-center gap-2">
                <Scale className="w-4 h-4 text-primary" />
                事業者情報
              </h2>
            </div>
            <div className="p-5 space-y-4">

              <Field label="販売事業者名（屋号・法人名）" required badge={stripeFilled.has('legalName') ? <AutoFillBadge /> : null}>
                <input
                  type="text"
                  value={form.legalName}
                  onChange={set('legalName')}
                  placeholder="例：おすそわけ食堂"
                  className={`w-full px-4 py-3 bg-secondary/50 rounded-xl text-sm font-medium border focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors ${stripeFilled.has('legalName') ? 'border-emerald-300 bg-emerald-50/40' : 'border-border/50'}`}
                />
              </Field>

              <Field label="代表者名" required badge={stripeFilled.has('legalRepresentative') ? <AutoFillBadge /> : null}>
                <input
                  type="text"
                  value={form.legalRepresentative}
                  onChange={set('legalRepresentative')}
                  placeholder="例：鈴木 一郎"
                  className={`w-full px-4 py-3 bg-secondary/50 rounded-xl text-sm font-medium border focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors ${stripeFilled.has('legalRepresentative') ? 'border-emerald-300 bg-emerald-50/40' : 'border-border/50'}`}
                />
              </Field>

              <Field label="所在地（住所）" required badge={stripeFilled.has('legalAddress') ? <AutoFillBadge /> : null}>
                <input
                  type="text"
                  value={form.legalAddress}
                  onChange={set('legalAddress')}
                  placeholder="例：東京都世田谷区〇〇町1-2-3"
                  className={`w-full px-4 py-3 bg-secondary/50 rounded-xl text-sm font-medium border focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors ${stripeFilled.has('legalAddress') ? 'border-emerald-300 bg-emerald-50/40' : 'border-border/50'}`}
                />
              </Field>

              <Field label="電話番号" badge={stripeFilled.has('legalPhone') ? <AutoFillBadge /> : null}>
                <input
                  type="tel"
                  value={form.legalPhone}
                  onChange={set('legalPhone')}
                  placeholder="例：090-0000-0000"
                  className={`w-full px-4 py-3 bg-secondary/50 rounded-xl text-sm font-medium border focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors ${stripeFilled.has('legalPhone') ? 'border-emerald-300 bg-emerald-50/40' : 'border-border/50'}`}
                />
              </Field>

              <Field label="メールアドレス" badge={stripeFilled.has('legalEmail') ? <AutoFillBadge /> : null}>
                <input
                  type="email"
                  value={form.legalEmail}
                  onChange={set('legalEmail')}
                  placeholder="例：info@osusowake.jp"
                  className={`w-full px-4 py-3 bg-secondary/50 rounded-xl text-sm font-medium border focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors ${stripeFilled.has('legalEmail') ? 'border-emerald-300 bg-emerald-50/40' : 'border-border/50'}`}
                />
              </Field>

              <Field
                label="その他の特記事項（返品・交換ポリシー等）"
                hint="食品の性質上、返品・交換不可の場合は必ず明記してください"
              >
                <textarea
                  value={form.legalOther}
                  onChange={set('legalOther')}
                  rows={4}
                  placeholder="例：食品の性質上、商品お引き渡し後の返品・交換は原則お受けできません。衛生上の理由から、受け取り後のキャンセルも承っておりません。"
                  className="w-full px-4 py-3 bg-secondary/50 rounded-xl text-sm font-medium border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </Field>

            </div>
          </motion.div>
        </div>
      </div>

      {/* フローティング保存ボタン */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30 bg-background/95 backdrop-blur-md border-t border-border/50 px-4 pt-3"
        style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
      >
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-14 bg-primary text-primary-foreground rounded-2xl font-black text-base flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-[0.98] transition-all shadow-lg shadow-primary/20 disabled:opacity-60"
        >
          {saving
            ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />保存中...</>
            : <><Save className="w-5 h-5" />内容を保存する</>
          }
        </button>
      </div>
    </StoreLayout>
  );
}
