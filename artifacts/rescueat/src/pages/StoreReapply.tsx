import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, CheckCircle, RefreshCw, Store } from 'lucide-react';
import { useMyStore } from '@/hooks/use-my-store';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { StoreLayout } from '@/components/StoreLayout';

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, '') || '';

const CATEGORIES = [
  { value: 'restaurant', label: '飲食店・レストラン' },
  { value: 'bakery',     label: 'パン屋' },
  { value: 'cafe',       label: 'カフェ' },
  { value: 'supermarket',label: 'スーパー' },
  { value: 'convenience',label: 'コンビニ' },
  { value: 'bakery_sweets', label: 'ベーカリー・スイーツ' },
  { value: 'meals',      label: '惣菜・弁当' },
  { value: 'ingredients',label: '食材・八百屋' },
  { value: 'other',      label: 'その他' },
];

export default function StoreReapply() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { store, loading } = useMyStore();
  const { toast } = useToast();

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    name: '',
    description: '',
    category: 'other',
    address: '',
    city: '',
    phone: '',
    openTime: '',
    closeTime: '',
    holiday: '',
    pickupHours: '',
  });

  useEffect(() => {
    if (store) {
      setForm({
        name:        store.name ?? '',
        description: store.description ?? '',
        category:    store.category ?? 'other',
        address:     store.address ?? '',
        city:        store.city ?? '',
        phone:       store.phone ?? '',
        openTime:    store.openTime ?? '',
        closeTime:   store.closeTime ?? '',
        holiday:     store.holiday ?? '',
        pickupHours: store.pickupHours ?? '',
      });
    }
  }, [store]);

  function update(field: keyof typeof form, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!store || !user) return;
    if (!form.name.trim() || !form.address.trim()) {
      toast({ title: '店舗名と住所は必須です', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${BASE}/api/stores/${store.id}/reapply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSubmitted(true);
        toast({ title: '再申請を受け付けました。審査結果をお待ちください。' });
        setTimeout(() => navigate('/store/dashboard'), 2500);
      } else {
        const data = await res.json().catch(() => ({}));
        toast({ title: '再申請に失敗しました', description: data?.message ?? '時間をおいて再度お試しください', variant: 'destructive' });
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-dvh flex items-center justify-center px-6">
        <div className="text-center space-y-4">
          <Store className="w-12 h-12 text-muted-foreground mx-auto" />
          <p className="font-bold text-foreground">店舗情報が見つかりません</p>
          <button onClick={() => navigate('/mypage')} className="text-primary font-bold text-sm">マイページへ戻る</button>
        </div>
      </div>
    );
  }

  if (store.status !== 'rejected') {
    return (
      <div className="min-h-dvh flex items-center justify-center px-6">
        <div className="text-center space-y-4">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
          <p className="font-bold text-foreground">現在のステータスでは再申請できません</p>
          <button onClick={() => navigate('/store/dashboard')} className="text-primary font-bold text-sm">ダッシュボードへ</button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-dvh flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-5 max-w-sm"
        >
          <div className="w-20 h-20 bg-green-100 rounded-3xl flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-black text-foreground mb-1">再申請を受け付けました</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">審査結果は通知とメールでお知らせします。<br />審査完了までしばらくお待ちください。</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <StoreLayout showHeader={false}>
      <div className="max-w-2xl mx-auto w-full pb-32">
        {/* ヘッダー */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border/40"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          <div className="px-4 h-14 flex items-center gap-3">
            <button onClick={() => window.history.back()}
              className="p-2 -ml-2 rounded-xl hover:bg-secondary transition-colors">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="font-black text-foreground text-base leading-tight">再申請フォーム</h1>
              <p className="text-[10px] text-muted-foreground">{store.name}</p>
            </div>
          </div>
        </div>

        <form noValidate onSubmit={handleSubmit} className="px-4 pt-5 space-y-5">

          {/* 却下理由バナー */}
          {store.rejectionReason && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 rounded-2xl p-4"
            >
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-black text-red-700 mb-1">却下理由</p>
                  <p className="text-sm text-red-600 leading-relaxed">{store.rejectionReason}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* 説明 */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <p className="text-sm text-amber-700 leading-relaxed">
              下記の情報を修正・確認のうえ、再申請してください。
              承認されるまで店舗は一般公開されません。
            </p>
          </div>

          {/* 店舗名 */}
          <div>
            <label className="block text-xs font-black text-foreground/70 mb-2 uppercase tracking-wider">店舗名 <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={form.name}
              onChange={e => update('name', e.target.value)}
              placeholder="例：タップスバーガーショップ"
              className="w-full px-4 py-3 bg-secondary/50 rounded-xl text-sm font-medium border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* カテゴリ */}
          <div>
            <label className="block text-xs font-black text-foreground/70 mb-2 uppercase tracking-wider">カテゴリ</label>
            <select
              value={form.category}
              onChange={e => update('category', e.target.value)}
              className="w-full px-4 py-3 bg-secondary/50 rounded-xl text-sm font-medium border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* 説明文 */}
          <div>
            <label className="block text-xs font-black text-foreground/70 mb-2 uppercase tracking-wider">店舗説明</label>
            <textarea
              value={form.description}
              onChange={e => update('description', e.target.value)}
              rows={3}
              placeholder="お店の特徴や取り扱い商品など"
              className="w-full px-4 py-3 bg-secondary/50 rounded-xl text-sm font-medium border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>

          {/* 住所 */}
          <div>
            <label className="block text-xs font-black text-foreground/70 mb-2 uppercase tracking-wider">住所 <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={form.address}
              onChange={e => update('address', e.target.value)}
              placeholder="例：大阪府高槻市城北町2-2-15"
              className="w-full px-4 py-3 bg-secondary/50 rounded-xl text-sm font-medium border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* 市区町村 */}
          <div>
            <label className="block text-xs font-black text-foreground/70 mb-2 uppercase tracking-wider">市区町村</label>
            <input
              type="text"
              value={form.city}
              onChange={e => update('city', e.target.value)}
              placeholder="例：高槻市"
              className="w-full px-4 py-3 bg-secondary/50 rounded-xl text-sm font-medium border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* 電話番号 */}
          <div>
            <label className="block text-xs font-black text-foreground/70 mb-2 uppercase tracking-wider">電話番号</label>
            <input
              type="tel"
              value={form.phone}
              onChange={e => update('phone', e.target.value)}
              placeholder="例：072-xxx-xxxx"
              className="w-full px-4 py-3 bg-secondary/50 rounded-xl text-sm font-medium border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* 営業時間 */}
          <div>
            <label className="block text-xs font-black text-foreground/70 mb-2 uppercase tracking-wider">営業時間</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">開店</p>
                <input
                  type="time"
                  value={form.openTime}
                  onChange={e => update('openTime', e.target.value)}
                  className="w-full px-4 py-3 bg-secondary/50 rounded-xl text-sm font-medium border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">閉店</p>
                <input
                  type="time"
                  value={form.closeTime}
                  onChange={e => update('closeTime', e.target.value)}
                  className="w-full px-4 py-3 bg-secondary/50 rounded-xl text-sm font-medium border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
          </div>

          {/* 受取可能時間 */}
          <div>
            <label className="block text-xs font-black text-foreground/70 mb-2 uppercase tracking-wider">受取可能時間</label>
            <input
              type="text"
              value={form.pickupHours}
              onChange={e => update('pickupHours', e.target.value)}
              placeholder="例：10:00〜20:00"
              className="w-full px-4 py-3 bg-secondary/50 rounded-xl text-sm font-medium border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* 定休日 */}
          <div>
            <label className="block text-xs font-black text-foreground/70 mb-2 uppercase tracking-wider">定休日</label>
            <input
              type="text"
              value={form.holiday}
              onChange={e => update('holiday', e.target.value)}
              placeholder="例：月曜日・祝日"
              className="w-full px-4 py-3 bg-secondary/50 rounded-xl text-sm font-medium border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* 送信ボタン */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="w-full h-14 bg-primary text-white font-black text-base rounded-2xl flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.98] transition-all shadow-lg shadow-primary/20"
            >
              {submitting ? (
                <><RefreshCw className="w-5 h-5 animate-spin" />送信中…</>
              ) : (
                '再申請する'
              )}
            </button>
            <p className="text-[11px] text-center text-muted-foreground mt-3">
              送信後、審査結果は通知とメールにてお知らせします（通常1〜2営業日）
            </p>
          </div>
        </form>
      </div>
    </StoreLayout>
  );
}
