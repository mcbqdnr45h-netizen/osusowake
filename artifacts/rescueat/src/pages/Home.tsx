import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Layout } from '@/components/Layout';
import { BagCard, BagCardSkeleton } from '@/components/BagCard';
import { useListAllBags, SurpriseBagWithStore } from '@workspace/api-client-react';
import {
  Search, Store, MapPin, Zap,
  SlidersHorizontal, ChevronDown, X, PackageOpen, Loader2, Map,
  Globe, Clock, ArrowLeft,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { getCategoryIcon, getCategoryImage } from '@/lib/category-utils';
import { useFavorites } from '@/contexts/FavoritesContext';
import { Heart } from 'lucide-react';
import { useMyStore } from '@/hooks/use-my-store';

// ─── カテゴリーピル ────────────────────────────────────────────────────────
const SCROLL_CATS = [
  { label: 'すべて',        value: 'all',           emoji: '✨' },
  { label: '料理・お惣菜',  value: 'meals',          emoji: '🍱' },
  { label: 'パン・スイーツ', value: 'bakery_sweets', emoji: '🥐' },
  { label: '食材・その他',  value: 'ingredients',    emoji: '🍎' },
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
              className={`bg-gradient-to-br ${b.from} ${b.to} px-4 py-3.5 flex items-center gap-3`}>
              <div className={`w-10 h-10 ${b.accent} rounded-xl flex items-center justify-center shrink-0 text-xl select-none`}>{b.emoji}</div>
              <div className="flex-1 min-w-0">
                <p className="text-white/80 text-[10px] font-medium leading-none mb-0.5">{b.title}</p>
                <p className="text-white text-base font-black leading-tight">{b.highlight}</p>
                <p className="text-white/70 text-[10px] mt-0.5">{b.sub}</p>
              </div>
              <button
                onClick={() => { setActive((i + 1) % BANNERS.length); resetTimer(); }}
                className={`${b.badge} text-[11px] font-black px-2.5 py-1.5 rounded-lg shrink-0 shadow-sm tap-scale`}
              >
                詳しく
              </button>
            </motion.div>
          ) : null)}
        </AnimatePresence>
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1.5">
          {BANNERS.map((_, i) => (
            <button key={i} onClick={() => { setActive(i); resetTimer(); }}
              className={`rounded-full transition-all duration-300 ${i === active ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/40'}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── カテゴリーピル（コンパクト横スクロール）─────────────────────────────
function CategoryPills({
  activeCategory, onSelect,
}: {
  activeCategory: string;
  onSelect: (val: string) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto hide-scrollbar px-4 pb-2 pt-1">
      {SCROLL_CATS.map((cat) => {
        const isActive = activeCategory === cat.value;
        return (
          <motion.button
            key={cat.value}
            onClick={() => onSelect(isActive && cat.value !== 'all' ? 'all' : cat.value)}
            whileTap={{ scale: 0.92 }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border shrink-0 transition-all ${
              isActive
                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                : 'bg-card text-foreground border-border hover:border-primary/40'
            }`}
          >
            <span className="text-sm leading-none">{cat.emoji}</span>
            <span>{cat.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

// ─── 全国モードバナー（位置情報OFF時）─────────────────────────────────────
function NationwideBanner({ onAllow }: { onAllow: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="mx-4 mt-2.5 mb-0 rounded-xl overflow-hidden"
    >
      <div className="bg-gradient-to-r from-sky-500 to-indigo-500 px-3.5 py-2.5 flex items-center gap-3">
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

// ─── 横スクロールカード（リッチ版）──────────────────────────────────────────
function HorizBagCard({ bag }: { bag: SurpriseBagWithStore }) {
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
      className={`group block relative w-44 shrink-0 rounded-2xl overflow-hidden shadow-sm border border-border/50 bg-card
        tap-scale transition-all duration-200
        ${isSoldOut ? 'opacity-55 grayscale cursor-not-allowed' : 'hover:-translate-y-0.5 hover:shadow-md'}`}
    >
      {/* 画像エリア */}
      <div className="relative w-full h-28 overflow-hidden bg-muted">
        {!loaded && <div className="absolute inset-0 skeleton-shimmer" />}
        <img
          src={imgSrc} alt={bag.store.name} loading="lazy" decoding="async"
          onLoad={() => setLoaded(true)}
          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105
            ${loaded ? 'img-fade-in' : 'opacity-0'}`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent pointer-events-none" />

        {/* 割引バッジ */}
        {!isSoldOut && (
          <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px] font-black px-1.5 py-0.5 rounded-md">
            {discountPct}% OFF
          </span>
        )}

        {/* 残りわずか */}
        {isLowStock && (
          <span className="absolute top-2 right-2 bg-destructive text-destructive-foreground text-[9px] font-black px-1.5 py-0.5 rounded-md animate-pulse">
            残りわずか
          </span>
        )}

        {/* 完売 */}
        {isSoldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <span className="bg-white/90 text-foreground text-[10px] font-black px-2 py-1 rounded-lg">完売御礼 🌸</span>
          </div>
        )}

        {/* お気に入りボタン */}
        <button
          onClick={e => { e.preventDefault(); e.stopPropagation(); toggle(bag.store.id); }}
          className={`absolute bottom-2 right-2 w-6 h-6 rounded-full flex items-center justify-center tap-scale-sm
            ${favorited ? 'bg-rose-500' : 'bg-white/80 backdrop-blur-sm'}`}
          aria-label="お気に入り"
        >
          <Heart className={`w-3 h-3 ${favorited ? 'fill-white stroke-white' : 'fill-none stroke-rose-400'}`} />
        </button>

        {/* 店舗名（画像下部） */}
        <div className="absolute bottom-2 left-2 right-10">
          <span className="text-white text-[10px] font-bold drop-shadow leading-tight line-clamp-1">
            {bag.store.name}
          </span>
        </div>
      </div>

      {/* テキスト情報 */}
      <div className="p-2.5">
        <p className="font-black text-xs leading-tight line-clamp-2 mb-1.5 text-foreground">{bag.title}</p>
        <div className="flex items-center justify-between">
          {bag.pickupStart && !isSoldOut ? (
            <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
              <Clock className="w-2.5 h-2.5 text-primary" />
              <span>{bag.pickupStart}</span>
            </div>
          ) : <span />}
          {!isSoldOut && (
            <span className="text-sm font-black text-primary">¥{bag.discountedPrice.toLocaleString()}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

function HorizBagCardSkeleton() {
  return (
    <div className="w-44 shrink-0 rounded-2xl overflow-hidden border border-border/30 bg-card">
      <div className="w-full h-28 skeleton-shimmer" />
      <div className="p-2.5 space-y-1.5">
        <div className="h-3 skeleton-shimmer rounded-full w-5/6" />
        <div className="h-2.5 skeleton-shimmer rounded-full w-2/3" />
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
        <span className="text-sm select-none">🔥</span>
        <span className="text-[13px] font-black text-foreground">もうすぐ終わるおすそ分け</span>
        {!loading && <span className="text-[10px] text-muted-foreground ml-auto">{urgentBags.length}件</span>}
      </div>
      <div className="flex gap-2.5 overflow-x-auto hide-scrollbar px-4 pr-6 pb-1">
        {loading
          ? [1, 2, 3].map(i => <HorizBagCardSkeleton key={i} />)
          : urgentBags.map(bag => <HorizBagCard key={bag.id} bag={bag} />)
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
    <div className="pt-3 pb-1">
      <div className="flex items-center gap-2 px-4 mb-2">
        <Zap className="w-3.5 h-3.5 text-primary shrink-0" />
        <span className="text-[13px] font-black text-foreground">今日のおすすめ</span>
        {!loading && <span className="text-[10px] text-muted-foreground ml-auto">{recommendedBags.length}件</span>}
      </div>
      <div className="flex gap-2.5 overflow-x-auto hide-scrollbar px-4 pr-6 pb-1">
        {loading
          ? [1, 2, 3].map(i => <HorizBagCardSkeleton key={i} />)
          : recommendedBags.map(bag => <HorizBagCard key={bag.id} bag={bag} />)
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
  const [showSearch,     setShowSearch]     = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [inStockOnly,    setInStockOnly]    = useState(false);
  const [sortKey,        setSortKey]        = useState<SortKey>('default');
  const [showSort,       setShowSort]       = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { user, profile, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const { isApprovedOwner } = useMyStore();
  const { data: bags, isLoading: isLoadingBags } = useListAllBags();
  const { city: userCity, loading: geoLoading, denied: geoDenied, retry: retryGeo } = useUserCity();

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/welcome', { replace: true }); return; }
    if (profile?.role === 'store_owner') { navigate('/store/dashboard', { replace: true }); return; }
  }, [authLoading, user, profile, navigate]);

  // 検索欄を開いたとき自動フォーカス
  useEffect(() => {
    if (showSearch) { setTimeout(() => searchRef.current?.focus(), 80); }
    else { setSearchQuery(''); }
  }, [showSearch]);

  const isFiltering = searchQuery.trim() !== '' || activeCategory !== 'all' || inStockOnly || sortKey !== 'default';

  const filteredBags = useMemo(() => {
    let result = bags || [];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(b =>
        b.title.toLowerCase().includes(q) ||
        b.store.name.toLowerCase().includes(q) ||
        b.store.city?.toLowerCase().includes(q)
      );
    }
    if (activeCategory !== 'all') result = result.filter(b => b.category === activeCategory);
    if (inStockOnly)               result = result.filter(b => b.stockCount > 0);
    if (sortKey === 'time_asc')   result = [...result].sort((a, b) => (a.pickupStart || '').localeCompare(b.pickupStart || ''));
    if (sortKey === 'price_asc')  result = [...result].sort((a, b) => a.discountedPrice - b.discountedPrice);
    if (sortKey === 'price_desc') result = [...result].sort((a, b) => b.discountedPrice - a.discountedPrice);
    return result;
  }, [bags, searchQuery, activeCategory, inStockOnly, sortKey]);

  const allBags         = bags || [];
  const activeFilterCnt = [activeCategory !== 'all', inStockOnly, sortKey !== 'default'].filter(Boolean).length;

  function clearAll() {
    setSearchQuery(''); setActiveCategory('all'); setInStockOnly(false); setSortKey('default'); setShowSearch(false);
  }

  const dismissKeyboard = useCallback(() => {
    searchRef.current?.blur();
    setShowSort(false);
  }, []);

  const currentSortLabel = SORT_OPTIONS.find(o => o.value === sortKey)?.label || 'おすすめ順';

  if (authLoading || !user) return null;

  const areaTitle = geoLoading
    ? '現在地を確認中...'
    : userCity
      ? `${userCity}のおすそ分け`
      : geoDenied ? '全国の注目おすそ分け' : 'あなたの街のおすそ分け';

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100dvh-64px)] overflow-hidden">

        {/* ── Sticky ヘッダー（スリム2行） ── */}
        <div className="shrink-0 bg-background border-b border-border/50 z-20 shadow-sm">

          {/* Row 1: エリア名（左） + 検索アイコン（右）── 1行スリムバー */}
          <div className="flex items-center gap-2 px-4 h-11">
            {/* 左: エリア */}
            <AnimatePresence mode="wait">
              {!showSearch ? (
                <motion.div
                  key="area"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-1.5 flex-1 min-w-0"
                >
                  {geoLoading
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin text-primary shrink-0" />
                    : geoDenied
                      ? <Globe className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                      : <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                  }
                  <span className="text-sm font-black text-foreground truncate">{areaTitle}</span>
                </motion.div>
              ) : (
                /* 検索バー（展開時） */
                <motion.div
                  key="search"
                  initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: '100%' }} exit={{ opacity: 0 }}
                  className="flex-1 relative"
                >
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                  <input
                    ref={searchRef}
                    type="search"
                    inputMode="search"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                    placeholder="お店・エリアで検索..."
                    className="w-full bg-secondary/60 border border-border text-foreground rounded-xl pl-8 pr-8 py-1.5 outline-none text-sm
                      focus:bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
                    style={{ fontSize: '16px' }}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-muted-foreground/20 flex items-center justify-center"
                    >
                      <X className="w-2.5 h-2.5 text-muted-foreground" />
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* 右: 検索トグル or 戻るボタン */}
            {!showSearch ? (
              <button
                onClick={() => setShowSearch(true)}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-secondary/60 border border-border hover:bg-secondary tap-scale shrink-0"
                aria-label="検索"
              >
                <Search className="w-4 h-4 text-foreground" />
              </button>
            ) : (
              <button
                onClick={() => { setShowSearch(false); setSearchQuery(''); }}
                className="flex items-center gap-1 text-xs font-bold text-muted-foreground tap-scale shrink-0 ml-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>戻る</span>
              </button>
            )}

            {/* ダッシュボードボタン（MD以上） */}
            {isApprovedOwner && (
              <Link href="/store-dashboard" className="hidden md:block">
                <button className="flex items-center gap-1.5 bg-primary text-primary-foreground font-bold px-3 py-1.5 rounded-xl text-xs hover:bg-primary/90 tap-scale shadow-sm shrink-0">
                  <Store className="w-3.5 h-3.5" />ダッシュボード
                </button>
              </Link>
            )}
          </div>

          {/* Row 2: カテゴリーピル（常時表示） */}
          <CategoryPills activeCategory={activeCategory} onSelect={setActiveCategory} />

          {/* Row 3: フィルターバー（絞り込み中のみ） */}
          <AnimatePresence>
            {(inStockOnly || sortKey !== 'default' || activeFilterCnt > 0) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-2 px-4 pb-2">
                  <button
                    onClick={() => setInStockOnly(v => !v)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border tap-scale transition-colors
                      ${inStockOnly ? 'bg-orange-100 text-orange-700 border-orange-300' : 'bg-card text-muted-foreground border-border'}`}
                  >
                    <span className={`w-5 h-3 rounded-full flex items-center transition-colors ${inStockOnly ? 'bg-primary' : 'bg-muted'}`}>
                      <span className={`w-2 h-2 bg-white rounded-full shadow transition-transform mx-0.5 ${inStockOnly ? 'translate-x-2.5' : 'translate-x-0'}`} />
                    </span>
                    受付中のみ
                  </button>

                  <div className="relative">
                    <button
                      onClick={() => setShowSort(v => !v)}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border tap-scale transition-colors
                        ${sortKey !== 'default' ? 'bg-primary/10 text-primary border-primary/30' : 'bg-card text-muted-foreground border-border'}`}
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
                  <motion.button onClick={clearAll} whileTap={{ scale: 0.92 }}
                    className="flex items-center gap-1 px-2 py-1 rounded-xl text-[11px] font-bold bg-destructive/8 text-destructive border border-destructive/20">
                    <X className="w-3 h-3" />リセット
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 受付中のみトグル（通常時にも手軽に出す） */}
          {!inStockOnly && sortKey === 'default' && activeCategory === 'all' && (
            <div className="flex items-center px-4 pb-2 pt-0">
              <button
                onClick={() => setInStockOnly(true)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground tap-scale"
              >
                <span className="w-5 h-3 rounded-full flex items-center bg-muted">
                  <span className="w-2 h-2 bg-white rounded-full shadow mx-0.5" />
                </span>
                受付中のみ表示
              </button>
              <div className="flex-1" />
              <div className="relative">
                <button
                  onClick={() => setShowSort(v => !v)}
                  className="flex items-center gap-1 text-xs text-muted-foreground tap-scale"
                >
                  <SlidersHorizontal className="w-3 h-3" />
                  <span>{currentSortLabel}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${showSort ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {showSort && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.95 }}
                      transition={{ duration: 0.13 }}
                      className="absolute top-full mt-1.5 right-0 z-50 bg-card border border-border rounded-2xl shadow-xl overflow-hidden min-w-[148px]"
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
            </div>
          )}
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
                  <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
                    <div className="flex flex-col items-center text-center px-6 py-8">
                      <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-amber-100 rounded-2xl flex items-center justify-center mb-3 border border-orange-200/60">
                        <PackageOpen className="w-8 h-8 text-primary/60" />
                      </div>
                      <h3 className="text-base font-black text-foreground mb-1">
                        {activeCategory !== 'all'
                          ? `「${SCROLL_CATS.find(c => c.value === activeCategory)?.label ?? activeCategory}」のおすそ分けはまだありません`
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

                {/* 急募セクション（横スクロール） */}
                <UrgentSection bags={allBags} loading={isLoadingBags} />

                {/* おすすめセクション（横スクロール） */}
                <RecommendedSection bags={allBags} loading={isLoadingBags} />

                {/* 区切り */}
                {!isLoadingBags && allBags.length > 0 && (
                  <div className="mx-4 mt-1 mb-0 border-t border-border/30" />
                )}

                {/* ─ すべてのおすそ分け ─ */}
                {(!isLoadingBags && allBags.length > 0) && (
                  <div className="flex items-center gap-2 px-4 pt-3 pb-1.5">
                    <span className="text-[13px] font-black text-foreground">すべてのおすそ分け</span>
                    <span className="text-[10px] text-muted-foreground">{allBags.length}件</span>
                  </div>
                )}

                {/* バッグリスト（縦グリッド）*/}
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
