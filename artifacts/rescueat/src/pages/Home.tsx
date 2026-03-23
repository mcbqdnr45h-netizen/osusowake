import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Layout } from '@/components/Layout';
import { BagCard, BagCardSkeleton } from '@/components/BagCard';
import { useListAllBags, SurpriseBagWithStore } from '@workspace/api-client-react';
import {
  Search, Store, MapPin, Zap,
  SlidersHorizontal, ChevronDown, X, PackageOpen, Loader2, Map,
  Globe, Clock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { getCategoryIcon, getCategoryImage } from '@/lib/category-utils';
import { useFavorites } from '@/contexts/FavoritesContext';
import { Heart } from 'lucide-react';
import { useMyStore } from '@/hooks/use-my-store';

// ─── カテゴリー（横スクロール丸ボタン用・全ジャンル）────────────────────────
const SCROLL_CATS = [
  { label: 'すべて',   value: 'all',          emoji: '✨', bg: 'bg-amber-50',    ring: 'ring-amber-300',   active: 'bg-primary'   },
  { label: 'パン',     value: 'bakery',        emoji: '🍞', bg: 'bg-amber-50',    ring: 'ring-amber-300',   active: 'bg-amber-500' },
  { label: 'お弁当',   value: 'restaurant',    emoji: '🍱', bg: 'bg-green-50',    ring: 'ring-green-300',   active: 'bg-green-500' },
  { label: 'スイーツ', value: 'sweets',        emoji: '🍰', bg: 'bg-pink-50',     ring: 'ring-pink-300',    active: 'bg-pink-500'  },
  { label: '惣菜',     value: 'other',         emoji: '🥗', bg: 'bg-orange-50',   ring: 'ring-orange-300',  active: 'bg-orange-500'},
  { label: 'カフェ',   value: 'cafe',          emoji: '☕', bg: 'bg-stone-50',    ring: 'ring-stone-300',   active: 'bg-stone-500' },
  { label: 'コンビニ', value: 'convenience',   emoji: '🏪', bg: 'bg-blue-50',     ring: 'ring-blue-300',    active: 'bg-blue-500'  },
  { label: 'スーパー', value: 'supermarket',   emoji: '🛒', bg: 'bg-indigo-50',   ring: 'ring-indigo-300',  active: 'bg-indigo-500'},
];

type SortKey = 'default' | 'time_asc' | 'price_asc' | 'price_desc';
const SORT_OPTIONS: { label: string; value: SortKey }[] = [
  { label: 'おすすめ順',   value: 'default'    },
  { label: '時間が早い順', value: 'time_asc'   },
  { label: '価格が安い順', value: 'price_asc'  },
  { label: '価格が高い順', value: 'price_desc' },
];

// ─── キャンペーンバナー ─────────────────────────────────────────────────────
const BANNERS = [
  { id: 1, emoji: '🎁', title: '初回限定おすそ分けキャンペーン', highlight: '500円OFF',       sub: 'はじめてのおすそ分け限定クーポン配布中', from: 'from-orange-500', to: 'to-amber-400', accent: 'bg-white/20', badge: 'bg-white text-orange-600' },
  { id: 2, emoji: '🥐', title: '春のパン祭り！対象のパン屋さんが',  highlight: 'ポイント2倍', sub: '3/20（木）〜3/31（日）の期間限定',     from: 'from-amber-500',  to: 'to-orange-400', accent: 'bg-white/20', badge: 'bg-white text-amber-600' },
  { id: 3, emoji: '🍱', title: 'お弁当おすそ分け特集！', highlight: '今日のランチをお得に',    sub: '在庫わずか・売切れ次第終了',             from: 'from-rose-500',   to: 'to-pink-400',   accent: 'bg-white/20', badge: 'bg-white text-rose-600'  },
];

function CampaignBanners() {
  const [active, setActive] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function resetTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setActive(prev => (prev + 1) % BANNERS.length), 4000);
  }
  useEffect(() => { resetTimer(); return () => { if (timerRef.current) clearInterval(timerRef.current); }; }, []);

  return (
    <div className="px-4 pt-3 pb-0">
      <div className="relative overflow-hidden rounded-2xl shadow-md">
        <AnimatePresence mode="wait">
          {BANNERS.map((b, i) => i === active ? (
            <motion.div key={b.id}
              initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.32, ease: 'easeInOut' }}
              className={`bg-gradient-to-br ${b.from} ${b.to} px-4 py-4 flex items-center gap-3`}>
              <div className={`w-12 h-12 ${b.accent} rounded-xl flex items-center justify-center shrink-0 text-2xl select-none`}>{b.emoji}</div>
              <div className="flex-1 min-w-0">
                <p className="text-white/80 text-[11px] font-medium leading-none mb-0.5">{b.title}</p>
                <p className="text-white text-lg font-black leading-tight">{b.highlight}</p>
                <p className="text-white/70 text-[11px] mt-0.5">{b.sub}</p>
              </div>
              <button
                onClick={() => { setActive((i + 1) % BANNERS.length); resetTimer(); }}
                className={`${b.badge} text-xs font-black px-2.5 py-1.5 rounded-lg shrink-0 shadow-sm tap-scale`}
              >
                詳しく
              </button>
            </motion.div>
          ) : null)}
        </AnimatePresence>
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
          {BANNERS.map((_, i) => (
            <button key={i} onClick={() => { setActive(i); resetTimer(); }}
              className={`rounded-full transition-all duration-300 ${i === active ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/40'}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── 横スクロール丸アイコンカテゴリー ────────────────────────────────────────
function CategoryScrollRow({
  activeCategory,
  onSelect,
}: {
  activeCategory: string;
  onSelect: (val: string) => void;
}) {
  return (
    <div className="flex gap-3 overflow-x-auto hide-scrollbar px-4 py-3" style={{ paddingRight: '1.5rem' }}>
      {SCROLL_CATS.map((cat) => {
        const isActive = activeCategory === cat.value;
        const isAll    = cat.value === 'all';

        return (
          <motion.button
            key={cat.value}
            onClick={() => onSelect(isActive && !isAll ? 'all' : cat.value)}
            whileTap={{ scale: 0.82 }}
            transition={{ type: 'spring', stiffness: 500, damping: 22 }}
            className="flex flex-col items-center gap-1.5 shrink-0"
          >
            {/*
              ── 「すべて」ボタン ──
              常時オレンジ背景で唯一無二の存在感。
              選択中: ring + 拡大 + 濃い影で「今ここ」を明示。
              非選択: やや透過 + 小さい影で「ホーム」感を保つ。

              ── 通常カテゴリー ──
              非選択: 白背景 + 薄いグレーリング（ニュートラル）
              選択中: オレンジ背景 + ring で「絞り込み中」を明示。
            */}
            <div
              className={[
                'w-14 h-14 rounded-full flex items-center justify-center text-[1.6rem] select-none transition-all duration-200',
                isAll
                  ? isActive
                    ? 'bg-primary shadow-[0_4px_16px_rgba(255,140,0,0.45)] ring-[3px] ring-primary ring-offset-2 scale-110'
                    : 'bg-primary/80 shadow-[0_2px_8px_rgba(255,140,0,0.28)]'
                  : isActive
                    ? 'bg-primary shadow-md shadow-primary/30 ring-2 ring-primary ring-offset-2 scale-108'
                    : 'bg-white border border-gray-200 shadow-sm',
              ].join(' ')}
            >
              <span className={isAll ? 'drop-shadow' : ''}>{cat.emoji}</span>
            </div>

            {/* ラベル */}
            <span
              className={[
                'text-[11px] leading-none whitespace-nowrap transition-all duration-150',
                isActive ? 'font-black text-primary' : 'font-medium text-muted-foreground',
              ].join(' ')}
            >
              {cat.label}
            </span>
          </motion.button>
        );
      })}
      {/* チラ見せスペーサー */}
      <div className="w-3 shrink-0" />
    </div>
  );
}

// ─── 全国モードバナー（位置情報OFF時）─────────────────────────────────────
function NationwideBanner({ onAllow }: { onAllow: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="mx-4 mt-3 mb-0 rounded-xl overflow-hidden"
    >
      <div className="bg-gradient-to-r from-sky-500 to-indigo-500 px-3.5 py-3 flex items-center gap-3">
        <span className="text-xl select-none">🗾</span>
        <div className="flex-1 min-w-0">
          <p className="text-white font-black text-xs leading-tight">全国のおすそ分けを表示中</p>
          <p className="text-white/75 text-[10px] mt-0.5 leading-tight">現在地をONにすると近くを優先表示</p>
        </div>
        <button
          onClick={onAllow}
          className="bg-white text-sky-600 font-black text-[10px] px-2.5 py-1.5 rounded-lg shrink-0 shadow-sm tap-scale whitespace-nowrap"
        >
          現在地ON
        </button>
      </div>
    </motion.div>
  );
}

// ─── コンパクトカード ─────────────────────────────────────────────────────
function CompactBagCard({ bag }: { bag: SurpriseBagWithStore }) {
  const { isFavorite, toggle } = useFavorites();
  const isSoldOut   = bag.stockCount <= 0;
  const discountPct = Math.round((1 - bag.discountedPrice / bag.originalPrice) * 100);
  const isLowStock  = bag.stockCount > 0 && bag.stockCount < 3;
  const favorited   = isFavorite(bag.store.id);
  const [loaded, setLoaded] = useState(false);
  const imgSrc = bag.imageUrl || bag.store.imageUrl || getCategoryImage(bag.store.category);

  return (
    <Link
      href={isSoldOut ? '#' : `/bags/${bag.id}`}
      onClick={e => isSoldOut && e.preventDefault()}
      className={`group block relative w-40 shrink-0 rounded-2xl overflow-hidden shadow-md border border-border/50 bg-card
        tap-scale transition-all duration-200
        ${isSoldOut ? 'opacity-60 grayscale cursor-not-allowed' : 'hover:-translate-y-0.5 hover:shadow-lg'}`}
    >
      <div className="relative w-full h-24 overflow-hidden bg-muted">
        {!loaded && <div className="absolute inset-0 skeleton-shimmer" />}
        <img
          src={imgSrc} alt={bag.store.name} loading="lazy" decoding="async"
          onLoad={() => setLoaded(true)}
          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105
            ${loaded ? 'img-fade-in' : 'opacity-0'}`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
        <div className="absolute top-1.5 left-1.5">
          <span className="bg-white/90 backdrop-blur-sm text-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
            {getCategoryIcon(bag.store.category)}
            <span className="truncate max-w-[40px]">{bag.store.name.slice(0, 5)}{bag.store.name.length > 5 ? '…' : ''}</span>
          </span>
        </div>
        <div className="absolute top-1.5 right-1.5 flex flex-col gap-1 items-end">
          {!isSoldOut && (
            <span className="bg-accent text-accent-foreground text-[9px] font-black px-1.5 py-0.5 rounded-md">
              {discountPct}% OFF
            </span>
          )}
          {isLowStock && (
            <span className="bg-destructive text-destructive-foreground text-[8px] font-black px-1 py-0.5 rounded-md animate-pulse">
              残りわずか
            </span>
          )}
        </div>
        <button
          onClick={e => { e.preventDefault(); e.stopPropagation(); toggle(bag.store.id); }}
          className={`absolute bottom-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center tap-scale-sm
            ${favorited ? 'bg-rose-500' : 'bg-white/80 backdrop-blur-sm'}`}
          aria-label="お気に入り"
        >
          <Heart className={`w-2.5 h-2.5 ${favorited ? 'fill-white stroke-white' : 'fill-none stroke-rose-400'}`} />
        </button>
      </div>
      <div className="p-2">
        <p className="font-black text-[11px] leading-tight line-clamp-1 mb-1 text-foreground">{bag.title}</p>
        {isSoldOut ? (
          <p className="text-[9px] text-muted-foreground font-bold text-center py-0.5">完売御礼 🌸</p>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-0.5 text-[9px] text-muted-foreground">
              <Clock className="w-2 h-2 text-primary" />
              <span>{bag.pickupStart}</span>
            </div>
            <span className="text-sm font-black text-primary">¥{bag.discountedPrice.toLocaleString()}</span>
          </div>
        )}
      </div>
    </Link>
  );
}

function CompactBagCardSkeleton() {
  return (
    <div className="w-40 shrink-0 rounded-2xl overflow-hidden border border-border/30 bg-card">
      <div className="w-full h-24 skeleton-shimmer" />
      <div className="p-2 space-y-1.5">
        <div className="h-3 skeleton-shimmer rounded-full w-4/5" />
        <div className="flex justify-between">
          <div className="h-2.5 skeleton-shimmer rounded-full w-10" />
          <div className="h-3.5 skeleton-shimmer rounded-full w-12" />
        </div>
      </div>
    </div>
  );
}

function UrgentSection({ bags, loading }: { bags: SurpriseBagWithStore[]; loading: boolean }) {
  const urgentBags = bags.filter(b => b.stockCount > 0 && b.stockCount < 5).slice(0, 8);
  if (!loading && urgentBags.length === 0) return null;
  return (
    <div className="pt-3 pb-1">
      <div className="flex items-center gap-2 px-4 mb-2">
        <div className="flex items-center gap-1.5 bg-orange-100 text-orange-600 px-2.5 py-1 rounded-full border border-orange-200">
          <span className="text-xs select-none">🔥</span>
          <span className="text-xs font-black">もうすぐ終わるおすそ分け</span>
        </div>
      </div>
      <div className="flex gap-2.5 overflow-x-auto hide-scrollbar px-4 pr-6 pb-1">
        {loading
          ? [1, 2, 3].map(i => <CompactBagCardSkeleton key={i} />)
          : urgentBags.map(bag => <CompactBagCard key={bag.id} bag={bag} />)
        }
        <div className="w-1 shrink-0" />
      </div>
    </div>
  );
}

function RecommendedSection({ bags, loading }: { bags: SurpriseBagWithStore[]; loading: boolean }) {
  const recommendedBags = bags.filter(b => b.stockCount > 0).slice(0, 8);
  if (!loading && recommendedBags.length === 0) return null;
  return (
    <div className="pt-2 pb-1">
      <div className="flex items-center justify-between px-4 mb-2">
        <div className="flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-primary" />
          <span className="text-sm font-black text-foreground">今日のおすすめ</span>
        </div>
        {!loading && <span className="text-xs text-muted-foreground">{recommendedBags.length}件</span>}
      </div>
      <div className="flex gap-2.5 overflow-x-auto hide-scrollbar px-4 pr-6 pb-1">
        {loading
          ? [1, 2, 3].map(i => <CompactBagCardSkeleton key={i} />)
          : recommendedBags.map(bag => <CompactBagCard key={bag.id} bag={bag} />)
        }
        <div className="w-1 shrink-0" />
      </div>
    </div>
  );
}

// ─── 位置情報フック ────────────────────────────────────────────────────────
const GEO_TIMEOUT_MS = 5000;

function useUserCity() {
  const [city, setCity]       = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied]   = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!navigator.geolocation) { setLoading(false); setDenied(true); return; }
    const fallbackTimer = setTimeout(() => { setLoading(false); setDenied(true); }, GEO_TIMEOUT_MS + 500);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        clearTimeout(fallbackTimer);
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=ja`,
            { headers: { 'User-Agent': 'TabeRosu/1.0' }, signal: AbortSignal.timeout(4000) }
          );
          const data = await res.json();
          const addr = data.address || {};
          setCity(addr.city || addr.town || addr.village || addr.county || addr.state || null);
          setDenied(false);
        } catch { setCity(null); }
        finally { setLoading(false); }
      },
      () => { clearTimeout(fallbackTimer); setLoading(false); setDenied(true); },
      { timeout: GEO_TIMEOUT_MS, maximumAge: 600_000, enableHighAccuracy: false }
    );
    return () => clearTimeout(fallbackTimer);
  }, [retryCount]);

  const retry = useCallback(() => {
    setLoading(true); setDenied(false); setCity(null);
    setRetryCount(c => c + 1);
  }, []);

  return { city, loading, denied, retry };
}

// ─── フローティング地図ボタン ─────────────────────────────────────────────
function FloatingMapButton() {
  return (
    <Link href="/search?view=map">
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.4 }}
        whileTap={{ scale: 0.88 }}
        className="fixed bottom-[88px] right-4 z-40 w-14 h-14 bg-primary rounded-2xl shadow-xl shadow-primary/30
          flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-colors"
        aria-label="地図で探す"
      >
        <Map className="w-6 h-6" />
      </motion.button>
    </Link>
  );
}

// ─── メインコンポーネント ─────────────────────────────────────────────────────
export default function Home() {
  const [searchQuery,    setSearchQuery]    = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [inStockOnly,    setInStockOnly]    = useState(false);
  const [sortKey,        setSortKey]        = useState<SortKey>('default');
  const [showSort,       setShowSort]       = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { profile, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const { isApprovedOwner } = useMyStore();
  const { data: bags, isLoading: isLoadingBags } = useListAllBags();
  const { city: userCity, loading: geoLoading, denied: geoDenied, retry: retryGeo } = useUserCity();

  useEffect(() => {
    if (authLoading) return;
    // 未ログイン → ウェルカム画面へ
    if (!profile) {
      navigate('/welcome', { replace: true });
      return;
    }
    // 店舗オーナー → ダッシュボードへ
    if (profile.role === 'store_owner') {
      navigate('/store/dashboard', { replace: true });
    }
  }, [authLoading, profile, navigate]);

  const isFiltering = searchQuery.trim() !== '' || activeCategory !== 'all' || inStockOnly || sortKey !== 'default';

  const filteredBags = useMemo(() => {
    let result = bags || [];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(b =>
        b.title.toLowerCase().includes(q) ||
        b.store.name.toLowerCase().includes(q) ||
        b.store.city?.toLowerCase().includes(q) ||
        b.store.category?.toLowerCase().includes(q)
      );
    }
    if (activeCategory !== 'all') result = result.filter(b => b.store.category === activeCategory);
    if (inStockOnly)               result = result.filter(b => b.stockCount > 0);
    if (sortKey === 'time_asc')   result = [...result].sort((a, b) => (a.pickupStart || '').localeCompare(b.pickupStart || ''));
    if (sortKey === 'price_asc')  result = [...result].sort((a, b) => a.discountedPrice - b.discountedPrice);
    if (sortKey === 'price_desc') result = [...result].sort((a, b) => b.discountedPrice - a.discountedPrice);
    return result;
  }, [bags, searchQuery, activeCategory, inStockOnly, sortKey]);

  const allBags         = bags || [];
  const activeFilterCnt = [activeCategory !== 'all', inStockOnly, sortKey !== 'default'].filter(Boolean).length;

  function clearAll() {
    setSearchQuery(''); setActiveCategory('all'); setInStockOnly(false); setSortKey('default');
  }

  const dismissKeyboard = useCallback(() => {
    searchRef.current?.blur();
    setShowSort(false);
  }, []);

  const currentSortLabel = SORT_OPTIONS.find(o => o.value === sortKey)?.label || 'おすすめ順';

  // auth確認中・未ログイン・店舗オーナーはリダイレクト中なので何も表示しない
  if (authLoading || !profile || profile.role === 'store_owner') return null;

  const areaTitle = geoLoading
    ? null
    : userCity
      ? `${userCity}のおすそ分け`
      : geoDenied ? '全国の注目おすそ分け' : 'あなたの街のおすそ分け';

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100dvh-64px)] overflow-hidden">

        {/* ── Sticky ヘッダー（コンパクト化）── */}
        <div className="shrink-0 bg-background border-b border-border/50 z-20 shadow-sm">

          {/* エリア名 + 件数（1行） */}
          <div className="flex items-center gap-2 px-4 pt-2.5 pb-0">
            {geoLoading ? (
              <div className="flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                <span className="text-sm font-bold text-muted-foreground">現在地を確認中...</span>
              </div>
            ) : (
              <>
                {geoDenied
                  ? <Globe className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                  : <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                }
                <span className="text-sm font-black text-foreground">{areaTitle}</span>
              </>
            )}
            {/* Desktop: ダッシュボードボタン */}
            {isApprovedOwner && (
              <Link href="/store-dashboard" className="hidden md:block ml-auto">
                <button className="flex items-center gap-1.5 bg-primary text-primary-foreground font-bold px-3 py-1.5 rounded-xl text-xs hover:bg-primary/90 tap-scale shadow-sm">
                  <Store className="w-3.5 h-3.5" />ダッシュボード
                </button>
              </Link>
            )}
          </div>

          {/* 検索バー */}
          <div className="px-4 pt-2 pb-2">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                ref={searchRef}
                type="search"
                inputMode="search"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => setShowSort(false)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.currentTarget.blur();
                  }
                }}
                placeholder="エリア・ジャンル・お店名で検索..."
                className="w-full bg-secondary/60 border border-border text-foreground rounded-2xl pl-10 pr-10 py-2.5 outline-none transition-all placeholder:text-muted-foreground
                  focus:bg-card focus:border-primary focus:ring-2 focus:ring-primary/20"
                style={{ fontSize: '16px' }}
                onFocusCapture={e => { e.currentTarget.style.boxShadow = '0 0 0 4px rgba(255,140,0,0.13)'; }}
                onBlurCapture={e => { e.currentTarget.style.boxShadow = ''; }}
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(''); searchRef.current?.focus(); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-muted-foreground/25 flex items-center justify-center tap-scale-sm"
                  aria-label="検索をクリア"
                >
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>

          {/* フィルターバー（ソート + 在庫のみ）*/}
          <div className="flex items-center gap-2 px-4 pb-2 pt-0">
            <button
              onClick={() => setInStockOnly(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border tap-scale transition-colors
                ${inStockOnly
                  ? 'bg-orange-100 text-orange-700 border-orange-300'
                  : 'bg-card text-muted-foreground border-border'
                }`}
            >
              <span className={`w-6 h-3.5 rounded-full flex items-center transition-colors ${inStockOnly ? 'bg-primary' : 'bg-muted'}`}>
                <span className={`w-2.5 h-2.5 bg-white rounded-full shadow transition-transform mx-0.5 ${inStockOnly ? 'translate-x-3' : 'translate-x-0'}`} />
              </span>
              受付中のみ
            </button>

            {/* 並び替え */}
            <div className="relative">
              <button
                onClick={() => setShowSort(v => !v)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border tap-scale transition-colors
                  ${sortKey !== 'default'
                    ? 'bg-primary/10 text-primary border-primary/30'
                    : 'bg-card text-muted-foreground border-border'
                  }`}
              >
                <SlidersHorizontal className="w-3 h-3" />
                {currentSortLabel}
                <ChevronDown className={`w-3 h-3 transition-transform duration-150 ${showSort ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {showSort && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.95 }}
                    transition={{ duration: 0.13 }}
                    className="absolute top-full mt-1.5 left-0 z-50 bg-card border border-border rounded-2xl shadow-xl overflow-hidden min-w-[148px]"
                  >
                    {SORT_OPTIONS.map(opt => (
                      <button key={opt.value}
                        onClick={() => { setSortKey(opt.value); setShowSort(false); }}
                        className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors hover:bg-secondary tap-opacity
                          ${sortKey === opt.value ? 'text-primary bg-primary/5' : 'text-foreground'}`}>
                        {sortKey === opt.value && <span className="mr-1">✓</span>}
                        {opt.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex-1" />
            {isFiltering && <span className="text-xs text-muted-foreground font-medium">{filteredBags.length}件</span>}
            {activeFilterCnt > 0 && (
              <motion.button onClick={clearAll} whileTap={{ scale: 0.92 }}
                className="flex items-center gap-1 px-2 py-1 rounded-xl text-[11px] font-bold bg-destructive/8 text-destructive border border-destructive/20 transition-colors">
                <X className="w-3 h-3" />リセット
              </motion.button>
            )}
          </div>
        </div>

        {/* ── スクロールエリア ── */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto bg-secondary/10 scroll-smooth-native"
          onTouchStart={dismissKeyboard}
          onClick={() => showSort && setShowSort(false)}
        >
          <AnimatePresence mode="wait">
            {/* 絞り込みモード */}
            {isFiltering ? (
              <motion.div
                key="filtered"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="px-4 pt-3 pb-6"
              >
                {/* フィルタリング中もカテゴリー丸ボタンを表示 */}
                <div className="-mx-4 mb-2">
                  <CategoryScrollRow activeCategory={activeCategory} onSelect={setActiveCategory} />
                </div>

                {isLoadingBags ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map(i => <BagCardSkeleton key={i} />)}
                  </div>
                ) : filteredBags.length > 0 ? (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeCategory}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
                    >
                      {filteredBags.map((bag, i) => (
                        <motion.div
                          key={bag.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: i * 0.04, ease: 'easeOut' }}
                        >
                          <BagCard bag={bag} />
                        </motion.div>
                      ))}
                    </motion.div>
                  </AnimatePresence>
                ) : (
                  /* ── 0件リテンション：レコメンド付き ── */
                  <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
                    {/* メッセージ */}
                    <div className="flex flex-col items-center text-center px-6 py-8">
                      <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-amber-100 rounded-2xl flex items-center justify-center mb-3 border border-orange-200/60">
                        <PackageOpen className="w-8 h-8 text-primary/60" />
                      </div>
                      <h3 className="text-base font-black text-foreground mb-1">
                        {activeCategory !== 'all'
                          ? `「${SCROLL_CATS.find(c => c.value === activeCategory)?.label ?? activeCategory}」のおすそ分けは\nまだありません`
                          : '条件に合うおすそ分けが見つかりませんでした'
                        }
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                        {activeCategory !== 'all'
                          ? 'お店が準備中です。代わりにこちらはいかがですか？'
                          : 'ジャンルや条件を変えて探してみてください'
                        }
                      </p>
                      <motion.button onClick={clearAll} whileTap={{ scale: 0.94 }}
                        className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-2xl text-sm font-bold shadow-md shadow-primary/20">
                        <X className="w-3.5 h-3.5" />条件をリセット
                      </motion.button>
                    </div>

                    {/* 全カテゴリーからのレコメンド */}
                    {allBags.filter(b => b.stockCount > 0).length > 0 && (
                      <div className="mt-1 pb-2">
                        <div className="flex items-center gap-2 mb-3 px-4">
                          <div className="flex-1 h-px bg-border/60" />
                          <span className="text-[11px] font-black text-muted-foreground flex items-center gap-1 px-1">
                            ✨ 代わりにこちらはいかがですか？
                          </span>
                          <div className="flex-1 h-px bg-border/60" />
                        </div>
                        <motion.div
                          className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-4"
                          initial="hidden" animate="show"
                          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
                        >
                          {allBags.filter(b => b.stockCount > 0).slice(0, 3).map(bag => (
                            <motion.div key={bag.id} variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
                              <BagCard bag={bag} />
                            </motion.div>
                          ))}
                        </motion.div>
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>

            ) : (
              /* ─── 通常ホーム ─── */
              <motion.div
                key="home"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {/* 全国モードバナー（位置情報OFF時） */}
                {!geoLoading && geoDenied && <NationwideBanner onAllow={retryGeo} />}

                {/* キャンペーンバナー */}
                {(!isLoadingBags && allBags.length > 0) && <CampaignBanners />}

                {/* ── 横スクロール丸アイコンカテゴリー ── */}
                <CategoryScrollRow activeCategory={activeCategory} onSelect={setActiveCategory} />

                {/* 区切り */}
                <div className="mx-4 border-t border-border/30" />

                {/* 急募セクション */}
                <UrgentSection bags={allBags} loading={isLoadingBags} />

                {/* おすすめセクション */}
                <RecommendedSection bags={allBags} loading={isLoadingBags} />

                {/* ─ すべてのおすそ分け ─ */}
                {(!isLoadingBags && allBags.length > 0) && (
                  <div className="flex items-center justify-between px-4 pt-2 pb-1.5">
                    <span className="text-sm font-black text-foreground">すべてのおすそ分け</span>
                    <span className="text-xs text-muted-foreground">{allBags.length}件</span>
                  </div>
                )}

                {/* バッグリスト（グリッド）*/}
                <div className="px-4 pb-6">
                  {isLoadingBags ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[1, 2, 3, 4].map(i => <BagCardSkeleton key={i} />)}
                    </div>
                  ) : allBags.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
                      <motion.div
                        initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 200 }}
                        className="w-20 h-20 bg-gradient-to-br from-primary/15 to-amber-200/40 rounded-3xl flex items-center justify-center mb-4"
                      >
                        <span className="text-4xl select-none">{geoDenied ? '🗾' : '🎁'}</span>
                      </motion.div>
                      <h3 className="text-base font-black text-foreground mb-1.5">
                        {geoDenied ? '全国のおすそ分けを準備中' : '今日のおすそ分けを準備中'}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {geoDenied
                          ? '全国のお店がおすそ分けを準備中です！'
                          : 'まだ出品がありません。お近くのお店がおすそ分けを準備中です！'
                        }
                      </p>
                    </div>
                  ) : (
                    <motion.div
                      className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                      initial="hidden" animate="show"
                      variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } }}
                    >
                      {allBags.map(bag => (
                        <motion.div key={bag.id} variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
                          <BagCard bag={bag} />
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* フローティング地図ボタン */}
      <FloatingMapButton />
    </Layout>
  );
}
