import React, { useState, useEffect, useRef } from 'react';
import { Layout } from '@/components/Layout';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useMyStores } from '@/hooks/use-my-stores';
import { authedFetch } from '@/lib/authed-fetch';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, CheckCircle2, Leaf, Loader2, AlertTriangle,
  ShieldCheck,
} from 'lucide-react';
import { PlaceSearchMap, PlaceResult } from '@/components/PlaceSearchMap';

// ★ iOS Capacitor では VITE_API_BASE (https://osusowakejapan.org) が必須。Web では BASE_URL を使う
const BASE = (((import.meta as any).env?.VITE_API_BASE as string) || '') ||
             (import.meta.env.BASE_URL?.replace(/\/$/, '') || '');

const CATEGORY_OPTIONS = [
  { value: 'meals',         label: '料理・お惣菜',  emoji: '🍱' },
  { value: 'bakery_sweets', label: 'パン・スイーツ', emoji: '🥐' },
  { value: 'ingredients',   label: '食材・その他',  emoji: '🍎' },
];

async function compressImage(file: File, maxPx = 1200, quality = 0.80): Promise<string> {
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

const ONBOARDING_DRAFT_KEY = 'store-onboarding-draft-v2';
type OnboardingDraft = {
  name: string; address: string; city: string; category: string;
  phone: string; imageUrl: string;
  pledgeSigned: boolean;
  pinLat: number | null; pinLng: number | null;
};
function saveOnboardingDraft(d: Partial<OnboardingDraft>) {
  try { localStorage.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify(d)); } catch (_) {}
}
function loadOnboardingDraft(): Partial<OnboardingDraft> {
  try { const r = localStorage.getItem(ONBOARDING_DRAFT_KEY); return r ? JSON.parse(r) : {}; } catch (_) { return {}; }
}
function clearOnboardingDraft() {
  try {
    localStorage.removeItem(ONBOARDING_DRAFT_KEY);
    localStorage.removeItem('store-onboarding-draft-v1'); // 旧バージョンも掃除
  } catch (_) {}
}

export default function StoreOnboarding() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, profile, isLoading: authLoading, setOptimisticRole, refreshProfile } = useAuth();
  const { currentStore: existingStore, loading: storeLoading, hasExistingStripeAccount, refetch: refetchStores } = useMyStores();

  // ★ 退会直後・セッション失効時など user が null になった場合は
  //    onboarding 画面に居座らせず Welcome に戻す（「ログインが必要です」エラーで詰まるのを防ぐ）
  useEffect(() => {
    if (!authLoading && !user) {
      try { localStorage.removeItem(ONBOARDING_DRAFT_KEY); } catch (_) {}
      navigate('/welcome');
    }
  }, [authLoading, user, navigate]);

  // ★ StoreOnboarding 開始時に楽観的にロールを store_owner にする
  // → 戻るボタンで MyPage に行っても「お客様」表示にならず、店舗ナビが出る
  // submit 完了で実際のロールが DB 上で更新される (refreshProfile で同期)
  useEffect(() => {
    if (user && profile && profile.role === 'customer') {
      setOptimisticRole('store_owner');
    }
  }, [user, profile, setOptimisticRole]);

  // ?add=1 が付いている場合は「追加登録モード」→ 既存店舗リダイレクトをスキップ
  const isAddMode = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('add') === '1'
    : false;

  // Stripe引き継ぎモード: 追加モード かつ 既存のStripeアカウントあり
  // → 本人確認・銀行口座は自動引き継ぎ。営業許可証のみ提出。
  const isInherited = isAddMode && hasExistingStripeAccount;

  // ★ draft はマウント時に1回だけ読む (再レンダリングで読み直さない)
  const obDraftRef = useRef<Partial<OnboardingDraft> | null>(null);
  if (obDraftRef.current === null) obDraftRef.current = loadOnboardingDraft();
  const obDraft = obDraftRef.current;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pledgeSigned, setPledgeSigned] = useState<boolean>(obDraft.pledgeSigned ?? false);
  const [pinPos, setPinPos] = useState<{ lat: number; lng: number } | null>(
    obDraft.pinLat != null && obDraft.pinLng != null ? { lat: obDraft.pinLat, lng: obDraft.pinLng } : null
  );
  const [imagePreview, setImagePreview] = useState<string>(obDraft.imageUrl ?? '');
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);

  const [form, setForm] = useState({
    name:          obDraft.name     ?? '',
    address:       obDraft.address  ?? '',
    city:          obDraft.city     ?? '',
    category:      obDraft.category ?? '',
    phone:         obDraft.phone    ?? '',
    imageUrl:      obDraft.imageUrl ?? '',
  });

  // ★ ファイル input の ref (同じファイル再選択時に value をリセットするため)
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ★ 初回ロード後は2度とスピナー画面に戻らない (form アンマウント = 入力消失を防ぐ)
  const hasInitializedRef = useRef(false);
  if (!storeLoading) hasInitializedRef.current = true;

  // 追加モードでない場合のみ、既存店舗があればダッシュボードへリダイレクト
  useEffect(() => {
    if (isAddMode) return;
    if (storeLoading) return;
    if (!existingStore) return;
    if (existingStore.stripeAccountId) {
      navigate('/store/dashboard');
    } else {
      navigate('/store/bank-setup');
    }
  }, [existingStore, storeLoading, navigate, isAddMode]);

  // 入力内容を自動保存（フォーム変化から1秒後）— 全フィールドを保存
  useEffect(() => {
    const t = setTimeout(() => {
      saveOnboardingDraft({
        name: form.name,
        address: form.address,
        city: form.city,
        category: form.category,
        phone: form.phone,
        imageUrl: form.imageUrl,
        pledgeSigned,
        pinLat: pinPos?.lat ?? null,
        pinLng: pinPos?.lng ?? null,
      });
    }, 600);
    return () => clearTimeout(t);
  }, [form.name, form.address, form.city, form.category, form.phone, form.imageUrl, pledgeSigned, pinPos]);

  // 警告が表示中のとき、フィールドが埋まったら警告をリアルタイム更新
  useEffect(() => {
    if (validationWarnings.length === 0) return;
    const updated: string[] = [];
    if (!form.imageUrl)                         updated.push('店舗写真が未入力です。');
    if (!form.name.trim())                      updated.push('店名が未入力です。');
    if (!form.address.trim())                   updated.push('住所が未入力です。');
    if (!form.city.trim())                      updated.push('市区町村が未入力です。');
    if (!form.phone.trim())                     updated.push('店舗電話番号が未入力です。');
    if (!form.category)                         updated.push('ジャンルが未選択です。');
    if (!pledgeSigned)                          updated.push('利用規約への同意が未完了です。');
    setValidationWarnings(updated);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.imageUrl, form.name, form.address, form.city, form.phone, form.category, pledgeSigned]);

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
    // ★ 同じファイルを再選択できるよう input 値をリセット
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({ title: 'ログインが必要です', variant: 'destructive' });
      return;
    }

    // 追加モードでない場合のみ、既存店舗があればリダイレクト（再送信ガード）
    if (!isAddMode && existingStore && !storeLoading) {
      if (existingStore.stripeAccountId) {
        navigate('/store/dashboard');
      } else {
        navigate('/store/bank-setup');
      }
      return;
    }

    // 未入力項目を収集 → ひとつでも欠けていたら送信をブロック
    const warnings: string[] = [];
    if (!form.imageUrl)                         warnings.push('店舗写真が未入力です。');
    if (!form.name.trim())                      warnings.push('店名が未入力です。');
    if (!form.address.trim())                   warnings.push('住所が未入力です。');
    if (!form.city.trim())                      warnings.push('市区町村が未入力です。');
    if (!form.phone.trim())                     warnings.push('店舗電話番号が未入力です。');
    if (!form.category)                         warnings.push('ジャンルが未選択です。');
    if (!pledgeSigned)                          warnings.push('利用規約への同意が未完了です。');
    setValidationWarnings(warnings);
    if (warnings.length > 0) return;
    if (!user.id) {
      toast({ title: 'ログイン情報を取得できませんでした', description: 'いったんログアウトして再度ログインしてください。', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    try {
      // ★ authedFetch を使用 — Bearer トークン (Supabase session) を自動付与
      //    素の fetch だと requireAuth が 401「ログインが必要です」 を返してしまう
      const res = await authedFetch(`${BASE}/api/stores/apply`, {
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
        const body = await res.json().catch(() => ({}));
        if (res.status === 404 || res.status === 503 || res.status === 502) {
          throw new Error('サーバーに接続できませんでした。少し時間をおいて再度お試しください。');
        }
        // ★ 409 = 同名・同住所の店舗が他オーナで既に登録済み (偽造防止ガード)
        if (res.status === 409 && body?.error === 'store_duplicate') {
          toast({
            title: 'この店舗は既に登録されています',
            description:
              body?.message ||
              '同じ店舗名・住所のお店が既に登録されています。 ご自身のお店であるにも関わらずこの表示が出る場合は hello@osusowakejapan.org までご連絡ください。',
            variant: 'destructive',
          });
          // toast を出して通常の throw 経路はスキップ（重複表示を避ける）
          return;
        }
        const msg = body?.message || body?.error || `登録に失敗しました（HTTP ${res.status}）`;
        throw new Error(msg);
      }

      // ★ レスポンス本文取得 (JSON 失敗時はテキストでフォールバック → 原因特定ログ)
      const rawText = await res.text().catch(() => '');
      let responseBody: any = null;
      try { responseBody = JSON.parse(rawText); } catch { /* JSON でない */ }

      if (!responseBody?.id) {
        console.error('[StoreOnboarding] ❌ 登録レスポンスに id がない:', { status: res.status, contentType: res.headers.get('content-type'), bodyPreview: rawText.slice(0, 200) });
        // ★ サーバー側では INSERT 成功している可能性が高い (JSON経路の問題のみ) → 即座に確認
        try {
          const check = await authedFetch(`${BASE}/api/stores/by-owner?userId=${encodeURIComponent(user.id)}`, { cache: 'no-store' });
          if (check.ok) {
            const checkStore = await check.json().catch(() => null);
            if (checkStore?.id) {
              console.log('[StoreOnboarding] ✅ 確認: 店舗は実際には作成されている → 続行');
              clearOnboardingDraft();
              refetchStores();
              try { await refreshProfile(); } catch (_) {}
              if (isInherited) {
                toast({ title: '店舗を追加しました！', description: 'すぐに商品を出品できます。' });
                navigate('/mypage');
              } else {
                navigate('/store/bank-setup');
              }
              return;
            }
          }
        } catch (recoverErr) {
          console.warn('[StoreOnboarding] 復旧チェック失敗:', recoverErr);
        }
        toast({
          title: '登録が完了しませんでした',
          description: 'データの保存を確認できませんでした。再度お試しください。',
          variant: 'destructive',
        });
        return;
      }

      clearOnboardingDraft();

      // 店舗リストを即時更新してから遷移する
      refetchStores();
      // ★ DB の users.role が server 側で store_owner に更新されているので profile を再取得
      try { await refreshProfile(); } catch (_) {}

      if (isInherited) {
        // Stripe引き継ぎ → bank-setup スキップ → マイページへ
        toast({
          title: '店舗を追加しました！',
          description: 'すぐに商品を出品できます。',
        });
        navigate('/mypage');
      } else {
        // 初回登録 → bank-setup へ
        navigate('/store/bank-setup');
      }
    } catch (err: unknown) {
      clearTimeout(timeout);

      if (err instanceof Error && err.name === 'AbortError') {
        console.warn('[StoreOnboarding] タイムアウト — 店舗作成を確認中...');
        try {
          const check = await authedFetch(`${BASE}/api/stores/by-owner?userId=${encodeURIComponent(user.id)}`, { cache: 'no-store' });
          if (check.ok) {
            const checkStore = await check.json().catch(() => null);
            clearOnboardingDraft();
            refetchStores();
            if (isInherited) {
              navigate('/mypage');
            } else {
              navigate(checkStore?.stripeAccountId ? '/store/dashboard' : '/store/bank-setup');
            }
            return;
          }
        } catch (_) {}
        toast({ title: 'サーバーへの接続がタイムアウトしました', description: 'ネットワーク状況を確認して、もう一度お試しください。', variant: 'destructive' });
      } else {
        console.warn('[StoreOnboarding] apply error:', err);
        toast({
          title: '登録に失敗しました',
          description: err instanceof Error ? err.message : '時間をおいて再度お試しください。',
          variant: 'destructive',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ★ 初回ロードのみスピナーを表示。以降は refetch 中でも form をアンマウントしない
  //    (storeLoading が true → false → true で form が消える = 入力が消える バグの根本対策)
  if (storeLoading && !hasInitializedRef.current) {
    return (
      <Layout showBottomNav={false} hideHeader={true}>
        <div className="flex-1 flex items-center justify-center min-h-dvh">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout showBottomNav={false} hideHeader={true}>
      <div className="max-w-xl mx-auto px-4 py-6">

        {/* ヘッダー */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => {
              // 1. 追加モード or 既存店舗あり → 店舗ダッシュボード
              if (isAddMode || existingStore) { navigate('/store/dashboard'); return; }
              // 2. それ以外 (新規登録途中) → マイページ (profile 読込待ちでスケルトンが出る)
              navigate('/mypage');
            }}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-black">{isAddMode ? '店舗を追加する' : 'お店を登録する'}</h1>
            <p className="text-xs text-muted-foreground">
              {isInherited ? '営業許可証のみ提出してください' : 'おすそわけに参加して、フードロスを減らしましょう'}
            </p>
          </div>
        </div>

        {/* 引き継ぎバナー（追加モード＋Stripe済みの場合） */}
        {isInherited && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex gap-3"
          >
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-black text-emerald-800">本人確認・口座情報は引き継がれます</p>
              <p className="text-xs text-emerald-700 mt-0.5 leading-relaxed">
                1店舗目で登録済みの免許証・銀行口座は、この店舗にも自動的に紐付けられます。
                <strong>営業許可証だけ</strong>この店舗のものをアップロードしてください。
              </p>
            </div>
          </motion.div>
        )}

        <motion.form
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          noValidate
          className="space-y-5"
        >
          {/* 料金案内（初回のみ） */}
          {!isInherited && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex gap-3 text-sm">
              <Leaf className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-black text-foreground">完全成果報酬型</div>
                <div className="text-muted-foreground">初期費用・月額0円。売れた分だけ手数料25%</div>
              </div>
            </div>
          )}

          {/* 店舗写真 */}
          <div>
            <label className="block text-sm font-bold text-muted-foreground mb-2">
              店舗写真 <span className="text-destructive">*</span>
            </label>
            <label className="block cursor-pointer">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) handleImageFile(file);
                }}
              />
              <div className={`relative w-full aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 overflow-hidden transition-all
                ${imagePreview ? 'border-primary/40' : 'border-red-300 bg-red-50/40 hover:border-primary/40 hover:bg-primary/5'}`}>
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

          {/* 店舗電話番号 */}
          <div>
            <label className="block text-sm font-bold text-muted-foreground mb-1.5">
              店舗電話番号 <span className="text-destructive">*</span>
            </label>
            <input
              required
              type="tel"
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              className="w-full bg-background border border-input rounded-xl px-4 py-3.5 font-medium text-base focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-all"
              placeholder="例: 072-639-9628"
              inputMode="tel"
            />
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              この店舗専用の電話番号です。決済審査・トラブル対応に使用されます。
            </p>
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
                食品衛生法を遵守し、営業許可証に基づいて営業していることを誓約します。また、おすそわけの
                <span className="text-primary font-bold">利用規約</span>に同意の上、申請します。
              </p>
            </div>
          </div>

          {/* 未入力警告パネル */}
          <AnimatePresence>
            {validationWarnings.length > 0 && (
              <motion.div
                key="validation-warnings"
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3.5"
              >
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="text-sm font-black text-amber-700">入力内容をご確認ください</span>
                </div>
                <ul className="space-y-1">
                  {validationWarnings.map((msg, i) => (
                    <li key={i} className="text-sm text-amber-700 flex items-start gap-1.5">
                      <span className="shrink-0 mt-0.5">・</span>
                      <span>{msg}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>

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
            ) : isInherited ? (
              '店舗を登録する →'
            ) : (
              '登録して口座設定へ →'
            )}
          </button>

          <p className="text-center text-xs text-muted-foreground pb-4">
            {isInherited
              ? '口座・本人確認は1店舗目の情報を引き継ぎます'
              : '登録後すぐに口座情報の入力へ進みます'}
          </p>
        </motion.form>
      </div>
    </Layout>
  );
}
