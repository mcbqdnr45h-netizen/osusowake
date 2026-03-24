import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { StoreLayout } from '@/components/StoreLayout';
import { useMyStore } from '@/hooks/use-my-store';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, Save, Scale, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

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

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold text-muted-foreground mb-1.5">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

export default function StoreLegal() {
  const [, navigate] = useLocation();
  const { store, loading } = useMyStore();
  const { toast } = useToast();

  const [form, setForm] = useState<LegalForm>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [fetched, setFetched] = useState(false);

  const set = (key: keyof LegalForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  useEffect(() => {
    if (!store) return;
    fetch(`${BASE}/api/stores/${store.id}/legal`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        setForm({
          legalName: data.legalName ?? '',
          legalRepresentative: data.legalRepresentative ?? '',
          legalAddress: data.legalAddress ?? '',
          legalPhone: data.legalPhone ?? '',
          legalEmail: data.legalEmail ?? '',
          legalOther: data.legalOther ?? '',
        });
        setFetched(true);
      });
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
      <StoreLayout showHeader={false}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout showHeader={false}>
      <div className="max-w-xl mx-auto pb-10">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-4 sticky bg-background/90 backdrop-blur-sm z-10 border-b border-border/50"
          style={{ top: 'calc(4rem + env(safe-area-inset-top))' }}>
          <button
            onClick={() => navigate('/mypage')}
            className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-black text-foreground">特定商取引法に基づく表記</h1>
            <p className="text-xs text-muted-foreground">販売に必要な法定表示事項を入力してください</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-60 hover:bg-primary/90 transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? '保存中...' : '保存'}
          </button>
        </div>

        <div className="px-4 py-6 space-y-5">
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
              <h2 className="font-black text-sm flex items-center gap-2"><Scale className="w-4 h-4 text-primary" />事業者情報</h2>
            </div>
            <div className="p-5 space-y-4">
              <Field label="販売事業者名（屋号・法人名）" required>
                <input
                  type="text"
                  value={form.legalName}
                  onChange={set('legalName')}
                  placeholder="例：合同会社 食べロス商事"
                  className="w-full px-4 py-3 bg-secondary/50 rounded-xl text-sm font-medium border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </Field>
              <Field label="代表者名" required>
                <input
                  type="text"
                  value={form.legalRepresentative}
                  onChange={set('legalRepresentative')}
                  placeholder="例：山田 太郎"
                  className="w-full px-4 py-3 bg-secondary/50 rounded-xl text-sm font-medium border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </Field>
              <Field label="所在地（住所）" required>
                <input
                  type="text"
                  value={form.legalAddress}
                  onChange={set('legalAddress')}
                  placeholder="例：東京都渋谷区〇〇1-2-3"
                  className="w-full px-4 py-3 bg-secondary/50 rounded-xl text-sm font-medium border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </Field>
              <Field label="電話番号">
                <input
                  type="tel"
                  value={form.legalPhone}
                  onChange={set('legalPhone')}
                  placeholder="例：03-1234-5678"
                  className="w-full px-4 py-3 bg-secondary/50 rounded-xl text-sm font-medium border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </Field>
              <Field label="メールアドレス">
                <input
                  type="email"
                  value={form.legalEmail}
                  onChange={set('legalEmail')}
                  placeholder="例：info@example.com"
                  className="w-full px-4 py-3 bg-secondary/50 rounded-xl text-sm font-medium border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </Field>
              <Field label="その他の特記事項（返品・交換ポリシー等）">
                <textarea
                  value={form.legalOther}
                  onChange={set('legalOther')}
                  rows={4}
                  placeholder="例：食品の性質上、商品お引き渡し後の返品・交換は原則お受けできません。..."
                  className="w-full px-4 py-3 bg-secondary/50 rounded-xl text-sm font-medium border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </Field>
            </div>
          </motion.div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-14 bg-primary text-primary-foreground rounded-2xl font-black text-base flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25 disabled:opacity-60"
          >
            <Save className="w-5 h-5" />
            {saving ? '保存中...' : '内容を保存する'}
          </button>
        </div>
      </div>
    </StoreLayout>
  );
}
