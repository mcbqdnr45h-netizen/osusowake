import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Layout } from '@/components/Layout';
import { BagCard, BagCardSkeleton } from '@/components/BagCard';
import { useListAllBags, SurpriseBagWithStore } from '@workspace/api-client-react';
import {
  Search, Store, ChevronRight, Clock, MapPin, Zap,
  SlidersHorizontal, ChevronDown, X, PackageOpen, Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'wouter';
import { getCategoryIcon, getCategoryImage } from '@/lib/category-utils';
import { useFavorites } from '@/contexts/FavoritesContext';
import { Heart } from 'lucide-react';
import { useMyStore } from '@/hooks/use-my-store';

// ─── カテゴリー定義 ──────────────────────────────────────────────────────────
const CATEGORIES = [
  { label: 'すべて',         value: 'all',          emoji: '✨' },
  { label: 'パン・スイーツ', value: 'bakery',        emoji: '🍞' },
  { label: 'お弁当・惣菜',   value: 'restaurant',    emoji: '🍱' },
  { label: 'カフェ',         value: 'cafe',          emoji: '☕' },
  { label: 'スーパー',       value: 'supermarket',   emoji: '🛒' },
  { label: 'コンビニ',       value: 'convenience',   emoji: '🏪' },
  { label: 'スイーツ',       value: 'sweets',        emoji: '🍰' },
  { label: 'その他',         value: 'other',         emoji: '🥗' },
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
    <div className="shrink-0 px-4 pt-4 pb-2">
      <div className="relative overflow-hidden rounded-2xl shadow-md">
        <AnimatePresence mode="wait">
          {BANNERS.map((b, i) => i === active ? (
            <motion.div key={b.id}
              initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.32, ease: 'easeInOut' }}
              className={`bg-gradient-to-br ${b.from} ${b.to} px-5 py-5 flex items-center gap-4`}>
              <div className={`w-14 h-14 ${b.accent} rounded-2xl flex items-center justify-center shrink-0 text-3xl select-none`}>{b.emoji}</div>
              <div className="flex-1 min-w-0">
                <p className="text-white/80 text-xs font-medium leading-none mb-1">{b.title}</p>
                <p className="text-white text-xl font-black leading-tight">{b.highlight}</p>
                <p className="text-white/70 text-xs mt-1">{b.sub}</p>
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
        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1.5">
          {BANNERS.map((_, i) => (
            <button key={i} onClick={() => { setActive(i); resetTimer(); }}
              className={`rounded-full transition-all duration-300 tap-scale ${i === active ? 'w-5 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/40'}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── コンパクトカード（shimmer付き）─────────────────────────────────────────
function CompactBagCard({ bag }: { bag: SurpriseBagWithStore }) {
  const { isFavorite, toggle } = useFavorites();
  const isSoldOut    = bag.stockCount <= 0;
  const discountPct  = Math.round((1 - bag.discountedPrice / bag.originalPrice) * 100);
  const isLowStock   = bag.stockCount > 0 && bag.stockCount < 3;
  const favorited    = isFavorite(bag.store.id);
  const [loaded, setLoaded] = useState(false);

  const imgSrc = bag.store.imageUrl || getCategoryImage(bag.store.category);

  return (
    <Link
      href={isSoldOut ? '#' : `/bags/${bag.id}`}
      onClick={e => isSoldOut && e.preventDefault()}
      className={`group block relative w-44 shrink-0 rounded-2xl overflow-hidden shadow-md border border-border/50 bg-card
        tap-scale transition-shadow duration-200
        ${isSoldOut ? 'opacity-60 grayscale cursor-not-allowed' : 'hover:-translate-y-0.5 hover:shadow-lg'}`}
    >
      {/* ── 固定高さ画像エリア（shimmer付き）── */}
      <div className="relative w-full h-28 overflow-hidden bg-muted">
        {/* Shimmer */}
        {!loaded && <div className="absolute inset-0 skeleton-shimmer" />}

        {/* 画像 */}
        <img
          src={imgSrc}
          alt={bag.store.name}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105
            ${loaded ? 'img-fade-in' : 'opacity-0'}`}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />

        {/* 店舗チップ */}
        <div className="absolute top-2 left-2">
          <span className="bg-white/90 backdrop-blur-sm text-foreground text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            {getCategoryIcon(bag.store.category)} {bag.store.name.slice(0, 6)}{bag.store.name.length > 6 ? '…' : ''}
          </span>
        </div>

        {/* バッジ */}
        <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
          {!isSoldOut && (
            <span className="bg-accent text-accent-foreground text-[10px] font-black px-1.5 py-0.5 rounded-md">
              {discountPct}% OFF
            </span>
          )}
          {isLowStock && (
            <span className="bg-destructive text-destructive-foreground text-[9px] font-black px-1.5 py-0.5 rounded-md animate-pulse">
              残りわずか
            </span>
          )}
        </div>

        {/* ハートボタン */}
        <button
          onClick={e => { e.preventDefault(); e.stopPropagation(); toggle(bag.store.id); }}
          className={`absolute bottom-2 right-2 w-6 h-6 rounded-full flex items-center justify-center tap-scale-sm
            ${favorited ? 'bg-rose-500' : 'bg-white/80 backdrop-blur-sm'}`}
          aria-label={favorited ? 'お気に入りから削除' : 'お気に入りに追加'}
        >
          <Heart className={`w-3 h-3 ${favorited ? 'fill-white stroke-white' : 'fill-none stroke-rose-400'}`} />
        </button>
      </div>

      {/* テキスト情報 */}
      <div className="p-2.5">
        <p className="font-bold text-foreground text-xs leading-tight line-clamp-1 mb-1.5">{bag.title}</p>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-1.5">
          <Clock className="w-2.5 h-2.5 shrink-0" />
          <span>{bag.pickupStart}-{bag.pickupEnd}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground line-through">¥{bag.originalPrice.toLocaleString()}</span>
          <div className="flex items-baseline gap-1">
            {!isSoldOut && (
              <span className={`text-[10px] font-bold ${isLowStock ? 'text-orange-500' : 'text-muted-foreground'}`}>
                残り{bag.stockCount}
              </span>
            )}
            <span className="text-base font-black text-primary">¥{bag.discountedPrice.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

/** 横スクロールのスケルトン */
function CompactBagCardSkeleton() {
  return (
    <div className="w-44 shrink-0 rounded-2xl overflow-hidden border border-border/30 bg-card">
      <div className="w-full h-28 skeleton-shimmer" />
      <div className="p-2.5 space-y-2">
        <div className="h-3 skeleton-shimmer rounded-full w-4/5" />
        <div className="h-2.5 skeleton-shimmer rounded-full w-3/5" />
        <div className="flex justify-between">
          <div className="h-2.5 skeleton-shimmer rounded-full w-10" />
          <div className="h-4 skeleton-shimmer rounded-full w-14" />
        </div>
      </div>
    </div>
  );
}

function UrgentSection({ bags, loading }: { bags: SurpriseBagWithStore[]; loading: boolean }) {
  const urgentBags = bags.filter(b => b.stockCount > 0 && b.stockCount < 5).slice(0, 8);
  if (!loading && urgentBags.length === 0) return null;
  return (
    <div className="shrink-0 pt-2 pb-1">
      <div className="flex items-center gap-2 px-4 mb-3">
        <div className="flex items-center gap-1.5 bg-orange-100 text-orange-600 px-2.5 py-1 rounded-full border border-orange-200">
          <span className="text-xs select-none">🔥</span>
          <span className="text-xs font-black">もうすぐ終わるおすそ分け</span>
        </div>
        <span className="text-xs text-muted-foreground font-medium">お急ぎを！</span>
      </div>
      <div className="flex gap-3 overflow-x-auto hide-scrollbar px-4 pb-1">
        {loading
          ? [1, 2, 3].map(i => <CompactBagCardSkeleton key={i} />)
          : urgentBags.map(bag => <CompactBagCard key={bag.id} bag={bag} />)
        }
      </div>
    </div>
  );
}

function RecommendedSection({ bags, loading }: { bags: SurpriseBagWithStore[]; loading: boolean }) {
  const recommendedBags = bags.filter(b => b.stockCount > 0).slice(0, 8);
  if (!loading && recommendedBags.length === 0) return null;
  return (
    <div className="shrink-0 pt-2 pb-1">
      <div className="flex items-center justify-between px-4 mb-3">
        <div className="flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-primary" />
          <span className="text-sm font-black text-foreground">今日のおすすめおすそ分け</span>
        </div>
        {!loading && <span className="text-xs text-muted-foreground">{recommendedBags.length}件</span>}
      </div>
      <div className="flex gap-3 overflow-x-auto hide-scrollbar px-4 pb-1">
        {loading
          ? [1, 2, 3].map(i => <CompactBagCardSkeleton key={i} />)
          : recommendedBags.map(bag => <CompactBagCard key={bag.id} bag={bag} />)
        }
      </div>
    </div>
  );
}

// ─── 現在地の市区町村フック（フォールバック付き）─────────────────────────────
const GEO_TIMEOUT_MS = 5000;

function useUserCity() {
  const [city, setCity]       = useState<string | null>(null);
  const [loading, setLoading] = useState(true);   // 最初はロード中
  const [denied, setDenied]   = useState(false);  // 拒否済みフラグ

  useEffect(() => {
    if (!navigator.geolocation) {
      setLoading(false);
      setDenied(true);
      return;
    }

    // タイムアウト保険（位置情報が長時間かかる場合は諦める）
    const fallbackTimer = setTimeout(() => {
      setLoading(false);
      setDenied(true);
    }, GEO_TIMEOUT_MS + 500);

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
          const name = addr.city || addr.town || addr.village || addr.county || addr.state || null;
          setCity(name);
        } catch {
          setCity(null);
        } finally {
          setLoading(false);
        }
      },
      () => {
        clearTimeout(fallbackTimer);
        setLoading(false);
        setDenied(true);
      },
      { timeout: GEO_TIMEOUT_MS, maximumAge: 600_000, enableHighAccuracy: false }
    );

    return () => clearTimeout(fallbackTimer);
  }, []);

  return { city, loading, denied };
}

// ─── メインコンポーネント ─────────────────────────────────────────────────────
export default function Home() {
  const [searchQuery,    setSearchQuery]    = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [inStockOnly,    setInStockOnly]    = useState(false);
  const [sortKey,        setSortKey]        = useState<SortKey>('default');
  const [showSort,       setShowSort]       = useState(false);
  const searchRef   = useRef<HTMLInputElement>(null);
  const scrollRef   = useRef<HTMLDivElement>(null);

  const { isApprovedOwner } = useMyStore();
  const { data: bags, isLoading: isLoadingBags } = useListAllBags();
  const { city: userCity, loading: geoLoading, denied: geoDenied } = useUserCity();

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
    if (sortKey === 'time_asc')  result = [...result].sort((a, b) => (a.pickupStart || '').localeCompare(b.pickupStart || ''));
    if (sortKey === 'price_asc') result = [...result].sort((a, b) => a.discountedPrice - b.discountedPrice);
    if (sortKey === 'price_desc') result = [...result].sort((a, b) => b.discountedPrice - a.discountedPrice);
    return result;
  }, [bags, searchQuery, activeCategory, inStockOnly, sortKey]);

  const allBags         = bags || [];
  const activeFilterCnt = [activeCategory !== 'all', inStockOnly, sortKey !== 'default'].filter(Boolean).length;

  function clearAll() {
    setSearchQuery('');
    setActiveCategory('all');
    setInStockOnly(false);
    setSortKey('default');
  }

  /** キーボードを閉じる（背景タップ時） */
  const dismissKeyboard = useCallback(() => {
    searchRef.current?.blur();
    setShowSort(false);
  }, []);

  const currentSortLabel = SORT_OPTIONS.find(o => o.value === sortKey)?.label || 'おすすめ順';

  // 位置情報フォールバックの地名タイトル
  const areaTitle = geoLoading
    ? null
    : userCity
      ? `${userCity}のおすそ分け`
      : geoDenied
        ? '全国のおすそ分け'
        : 'あなたの街のおすそ分け';

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100dvh-64px)] overflow-hidden">

        {/* ── Sticky ヘッダー ── */}
        <div className="shrink-0 bg-background border-b border-border/50 z-20 shadow-sm">

          {/* Desktop top bar */}
          <div className="hidden md:flex items-center justify-between px-5 py-3 border-b border-border">
            <div className="flex items-center gap-3">
              {geoLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span className="text-xl font-black text-muted-foreground">場所を確認中...</span>
                </div>
              ) : (
                <>
                  <MapPin className="w-4 h-4 text-primary" />
                  <h1 className="text-xl font-black text-foreground">{areaTitle}</h1>
                </>
              )}
              <span className="bg-primary/10 text-primary px-2.5 py-1 rounded-full font-bold text-sm">
                {filteredBags.length}件
              </span>
            </div>
            {isApprovedOwner && (
              <Link href="/store-dashboard">
                <button className="flex items-center gap-2 bg-primary text-primary-foreground font-bold px-4 py-2.5 rounded-xl text-sm hover:bg-primary/90 tap-scale shadow-sm">
                  <Store className="w-4 h-4" />ダッシュボード
                </button>
              </Link>
            )}
          </div>

          {/* Mobile エリア名 */}
          <div className="md:hidden flex items-center gap-2 px-4 pt-3 pb-1">
            {geoLoading ? (
              <div className="flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                <span className="text-sm font-bold text-muted-foreground">現在地を確認中...</span>
              </div>
            ) : (
              <>
                <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="text-sm font-black text-foreground">{areaTitle}</span>
              </>
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
                placeholder="エリア・ジャンル・お店名で検索..."
                className="w-full bg-secondary/60 border border-border text-foreground rounded-2xl pl-10 pr-10 py-3 focus:bg-card focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all placeholder:text-muted-foreground"
                style={{ fontSize: '16px' }}
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

          {/* カテゴリーチップ */}
          <div className="flex overflow-x-auto hide-scrollbar gap-2 px-4 pb-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                className={`whitespace-nowrap flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors shrink-0 border tap-scale
                  ${activeCategory === cat.value
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-card text-foreground border-border hover:border-primary/40'
                  }`}
              >
                <span className="select-none">{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* フィルターバー */}
          <div className="flex items-center gap-2 px-4 pb-3 pt-1">

            {/* おすそ分け受付中のみトグル */}
            <button
              onClick={() => setInStockOnly(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border tap-scale transition-colors
                ${inStockOnly
                  ? 'bg-orange-100 text-orange-700 border-orange-300'
                  : 'bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
                }`}
            >
              <span className={`w-7 h-4 rounded-full flex items-center transition-colors ${inStockOnly ? 'bg-primary' : 'bg-muted'}`}>
                <span className={`w-3 h-3 bg-white rounded-full shadow transition-transform mx-0.5 ${inStockOnly ? 'translate-x-3' : 'translate-x-0'}`} />
              </span>
              おすそ分け受付中のみ
            </button>

            {/* 並び替えドロップダウン */}
            <div className="relative">
              <button
                onClick={() => setShowSort(v => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border tap-scale transition-colors
                  ${sortKey !== 'default'
                    ? 'bg-primary/10 text-primary border-primary/30'
                    : 'bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
                  }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                {currentSortLabel}
                <ChevronDown className={`w-3 h-3 transition-transform ${showSort ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {showSort && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.95 }}
                    transition={{ duration: 0.14 }}
                    className="absolute top-full mt-1.5 left-0 z-50 bg-card border border-border rounded-2xl shadow-xl overflow-hidden min-w-[150px]"
                  >
                    {SORT_OPTIONS.map(opt => (
                      <button key={opt.value}
                        onClick={() => { setSortKey(opt.value); setShowSort(false); }}
                        className={`w-full text-left px-4 py-3 text-xs font-bold transition-colors hover:bg-secondary tap-opacity
                          ${sortKey === opt.value ? 'text-primary bg-primary/5' : 'text-foreground'}`}>
                        {sortKey === opt.value && <span className="mr-1.5">✓</span>}
                        {opt.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex-1" />

            {/* 件数 + リセット */}
            <div className="flex items-center gap-2">
              {isFiltering && (
                <span className="text-xs text-muted-foreground font-medium">{filteredBags.length}件</span>
              )}
              {activeFilterCnt > 0 && (
                <button onClick={clearAll}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-destructive/8 text-destructive border border-destructive/20 hover:bg-destructive/15 tap-scale transition-colors">
                  <X className="w-3 h-3" />
                  リセット
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── スクロールエリア（背景タップでキーボード閉じる）── */}
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
                transition={{ duration: 0.18 }}
                className="px-4 pt-4 pb-6"
              >
                {isLoadingBags ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map(i => <BagCardSkeleton key={i} />)}
                  </div>
                ) : filteredBags.length > 0 ? (
                  <motion.div
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                    initial="hidden" animate="show"
                    variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } }}
                  >
                    {filteredBags.map(bag => (
                      <motion.div key={bag.id} variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}>
                        <BagCard bag={bag} />
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center py-20 px-6"
                  >
                    <div className="w-24 h-24 bg-card border-2 border-dashed border-border rounded-3xl flex items-center justify-center mb-5 shadow-sm">
                      <PackageOpen className="w-10 h-10 text-muted-foreground/50" />
                    </div>
                    <h3 className="text-lg font-black text-foreground mb-2 text-center">
                      条件に合うおすそ分けが<br />見つかりませんでした
                    </h3>
                    <p className="text-sm text-muted-foreground text-center mb-6 leading-relaxed">
                      キーワードやジャンルを<br />変えて探してみてください
                    </p>
                    <button onClick={clearAll}
                      className="px-6 py-2.5 bg-primary text-primary-foreground rounded-2xl text-sm font-bold shadow-md shadow-primary/20 tap-scale">
                      条件をリセットする
                    </button>
                  </motion.div>
                )}
              </motion.div>

            ) : (
              /* 通常ホーム */
              <motion.div
                key="home"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                {/* キャンペーンバナー（バッグ有り時のみ表示） */}
                {(!isLoadingBags && allBags.length > 0) && <CampaignBanners />}

                {/* 急募・おすすめセクション */}
                <UrgentSection     bags={allBags} loading={isLoadingBags} />
                {(!isLoadingBags && allBags.length > 0) && <div className="mx-4 my-2 border-t border-border/40" />}
                <RecommendedSection bags={allBags} loading={isLoadingBags} />

                {(!isLoadingBags && allBags.length > 0) && (
                  <div className="flex items-center justify-between px-4 pt-3 pb-2">
                    <span className="text-sm font-black text-foreground">すべてのおすそ分け</span>
                    <span className="text-xs text-muted-foreground">{allBags.length}件</span>
                  </div>
                )}

                {/* 店舗ダッシュボードバナー（Mobile） */}
                {isApprovedOwner && (
                  <Link href="/store-dashboard" className="md:hidden mx-4 mt-1 mb-3 block">
                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-3.5 flex items-center justify-between tap-scale">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Store className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-foreground">店舗ダッシュボード</p>
                          <p className="text-[10px] text-muted-foreground">在庫・売上を管理する</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </Link>
                )}

                {/* バッグリスト */}
                <div className="px-4 pb-6">
                  {isLoadingBags ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                      {[1, 2, 3, 4].map(i => <BagCardSkeleton key={i} />)}
                    </div>
                  ) : allBags.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                      <div className="w-24 h-24 bg-card border-2 border-dashed border-border rounded-3xl flex items-center justify-center mb-5">
                        <span className="text-4xl select-none">🎁</span>
                      </div>
                      <h3 className="text-lg font-black text-foreground mb-2">今日のおすそ分けを準備中</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        まだ出品がありません。<br />
                        お近くのお店がおすそ分けを準備中です！
                      </p>
                    </div>
                  ) : (
                    <motion.div
                      className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2"
                      initial="hidden" animate="show"
                      variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }}
                    >
                      {allBags.map(bag => (
                        <motion.div key={bag.id} variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}>
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
    </Layout>
  );
}
