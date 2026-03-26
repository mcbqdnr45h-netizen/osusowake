import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Layout } from '@/components/Layout';
import { BagCard, BagCardSkeleton } from '@/components/BagCard';
import { useListAllBags, useListReservations, SurpriseBagWithStore } from '@workspace/api-client-react';
import {
  Search, Store, MapPin, Zap, Flame, Moon, Navigation2,
  SlidersHorizontal, ChevronDown, X, PackageOpen, Loader2, Map as MapIcon,
  Globe, Clock, ArrowLeft, ShoppingBag, Megaphone,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { getCategoryIcon, getCategoryImage } from '@/lib/category-utils';
import { useFavorites } from '@/contexts/FavoritesContext';
import { Heart } from 'lucide-react';
import { useMyStore } from '@/hooks/use-my-store';
import { useUserLocation, haversineMeters } from '@/hooks/use-user-location';
import { useUserId } from '@/hooks/use-user';
import { LoginNudgeSheet } from '@/components/LoginNudgeSheet';
import { useAppSettings } from '@/hooks/use-app-settings';

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

// ─── 受け取り時間フォーマット ─────────────────────────────────────────────
function formatPickupTime(start?: string | null, end?: string | null): string {
  if (!start) return '';
  if (!end) return `${start}〜`;
  return `${start} 〜 ${end}`;
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

// ─── 横スクロールカード ────────────────────────────────────────────────────
function HorizBagCard({ bag, distM }: { bag: SurpriseBagWithStore; distM?: number }) {
  const { isFavorite, toggle } = useFavorites();
  const { user } = useAuth();
  const isSoldOut   = bag.stockCount <= 0;
  const discountPct = Math.round((1 - bag.discountedPrice / bag.originalPrice) * 100);
  const isLowStock  = bag.stockCount > 0 && bag.stockCount < 3;
  const favorited   = isFavorite(bag.store.id);
  const [loaded, setLoaded] = useState(false);
  const [showNudge, setShowNudge] = useState(false);
  const imgSrc = bag.imageUrl || bag.store.imageUrl || getCategoryImage(bag.store.category);

  const distLabel = distM != null
    ? distM < 50 ? 'すぐそこ' : distM < 1000 ? `${Math.round(distM / 10) * 10}m` : `${(distM / 1000).toFixed(1)}km`
    : null;

  return (<>
    <Link
      href={isSoldOut ? '#' : `/bags/${bag.id}`}
      onClick={e => isSoldOut && e.preventDefault()}
      className={`group block relative w-44 shrink-0 rounded-2xl overflow-hidden shadow-sm border border-border/50 bg-card
        tap-scale transition-all duration-200
        ${isSoldOut ? 'opacity-55 grayscale cursor-not-allowed' : 'hover:-translate-y-0.5 hover:shadow-md'}`}
    >
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
        {isLowStock && (
          <span className="absolute top-2 right-2 bg-destructive text-destructive-foreground text-[9px] font-black px-1.5 py-0.5 rounded-md animate-pulse">
            残りわずか
          </span>
        )}
        {isSoldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <span className="bg-white/90 text-foreground text-[10px] font-black px-2 py-1 rounded-lg">完売御礼 🌸</span>
          </div>
        )}

        {/* お気に入りボタン */}
        <button
          onClick={e => { e.preventDefault(); e.stopPropagation(); if (!user) { setShowNudge(true); return; } toggle(bag.store.id); }}
          className={`absolute bottom-2 right-2 w-6 h-6 rounded-full flex items-center justify-center tap-scale-sm
            ${favorited ? 'bg-rose-500' : 'bg-white/80 backdrop-blur-sm'}`}
          aria-label="お気に入り"
        >
          <Heart className={`w-3 h-3 ${favorited ? 'fill-white stroke-white' : 'fill-none stroke-rose-400'}`} />
        </button>

        {/* 店舗名 */}
        <div className="absolute bottom-2 left-2 right-10">
          <span className="text-white text-[10px] font-bold drop-shadow leading-tight line-clamp-1">
            {bag.store.name}
          </span>
        </div>
      </div>

      <div className="p-2.5">
        <p className="font-black text-xs leading-tight line-clamp-2 mb-1.5 text-foreground">{bag.title}</p>
        <div className="flex items-center justify-between gap-1">
          <div className="flex flex-col gap-0.5 min-w-0">
            {(bag.pickupStart || bag.pickupEnd) && !isSoldOut && (
              <div className="flex items-center gap-0.5 text-[9px] text-muted-foreground">
                <Clock className="w-2.5 h-2.5 text-primary shrink-0" />
                <span className="truncate">{formatPickupTime(bag.pickupStart, bag.pickupEnd)}</span>
              </div>
            )}
            {distLabel && (
              <div className="flex items-center gap-0.5 text-[9px] text-muted-foreground">
                <Navigation2 className="w-2 h-2 shrink-0" />
                <span>{distLabel}</span>
              </div>
            )}
          </div>
          {!isSoldOut && (
            <span className="text-sm font-black text-primary shrink-0">¥{bag.discountedPrice.toLocaleString()}</span>
          )}
        </div>
      </div>
    </Link>
    <LoginNudgeSheet isOpen={showNudge} onClose={() => setShowNudge(false)} reason="favorite" />
  </>);
}

function HorizBagCardSkeleton() {
  return (
    <div className="w-44 shrink-0 rounded-2xl overflow-hidden border border-border/30 bg-card">
      <div className="w-full h-28 skeleton-shimmer" />
      <div className="p-2.5 space-y-1.5">
        <div className="h-3 skeleton-shimmer rounded-full w-5/6" />
        <div className="h-2.5 skeleton-shimmer rounded-full w-2/3" />
        <div className="flex justify-between mt-1">
          <div className="h-2.5 skeleton-shimmer rounded-full w-12" />
          <div className="h-3.5 skeleton-shimmer rounded-full w-12" />
        </div>
      </div>
    </div>
  );
}

// ─── セクション共通ヘッダー ────────────────────────────────────────────────
function SectionHeader({ icon, title, count }: {
  icon: React.ReactNode; title: string; count?: number;
}) {
  return (
    <div className="flex items-center gap-1.5 px-4 mb-2">
      {icon}
      <span className="text-[13px] font-black text-foreground">{title}</span>
      {count != null && <span className="text-[10px] text-muted-foreground ml-auto">{count}件</span>}
    </div>
  );
}

// ─── 横スクロールラッパー ─────────────────────────────────────────────────
function HorizScrollRow({ bags, loading, skeletonCount = 3, distMap }: {
  bags: SurpriseBagWithStore[];
  loading: boolean;
  skeletonCount?: number;
  distMap?: Map<string, number>;
}) {
  if (!loading && bags.length === 0) return null;
  return (
    <div className="flex gap-2.5 overflow-x-auto hide-scrollbar px-4 pr-6 pb-1">
      {loading
        ? Array.from({ length: skeletonCount }, (_, i) => <HorizBagCardSkeleton key={i} />)
        : bags.map(bag => (
            <HorizBagCard key={bag.id} bag={bag} distM={distMap?.get(bag.id)} />
          ))
      }
      <div className="w-1 shrink-0" />
    </div>
  );
}

// ─── 全国モードバナー ─────────────────────────────────────────────────────
function NationwideBanner({ onAllow }: { onAllow: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
      className="mx-4 mt-2.5 mb-0 rounded-xl overflow-hidden">
      <div className="bg-gradient-to-r from-sky-500 to-indigo-500 px-3.5 py-2.5 flex items-center gap-3">
        <span className="text-xl select-none">🗾</span>
        <div className="flex-1 min-w-0">
          <p className="text-white font-black text-xs leading-tight">全国のおすそわけを表示中</p>
          <p className="text-white/75 text-[10px] mt-0.5 leading-tight">現在地をONにすると近くを優先表示</p>
        </div>
        <button onClick={onAllow}
          className="bg-white text-sky-600 font-black text-[10px] px-2.5 py-1.5 rounded-lg shrink-0 shadow-sm tap-scale whitespace-nowrap">
          現在地ON
        </button>
      </div>
    </motion.div>
  );
}

// ─── フローティング地図ボタン ─────────────────────────────────────────────
function FloatingMapButton() {
  return (
    <Link href="/map">
      <motion.button
        initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.4 }}
        whileTap={{ scale: 0.88 }}
        className="fixed bottom-[88px] right-4 z-40 w-14 h-14 bg-primary rounded-2xl shadow-xl shadow-primary/30
          flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-colors"
        aria-label="地図で探す"
      >
        <MapIcon className="w-6 h-6" />
      </motion.button>
    </Link>
  );
}

// ─── 位置情報フック (都市名) ──────────────────────────────────────────────
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

// ─── メインコンポーネント ─────────────────────────────────────────────────────
export default function Home() {
  const [searchQuery,    setSearchQuery]    = useState('');
  const [showSearch,     setShowSearch]     = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [inStockOnly,    setInStockOnly]    = useState(true);  // デフォルトON
  const [sortKey,        setSortKey]        = useState<SortKey>('default');
  const [showSort,       setShowSort]       = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { settings: appSettings } = useAppSettings();

  // ── お知らせバナー ──
  const [announcement, setAnnouncement]         = useState<{ id: number; title: string; body: string } | null>(null);
  const [annDismissed, setAnnDismissed]         = useState(false);
  useEffect(() => {
    const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, '') || '';
    fetch(`${BASE_URL}/api/announcements?limit=1`)
      .then(r => r.ok ? r.json() : [])
      .then((list: { id: number; title: string; body: string }[]) => {
        if (list.length > 0) {
          const key = `ann_dismissed_${list[0].id}`;
          if (!sessionStorage.getItem(key)) setAnnouncement(list[0]);
        }
      })
      .catch(() => {});
  }, []);

  const { user, profile, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const { isApprovedOwner } = useMyStore();
  const userId = useUserId();
  const { data: bags, isLoading: isLoadingBags } = useListAllBags({
    query: { refetchInterval: 60_000, staleTime: 30_000 },
  });

  // 仮押さえ中の予約を取得
  const { data: reservations } = useListReservations(
    { userId: userId || '' },
    { query: { enabled: !!userId, refetchInterval: 30_000, staleTime: 0 } },
  );
  const HOLD_MS = 5 * 60 * 1000;
  const activeReservation = useMemo(() => {
    if (!reservations) return null;
    return reservations.find(r => {
      if (r.status !== 'pending') return false;
      const expires = new Date(r.createdAt).getTime() + HOLD_MS;
      return Date.now() < expires;
    }) ?? null;
  }, [reservations]);
  const { city: userCity, loading: geoLoading, denied: geoDenied, retry: retryGeo } = useUserCity();
  const { coords: userCoords } = useUserLocation();

  useEffect(() => {
    if (authLoading) return;
    if (user && profile?.role === 'store_owner') { navigate('/store/dashboard', { replace: true }); return; }
  }, [authLoading, user, profile, navigate]);

  useEffect(() => {
    if (showSearch) { setTimeout(() => searchRef.current?.focus(), 80); }
    else { setSearchQuery(''); }
  }, [showSearch]);

  // 絞り込みモード: 検索・カテゴリが変わった時のみ（ソートはセクション構造を崩さない）
  const isFiltering = searchQuery.trim() !== '' || activeCategory !== 'all';

  const allBags = bags || [];

  // 在庫フィルターを適用したベースバッグ
  const visibleBags = useMemo(
    () => inStockOnly ? allBags.filter(b => b.stockCount > 0) : allBags,
    [allBags, inStockOnly]
  );

  // ソート関数（各セクション・縦リスト共通）
  const applySortKey = useCallback((arr: SurpriseBagWithStore[]) => {
    if (sortKey === 'time_asc')   return [...arr].sort((a, b) => (a.pickupStart || '').localeCompare(b.pickupStart || ''));
    if (sortKey === 'price_asc')  return [...arr].sort((a, b) => a.discountedPrice - b.discountedPrice);
    if (sortKey === 'price_desc') return [...arr].sort((a, b) => b.discountedPrice - a.discountedPrice);
    return arr;
  }, [sortKey]);

  // ソート済みベース（セクション・全体グリッド共通で使う）
  const sortedVisibleBags = useMemo(() => applySortKey(visibleBags), [visibleBags, applySortKey]);

  // 絞り込み結果（縦リストモード専用 — 検索/カテゴリフィルター + ソート）
  const filteredBags = useMemo(() => {
    let result = visibleBags;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(b =>
        b.title.toLowerCase().includes(q) ||
        b.store.name.toLowerCase().includes(q) ||
        b.store.city?.toLowerCase().includes(q)
      );
    }
    if (activeCategory !== 'all') result = result.filter(b => b.category === activeCategory);
    return applySortKey(result);
  }, [visibleBags, searchQuery, activeCategory, applySortKey]);

  // ── ① もうすぐ終わるおすそわけ ──
  const urgentBags = useMemo(
    () => applySortKey(sortedVisibleBags.filter(b => b.stockCount > 0 && b.stockCount < 5)).slice(0, 8),
    [sortedVisibleBags, applySortKey]
  );

  // ── ② 今日のおすすめ ──
  const recommendedBags = useMemo(
    () => applySortKey(sortedVisibleBags.filter(b => b.stockCount > 0)).slice(0, 8),
    [sortedVisibleBags, applySortKey]
  );

  // ── ③ 現在地から近いお店 ── （距離順固定、ソート適用なし）
  const { nearbyBags, distMap } = useMemo(() => {
    if (!userCoords) return { nearbyBags: [], distMap: new Map<string, number>() };
    const map = new Map<string, number>();
    const withDist = visibleBags
      .filter(b => b.stockCount > 0 && b.store.lat != null && b.store.lng != null)
      .map(b => {
        const d = haversineMeters(userCoords.lat, userCoords.lng, b.store.lat!, b.store.lng!);
        map.set(b.id, d);
        return { bag: b, d };
      })
      .sort((a, b) => a.d - b.d)
      .slice(0, 8)
      .map(x => x.bag);
    return { nearbyBags: withDist, distMap: map };
  }, [visibleBags, userCoords]);

  // ── ④ 今夜の受け取り（17:00〜22:00） ──
  const eveningBags = useMemo(
    () => applySortKey(sortedVisibleBags.filter(b => {
      const start = b.pickupStart || '';
      const end   = b.pickupEnd   || '';
      if (!start) return false;
      return start <= '22:00' && (!end || end >= '17:00');
    })).slice(0, 8),
    [sortedVisibleBags, applySortKey]
  );

  // ── ⑤⑥⑦ カテゴリー別 ──
  const mealsBags      = useMemo(() => sortedVisibleBags.filter(b => b.category === 'meals').slice(0, 10),        [sortedVisibleBags]);
  const bakeryBags     = useMemo(() => sortedVisibleBags.filter(b => b.category === 'bakery_sweets').slice(0, 10), [sortedVisibleBags]);
  const ingredientBags = useMemo(() => sortedVisibleBags.filter(b => b.category === 'ingredients').slice(0, 10),  [sortedVisibleBags]);

  const activeFilterCnt = [activeCategory !== 'all', inStockOnly !== true].filter(Boolean).length;

  function clearAll() {
    setSearchQuery(''); setActiveCategory('all'); setInStockOnly(true); setSortKey('default'); setShowSearch(false);
  }

  const dismissKeyboard = useCallback(() => {
    searchRef.current?.blur();
    setShowSort(false);
  }, []);

  const currentSortLabel = SORT_OPTIONS.find(o => o.value === sortKey)?.label || 'おすすめ順';

  if (authLoading) return null;

  const areaTitle = geoLoading
    ? '現在地を確認中...'
    : userCity
      ? `${userCity}のおすそわけ`
      : geoDenied ? '全国の注目おすそわけ' : (appSettings.catchphrase || 'あなたの街のおすそわけ');

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100dvh-64px)] overflow-hidden">

        {/* ── Sticky ヘッダー ── */}
        <div className="shrink-0 bg-background border-b border-border/50 z-20 shadow-sm">

          {/* Row 1: エリア名 ←→ 検索アイコン */}
          <div className="flex items-center gap-2 px-4 h-11">
            <AnimatePresence mode="wait">
              {!showSearch ? (
                <motion.div key="area" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-1.5 flex-1 min-w-0">
                  {geoLoading
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin text-primary shrink-0" />
                    : geoDenied
                      ? <Globe className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                      : <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                  }
                  <span className="text-sm font-black text-foreground truncate">{areaTitle}</span>
                </motion.div>
              ) : (
                <motion.div key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                  <input
                    ref={searchRef} type="search" inputMode="search"
                    value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                    placeholder="お店・エリアで検索..."
                    className="w-full bg-secondary/60 border border-border text-foreground rounded-xl pl-8 pr-8 py-1.5 outline-none text-sm
                      focus:bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
                    style={{ fontSize: '16px' }}
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-muted-foreground/20 flex items-center justify-center">
                      <X className="w-2.5 h-2.5 text-muted-foreground" />
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {!showSearch ? (
              <button onClick={() => setShowSearch(true)}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-secondary/60 border border-border hover:bg-secondary tap-scale shrink-0"
                aria-label="検索">
                <Search className="w-4 h-4 text-foreground" />
              </button>
            ) : (
              <button onClick={() => { setShowSearch(false); setSearchQuery(''); }}
                className="flex items-center gap-1 text-xs font-bold text-muted-foreground tap-scale shrink-0 ml-1">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>戻る</span>
              </button>
            )}

            {isApprovedOwner && (
              <Link href="/store-dashboard" className="hidden md:block">
                <button className="flex items-center gap-1.5 bg-primary text-primary-foreground font-bold px-3 py-1.5 rounded-xl text-xs hover:bg-primary/90 tap-scale shadow-sm shrink-0">
                  <Store className="w-3.5 h-3.5" />ダッシュボード
                </button>
              </Link>
            )}
          </div>

          {/* Row 2: カテゴリーピル */}
          <CategoryPills activeCategory={activeCategory} onSelect={setActiveCategory} />

          {/* Row 3: フィルターバー */}
          <div className="flex items-center px-4 pb-2 gap-2">
            {/* 受付中のみトグル */}
            <button
              onClick={() => setInStockOnly(v => !v)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border tap-scale transition-colors shrink-0 ${
                inStockOnly
                  ? 'bg-primary/10 text-primary border-primary/30'
                  : 'bg-card text-muted-foreground border-border'
              }`}
            >
              <span className={`w-5 h-3 rounded-full flex items-center transition-colors ${inStockOnly ? 'bg-primary' : 'bg-muted'}`}>
                <span className={`w-2 h-2 bg-white rounded-full shadow transition-transform mx-0.5 ${inStockOnly ? 'translate-x-2.5' : 'translate-x-0'}`} />
              </span>
              受付中のみ
            </button>

            {/* 並び替え */}
            <div className="relative">
              <button
                onClick={() => setShowSort(v => !v)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border tap-scale transition-colors ${
                  sortKey !== 'default' ? 'bg-primary/10 text-primary border-primary/30' : 'bg-card text-muted-foreground border-border'
                }`}
              >
                <SlidersHorizontal className="w-3 h-3" />
                {currentSortLabel}
                <ChevronDown className={`w-3 h-3 transition-transform ${showSort ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {showSort && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.95 }} transition={{ duration: 0.13 }}
                    className="absolute top-full mt-1.5 left-0 z-50 bg-card border border-border rounded-2xl shadow-xl overflow-hidden min-w-[148px]"
                  >
                    {SORT_OPTIONS.map(opt => (
                      <button key={opt.value} onClick={() => { setSortKey(opt.value); setShowSort(false); }}
                        className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors hover:bg-secondary tap-opacity
                          ${sortKey === opt.value ? 'text-primary bg-primary/5' : 'text-foreground'}`}>
                        {sortKey === opt.value && <span className="mr-1">✓</span>}{opt.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex-1" />
            {isFiltering && <span className="text-xs text-muted-foreground font-medium">{filteredBags.length}件</span>}
            {(isFiltering || !inStockOnly || sortKey !== 'default') && (
              <motion.button onClick={clearAll} whileTap={{ scale: 0.92 }}
                className="flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold bg-destructive/8 text-destructive border border-destructive/20">
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
          {/* ── お知らせバナー ── */}
          <AnimatePresence>
            {announcement && !annDismissed && (
              <motion.div key="announcement-banner"
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="mx-3 mt-3 rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-start gap-3">
                <Megaphone className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-amber-800 leading-tight">{announcement.title}</p>
                  <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed line-clamp-2">{announcement.body}</p>
                </div>
                <button
                  onClick={() => {
                    sessionStorage.setItem(`ann_dismissed_${announcement.id}`, '1');
                    setAnnDismissed(true);
                  }}
                  className="shrink-0 p-1 rounded-full hover:bg-amber-100 transition-colors">
                  <X className="w-3.5 h-3.5 text-amber-500" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── 仮押さえ中バナー ── */}
          <AnimatePresence>
            {activeReservation && (
              <motion.button
                key="hold-banner"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                onClick={() => navigate(`/checkout/${activeReservation.id}`)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-primary text-primary-foreground text-left"
              >
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold opacity-90">仮押さえ中</p>
                  <p className="text-sm font-black truncate">
                    {activeReservation.bag?.title ?? 'おすそわけバッグ'}
                  </p>
                </div>
                <div className="text-xs font-bold opacity-80 shrink-0">決済へ →</div>
              </motion.button>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">

            {/* ─── 絞り込みモード ─── */}
            {isFiltering ? (
              <motion.div key="filtered"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="px-4 pt-3 pb-6"
              >
                {isLoadingBags ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map(i => <BagCardSkeleton key={i} />)}
                  </div>
                ) : filteredBags.length > 0 ? (
                  <motion.div
                    key={`${activeCategory}-${searchQuery}`}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18 }}
                  >
                    {filteredBags.map((bag, i) => (
                      <motion.div key={bag.id}
                        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: i * 0.04 }}>
                        <BagCard bag={bag} />
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="flex flex-col items-center text-center px-6 py-8">
                      <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-amber-100 rounded-2xl flex items-center justify-center mb-3">
                        <PackageOpen className="w-8 h-8 text-primary/60" />
                      </div>
                      <h3 className="text-base font-black text-foreground mb-1">
                        {activeCategory !== 'all'
                          ? `「${SCROLL_CATS.find(c => c.value === activeCategory)?.label}」のおすそわけはまだありません`
                          : '条件に合うおすそわけが見つかりませんでした'
                        }
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-4">ジャンルや条件を変えて探してみてください</p>
                      <motion.button onClick={clearAll} whileTap={{ scale: 0.94 }}
                        className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-2xl text-sm font-bold shadow-md shadow-primary/20">
                        <X className="w-3.5 h-3.5" />条件をリセット
                      </motion.button>
                    </div>
                    {visibleBags.length > 0 && (
                      <div className="mt-1 pb-2">
                        <div className="flex items-center gap-2 mb-3 px-4">
                          <div className="flex-1 h-px bg-border/60" />
                          <span className="text-[11px] font-black text-muted-foreground px-1">✨ 代わりにこちらはいかがですか？</span>
                          <div className="flex-1 h-px bg-border/60" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-4">
                          {visibleBags.slice(0, 3).map(bag => <BagCard key={bag.id} bag={bag} />)}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>

            ) : (
              /* ─── 通常ホーム（7セクション） ─── */
              <motion.div key="home"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="pb-6"
              >
                {/* 全国モードバナー */}
                {!geoLoading && geoDenied && <NationwideBanner onAllow={retryGeo} />}

                {/* ① もうすぐ終わるおすそわけ */}
                {(isLoadingBags || urgentBags.length > 0) && (
                  <div className="pt-3 pb-2">
                    <SectionHeader
                      icon={<Flame className="w-3.5 h-3.5 text-orange-500 shrink-0" />}
                      title="もうすぐ終わるおすそわけ"
                      count={!isLoadingBags ? urgentBags.length : undefined}
                    />
                    <HorizScrollRow bags={urgentBags} loading={isLoadingBags} />
                  </div>
                )}

                {/* ② 今日のおすすめ */}
                {(isLoadingBags || recommendedBags.length > 0) && (
                  <div className="pt-1 pb-2">
                    <SectionHeader
                      icon={<Zap className="w-3.5 h-3.5 text-primary shrink-0" />}
                      title="今日のおすすめ"
                      count={!isLoadingBags ? recommendedBags.length : undefined}
                    />
                    <HorizScrollRow bags={recommendedBags} loading={isLoadingBags} />
                  </div>
                )}

                {/* ③ 現在地から近いお店 */}
                {userCoords && nearbyBags.length > 0 && (
                  <div className="pt-1 pb-2">
                    <SectionHeader
                      icon={<Navigation2 className="w-3.5 h-3.5 text-sky-500 shrink-0" />}
                      title="現在地から近いお店"
                      count={nearbyBags.length}
                    />
                    <HorizScrollRow bags={nearbyBags} loading={false} distMap={distMap} />
                  </div>
                )}

                {/* ④ 今夜の受け取り */}
                {eveningBags.length > 0 && (
                  <div className="pt-1 pb-2">
                    <SectionHeader
                      icon={<Moon className="w-3.5 h-3.5 text-indigo-500 shrink-0" />}
                      title="今夜の受け取り（17〜22時）"
                      count={eveningBags.length}
                    />
                    <HorizScrollRow bags={eveningBags} loading={false} />
                  </div>
                )}

                {/* ⑤ 料理・お惣菜 */}
                {mealsBags.length > 0 && (
                  <div className="pt-1 pb-2">
                    <SectionHeader
                      icon={<span className="text-sm leading-none">🍱</span>}
                      title="料理・お惣菜"
                      count={mealsBags.length}
                    />
                    <HorizScrollRow bags={mealsBags} loading={false} />
                  </div>
                )}

                {/* ⑥ パン・スイーツ */}
                {bakeryBags.length > 0 && (
                  <div className="pt-1 pb-2">
                    <SectionHeader
                      icon={<span className="text-sm leading-none">🥐</span>}
                      title="パン・スイーツ"
                      count={bakeryBags.length}
                    />
                    <HorizScrollRow bags={bakeryBags} loading={false} />
                  </div>
                )}

                {/* ⑦ 食材・その他 */}
                {ingredientBags.length > 0 && (
                  <div className="pt-1 pb-2">
                    <SectionHeader
                      icon={<span className="text-sm leading-none">🍎</span>}
                      title="食材・その他"
                      count={ingredientBags.length}
                    />
                    <HorizScrollRow bags={ingredientBags} loading={false} />
                  </div>
                )}

                {/* 区切り & すべてのおすそわけ */}
                {!isLoadingBags && (
                  <>
                    <div className="mx-4 mt-2 mb-0 border-t border-border/40" />
                    <div className="flex items-center gap-2 px-4 pt-3 pb-1.5">
                      <span className="text-[13px] font-black text-foreground">すべてのおすそわけ</span>
                      <span className="text-[10px] text-muted-foreground">{sortedVisibleBags.length}件</span>
                      {sortKey !== 'default' && (
                        <span className="text-[10px] text-primary font-bold bg-primary/10 px-1.5 py-0.5 rounded-full">
                          {SORT_OPTIONS.find(o => o.value === sortKey)?.label}
                        </span>
                      )}
                    </div>
                  </>
                )}

                {/* バッググリッド */}
                <div className="px-4">
                  {isLoadingBags ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[1, 2, 3, 4].map(i => <BagCardSkeleton key={i} />)}
                    </div>
                  ) : sortedVisibleBags.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                      <motion.div
                        initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 200 }}
                        className="w-20 h-20 bg-gradient-to-br from-primary/15 to-amber-200/40 rounded-3xl flex items-center justify-center mb-4"
                      >
                        <span className="text-4xl select-none">{geoDenied ? '🗾' : '🎁'}</span>
                      </motion.div>
                      <h3 className="text-base font-black text-foreground mb-1.5">
                        {inStockOnly ? '現在受付中のおすそわけはありません' : '今日のおすそわけを準備中'}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                        {inStockOnly
                          ? '「受付中のみ」をOFFにすると全商品を確認できます'
                          : 'お近くのお店がおすそわけを準備中です！'
                        }
                      </p>
                      {inStockOnly && (
                        <button onClick={() => setInStockOnly(false)}
                          className="px-5 py-2 bg-secondary text-foreground rounded-2xl text-sm font-bold border border-border">
                          すべて表示する
                        </button>
                      )}
                    </div>
                  ) : (
                    <motion.div
                      className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                      initial="hidden" animate="show"
                      variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } }}
                    >
                      {sortedVisibleBags.map(bag => (
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

      <FloatingMapButton />
    </Layout>
  );
}
