import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { StoreLayout } from '@/components/StoreLayout';
import { useMyStore } from '@/hooks/use-my-store';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, Camera, Save, Clock, CalendarX2, Store, FileText, Phone, MapPin, Loader2, MapPinned, X as XIcon } from 'lucide-react';
import { TimePicker } from '@/components/TimePicker';
import { motion } from 'framer-motion';
import { authedFetch } from '@/lib/authed-fetch';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

// ★ iOS Capacitor では VITE_API_BASE (https://osusowakejapan.org) が必須。Web では BASE_URL を使う
const BASE = (((import.meta as any).env?.VITE_API_BASE as string) || '') ||
             (import.meta.env.BASE_URL?.replace(/\/$/, '') || '');

const CATEGORY_OPTIONS = [
  { value: 'meals',         label: '料理・お惣菜',  emoji: '🍱' },
  { value: 'bakery_sweets', label: 'パン・スイーツ', emoji: '🥐' },
  { value: 'ingredients',   label: '食材・その他',  emoji: '🍎' },
];

type StoreProfile = {
  name: string;
  description: string;
  imageUrl: string;
  iconUrl: string;
  phone: string;
  address: string;
  city: string;
  openTime: string;
  closeTime: string;
  holiday: string;
  pickupHours: string;
  category: string;
};

export default function StoreProfileEdit() {
  const [, navigate] = useLocation();
  const { store, loading } = useMyStore();
  const { signOut } = useAuth();
  const { toast } = useToast();

  const [form, setForm] = useState<StoreProfile>({
    name: '',
    description: '',
    imageUrl: '',
    iconUrl: '',
    phone: '',
    address: '',
    city: '',
    openTime: '',
    closeTime: '',
    holiday: '',
    pickupHours: '',
    category: 'other',
  });
  const [saving, setSaving]         = useState(false);
  const [uploading, setUploading]   = useState(false);
  const [iconUploading, setIconUploading] = useState(false);
  const [previewUrl, setPreviewUrl]       = useState('');
  const [iconPreviewUrl, setIconPreviewUrl] = useState('');
  const fileRef     = useRef<HTMLInputElement>(null);
  const iconFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!store) return;
    authedFetch(`${BASE}/api/stores/${store.id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        setForm({
          name:         data.name         ?? '',
          description:  data.description  ?? '',
          imageUrl:     data.imageUrl     ?? '',
          iconUrl:      data.iconUrl      ?? '',
          phone:        data.phone        ?? '',
          address:      data.address      ?? '',
          city:         data.city         ?? '',
          openTime:     data.openTime     ?? '',
          closeTime:    data.closeTime    ?? '',
          holiday:      data.holiday      ?? '',
          pickupHours:  data.pickupHours  ?? '',
          category:     data.category     ?? 'meals',
        });
        setPreviewUrl(data.imageUrl ?? '');
        setIconPreviewUrl(data.iconUrl ?? '');
      });
  }, [store]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // ★ 同じファイルを再選択できるよう即リセット
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await authedFetch(`${BASE}/api/upload/bag-image`, { method: 'POST', body: fd });
      if (!res.ok) {
        const data = await res.json().catch(() => ({} as { message?: string }));
        throw new Error(data.message || `送信失敗 (HTTP ${res.status})`);
      }
      const { url } = await res.json();
      setPreviewUrl(url);
      setForm(f => ({ ...f, imageUrl: url }));
    } catch (err) {
      toast({
        title: 'アップロードエラー',
        description: err instanceof Error ? err.message : '画像の送信に失敗しました',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  // ★ 地図ピン用アイコンの選択 (正方形推奨・自動で角丸表示)
  const handleIconChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      toast({ title: 'ファイルが大きすぎます', description: '3MB 以下の画像を選択してください', variant: 'destructive' });
      return;
    }
    setIconUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await authedFetch(`${BASE}/api/upload/bag-image`, { method: 'POST', body: fd });
      if (!res.ok) {
        const data = await res.json().catch(() => ({} as { message?: string }));
        throw new Error(data.message || `送信失敗 (HTTP ${res.status})`);
      }
      const { url } = await res.json();
      setIconPreviewUrl(url);
      setForm(f => ({ ...f, iconUrl: url }));
    } catch (err) {
      toast({
        title: 'アップロードエラー',
        description: err instanceof Error ? err.message : 'アイコンの送信に失敗しました',
        variant: 'destructive',
      });
    } finally {
      setIconUploading(false);
    }
  };

  const handleIconRemove = () => {
    setIconPreviewUrl('');
    setForm(f => ({ ...f, iconUrl: '' }));
  };

  const handleSave = async () => {
    // ★ store がまだロードされていない時にサイレント無反応にしない（旧版ではユーザーが
    //    「ボタンを押しても何も起こらない」と感じる致命的 UX バグの原因だった）
    if (!store) {
      toast({
        title: '店舗情報の読み込み中です',
        description: '少し待ってから再度お試しください。改善しない場合は再ログインしてください。',
        variant: 'destructive',
      });
      return;
    }
    setSaving(true);
    const url = `${BASE}/api/stores/${store.id}/profile`;
    try {
      // ── 1st attempt ──
      let res = await authedFetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      // ── 401 fallback: Supabase access_token が期限切れ等の場合、refreshSession して 1 回だけ retry ──
      // (iOS Capacitor で稀に auto-refresh が間に合わずに 401 が返るケースの救済)
      if (res.status === 401) {
        try {
          const { data: { session } } = await supabase.auth.refreshSession();
          if (session?.access_token) {
            res = await authedFetch(url, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(form),
            });
          }
        } catch (refreshErr) {
          console.warn('[StoreProfileEdit] refreshSession failed:', refreshErr);
        }
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({} as any));
        if (res.status === 401) {
          // ★ retry 後も 401 ならセッション完全失効。AuthContext 上で user が残ったまま
          //    /login に navigate しても GuestRoute 側が user 有り判定で即 redirect 先 (/store/profile-edit)
          //    に戻されて無限ループになる。signOut で AuthContext を完全クリアしてから navigate する。
          toast({
            title: 'ログインの有効期限が切れました',
            description: '再ログインしてからもう一度お試しください。',
            variant: 'destructive',
          });
          try {
            await signOut();
          } catch (signOutErr) {
            console.warn('[StoreProfileEdit] signOut after 401 failed:', signOutErr);
          }
          navigate('/login?tab=store&redirect=' + encodeURIComponent('/store/profile-edit'));
          return;
        }
        const msg = body?.message || body?.error || `HTTP ${res.status}`;
        throw new Error(String(msg));
      }
      toast({ title: '保存しました', description: '店舗プロフィールを更新しました' });
      navigate('/mypage');
    } catch (err: any) {
      console.error('[StoreProfileEdit] save error:', err);
      toast({ title: '保存に失敗しました', description: String(err?.message ?? err), variant: 'destructive' });
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

        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageChange} />

        {/* ── 地図ピン用アイコン (任意) ───────────────────────────────────── */}
        <div className="px-4 pt-5">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm"
          >
            <div className="px-5 pt-5 pb-3 border-b border-border/50">
              <h2 className="font-black text-sm flex items-center gap-2">
                <MapPinned className="w-4 h-4 text-primary" />
                地図のピンに使うアイコン
                <span className="ml-auto text-[10px] font-bold text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">任意</span>
              </h2>
              <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
                マップ画面で表示されるオリジナルピンに使います。未設定なら、カテゴリ絵文字のピンが自動で表示されます。<br />
                <span className="text-[10px] text-muted-foreground/80">推奨: 正方形・PNG/JPG・512×512px 程度</span>
              </p>
            </div>
            <div className="p-5 flex items-center gap-4">
              {/* アイコンプレビュー (正方形・角丸 → 円形) */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => iconFileRef.current?.click()}
                  disabled={iconUploading}
                  className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-primary/30 shadow-sm flex items-center justify-center hover:scale-105 active:scale-95 transition-transform disabled:opacity-60"
                  aria-label="アイコンを変更"
                >
                  {iconPreviewUrl ? (
                    <img src={iconPreviewUrl} alt="店舗アイコン" className="w-full h-full object-cover" />
                  ) : iconUploading ? (
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  ) : (
                    <Camera className="w-6 h-6 text-primary" />
                  )}
                </button>
                {/* 削除ボタン */}
                {iconPreviewUrl && !iconUploading && (
                  <button
                    type="button"
                    onClick={handleIconRemove}
                    className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-white border border-border shadow-md flex items-center justify-center hover:bg-red-50 active:scale-90 transition-all"
                    aria-label="アイコンを削除"
                  >
                    <XIcon className="w-3.5 h-3.5 text-red-500" />
                  </button>
                )}
              </div>

              {/* 説明と切替ボタン */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-foreground">
                  {iconPreviewUrl ? 'カスタムアイコン設定済み' : 'まだ設定されていません'}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
                  {iconPreviewUrl
                    ? 'お客様のマップ上にこのアイコンが表示されます'
                    : 'カテゴリ絵文字のピンで表示されます'}
                </p>
                <button
                  type="button"
                  onClick={() => iconFileRef.current?.click()}
                  disabled={iconUploading}
                  className="mt-2 text-xs font-bold text-primary hover:underline disabled:opacity-60"
                >
                  {iconUploading ? 'アップロード中…' : iconPreviewUrl ? 'アイコンを変更' : 'アイコンを選ぶ'}
                </button>
              </div>
            </div>
          </motion.div>
          <input ref={iconFileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleIconChange} />
        </div>

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
                  placeholder="例：おすそわけ食堂 渋谷店"
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
                  placeholder="例：090-0000-0000"
                  className="w-full px-4 py-3 bg-secondary/50 rounded-xl text-sm font-medium border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />住所
                </label>
                <input
                  type="text"
                  value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  placeholder="例：東京都渋谷区神南1-2-3"
                  className="w-full px-4 py-3 bg-secondary/50 rounded-xl text-sm font-medium border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-2">カテゴリ</label>
                <div className="flex gap-2">
                  {CATEGORY_OPTIONS.map(opt => (
                    <button
                      key={opt.value} type="button"
                      onClick={() => setForm(f => ({ ...f, category: opt.value }))}
                      className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border-2 font-bold text-xs transition-all active:scale-95 ${
                        form.category === opt.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-secondary/50 text-foreground hover:border-primary/40'
                      }`}
                    >
                      <span className="text-xl">{opt.emoji}</span>
                      <span className="leading-tight text-center">{opt.label}</span>
                    </button>
                  ))}
                </div>
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
                placeholder="お店の魅力、こだわり、おすそわけバッグの特徴などをPRしましょう！"
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
                  <TimePicker
                    value={form.openTime}
                    onChange={v => setForm(f => ({ ...f, openTime: v }))}
                    label="営業開始時間"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1.5">営業終了</label>
                  <TimePicker
                    value={form.closeTime}
                    onChange={v => setForm(f => ({ ...f, closeTime: v }))}
                    label="営業終了時間"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5">受取可能な時間帯（説明文）</label>
                <input
                  type="text"
                  value={form.pickupHours}
                  onChange={e => setForm(f => ({ ...f, pickupHours: e.target.value }))}
                  placeholder="例：18:00〜21:00（平日）、17:00〜20:00（土日）"
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
                  placeholder="例：毎週水曜日・年末年始"
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
