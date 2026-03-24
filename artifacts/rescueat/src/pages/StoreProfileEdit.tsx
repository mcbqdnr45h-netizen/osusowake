import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { StoreLayout } from '@/components/StoreLayout';
import { useMyStore } from '@/hooks/use-my-store';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, Camera, Save, Clock, CalendarX2, Store, FileText, Phone, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, '') || '';

const CATEGORY_LABELS: Record<string, string> = {
  restaurant: '飲食店',
  bakery: 'パン屋',
  cafe: 'カフェ',
  supermarket: 'スーパー',
  convenience: 'コンビニ',
  other: 'その他',
};

type StoreProfile = {
  name: string;
  description: string;
  imageUrl: string;
  phone: string;
  openTime: string;
  closeTime: string;
  holiday: string;
  pickupHours: string;
  category: string;
};

export default function StoreProfileEdit() {
  const [, navigate] = useLocation();
  const { store, loading } = useMyStore();
  const { toast } = useToast();

  const [form, setForm] = useState<StoreProfile>({
    name: '',
    description: '',
    imageUrl: '',
    phone: '',
    openTime: '',
    closeTime: '',
    holiday: '',
    pickupHours: '',
    category: 'other',
  });
  const [saving, setSaving]     = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!store) return;
    fetch(`${BASE}/api/stores/${store.id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        setForm({
          name:         data.name         ?? '',
          description:  data.description  ?? '',
          imageUrl:     data.imageUrl     ?? '',
          phone:        data.phone        ?? '',
          openTime:     data.openTime     ?? '',
          closeTime:    data.closeTime    ?? '',
          holiday:      data.holiday      ?? '',
          pickupHours:  data.pickupHours  ?? '',
          category:     data.category     ?? 'other',
        });
        setPreviewUrl(data.imageUrl ?? '');
      });
  }, [store]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await fetch(`${BASE}/api/upload/bag-image`, { method: 'POST', body: fd });
      if (!res.ok) throw new Error('アップロード失敗');
      const { url } = await res.json();
      setPreviewUrl(url);
      setForm(f => ({ ...f, imageUrl: url }));
    } catch {
      toast({ title: 'アップロードエラー', description: '画像の送信に失敗しました', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!store) return;
    setSaving(true);
    try {
      const res = await fetch(`${BASE}/api/stores/${store.id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('保存失敗');
      toast({ title: '保存しました', description: '店舗プロフィールを更新しました' });
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
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout showHeader={false}>

      {/* ══════════════════════════════════════════════════
          固定タイトルバー
          - 画面最上部（top:0）に fixed 配置
          - padding-top で iPhone ノッチを確実に回避
          - z-50 でカバー写真の上に重ねる
      ══════════════════════════════════════════════════ */}
      <div
        className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-border/50 shadow-sm"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex items-center gap-3 px-4 h-14 max-w-xl mx-auto">
          {/* 戻るボタン */}
          <button
            type="button"
            onClick={() => navigate('/mypage')}
            className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 active:scale-90 transition-all shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* タイトル */}
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-black text-foreground leading-tight">店舗プロフィール編集</h1>
            <p className="text-[10px] text-muted-foreground mt-0.5">お客様に表示される情報を編集</p>
          </div>

          {/* 保存ボタン */}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || uploading}
            className="flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-60 hover:bg-primary/90 active:scale-95 transition-all shadow-md shadow-primary/20 shrink-0"
          >
            {saving
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Save className="w-4 h-4" />}
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          スクロールコンテンツ
          - padding-top で固定タイトルバーの高さ分だけ下にずらす
            (14px safe-area + 56px bar = 70px 基準)
          - カバー写真をコンテンツの先頭・全幅で表示
      ══════════════════════════════════════════════════ */}
      <div
        className="max-w-xl mx-auto w-full pb-10"
        style={{ paddingTop: 'calc(56px + env(safe-area-inset-top))' }}
      >

        {/* ── カバー写真（全幅・ヒーロー表示） ── */}
        <div
          className="relative w-full cursor-pointer group overflow-hidden"
          style={{ height: '200px' }}
          onClick={() => fileRef.current?.click()}
        >
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="カバー写真"
              className="w-full h-full object-cover"
            />
          ) : (
            /* プレースホルダー：オレンジグラデーション背景 */
            <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-orange-50 to-orange-100 border-b border-orange-200">
              <div className="w-16 h-16 rounded-full bg-white/80 flex items-center justify-center shadow-sm">
                <Camera className="w-7 h-7 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-primary">カバー写真を追加</p>
                <p className="text-xs text-muted-foreground mt-0.5">タップして写真を選択</p>
              </div>
            </div>
          )}

          {/* ホバー/タップ時オーバーレイ */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
            {uploading ? (
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            ) : (
              <>
                <Camera className="w-8 h-8 text-white" />
                <span className="text-white font-bold text-sm">写真を変更</span>
              </>
            )}
          </div>

          {/* アップロード中プログレスバー */}
          {uploading && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30">
              <div className="h-full bg-primary animate-pulse" style={{ width: '60%' }} />
            </div>
          )}
        </div>

        {/* 写真サイズヒント */}
        <div className="flex items-center justify-between px-4 py-2 bg-orange-50/60 border-b border-orange-100">
          <p className="text-[11px] text-muted-foreground">JPG・PNG・WEBP / 推奨サイズ 1200×600px</p>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="text-[11px] font-bold text-primary hover:underline"
          >
            変更する
          </button>
        </div>

        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />

        {/* ── フォームカード群 ── */}
        <div className="px-4 py-5 space-y-5">

          {/* 基本情報 */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm"
          >
            <div className="px-5 pt-5 pb-3 border-b border-border/50">
              <h2 className="font-black text-sm flex items-center gap-2">
                <Store className="w-4 h-4 text-primary" />基本情報
              </h2>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5">店舗名</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="例：たけのこ食堂"
                  className="w-full px-4 py-3 bg-secondary/50 rounded-xl text-sm font-medium border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" />電話番号
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="例：03-1234-5678"
                  className="w-full px-4 py-3 bg-secondary/50 rounded-xl text-sm font-medium border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5">カテゴリ</label>
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full px-4 py-3 bg-secondary/50 rounded-xl text-sm font-medium border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
            </div>
          </motion.div>

          {/* PR文 */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm"
          >
            <div className="px-5 pt-5 pb-3 border-b border-border/50">
              <h2 className="font-black text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />お店の紹介文（PR）
              </h2>
            </div>
            <div className="p-5">
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={4}
                placeholder="お店の魅力、こだわり、おすそ分けバッグの特徴などをPRしましょう！"
                className="w-full px-4 py-3 bg-secondary/50 rounded-xl text-sm font-medium border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1.5">{form.description.length} 文字</p>
            </div>
          </motion.div>

          {/* 営業時間・定休日 */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm"
          >
            <div className="px-5 pt-5 pb-3 border-b border-border/50">
              <h2 className="font-black text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />営業時間・受取時間
              </h2>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1.5">営業開始</label>
                  <input
                    type="time"
                    value={form.openTime}
                    onChange={e => setForm(f => ({ ...f, openTime: e.target.value }))}
                    className="w-full px-4 py-3 bg-secondary/50 rounded-xl text-sm font-medium border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1.5">営業終了</label>
                  <input
                    type="time"
                    value={form.closeTime}
                    onChange={e => setForm(f => ({ ...f, closeTime: e.target.value }))}
                    className="w-full px-4 py-3 bg-secondary/50 rounded-xl text-sm font-medium border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5">受取可能な時間帯（説明文）</label>
                <input
                  type="text"
                  value={form.pickupHours}
                  onChange={e => setForm(f => ({ ...f, pickupHours: e.target.value }))}
                  placeholder="例：17:00〜20:00（毎日）"
                  className="w-full px-4 py-3 bg-secondary/50 rounded-xl text-sm font-medium border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5 flex items-center gap-1">
                  <CalendarX2 className="w-3.5 h-3.5" />定休日
                </label>
                <input
                  type="text"
                  value={form.holiday}
                  onChange={e => setForm(f => ({ ...f, holiday: e.target.value }))}
                  placeholder="例：毎週月曜日・祝日"
                  className="w-full px-4 py-3 bg-secondary/50 rounded-xl text-sm font-medium border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
          </motion.div>

          {/* 保存ボタン（下部） */}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || uploading}
            className="w-full h-14 bg-primary text-white rounded-2xl font-black text-base flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-[0.98] transition-all shadow-lg shadow-primary/25 disabled:opacity-60"
          >
            {saving
              ? <Loader2 className="w-5 h-5 animate-spin" />
              : <Save className="w-5 h-5" />}
            {saving ? '保存中...' : 'プロフィールを保存する'}
          </button>
        </div>
      </div>
    </StoreLayout>
  );
}
