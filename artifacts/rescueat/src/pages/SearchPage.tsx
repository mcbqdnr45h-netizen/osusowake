import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { MapView, MapBounds, MapViewHandle } from '@/components/Map';
import { BagCard, BagCardSkeleton } from '@/components/BagCard';
import {
  useListAllBags, useListStores,
  getListAllBagsQueryKey, getListStoresQueryKey,
  Store, SurpriseBagWithStore,
} from '@workspace/api-client-react';
import {
  Search, X, ChevronDown,
  ArrowUpDown, MapPin, Clock, Package, ChevronRight, ShoppingBag, Navigation2,
  Croissant, Utensils, Coffee, ShoppingCart, Store as StoreIcon,
  Candy, Wheat, Sparkles, History, RefreshCw, Loader2, PackageOpen, Navigation,
  RotateCcw, Apple, Fish, UtensilsCrossed, GlassWater, Gift,
} from 'lucide-react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { Link } from 'wouter';
import { getCategoryIcon, getCategoryImage, getCategoryLabel, normalizeCategory } from '@/lib/category-utils';
import { normalizeBrand } from '@/lib/brand-text';
import { useUserLocation, updateCachedCoords, haversineMeters, metersToWalkMinutes, formatDistanceLabel } from '@/hooks/use-user-location';
import { getDisplayPrice, getDisplayDiscountPercent } from '@/lib/price-display';

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
  { label: 'すべて',        value: '',               icon: <Sparkles  className="w-4 h-4" />, emoji: '' },
  { label: '料理・お惣菜',  value: 'meals',          icon: <Utensils  className="w-4 h-4" />, emoji: '🍱' },
  { label: 'パン・スイーツ', value: 'bakery_sweets', icon: <Croissant className="w-4 h-4" />, emoji: '🥐' },
  { label: '食材・その他',  value: 'ingredients',    icon: <Apple     className="w-4 h-4" />, emoji: '🍎' },
];

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
  const label   = formatDistanceLabel(meters);
  const isClose = minutes <= 5;
  const isMid   = minutes <= 15;

  if (prominent) {
    return (
      <span className={`inline-flex items-center gap-1 font-black px-2.5 py-1 rounded-full text-xs
        ${isClose ? 'bg-green-100 text-green-700 border border-green-200'
          : isMid ? 'bg-orange-100 text-orange-600 border border-orange-200'
          : 'bg-sky-100 text-sky-700 border border-sky-200'}`}>
        <Navigation className="w-3 h-3 shrink-0" />
        {label}
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
  const [expanded, setExpanded] = useState(false);

  const allStoreBags = bags.filter(b => b.store.id === store.id);
  const storeBags = [...allStoreBags].sort((a, b) => {
    if ((a.stockCount > 0) === (b.stockCount > 0)) return 0;
    return a.stockCount > 0 ? -1 : 1;
  });
  const bagCount = store.totalBagsAvailable ?? storeBags.filter(b => b.stockCount > 0).length;
  const hasBags  = bagCount > 0;

  const distanceLabel = useMemo(() => {
    if (!userPos || !store.lat || !store.lng) return null;
    const m = calcDistanceM(userPos.lat, userPos.lng, store.lat, store.lng);
    return formatDistance(m);
  }, [userPos, store.lat, store.lng]);

  const walkLabel = useMemo(() => {
    if (!userPos || !store.lat || !store.lng) return null;
    const m = haversineMeters(userPos.lat, userPos.lng, store.lat, store.lng);
    return formatDistanceLabel(m);
  }, [userPos, store.lat, store.lng]);

  // Google Maps URL
  const mapsUrl = useMemo(() => {
    const lat = store.lat;
    const lng = store.lng;
    if (lat && lng) return `https://maps.google.com/?q=${lat},${lng}`;
    if (store.address) return `https://maps.google.com/?q=${encodeURIComponent(store.address)}`;
    return null;
  }, [store]);

  // ドラッグでパネル展開 / 閉じる
  const handleDragEnd = useCallback((_: unknown, info: PanInfo) => {
    if (info.velocity.y > 400 || info.offset.y > 100) {
      onClose();
    } else if (info.offset.y < -60 || info.velocity.y < -300) {
      setExpanded(true);
    } else if (info.offset.y > 40) {
      setExpanded(false);
    }
  }, [onClose]);

  const sheetH = expanded ? '92dvh' : '60dvh';

  return (
    <>
      <motion.div key="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 z-30 bg-black/30 backdrop-blur-[1px]"
        onClick={onClose} />

      <motion.div
        key="sheet"
        initial={{ y: '100%' }}
        animate={{ y: 0, height: sheetH }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="absolute bottom-0 left-0 right-0 z-40 bg-background rounded-t-3xl shadow-2xl flex flex-col"
        style={{ height: sheetH }}
      >
        {/* ドラッグハンドル — 上下スワイプで伸縮 */}
        <motion.div
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          className="flex flex-col items-center pt-3 pb-2 cursor-grab active:cursor-grabbing shrink-0 touch-none select-none"
          onClick={() => setExpanded(v => !v)}
        >
          <div className="w-10 h-1.5 bg-border rounded-full mb-1" />
          <span className="text-[10px] text-muted-foreground/50 font-medium">
            {expanded ? '▾ 閉じる' : '▴ 引き上げて全表示'}
          </span>
        </motion.div>

        {/* スクロールコンテンツ */}
        <div
          className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain"
          style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
        >
          {/* 店舗画像バナー */}
          <div className="relative mx-4 mt-1 mb-3 rounded-2xl overflow-hidden bg-muted shrink-0 shadow-md shadow-black/10" style={{ height: store.description ? 192 : 148 }}>
            <img
              src={store.imageUrl || getCategoryImage(store.category, store.id)}
              alt={store.name}
              className="w-full h-full object-cover"
            />
            {/* 下半分グラデーション — 強め */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

            {/* 閉じるボタン */}
            <button
              onClick={onClose}
              className="absolute top-2.5 right-2.5 w-8 h-8 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center tap-scale"
            >
              <X className="w-4 h-4 text-white" />
            </button>

            {/* テキストオーバーレイ */}
            <div className="absolute bottom-0 left-0 right-0 px-4 pb-3.5 pt-8">
              {/* カテゴリバッジ */}
              <p className="text-white/60 text-[11px] font-semibold tracking-wide mb-1">
                {getCategoryIcon(store.category)}&nbsp;{getCategoryLabel(store.category)}
              </p>
              {/* 店名 — 大きく太く */}
              <h2 className="text-white font-black text-2xl leading-tight tracking-tight line-clamp-1 drop-shadow-sm">
                {store.name}
              </h2>
              {/* PR文 — 半透明ピル背景付きで確実に読めるように */}
              {store.description && (
                <div className="mt-1.5 inline-block max-w-full">
                  <p className="text-white text-[12px] font-medium leading-snug line-clamp-2
                    bg-black/45 backdrop-blur-sm rounded-lg px-2.5 py-1">
                    {store.description}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 住所 + 距離 + 地図ボタン（1行にまとめ） */}
          <div className="px-4 mb-3">
            <div className="flex items-center gap-3">
              {/* 住所 + 距離情報 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground mt-[2px] shrink-0" />
                  <span className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {store.address || '住所未設定'}
                  </span>
                </div>
                {(distanceLabel || walkLabel) && (
                  <div className="flex items-center gap-1.5 mt-1 pl-5">
                    {distanceLabel && (
                      <span className="inline-flex items-center gap-0.5 text-[11px] font-black text-primary whitespace-nowrap">
                        <Navigation2 className="w-2.5 h-2.5" />{distanceLabel}
                      </span>
                    )}
                    {distanceLabel && walkLabel && (
                      <span className="text-[10px] text-muted-foreground/50">·</span>
                    )}
                    {walkLabel && (
                      <span className="text-[11px] font-medium text-muted-foreground whitespace-nowrap">
                        {walkLabel}
                      </span>
                    )}
                  </div>
                )}
              </div>
              {/* 地図ボタン（1つだけ） */}
              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 shrink-0 bg-secondary border border-border text-foreground font-black text-[12px] px-3.5 py-2 rounded-2xl tap-scale hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-colors"
                >
                  <Navigation2 className="w-3.5 h-3.5 shrink-0" />
                  地図で開く
                </a>
              )}
            </div>
          </div>

          <div className="px-4 mb-3">
            <div className="flex items-center gap-2">
              {hasBags ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black text-white"
                  style={{ background: 'linear-gradient(135deg,#F8854A,#D44A00)' }}>
                  <ShoppingBag className="w-3.5 h-3.5" />出品中 · {bagCount}個あり
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-muted-foreground rounded-full text-xs font-bold">
                  😴 現在出品なし
                </span>
              )}
            </div>
          </div>


          {/* バッグ一覧 */}
          <div className="px-4 pb-10">
            {hasBags ? (
              <>
                <h3 className="text-sm font-black text-foreground mb-3 flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-primary" />出品中のバッグ
                </h3>
                <div className="space-y-3">
                  {storeBags.map(bag => {
                    const isSoldOut   = bag.stockCount <= 0;
                    const discountPct = getDisplayDiscountPercent(bag.originalPrice, bag.discountedPrice);
                    const isLowStock  = bag.stockCount > 0 && bag.stockCount < 3;
                    return (
                      <div key={bag.id}
                        className={`flex gap-3 bg-card border rounded-2xl overflow-hidden transition-all
                          ${isSoldOut ? 'opacity-60 border-border' : 'border-primary/20 shadow-sm'}`}>
                        <div className="relative w-24 h-24 shrink-0 bg-muted">
                          {/* ★ バッグ自身の画像を最優先。 store.imageUrl にフォールバックすると
                                同じ店の複数バッグが全部同じ画像で表示されるバグになる (本番ユーザ報告)。 */}
                          <img
                            key={bag.imageUrl || bag.store.imageUrl || bag.id}
                            src={bag.imageUrl || bag.store.imageUrl || getCategoryImage(bag.store.category, bag.id)}
                            alt={bag.title}
                            loading="lazy"
                            decoding="async"
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
                        <div className="flex-1 py-2.5 pr-2 min-w-0">
                          <p className="font-black text-sm text-foreground leading-tight line-clamp-1 mb-1">{normalizeBrand(bag.title)}</p>
                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-1.5">
                            <Clock className="w-3 h-3 shrink-0" />
                            <span>受取 {bag.pickupStart}–{bag.pickupEnd}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-[10px] text-muted-foreground line-through mr-1">¥{getDisplayPrice(bag.originalPrice).toLocaleString()}</span>
                              <span className="text-base font-black text-primary">¥{getDisplayPrice(bag.discountedPrice).toLocaleString()}</span>
                              {isSoldOut
                                ? <span className="text-[10px] text-muted-foreground font-bold ml-1">完売</span>
                                : isLowStock
                                  ? <span className="text-[10px] text-amber-600 font-black animate-pulse ml-1">残り{bag.stockCount}個！</span>
                                  : <span className="text-[10px] text-muted-foreground font-bold ml-1">残り{bag.stockCount}個</span>
                              }
                            </div>
                            {!isSoldOut ? (
                              <Link href={`/bags/${bag.id}`}>
                                <button className="flex items-center gap-1.5 bg-primary text-primary-foreground text-sm font-black px-4 py-2 rounded-xl tap-scale shadow-md shadow-primary/25 hover:bg-primary/90 active:scale-95 transition-all">
                                  おすそわけ <ChevronRight className="w-4 h-4" />
                                </button>
                              </Link>
                            ) : (
                              <span className="text-xs text-muted-foreground font-bold px-2.5 py-1.5 bg-secondary rounded-xl">完売御礼</span>
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
    ? `「${catLabel}」のおすそわけはまだありません`
    : query
      ? `「${query}」は見つかりませんでした`
      : '条件に合うおすそわけがありませんでした';

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


// ─── メインページ ─────────────────────────────────────────────────────────────
// ★ 2026-05-02: Google Places Autocomplete + Geocoding API を完全廃止。
//   理由: 月 $200 の Maps Platform 無料枠を消費するうえ、 リファラ流出時に他人による
//   不正利用で枠を食い潰されるリスクあり。 検索は stores テーブル内のローカル文字列検索
//   (title / store.name / store.city / store.category の部分一致) で代替し、 Google API
//   呼び出しを完全にゼロにしてコスト・依存性を排除する。
export default function SearchPage() {
  // キャッシュ済み現在地（GPSボタン押下済みなら即座に利用可能）
  const { coords: cachedCoords } = useUserLocation();

  const [inputValue,    setInputValue]    = useState('');
  const [query,         setQuery]         = useState('');
  const [view,          setView]          = useState<ViewMode>('map');
  const [category,      setCategory]      = useState('');
  const [sort,          setSort]          = useState<SortKey>('default');
  const [inStockOnly,   setInStockOnly]   = useState(false);
  const [showSort,      setShowSort]      = useState(false);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [userPos,       setUserPos]       = useState<{ lat: number; lng: number } | null>(null);
  const [isSearching,   setIsSearching]   = useState(false);
  const [showHistory,   setShowHistory]   = useState(false);
  const [history,       setHistory]       = useState<string[]>(loadHistory);

  // マップ初期GPS（キャッシュがあれば即座に使用、なければ自動取得）
  const [mapInitPos,     setMapInitPos]     = useState<[number, number] | null>(
    cachedCoords ? [cachedCoords.lat, cachedCoords.lng] : null,
  );

  // マップを開いた瞬間に現在地を自動取得（キャッシュなしの場合）
  useEffect(() => {
    if (cachedCoords) {
      // キャッシュあり → 即座に使用
      const pos: [number, number] = [cachedCoords.lat, cachedCoords.lng];
      setMapInitPos(pos);
      setUserPos({ lat: cachedCoords.lat, lng: cachedCoords.lng });
      return;
    }
    if (!navigator.geolocation) {
      return;
    }
    // iOS Safari 対策: ナビタブのクリック直後にマウントされるため、
    // ユーザー操作の延長として geolocation が許可される
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const ll: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        updateCachedCoords({ lat: ll[0], lng: ll[1] });
        setMapInitPos(ll);
        setUserPos({ lat: ll[0], lng: ll[1] });
      },
      (err) => {
        console.warn('[SearchPage] GPS auto-init error:', err.code, err.message);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // エリア再検索
  const [mapBounds,           setMapBounds]           = useState<MapBounds | null>(null);
  const [pendingBounds,       setPendingBounds]       = useState<MapBounds | null>(null);
  const [showReSearchButton,  setShowReSearchButton]  = useState(false);
  const [areaSearchActive,    setAreaSearchActive]    = useState(false);

  const searchRef  = useRef<HTMLInputElement>(null);
  const mapViewRef = useRef<MapViewHandle>(null);

  // ─── 検索ボックス右アクション (X + 検索) の実寸を計測 ───────────────────────
  // 旧実装は input の pr を固定値 (pr-[124px]) で確保していたが、
  // 検索ボタン文言の変更・iOS Dynamic Type・言語切替でボタン幅が変動すると
  // 入力テキストとボタンが重なるリスクが残る。
  // ResizeObserver で右アクション群の実 width を計測し、 余白 16px を足して
  // input.style.paddingRight に反映することで「重なり再発ゼロ」を構造的に保証する。
  const searchActionsRef = useRef<HTMLDivElement>(null);
  const [actionsWidth, setActionsWidth] = useState(124); // 初期値はフォールバック
  useEffect(() => {
    const el = searchActionsRef.current;
    if (!el) return;
    const update = () => setActionsWidth(Math.ceil(el.getBoundingClientRect().width));
    update();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

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

  const { data: bags, isLoading: bagsLoading } = useListAllBags(
    { query: { queryKey: getListAllBagsQueryKey(), staleTime: 60_000 } }
  );
  const { data: stores } = useListStores(
    undefined,
    { query: { queryKey: getListStoresQueryKey(), staleTime: 60_000 } }
  );

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

    // カテゴリー (旧カテゴリ値も含めて normalize して比較)
    if (category) result = result.filter(b => normalizeCategory(b.category) === category);

    // 在庫あり
    if (inStockOnly) result = result.filter(b => b.stockCount > 0);

    // エリア絞り込み（マップ連動）
    if (areaSearchActive && mapBounds) {
      result = result.filter(b => {
        const lat = b.store.lat;
        const lng = b.store.lng;
        if (!lat || !lng) return false;
        const latN = Number(lat);
        const lngN = Number(lng);
        return latN >= mapBounds.south && latN <= mapBounds.north &&
               lngN >= mapBounds.west  && lngN <= mapBounds.east;
      });
    }

    // ソート（userPos = GPS ボタンで取得した現在地、Safari 対応のためボタン経由のみ）
    if (sort === 'distance' && userPos) {
      result = [...result].sort((a, b) => {
        const aLat = a.store.lat;
        const aLng = a.store.lng;
        const bLat = b.store.lat;
        const bLng = b.store.lng;
        const dA = haversineMeters(userPos.lat, userPos.lng, aLat, aLng);
        const dB = haversineMeters(userPos.lat, userPos.lng, bLat, bLng);
        return dA - dB;
      });
    } else if (sort === 'price_asc')  { result = [...result].sort((a, b) => a.discountedPrice - b.discountedPrice); }
    else if (sort === 'price_desc') { result = [...result].sort((a, b) => b.discountedPrice - a.discountedPrice); }
    else if (sort === 'stock_desc') { result = [...result].sort((a, b) => b.stockCount - a.stockCount); }

    return result;
  }, [bags, liveQuery, category, sort, inStockOnly, areaSearchActive, mapBounds, userPos]);

  const recommendBags  = useMemo(() => (bags || []).filter(b => b.stockCount > 0).slice(0, 3), [bags]);

  const filteredStoreIds = useMemo(
    () => new Set(filteredBags.map(b => b.store.id)),
    [filteredBags],
  );

  const displayStores = useMemo(() => {
    // approved を優先して並べ替え（同じ場所に複数申請がある場合、approved を優先）
    const sorted = [...(stores || [])].sort((a, b) => {
      if ((a as any).status === 'approved' && (b as any).status !== 'approved') return -1;
      if ((b as any).status === 'approved' && (a as any).status !== 'approved') return 1;
      return (b.id as number) - (a.id as number); // 新しい順
    });

    const seenId  = new Set<number | string>();
    const seenLoc = new Set<string>(); // 丸め座標 で重複排除

    return sorted.filter(s => {
      const ok = (s as any).status === 'approved' || !(s as any).status || (s as any).showOnMap === true || (s as any).show_on_map === true;
      if (!ok) return false;
      if (seenId.has(s.id)) return false;
      seenId.add(s.id);
      // ★ 公開 /stores API から ownerId を除外 (#3 PII 漏洩対策) — id ベースで重複排除
      //   同一場所の複数店舗は backend 側で 'approved' のみ返るため、 ここでは
      //   座標ベース重複だけ防げば十分。
      const locKey = `${s.id}-${Math.round(s.lat * 1000)}-${Math.round(s.lng * 1000)}`;
      if (seenLoc.has(locKey)) return false;
      seenLoc.add(locKey);
      return true;
    }).filter(s => {
      // ★ カテゴリ・検索ワード・在庫・エリア のいずれかで絞り込み中はマップマーカーも連動
      //   sort は表示順だけなので除外 (sort 変えただけで店舗が消えたら困る)
      const hasMarkerFilter = !!liveQuery || !!category || inStockOnly || areaSearchActive;
      return !hasMarkerFilter || filteredStoreIds.has(s.id);
    });
  }, [stores, liveQuery, category, inStockOnly, areaSearchActive, filteredStoreIds]);

  const isFiltering       = !!liveQuery || category !== '' || inStockOnly || sort !== 'default' || areaSearchActive;
  const activeFilterCount = [category !== '', inStockOnly, sort !== 'default'].filter(Boolean).length;
  const currentSortLabel  = SORT_OPTIONS.find(o => o.value === sort)?.label || 'おすすめ順';
  const hasLocation       = !!userPos;

  function clearAllFilters() {
    setCategory(''); setInStockOnly(false); setSort('default');
    setQuery(''); setInputValue(''); clearAreaSearch();
  }

  const handleStoreSelect = useCallback((store: Store) => setSelectedStore(store), []);

  // ── 検索後マップパン ────────────────────────────────────────────────────────
  // query が確定したら、 一致した店舗座標にマップをフィット。
  // ★ 2026-05-02: Google Geocoding API による「店舗が見つからない場合の地名検索」 fallback を廃止。
  //   ローカル DB 検索でヒットゼロなら、 ZeroResultsState を表示するだけでマップは現状維持。
  useEffect(() => {
    if (!query) return;

    // 一致した店舗の座標を収集（重複除去）
    const uniqueLocations = filteredBags
      .filter(b => b.store.lat && b.store.lng)
      .reduce<{ lat: number; lng: number }[]>((acc, b) => {
        const ll = { lat: b.store.lat!, lng: b.store.lng! };
        if (!acc.some(l => l.lat === ll.lat && l.lng === ll.lng)) acc.push(ll);
        return acc;
      }, []);

    if (uniqueLocations.length === 0) return;

    const timer = setTimeout(() => {
      mapViewRef.current?.fitStores(uniqueLocations, { minZoom: 13, maxZoom: 16 });
    }, 350);
    return () => clearTimeout(timer);
  }, [query, filteredBags]);

  return (
    <Layout hideFooter={view === 'map'}>
      <div className={`flex flex-col ${view === 'map' ? 'flex-1 min-h-0 h-full' : ''}`}>

        {/* ── Sticky スリムフィルターバー ── */}
        <div className="sticky z-30 bg-background/97 backdrop-blur-md border-b border-border/40 px-3 pb-1.5 shrink-0 pt-2"
          style={{ top: 0 }}>

          {/* Row 1: 検索バー */}
          <div className="relative mb-1.5">
            {/* GPS インジケーター or 検索アイコン */}
            {hasLocation ? (
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
              </span>
            ) : (
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            )}
            {/* ★ X と検索ボタンは右端の同一 flex コンテナ内に配置 (gap-1.5 で間隔を構造保証)。
                input.paddingRight は ResizeObserver で計測した実寸 + 16px 余白を動的に反映し、
                ボタン幅が文言/Dynamic Type/言語切替で変動しても入力テキストと重ならない。 */}
            <input
              ref={searchRef}
              type="search"
              inputMode="search"
              className="w-full bg-card border border-border text-foreground rounded-xl pl-9 py-2.5 text-sm font-medium outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="エリア・お店・カテゴリで探す..."
              value={inputValue}
              style={{ fontSize: '16px', paddingRight: `${actionsWidth + 16}px` }}
              onChange={e => { setInputValue(e.target.value); setShowHistory(true); }}
              onFocus={() => history.length > 0 && setShowHistory(true)}
              onBlur={() => setTimeout(() => setShowHistory(false), 150)}
              onKeyDown={handleKeyDown}
              onFocusCapture={e => { e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255,140,0,0.15)'; }}
              onBlurCapture={e => { e.currentTarget.style.boxShadow = ''; }}
            />
            <div ref={searchActionsRef} className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
              {inputValue && (
                <button
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => { setInputValue(''); setQuery(''); }}
                  aria-label="検索内容を消去"
                  className="pointer-events-auto w-6 h-6 rounded-full bg-muted-foreground/15 hover:bg-muted-foreground/25 flex items-center justify-center tap-scale-sm transition-colors shrink-0">
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              )}
              <button onClick={() => executeSearch(inputValue)} disabled={isSearching}
                aria-label="検索を実行"
                className="pointer-events-auto flex items-center gap-1 bg-primary text-primary-foreground text-xs font-black px-2.5 py-1.5 rounded-lg tap-scale shadow-sm shadow-primary/20 shrink-0 whitespace-nowrap">
                {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Search className="w-3.5 h-3.5" /><span>検索</span></>}
              </button>
            </div>

            {/* 検索履歴ドロップダウン (Google Places Autocomplete は廃止: 課金回避のためローカル文字列検索のみに統一) */}
            <AnimatePresence>
              {showHistory && history.length > 0 ? (
                <motion.div key="history"
                  initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
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
              ) : null}
            </AnimatePresence>
          </div>

          {/* Row 2: カテゴリー + ソート + フィルター + ビュー切替 — 1行横スクロール */}
          <div className="flex gap-1.5 overflow-x-auto hide-scrollbar pb-0.5 items-center">
            {CATEGORIES.map(cat => (
              <button key={cat.value} onClick={() => { setCategory(cat.value === '' ? '' : cat.value); searchRef.current?.blur(); }}
                className={`whitespace-nowrap flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 border tap-scale
                  ${category === cat.value
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-card text-foreground border-border'
                  }`}>
                {cat.emoji ? <span className="text-sm leading-none">{cat.emoji}</span> : cat.icon}
                <span>{cat.label}</span>
              </button>
            ))}

            {/* 区切り線 */}
            <div className="w-px h-4 bg-border shrink-0 mx-0.5" />

            {/* 並び替え — リストビューのみ表示 */}
            {view === 'list' && (
              <div className="relative shrink-0">
                <button onClick={() => setShowSort(v => !v)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all tap-scale whitespace-nowrap
                    ${sort !== 'default' ? 'bg-primary/10 text-primary border-primary/30' : 'bg-card text-foreground border-border'}`}>
                  <ArrowUpDown className="w-3 h-3" />
                  {currentSortLabel}
                  <ChevronDown className={`w-2.5 h-2.5 transition-transform ${showSort ? 'rotate-180' : ''}`} />
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
            )}

            {/* 在庫あり — トグルスイッチUI */}
            <button
              onClick={() => setInStockOnly(v => !v)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg tap-scale whitespace-nowrap shrink-0 transition-all"
            >
              {/* スイッチ本体 */}
              <span className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out
                ${inStockOnly ? 'bg-emerald-500 shadow-[0_0_0_2px_rgba(16,185,129,0.2)]' : 'bg-muted-foreground/25'}`}>
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out
                  ${inStockOnly ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </span>
              <span className={`text-xs font-bold transition-colors ${inStockOnly ? 'text-emerald-700' : 'text-muted-foreground'}`}>
                在庫あり
              </span>
            </button>

            {/* エリア解除バッジ */}
            <AnimatePresence>
              {areaSearchActive && (
                <motion.button initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                  onClick={clearAreaSearch}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200 tap-scale whitespace-nowrap shrink-0">
                  <MapPin className="w-3 h-3" />エリア解除
                </motion.button>
              )}
            </AnimatePresence>

            {/* リセット */}
            <AnimatePresence>
              {(activeFilterCount > 0 || !!liveQuery) && (
                <motion.button initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                  onClick={clearAllFilters}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-destructive/10 text-destructive border border-destructive/20 tap-scale whitespace-nowrap shrink-0">
                  <X className="w-3 h-3" />リセット
                </motion.button>
              )}
            </AnimatePresence>

          </div>
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
                ref={mapViewRef}
                stores={displayStores}
                bags={bags || []}
                center={mapInitPos ?? undefined}
                userPosition={mapInitPos ?? undefined}
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
                  <p className="text-base font-black text-foreground">おすそわけを探しています...</p>
                  <p className="text-xs text-muted-foreground">「{inputValue}」で検索中</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* バッグ一覧 */}
            {!isSearching && (
              <div className="px-4 pt-3">
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
                        const storeLat = bag.store.lat;
                        const storeLng = bag.store.lng;
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
                      <h3 className="text-lg font-black text-foreground mb-2">今日のおすそわけを準備中</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        まだ出品がありません。<br />お近くのお店がおすそわけを準備中です！
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
