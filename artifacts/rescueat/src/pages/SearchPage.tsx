import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { MapView, MapBounds } from '@/components/Map';
import { BagCard, BagCardSkeleton } from '@/components/BagCard';
import { useListAllBags, useListStores, Store, SurpriseBagWithStore } from '@workspace/api-client-react';
import {
  Search, Map as MapIcon, List, X, ChevronDown,
  ArrowUpDown, MapPin, Clock, Package, ChevronRight, ShoppingBag, Navigation2,
  Croissant, Utensils, Coffee, ShoppingCart, Store as StoreIcon,
  Candy, Wheat, Sparkles, History, RefreshCw, Loader2, PackageOpen, Navigation,
  RotateCcw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'wouter';
import { getCategoryIcon, getCategoryImage } from '@/lib/category-utils';
import { useUserLocation, haversineMeters, metersToWalkMinutes, formatWalkTime } from '@/hooks/use-user-location';

// ─── 距離計算 ─────────────────────────────────────────────────────────────────
function calcDistanceM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (d: number) => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(m: number): string {
  if (m < 50)   return 'すぐそこ';
  if (m < 1000) return `${Math.round(m / 10) * 10}m`;
  return `${(m / 1000).toFixed(1)}km`;
}

type ViewMode = 'list' | 'map';
type SortKey  = 'default' | 'distance' | 'price_asc' | 'price_desc' | 'stock_desc';

// ─── カテゴリー ───────────────────────────────────────────────────────────────
const CATEGORIES = [
  { label: 'すべて',       value: '',            icon: <Sparkles     className="w-4 h-4" /> },
  { label: 'パン',         value: 'bakery',       icon: <Croissant    className="w-4 h-4" /> },
  { label: 'お弁当・惣菜', value: 'restaurant',   icon: <Utensils     className="w-4 h-4" /> },
  { label: 'カフェ',       value: 'cafe',         icon: <Coffee       className="w-4 h-4" /> },
  { label: 'スーパー',     value: 'supermarket',  icon: <ShoppingCart className="w-4 h-4" /> },
  { label: 'コンビニ',     value: 'convenience',  icon: <StoreIcon    className="w-4 h-4" /> },
  { label: 'スイーツ',     value: 'sweets',       icon: <Candy        className="w-4 h-4" /> },
  { label: 'その他',       value: 'other',        icon: <Wheat        className="w-4 h-4" /> },
] as const;

const SORT_OPTIONS: { label: string; value: SortKey; needsLocation?: boolean }[] = [
  { label: '近い順',       value: 'distance',   needsLocation: true },
  { label: 'おすすめ順',   value: 'default'    },
  { label: '価格が安い順', value: 'price_asc'  },
  { label: '価格が高い順', value: 'price_desc' },
  { label: '在庫が多い順', value: 'stock_desc' },
];

// ─── 検索履歴 ─────────────────────────────────────────────────────────────────
const HISTORY_KEY = 'tabe_search_history';
const MAX_HISTORY = 6;
function loadHistory(): string[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; }
}
function saveHistory(q: string, prev: string[]): string[] {
  const next = [q, ...prev.filter(h => h !== q)].slice(0, MAX_HISTORY);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  return next;
}
function clearHistory() { localStorage.removeItem(HISTORY_KEY); }

// ─── 徒歩時間バッジ（リスト内埋め込み用）─────────────────────────────────────
function InlineWalkBadge({ storeLat, storeLng, prominent = false }: { storeLat: number; storeLng: number; prominent?: boolean }) {
  const { coords } = useUserLocation();
  if (!coords) return null;
  const meters  = haversineMeters(coords.lat, coords.lng, storeLat, storeLng);
  const minutes = metersToWalkMinutes(meters);
  const label   = formatWalkTime(minutes);
  const isClose = minutes <= 5;
  const isMid   = minutes <= 15;

  if (prominent) {
    return (
      <span className={`inline-flex items-center gap-1 font-black px-2.5 py-1 rounded-full text-xs
        ${isClose ? 'bg-green-100 text-green-700 border border-green-200'
          : isMid ? 'bg-orange-100 text-orange-600 border border-orange-200'
          : 'bg-sky-100 text-sky-700 border border-sky-200'}`}>
        <Navigation className="w-3 h-3 shrink-0" />
        徒歩{label}
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-black
      ${isClose ? 'text-green-600' : isMid ? 'text-orange-500' : 'text-sky-500'}`}>
      <Navigation className="w-2.5 h-2.5 shrink-0" />{label}
    </span>
  );
}

// ─── 店舗詳細ボトムシート ─────────────────────────────────────────────────────
function StoreBottomSheet({
  store, bags, userPos, onClose,
}: {
  store: Store; bags: SurpriseBagWithStore[];
  userPos: { lat: number; lng: number } | null; onClose: () => void;
}) {
  const storeBags = bags.filter(b => b.store.id === store.id);
  const hasBags   = storeBags.length > 0;
  const bagCount  = store.totalBagsAvailable ?? storeBags.filter(b => b.stockCount > 0).length;

  const distanceLabel = useMemo(() => {
    if (!userPos || !store.latitude || !store.longitude) return null;
    const m = calcDistanceM(userPos.lat, userPos.lng, Number(store.latitude), Number(store.longitude));
    return formatDistance(m);
  }, [userPos, store.latitude, store.longitude]);

  const walkLabel = useMemo(() => {
    if (!userPos || !store.lat || !store.lng) return null;
    const m = haversineMeters(userPos.lat, userPos.lng, store.lat, store.lng);
    const mins = metersToWalkMinutes(m);
    return formatWalkTime(mins);
  }, [userPos, store.lat, store.lng]);

  return (
    <>
      <motion.div key="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }} className="absolute inset-0 z-30 bg-black/30 backdrop-blur-[1px]" onClick={onClose} />

      <motion.div key="sheet" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="absolute bottom-0 left-0 right-0 z-40 bg-background rounded-t-3xl shadow-2xl overflow-hidden"
        style={{ maxHeight: 'calc(75vh)' }}>

        <div className="flex justify-center pt-3 pb-1" onClick={onClose}>
          <div className="w-10 h-1.5 bg-border rounded-full" />
        </div>

        <div className="overflow-y-auto scroll-smooth-native" style={{ maxHeight: 'calc(75vh - 28px)' }}>
          <div className="relative h-32 mx-4 mt-1 mb-3 rounded-2xl overflow-hidden bg-muted shrink-0">
            <img src={store.imageUrl || getCategoryImage(store.category)} alt={store.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <button onClick={onClose}
              className="absolute top-2.5 right-2.5 w-8 h-8 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center tap-scale">
              <X className="w-4 h-4 text-white" />
            </button>
            <div className="absolute bottom-3 left-3 right-10">
              <p className="text-white/70 text-xs mb-0.5">{getCategoryIcon(store.category)} {store.category ?? 'その他'}</p>
              <h2 className="text-white font-black text-lg leading-tight line-clamp-1">{store.name}</h2>
            </div>
          </div>

          <div className="px-4 space-y-2 mb-3">
            <div className="flex items-start gap-2 flex-wrap">
              <div className="flex items-start gap-1.5 flex-1 min-w-0">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <span className="text-xs text-muted-foreground leading-relaxed">{store.address || '住所未設定'}</span>
              </div>
              {/* 距離 + 徒歩時間 */}
              <div className="flex items-center gap-1.5 shrink-0">
                {distanceLabel && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                    <Navigation2 className="w-2.5 h-2.5" />{distanceLabel}
                  </span>
                )}
                {walkLabel && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-black text-sky-600 bg-sky-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                    <Navigation className="w-2.5 h-2.5" />徒歩{walkLabel}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {hasBags ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black text-white"
                  style={{ background: 'linear-gradient(135deg,#4AAF96,#1E3F38)' }}>
                  <ShoppingBag className="w-3.5 h-3.5" />出品中 · {bagCount}個あり
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-muted-foreground rounded-full text-xs font-bold">
                  😴 現在出品なし
                </span>
              )}
            </div>
          </div>

          <div className="px-4 pb-8">
            {hasBags ? (
              <>
                <h3 className="text-sm font-black text-foreground mb-3 flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-primary" />出品中のバッグ
                </h3>
                <div className="space-y-3">
                  {storeBags.map(bag => {
                    const isSoldOut   = bag.stockCount <= 0;
                    const discountPct = Math.round((1 - bag.discountedPrice / bag.originalPrice) * 100);
                    const isLowStock  = bag.stockCount > 0 && bag.stockCount < 3;
                    return (
                      <div key={bag.id}
                        className={`flex gap-3 bg-card border rounded-2xl overflow-hidden transition-all
                          ${isSoldOut ? 'opacity-60 border-border' : 'border-primary/20 shadow-sm'}`}>
                        <div className="relative w-24 h-24 shrink-0 bg-muted">
                          <img src={bag.store.imageUrl || getCategoryImage(bag.store.category)} alt={bag.title} className="w-full h-full object-cover" />
                          {!isSoldOut && (
                            <span className="absolute top-1.5 left-1.5 bg-accent text-accent-foreground text-[10px] font-black px-1.5 py-0.5 rounded-md">
                              {discountPct}% OFF
                            </span>
                          )}
                          {isSoldOut && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><span className="text-white text-[10px] font-black">完売</span></div>}
                        </div>
                        <div className="flex-1 py-2.5 pr-2 min-w-0">
                          <p className="font-black text-sm text-foreground leading-tight line-clamp-1 mb-1">{bag.title}</p>
                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-1.5">
                            <Clock className="w-3 h-3 shrink-0" /><span>受取 {bag.pickupStart}–{bag.pickupEnd}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-[10px] text-muted-foreground line-through mr-1">¥{bag.originalPrice.toLocaleString()}</span>
                              <span className="text-base font-black text-primary">¥{bag.discountedPrice.toLocaleString()}</span>
                              {isSoldOut
                                ? <span className="text-[10px] text-muted-foreground font-bold ml-1">完売</span>
                                : isLowStock
                                  ? <span className="text-[10px] text-amber-600 font-black animate-pulse ml-1">残り{bag.stockCount}個！</span>
                                  : <span className="text-[10px] text-muted-foreground font-bold ml-1">残り{bag.stockCount}個</span>
                              }
                            </div>
                            {!isSoldOut ? (
                              <Link href={`/bags/${bag.id}`}>
                                <button className="flex items-center gap-1 bg-primary text-primary-foreground text-[11px] font-black px-3 py-1.5 rounded-xl tap-scale shadow-sm shadow-primary/20">
                                  おすそ分け <ChevronRight className="w-3 h-3" />
                                </button>
                              </Link>
                            ) : (
                              <span className="text-[11px] text-muted-foreground font-bold px-2 py-1 bg-secondary rounded-xl">完売御礼</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="text-center py-8 bg-secondary/50 rounded-2xl border border-dashed border-border">
                <ShoppingBag className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm font-bold text-foreground">現在出品中のバッグはありません</p>
                <p className="text-xs text-muted-foreground mt-1">また後でチェックしてみてください</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
}

// ─── ゼロ件ステート ────────────────────────────────────────────────────────────
function ZeroResultsState({ query, category, onClear, recommendBags }: {
  query: string; category: string; onClear: () => void; recommendBags: SurpriseBagWithStore[];
}) {
  const catLabel = CATEGORIES.find(c => c.value === category)?.label;

  const title = catLabel && !query
    ? `「${catLabel}」のおすそ分けはまだありません`
    : query
      ? `「${query}」は見つかりませんでした`
      : '条件に合うおすそ分けがありませんでした';

  const subtitle = catLabel && !query
    ? 'お店が準備中です。代わりにこちらはいかがですか？🌸'
    : 'スペルや条件を変えて探してみましょう 🔍';

  return (
    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
      <div className="flex flex-col items-center text-center px-6 py-10">
        <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-amber-100 rounded-3xl flex items-center justify-center mb-4 shadow-sm border border-orange-200/60">
          <PackageOpen className="w-9 h-9 text-primary/60" />
        </div>
        <h3 className="text-lg font-black text-foreground mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed mb-6">{subtitle}</p>
        <button onClick={onClear}
          className="flex items-center gap-2 bg-primary text-primary-foreground font-black px-6 py-3 rounded-2xl shadow-md shadow-primary/20 tap-scale">
          <RefreshCw className="w-4 h-4" />全商品を表示する
        </button>
      </div>
      {recommendBags.length > 0 && (
        <div className="mt-2 px-4 pb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex-1 h-px bg-border" />
            <div className="flex items-center gap-1.5 text-xs font-black text-muted-foreground px-3">
              <Sparkles className="w-3.5 h-3.5 text-primary" />代わりにこちらはいかがですか？
            </div>
            <div className="flex-1 h-px bg-border" />
          </div>
          <motion.div className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            initial="hidden" animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}>
            {recommendBags.map(bag => (
              <motion.div key={bag.id} variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
                <BagCard bag={bag} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

// ─── セグメントコントロール ────────────────────────────────────────────────────
function SegmentControl({ view, onChange }: { view: ViewMode; onChange: (v: ViewMode) => void }) {
  return (
    <div className="flex items-center bg-secondary rounded-2xl p-1 gap-1">
      {([
        { value: 'list' as const, icon: <List className="w-3.5 h-3.5" />,    label: 'リスト' },
        { value: 'map'  as const, icon: <MapIcon className="w-3.5 h-3.5" />, label: '地図'   },
      ]).map(tab => (
        <button key={tab.value} onClick={() => onChange(tab.value)}
          className={`relative flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-black transition-all tap-scale
            ${view === tab.value
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
            }`}>
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// ─── メインページ ─────────────────────────────────────────────────────────────
export default function SearchPage() {
  const [inputValue,    setInputValue]    = useState('');
  const [query,         setQuery]         = useState('');
  const [view,          setView]          = useState<ViewMode>('list');
  const [category,      setCategory]      = useState('');
  const [sort,          setSort]          = useState<SortKey>('default');
  const [inStockOnly,   setInStockOnly]   = useState(false);
  const [showSort,      setShowSort]      = useState(false);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [userPos,       setUserPos]       = useState<{ lat: number; lng: number } | null>(null);
  const [isSearching,   setIsSearching]   = useState(false);
  const [showHistory,   setShowHistory]   = useState(false);
  const [history,       setHistory]       = useState<string[]>(loadHistory);

  // エリア再検索
  const [mapBounds,           setMapBounds]           = useState<MapBounds | null>(null);
  const [pendingBounds,       setPendingBounds]       = useState<MapBounds | null>(null);
  const [showReSearchButton,  setShowReSearchButton]  = useState(false);
  const [areaSearchActive,    setAreaSearchActive]    = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);
  const { coords: locCoords } = useUserLocation();

  const handleUserPositionChange = useCallback((pos: { lat: number; lng: number } | null) => {
    setUserPos(pos);
  }, []);

  // 地図が静止したら「このエリアで再検索」ボタンを表示
  const handleMapIdle = useCallback((bounds: MapBounds) => {
    setPendingBounds(bounds);
    setShowReSearchButton(true);
  }, []);

  // エリア再検索実行
  function applyAreaSearch() {
    if (!pendingBounds) return;
    setMapBounds(pendingBounds);
    setAreaSearchActive(true);
    setShowReSearchButton(false);
    setSelectedStore(null);
  }

  // エリア検索解除
  function clearAreaSearch() {
    setMapBounds(null);
    setAreaSearchActive(false);
    setShowReSearchButton(false);
    setPendingBounds(null);
  }

  const { data: bags, isLoading: bagsLoading } = useListAllBags();
  const { data: stores } = useListStores();

  // 検索実行（キーボードを閉じる + ローダー演出）
  const executeSearch = useCallback((q: string) => {
    const trimmed = q.trim();
    searchRef.current?.blur();
    setShowHistory(false);
    setShowSort(false);
    if (trimmed) {
      setIsSearching(true);
      setTimeout(() => {
        setQuery(trimmed);
        setIsSearching(false);
        setHistory(prev => saveHistory(trimmed, prev));
      }, 380);
    } else {
      setQuery('');
    }
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') executeSearch(inputValue);
    if (e.key === 'Escape') { searchRef.current?.blur(); setShowHistory(false); }
  }, [inputValue, executeSearch]);

  const handleHistorySelect = (h: string) => { setInputValue(h); setShowHistory(false); executeSearch(h); };
  const handleDeleteHistory  = (h: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = history.filter(i => i !== h);
    setHistory(next);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  };

  const liveQuery = query || inputValue.trim();

  const filteredBags = useMemo(() => {
    let result = bags || [];

    // テキスト検索
    if (liveQuery) {
      const q = liveQuery.toLowerCase();
      result = result.filter(b =>
        b.title.toLowerCase().includes(q) ||
        b.store.name.toLowerCase().includes(q) ||
        b.store.city?.toLowerCase().includes(q) ||
        b.store.category?.toLowerCase().includes(q)
      );
    }

    // カテゴリー
    if (category) result = result.filter(b => b.store.category === category);

    // 在庫あり
    if (inStockOnly) result = result.filter(b => b.stockCount > 0);

    // エリア絞り込み（マップ連動）
    if (areaSearchActive && mapBounds) {
      result = result.filter(b => {
        const lat = b.store.lat ?? b.store.latitude;
        const lng = b.store.lng ?? b.store.longitude;
        if (!lat || !lng) return false;
        const latN = Number(lat);
        const lngN = Number(lng);
        return latN >= mapBounds.south && latN <= mapBounds.north &&
               lngN >= mapBounds.west  && lngN <= mapBounds.east;
      });
    }

    // ソート
    if (sort === 'distance' && locCoords) {
      result = [...result].sort((a, b) => {
        const aLat = a.store.lat ?? Number(a.store.latitude);
        const aLng = a.store.lng ?? Number(a.store.longitude);
        const bLat = b.store.lat ?? Number(b.store.latitude);
        const bLng = b.store.lng ?? Number(b.store.longitude);
        const dA = haversineMeters(locCoords.lat, locCoords.lng, aLat, aLng);
        const dB = haversineMeters(locCoords.lat, locCoords.lng, bLat, bLng);
        return dA - dB;
      });
    } else if (sort === 'price_asc')  { result = [...result].sort((a, b) => a.discountedPrice - b.discountedPrice); }
    else if (sort === 'price_desc') { result = [...result].sort((a, b) => b.discountedPrice - a.discountedPrice); }
    else if (sort === 'stock_desc') { result = [...result].sort((a, b) => b.stockCount - a.stockCount); }

    return result;
  }, [bags, liveQuery, category, sort, inStockOnly, areaSearchActive, mapBounds, locCoords]);

  const recommendBags  = useMemo(() => (bags || []).filter(b => b.stockCount > 0).slice(0, 3), [bags]);

  const filteredStoreIds = new Set(filteredBags.map(b => b.store.id));
  const displayStores    = (stores || [])
    .filter(s => (s as any).status === 'approved' || !(s as any).status)
    .filter(s => !liveQuery || filteredStoreIds.has(s.id));

  const isFiltering       = !!liveQuery || category !== '' || inStockOnly || sort !== 'default' || areaSearchActive;
  const activeFilterCount = [category !== '', inStockOnly, sort !== 'default'].filter(Boolean).length;
  const currentSortLabel  = SORT_OPTIONS.find(o => o.value === sort)?.label || 'おすすめ順';
  const hasLocation       = !!locCoords;

  function clearAllFilters() {
    setCategory(''); setInStockOnly(false); setSort('default');
    setQuery(''); setInputValue(''); clearAreaSearch();
  }

  const handleStoreSelect = useCallback((store: Store) => setSelectedStore(store), []);

  // ビュー切り替え時にシートを閉じる
  const handleViewChange = useCallback((v: ViewMode) => {
    setView(v);
    setSelectedStore(null);
    setShowSort(false);
    searchRef.current?.blur();
  }, []);

  return (
    <Layout hideFooter={view === 'map'}>
      <div className={`flex flex-col ${view === 'map' ? 'flex-1 min-h-0 h-full' : ''}`}>

        {/* ── Sticky フィルターバー（リスト/地図 共通）── */}
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border/50 px-4 pt-3 pb-2.5 space-y-2.5 shrink-0">

          {/* Row 1: セグメントコントロール */}
          <SegmentControl view={view} onChange={handleViewChange} />

          {/* Row 2: 検索ボックス */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              ref={searchRef}
              type="search"
              inputMode="search"
              className="w-full bg-card border border-border text-foreground rounded-2xl pl-11 pr-24 py-3 text-sm font-medium outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="エリア・お店・カテゴリで探す..."
              value={inputValue}
              style={{ fontSize: '16px' }}
              onChange={e => { setInputValue(e.target.value); setShowHistory(true); }}
              onFocus={() => history.length > 0 && setShowHistory(true)}
              onBlur={() => setTimeout(() => setShowHistory(false), 150)}
              onKeyDown={handleKeyDown}
              onFocusCapture={e => { e.currentTarget.style.boxShadow = '0 0 0 4px rgba(255,140,0,0.13)'; }}
              onBlurCapture={e => { e.currentTarget.style.boxShadow = ''; }}
            />
            {inputValue && (
              <button
                onMouseDown={e => e.preventDefault()}
                onClick={() => { setInputValue(''); setQuery(''); }}
                className="absolute right-[72px] top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-muted-foreground/20 flex items-center justify-center tap-scale-sm">
                <X className="w-3 h-3 text-muted-foreground" />
              </button>
            )}
            {/* 検索ボタン */}
            <button onClick={() => executeSearch(inputValue)} disabled={isSearching}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-primary text-primary-foreground text-xs font-black px-3 py-1.5 rounded-xl tap-scale shadow-sm shadow-primary/20">
              {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Search className="w-3.5 h-3.5" /><span>検索</span></>}
            </button>

            {/* 検索履歴ドロップダウン */}
            <AnimatePresence>
              {showHistory && history.length > 0 && (
                <motion.div initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }} transition={{ duration: 0.13 }}
                  className="absolute top-full mt-1.5 left-0 right-0 z-50 bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50">
                    <div className="flex items-center gap-1.5 text-xs font-black text-muted-foreground">
                      <History className="w-3.5 h-3.5" />最近の検索
                    </div>
                    <button onMouseDown={e => e.preventDefault()}
                      onClick={() => { clearHistory(); setHistory([]); setShowHistory(false); }}
                      className="text-[10px] text-muted-foreground hover:text-destructive font-bold transition-colors">
                      全て消去
                    </button>
                  </div>
                  {history.map(h => (
                    <div key={h} onMouseDown={e => e.preventDefault()} onClick={() => handleHistorySelect(h)}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-secondary cursor-pointer group tap-opacity border-b border-border/30 last:border-0 transition-colors">
                      <History className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
                      <span className="flex-1 text-sm font-medium text-foreground truncate">{h}</span>
                      <button onClick={e => handleDeleteHistory(h, e)}
                        className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive transition-all">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Row 3: カテゴリーチップ（リストのみ）*/}
          {view === 'list' && (
            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-0.5">
              {CATEGORIES.map(cat => (
                <button key={cat.value} onClick={() => { setCategory(cat.value); searchRef.current?.blur(); }}
                  className={`whitespace-nowrap flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 border tap-scale
                    ${category === cat.value
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-card text-foreground border-border hover:border-primary/50'
                    }`}>
                  {cat.icon}<span>{cat.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Row 4: ソート＋フィルター（リストのみ）*/}
          {view === 'list' && (
            <div className="flex items-center gap-2">
              {/* 並び替え */}
              <div className="relative">
                <button onClick={() => setShowSort(v => !v)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all tap-scale
                    ${sort !== 'default' ? 'bg-primary/10 text-primary border-primary/30' : 'bg-card text-foreground border-border'}`}>
                  <ArrowUpDown className="w-3.5 h-3.5" />{currentSortLabel}
                  <ChevronDown className={`w-3 h-3 transition-transform ${showSort ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {showSort && (
                    <motion.div initial={{ opacity: 0, y: -8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }} transition={{ duration: 0.13 }}
                      className="absolute top-full mt-1.5 left-0 z-50 bg-card border border-border rounded-2xl shadow-xl overflow-hidden min-w-[160px]">
                      {SORT_OPTIONS.map(opt => {
                        const disabled = opt.needsLocation && !hasLocation;
                        return (
                          <button key={opt.value}
                            onClick={() => { if (!disabled) { setSort(opt.value); setShowSort(false); } }}
                            disabled={disabled}
                            className={`w-full text-left px-4 py-3 text-xs font-bold transition-colors border-b border-border/30 last:border-0
                              ${sort === opt.value ? 'text-primary bg-primary/5' : disabled ? 'text-muted-foreground/40 cursor-not-allowed' : 'text-foreground hover:bg-secondary tap-opacity'}`}>
                            <span className="flex items-center gap-2">
                              {sort === opt.value && <span>✓</span>}
                              {opt.value === 'distance' && <Navigation className="w-3 h-3 text-primary" />}
                              {opt.label}
                              {disabled && <span className="text-[9px] text-muted-foreground/50 ml-auto">位置情報が必要</span>}
                            </span>
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 在庫あり */}
              <button onClick={() => setInStockOnly(v => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all tap-scale
                  ${inStockOnly ? 'bg-green-100 text-green-700 border-green-300' : 'bg-card text-foreground border-border'}`}>
                <span className={`w-2 h-2 rounded-full ${inStockOnly ? 'bg-green-500' : 'bg-muted-foreground/40'}`} />
                在庫あり
              </button>

              {/* エリア絞り込みバッジ */}
              <AnimatePresence>
                {areaSearchActive && (
                  <motion.button initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                    onClick={clearAreaSearch}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200 tap-scale">
                    <MapPin className="w-3 h-3" />エリア解除
                  </motion.button>
                )}
              </AnimatePresence>

              <div className="flex-1" />

              {/* 件数 + リセット */}
              <div className="flex items-center gap-2">
                {!bagsLoading && (
                  <span className="text-xs text-muted-foreground font-medium">
                    {isFiltering ? `${filteredBags.length}件` : `全${(bags || []).length}件`}
                  </span>
                )}
                {activeFilterCount > 0 && (
                  <button onClick={clearAllFilters}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-destructive/10 text-destructive border border-destructive/20 tap-scale">
                    <X className="w-3 h-3" />リセット
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── マップビュー ── */}
        {view === 'map' && (
          <div className="relative flex-1 min-h-0">

            {/* 「このエリアで再検索」ボタン */}
            <AnimatePresence>
              {showReSearchButton && (
                <motion.div
                  initial={{ opacity: 0, y: -12, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -12, scale: 0.9 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                  className="absolute top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-auto"
                >
                  <button
                    onClick={applyAreaSearch}
                    className="flex items-center gap-2 bg-white text-foreground font-black text-sm px-5 py-2.5 rounded-2xl shadow-xl border border-gray-200/80 tap-scale active:scale-95 whitespace-nowrap"
                  >
                    <RotateCcw className="w-4 h-4 text-primary" />
                    このエリアで再検索
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* エリア絞り込みアクティブバッジ */}
            <AnimatePresence>
              {areaSearchActive && !showReSearchButton && (
                <motion.div
                  initial={{ opacity: 0, y: -12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  className="absolute top-3 left-1/2 -translate-x-1/2 z-20"
                >
                  <button onClick={clearAreaSearch}
                    className="flex items-center gap-2 bg-blue-600 text-white font-black text-xs px-4 py-2 rounded-2xl shadow-lg tap-scale">
                    <MapPin className="w-3.5 h-3.5" />エリア検索中 · タップで解除
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 地図本体 */}
            <div className="absolute inset-0">
              <MapView
                stores={displayStores}
                onStoreSelect={handleStoreSelect}
                onUserPositionChange={handleUserPositionChange}
                onMapIdle={handleMapIdle}
              />
            </div>

            {/* 店舗詳細ボトムシート */}
            <AnimatePresence>
              {selectedStore && (
                <StoreBottomSheet
                  store={selectedStore}
                  bags={bags || []}
                  userPos={userPos}
                  onClose={() => setSelectedStore(null)}
                />
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ── リストビュー ── */}
        {view === 'list' && (
          <div className="max-w-4xl mx-auto w-full pb-6">

            {/* 近い順ヒント（位置情報あり + sortがdistanceでない時）*/}
            <AnimatePresence>
              {hasLocation && sort !== 'distance' && !liveQuery && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mx-4 mt-3 flex items-center gap-2 bg-sky-50 border border-sky-200 rounded-xl px-3.5 py-2.5">
                    <Navigation className="w-4 h-4 text-sky-500 shrink-0" />
                    <p className="text-xs text-sky-700 font-medium flex-1">現在地が取得できました</p>
                    <button onClick={() => setSort('distance')}
                      className="text-xs font-black text-sky-700 bg-sky-200 px-2.5 py-1 rounded-lg tap-scale whitespace-nowrap">
                      近い順に並べる
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ローディング演出 */}
            <AnimatePresence>
              {isSearching && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="px-4 pt-12 pb-8 flex flex-col items-center gap-4">
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                    <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                    <div className="absolute inset-2 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xl select-none">🔍</span>
                    </div>
                  </div>
                  <p className="text-base font-black text-foreground">おすそ分けを探しています...</p>
                  <p className="text-xs text-muted-foreground">「{inputValue}」で検索中</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* バッグ一覧 */}
            {!isSearching && (
              <div className="px-4 pt-4">
                <AnimatePresence mode="wait">
                  {bagsLoading ? (
                    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[1, 2, 3, 4].map(i => <BagCardSkeleton key={i} />)}
                    </motion.div>

                  ) : filteredBags.length > 0 ? (
                    <motion.div key="results" className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                      initial="hidden" animate="show"
                      variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } }}>
                      {filteredBags.map(bag => {
                        const storeLat = bag.store.lat ?? Number(bag.store.latitude);
                        const storeLng = bag.store.lng ?? Number(bag.store.longitude);
                        return (
                          <motion.div key={bag.id} variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
                            className="relative">
                            {/* 近い順ソート時は徒歩時間バッジを目立たせる */}
                            {sort === 'distance' && storeLat && storeLng && (
                              <div className="absolute top-2 right-2 z-10 pointer-events-none">
                                <InlineWalkBadge storeLat={storeLat} storeLng={storeLng} prominent />
                              </div>
                            )}
                            <BagCard bag={bag} />
                          </motion.div>
                        );
                      })}
                    </motion.div>

                  ) : isFiltering ? (
                    <ZeroResultsState key="zero" query={liveQuery} category={category} onClear={clearAllFilters} recommendBags={recommendBags} />

                  ) : (
                    <motion.div key="empty" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col items-center justify-center py-20 px-6 text-center">
                      <div className="w-20 h-20 bg-card border-2 border-dashed border-border rounded-3xl flex items-center justify-center mb-5">
                        <span className="text-4xl select-none">🎁</span>
                      </div>
                      <h3 className="text-lg font-black text-foreground mb-2">今日のおすそ分けを準備中</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        まだ出品がありません。<br />お近くのお店がおすそ分けを準備中です！
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}
      </div>

      {showSort && <div className="fixed inset-0 z-40" onClick={() => setShowSort(false)} />}
    </Layout>
  );
}
