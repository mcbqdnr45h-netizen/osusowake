import React, { useState, useMemo, useCallback } from 'react';
import { Layout } from '@/components/Layout';
import { MapView } from '@/components/Map';
import { BagCard } from '@/components/BagCard';
import { useListAllBags, useListStores, Store, SurpriseBagWithStore } from '@workspace/api-client-react';
import {
  Search, Map as MapIcon, List, SlidersHorizontal, X, ChevronDown,
  ArrowUpDown, MapPin, Clock, Package, ChevronRight, ShoppingBag, Navigation2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'wouter';
import { getCategoryIcon, getCategoryImage } from '@/lib/category-utils';

// ─── Haversine 距離計算 ───────────────────────────────────────────────────────
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

type ViewMode = 'map' | 'list';
type SortKey  = 'default' | 'price_asc' | 'price_desc' | 'stock_desc';

const CATEGORIES = [
  { label: '全て',       value: '' },
  { label: '🥐 ベーカリー', value: 'bakery' },
  { label: '🍱 レストラン', value: 'restaurant' },
  { label: '☕ カフェ',    value: 'cafe' },
  { label: '🛒 スーパー',  value: 'supermarket' },
  { label: '🏪 コンビニ',  value: 'convenience' },
];

const SORT_OPTIONS: { label: string; value: SortKey }[] = [
  { label: 'おすすめ順',   value: 'default'    },
  { label: '価格が安い順', value: 'price_asc'  },
  { label: '価格が高い順', value: 'price_desc' },
  { label: '在庫が多い順', value: 'stock_desc' },
];

// ─── 店舗詳細ボトムシート ────────────────────────────────────────────────────
function StoreBottomSheet({
  store,
  bags,
  userPos,
  onClose,
}: {
  store: Store;
  bags: SurpriseBagWithStore[];
  userPos: { lat: number; lng: number } | null;
  onClose: () => void;
}) {
  const storeBags = bags.filter(b => b.store.id === store.id);
  const hasBags   = storeBags.length > 0;
  const bagCount  = store.totalBagsAvailable ?? storeBags.filter(b => b.stockCount > 0).length;

  const distanceLabel = useMemo(() => {
    if (!userPos || !store.latitude || !store.longitude) return null;
    const m = calcDistanceM(userPos.lat, userPos.lng, Number(store.latitude), Number(store.longitude));
    return formatDistance(m);
  }, [userPos, store.latitude, store.longitude]);

  return (
    <>
      {/* 背景オーバーレイ */}
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 z-30 bg-black/30 backdrop-blur-[1px]"
        onClick={onClose}
      />

      {/* ボトムシート本体 */}
      <motion.div
        key="sheet"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="absolute bottom-0 left-0 right-0 z-40 bg-background rounded-t-3xl shadow-2xl overflow-hidden"
        style={{ maxHeight: '78vh' }}
      >
        {/* ドラッグハンドル */}
        <div className="flex justify-center pt-3 pb-1" onClick={onClose}>
          <div className="w-10 h-1.5 bg-border rounded-full" />
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: 'calc(78vh - 20px)' }}>

          {/* ─── 店舗ヘッダー ─── */}
          <div className="relative h-36 mx-4 mt-1 mb-4 rounded-2xl overflow-hidden bg-muted shrink-0">
            <img
              src={store.imageUrl || getCategoryImage(store.category)}
              alt={store.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

            {/* 閉じるボタン */}
            <button
              onClick={onClose}
              className="absolute top-2.5 right-2.5 w-8 h-8 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center"
            >
              <X className="w-4 h-4 text-white" />
            </button>

            {/* 店舗名 */}
            <div className="absolute bottom-3 left-3 right-10">
              <p className="text-white/80 text-xs mb-0.5">{getCategoryIcon(store.category)} {store.category ?? 'その他'}</p>
              <h2 className="text-white font-black text-lg leading-tight line-clamp-1">{store.name}</h2>
            </div>
          </div>

          {/* ─── 基本情報 ─── */}
          <div className="px-4 space-y-2 mb-4">
            {/* 住所 + 距離 */}
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <span className="text-sm text-muted-foreground leading-relaxed flex-1">
                {store.address || '住所未設定'}
              </span>
              {distanceLabel && (
                <span className="inline-flex items-center gap-1 shrink-0 text-[11px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                  <Navigation2 className="w-2.5 h-2.5" />
                  {distanceLabel}
                </span>
              )}
            </div>

            {/* ステータスバッジ */}
            <div className="flex items-center gap-2 flex-wrap">
              {hasBags ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black text-white"
                  style={{ background: 'linear-gradient(135deg,#4AAF96,#1E3F38)' }}>
                  <ShoppingBag className="w-3.5 h-3.5" />
                  出品中 · {bagCount}個あり
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-muted-foreground rounded-full text-xs font-bold">
                  😴 現在出品なし
                </span>
              )}
            </div>
          </div>

          {/* ─── バッグ一覧 ─── */}
          <div className="px-4 pb-6">
            {hasBags ? (
              <>
                <h3 className="text-sm font-black text-foreground mb-3 flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-primary" />
                  出品中のバッグ
                </h3>
                <div className="space-y-3">
                  {storeBags.map(bag => {
                    const isSoldOut      = bag.stockCount <= 0;
                    const discountPct    = Math.round((1 - bag.discountedPrice / bag.originalPrice) * 100);
                    const isLowStock     = bag.stockCount > 0 && bag.stockCount < 3;

                    return (
                      <div key={bag.id}
                        className={`flex gap-3 bg-card border rounded-2xl overflow-hidden transition-all
                          ${isSoldOut ? 'opacity-60 border-border' : 'border-primary/20 shadow-sm hover:shadow-md'}`}>

                        {/* サムネイル */}
                        <div className="relative w-24 h-24 shrink-0 bg-muted">
                          <img
                            src={bag.store.imageUrl || getCategoryImage(bag.store.category)}
                            alt={bag.title}
                            className="w-full h-full object-cover"
                          />
                          {!isSoldOut && (
                            <span className="absolute top-1.5 left-1.5 bg-accent text-accent-foreground text-[10px] font-black px-1.5 py-0.5 rounded-md">
                              {discountPct}% OFF
                            </span>
                          )}
                          {isSoldOut && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <span className="text-white text-[10px] font-black">完売</span>
                            </div>
                          )}
                        </div>

                        {/* 情報 */}
                        <div className="flex-1 py-2.5 pr-2 min-w-0">
                          <p className="font-bold text-sm text-foreground leading-tight line-clamp-1 mb-1">{bag.title}</p>

                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-1.5">
                            <Clock className="w-3 h-3 shrink-0" />
                            <span>受取 {bag.pickupStart}–{bag.pickupEnd}</span>
                          </div>

                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-2">
                            <Package className="w-3 h-3 shrink-0" />
                            {isSoldOut
                              ? <span className="text-destructive font-bold">完売</span>
                              : isLowStock
                                ? <span className="text-amber-600 font-bold animate-pulse">残り{bag.stockCount}個！</span>
                                : <span>残り{bag.stockCount}個</span>
                            }
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-[10px] text-muted-foreground line-through mr-1">¥{bag.originalPrice.toLocaleString()}</span>
                              <span className="text-base font-black text-primary">¥{bag.discountedPrice.toLocaleString()}</span>
                            </div>

                            {!isSoldOut ? (
                              <Link href={`/bags/${bag.id}`}>
                                <button className="flex items-center gap-1 bg-primary text-primary-foreground text-[11px] font-black px-3 py-1.5 rounded-xl active:scale-95 transition-transform shadow-sm shadow-primary/20">
                                  レスキュー
                                  <ChevronRight className="w-3 h-3" />
                                </button>
                              </Link>
                            ) : (
                              <span className="text-[11px] text-muted-foreground font-bold px-2 py-1 bg-secondary rounded-xl">完売</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="text-center py-10 bg-secondary/50 rounded-2xl border border-dashed border-border">
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

// ─── メインページ ─────────────────────────────────────────────────────────────
export default function SearchPage() {
  const [query,        setQuery]        = useState('');
  const [view,         setView]         = useState<ViewMode>('map');
  const [category,     setCategory]     = useState('');
  const [sort,         setSort]         = useState<SortKey>('default');
  const [inStockOnly,  setInStockOnly]  = useState(false);
  const [showSort,     setShowSort]     = useState(false);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);

  const handleUserPositionChange = useCallback((pos: { lat: number; lng: number } | null) => {
    setUserPos(pos);
  }, []);

  const { data: bags,   isLoading: bagsLoading } = useListAllBags();
  const { data: stores }                          = useListStores();

  const filteredBags = useMemo(() => {
    let result = bags || [];
    if (query) {
      const q = query.toLowerCase();
      result = result.filter(b =>
        b.title.toLowerCase().includes(q) ||
        b.store.name.toLowerCase().includes(q) ||
        b.store.city?.toLowerCase().includes(q) ||
        b.store.category?.toLowerCase().includes(q)
      );
    }
    if (category)    result = result.filter(b => b.store.category === category);
    if (inStockOnly) result = result.filter(b => b.stockCount > 0);
    if (sort === 'price_asc')  result = [...result].sort((a, b) => a.discountedPrice - b.discountedPrice);
    if (sort === 'price_desc') result = [...result].sort((a, b) => b.discountedPrice - a.discountedPrice);
    if (sort === 'stock_desc') result = [...result].sort((a, b) => b.stockCount - a.stockCount);
    return result;
  }, [bags, query, category, sort, inStockOnly]);

  const filteredStoreIds = new Set(filteredBags.map(b => b.store.id));
  const displayStores    = (stores || [])
    .filter(s => (s as any).status === 'approved' || !(s as any).status)
    .filter(s => !query || filteredStoreIds.has(s.id));

  const activeFilterCount = [category !== '', inStockOnly, sort !== 'default'].filter(Boolean).length;
  const currentSortLabel  = SORT_OPTIONS.find(o => o.value === sort)?.label || 'おすすめ順';

  function clearAllFilters() { setCategory(''); setInStockOnly(false); setSort('default'); setQuery(''); }

  const handleStoreSelect = useCallback((store: Store) => {
    setSelectedStore(store);
  }, []);

  return (
    <Layout hideFooter={view === 'map'}>

      {/* ── マップビュー ── */}
      {view === 'map' && (
        <div className="relative h-[calc(100dvh_-_144px)] md:h-[calc(100dvh_-_64px)]">

          {/* 浮動検索バー */}
          <div className="absolute top-3 left-3 right-3 z-20 flex gap-2">
            <div className="relative flex-1 shadow-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                className="w-full bg-white border border-gray-100 rounded-2xl pl-9 pr-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
                placeholder="店舗名、エリア、カテゴリで検索..."
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>
            <button
              onClick={() => setView('list')}
              className="h-[46px] px-3.5 bg-white shadow-xl border border-gray-100 rounded-2xl flex items-center gap-1.5 text-xs font-bold text-foreground whitespace-nowrap active:scale-95 transition-transform"
            >
              <List className="w-4 h-4" />
              リスト
            </button>
          </div>

          {/* 地図本体 */}
          <div className="absolute inset-0">
            <MapView
              stores={displayStores}
              onStoreSelect={handleStoreSelect}
              onUserPositionChange={handleUserPositionChange}
            />
          </div>

          {/* ── 店舗詳細ボトムシート ── */}
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
        <div className="max-w-4xl mx-auto pb-6">

          {/* Sticky フィルターバー */}
          <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border/50 px-4 pt-4 pb-3 space-y-3">

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  className="w-full bg-card border border-border text-foreground rounded-2xl pl-11 pr-4 py-3 text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all placeholder:text-muted-foreground"
                  placeholder="店舗名、商品名、エリアで検索..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                />
                {query && (
                  <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-muted-foreground/20 flex items-center justify-center">
                    <X className="w-3 h-3 text-muted-foreground" />
                  </button>
                )}
              </div>
              <button
                onClick={() => setView('map')}
                className="h-[46px] px-3.5 bg-primary text-primary-foreground rounded-2xl flex items-center gap-1.5 text-xs font-bold shadow-md shadow-primary/20 active:scale-95 transition-transform shrink-0"
              >
                <MapIcon className="w-4 h-4" />
                地図
              </button>
            </div>

            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-0.5">
              {CATEGORIES.map(cat => (
                <button key={cat.value} onClick={() => setCategory(cat.value)}
                  className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 border
                    ${category === cat.value ? 'bg-primary text-primary-foreground border-primary shadow-sm' : 'bg-card text-foreground border-border hover:border-primary/50'}`}>
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <button onClick={() => setShowSort(v => !v)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all
                    ${sort !== 'default' ? 'bg-primary/10 text-primary border-primary/30' : 'bg-card text-foreground border-border hover:border-primary/40'}`}>
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  {currentSortLabel}
                  <ChevronDown className={`w-3 h-3 transition-transform ${showSort ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {showSort && (
                    <motion.div initial={{ opacity: 0, y: -8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.95 }} transition={{ duration: 0.15 }}
                      className="absolute top-full mt-1.5 left-0 z-50 bg-card border border-border rounded-2xl shadow-xl overflow-hidden min-w-[160px]">
                      {SORT_OPTIONS.map(opt => (
                        <button key={opt.value} onClick={() => { setSort(opt.value); setShowSort(false); }}
                          className={`w-full text-left px-4 py-3 text-xs font-bold transition-colors hover:bg-secondary ${sort === opt.value ? 'text-primary bg-primary/5' : 'text-foreground'}`}>
                          {sort === opt.value && <span className="mr-1.5">✓</span>}
                          {opt.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button onClick={() => setInStockOnly(v => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all
                  ${inStockOnly ? 'bg-green-100 text-green-700 border-green-300' : 'bg-card text-foreground border-border hover:border-primary/40'}`}>
                <span className={`w-2 h-2 rounded-full ${inStockOnly ? 'bg-green-500' : 'bg-muted-foreground/40'}`} />
                在庫あり
              </button>

              <div className="flex-1" />
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium">{filteredBags.length}件</span>
                {activeFilterCount > 0 && (
                  <button onClick={clearAllFilters}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 transition-colors">
                    <X className="w-3 h-3" />
                    リセット ({activeFilterCount})
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* バッグ一覧 */}
          <div className="px-4 pt-4">
            {bagsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-64 bg-card rounded-2xl animate-pulse border border-border" />)}
              </div>
            ) : filteredBags.length > 0 ? (
              <motion.div className="grid grid-cols-1 sm:grid-cols-2 gap-4" initial="hidden" animate="show"
                variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } }}>
                {filteredBags.map(bag => (
                  <motion.div key={bag.id} variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}>
                    <BagCard bag={bag} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div className="text-center py-20 bg-card rounded-2xl border border-dashed border-border">
                <SlidersHorizontal className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-foreground">条件に合う商品がありません</h3>
                <p className="text-muted-foreground mt-1 text-sm">絞り込み条件を変えてみてください</p>
                {activeFilterCount > 0 && (
                  <button onClick={clearAllFilters} className="mt-4 px-5 py-2 bg-primary text-primary-foreground rounded-full text-sm font-bold">
                    絞り込みをリセット
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {showSort && <div className="fixed inset-0 z-40" onClick={() => setShowSort(false)} />}
    </Layout>
  );
}
