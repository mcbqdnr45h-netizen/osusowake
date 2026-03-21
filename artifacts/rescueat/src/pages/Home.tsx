import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Layout } from '@/components/Layout';
import { BagCard } from '@/components/BagCard';
import { useListAllBags, SurpriseBagWithStore } from '@workspace/api-client-react';
import {
  Search, Store, ChevronRight, Clock, Flame, Zap,
  SlidersHorizontal, ChevronDown, X, PackageOpen,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'wouter';
import { getCategoryIcon, getCategoryImage } from '@/lib/category-utils';
import { useFavorites } from '@/contexts/FavoritesContext';
import { Heart } from 'lucide-react';
import { useMyStore } from '@/hooks/use-my-store';

// ─── カテゴリー定義 ───────────────────────────────────────────────────────────
const CATEGORIES = [
  { label: 'すべて',         value: 'all',          emoji: '✨' },
  { label: 'パン・スイーツ', value: 'bakery',        emoji: '🍞' },
  { label: 'お弁当・惣菜',   value: 'restaurant',    emoji: '🍱' },
  { label: 'カフェ',         value: 'cafe',          emoji: '☕' },
  { label: 'スーパー',       value: 'supermarket',   emoji: '🛒' },
  { label: 'コンビニ',       value: 'convenience',   emoji: '🏪' },
  { label: 'その他',         value: 'other',         emoji: '🥗' },
];

type SortKey = 'default' | 'time_asc' | 'price_asc' | 'price_desc';
const SORT_OPTIONS: { label: string; value: SortKey }[] = [
  { label: 'おすすめ順',       value: 'default'   },
  { label: '時間が早い順',     value: 'time_asc'  },
  { label: '価格が安い順',     value: 'price_asc' },
  { label: '価格が高い順',     value: 'price_desc'},
];

// ─── キャンペーンバナー ───────────────────────────────────────────────────────
const BANNERS = [
  { id: 1, emoji: '🌱', title: '初回限定！レスキュー応援', highlight: '500円OFF',       sub: '初めての方限定クーポン配布中',          from: 'from-[#2D5A51]', to: 'to-[#4A8C7F]', accent: 'bg-white/20', badge: 'bg-white text-[#2D5A51]' },
  { id: 2, emoji: '🥐', title: '春のパン祭り！対象のパン屋さんが', highlight: 'ポイント2倍', sub: '3/20（木）〜3/31（日）の期間限定', from: 'from-amber-500', to: 'to-orange-400', accent: 'bg-white/20', badge: 'bg-white text-amber-600' },
  { id: 3, emoji: '🍱', title: 'お弁当レスキュー特集！', highlight: '今日のランチをお得に', sub: '在庫わずか・売切れ次第終了',             from: 'from-rose-500',  to: 'to-pink-400',   accent: 'bg-white/20', badge: 'bg-white text-rose-600'  },
];

function CampaignBanners() {
  const [active, setActive] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
            <motion.div key={b.id} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.35, ease: 'easeInOut' }}
              className={`bg-gradient-to-br ${b.from} ${b.to} px-5 py-5 flex items-center gap-4`}>
              <div className={`w-14 h-14 ${b.accent} rounded-2xl flex items-center justify-center shrink-0 text-3xl`}>{b.emoji}</div>
              <div className="flex-1 min-w-0">
                <p className="text-white/80 text-xs font-medium leading-none mb-1">{b.title}</p>
                <p className="text-white text-xl font-black leading-tight">{b.highlight}</p>
                <p className="text-white/70 text-xs mt-1">{b.sub}</p>
              </div>
              <span className={`${b.badge} text-xs font-black px-2.5 py-1.5 rounded-lg shrink-0 shadow-sm`}>詳しく</span>
            </motion.div>
          ) : null)}
        </AnimatePresence>
        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1.5">
          {BANNERS.map((_, i) => (
            <button key={i} onClick={() => { setActive(i); resetTimer(); }}
              className={`rounded-full transition-all duration-300 ${i === active ? 'w-5 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/40'}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── コンパクトカード ─────────────────────────────────────────────────────────
function CompactBagCard({ bag }: { bag: SurpriseBagWithStore }) {
  const { isFavorite, toggle } = useFavorites();
  const isSoldOut = bag.stockCount <= 0;
  const discountPercent = Math.round((1 - bag.discountedPrice / bag.originalPrice) * 100);
  const isLowStock = bag.stockCount > 0 && bag.stockCount < 3;
  const favorited = isFavorite(bag.store.id);

  return (
    <Link href={isSoldOut ? '#' : `/bags/${bag.id}`} onClick={e => isSoldOut && e.preventDefault()}
      className={`group block relative w-44 shrink-0 rounded-2xl overflow-hidden shadow-md border border-border/50 bg-card transition-all duration-200
        ${isSoldOut ? 'opacity-60 grayscale cursor-not-allowed' : 'hover:-translate-y-0.5 hover:shadow-lg'}`}>
      <div className="relative h-28 bg-muted overflow-hidden">
        <img src={bag.store.imageUrl || getCategoryImage(bag.store.category)} alt={bag.store.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute top-2 left-2">
          <span className="bg-white/90 backdrop-blur-sm text-foreground text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            {getCategoryIcon(bag.store.category)} {bag.store.name.slice(0, 6)}{bag.store.name.length > 6 ? '…' : ''}
          </span>
        </div>
        <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
          {!isSoldOut && <span className="bg-accent text-accent-foreground text-[10px] font-black px-1.5 py-0.5 rounded-md">{discountPercent}% OFF</span>}
          {isLowStock && <span className="bg-destructive text-destructive-foreground text-[9px] font-black px-1.5 py-0.5 rounded-md animate-pulse">残りわずか</span>}
        </div>
        <button onClick={e => { e.preventDefault(); e.stopPropagation(); toggle(bag.store.id); }}
          className={`absolute bottom-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all active:scale-90 ${favorited ? 'bg-rose-500' : 'bg-white/80 backdrop-blur-sm'}`}>
          <Heart className={`w-3 h-3 ${favorited ? 'fill-white stroke-white' : 'fill-none stroke-rose-400'}`} />
        </button>
      </div>
      <div className="p-2.5">
        <p className="font-bold text-foreground text-xs leading-tight line-clamp-1 mb-1.5">{bag.title}</p>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-1.5">
          <Clock className="w-2.5 h-2.5 shrink-0" />
          <span>{bag.pickupStart}-{bag.pickupEnd}</span>
        </div>
        <div className="flex items-end justify-between">
          <span className="text-[10px] text-muted-foreground line-through">¥{bag.originalPrice.toLocaleString()}</span>
          <span className="text-base font-black text-primary">¥{bag.discountedPrice.toLocaleString()}</span>
        </div>
      </div>
    </Link>
  );
}

function UrgentSection({ bags }: { bags: SurpriseBagWithStore[] }) {
  const urgentBags = bags.filter(b => b.stockCount > 0 && b.stockCount < 5).slice(0, 8);
  if (urgentBags.length === 0) return null;
  return (
    <div className="shrink-0 pt-2 pb-1">
      <div className="flex items-center gap-2 px-4 mb-3">
        <div className="flex items-center gap-1.5 bg-destructive/10 text-destructive px-2.5 py-1 rounded-full">
          <Flame className="w-3.5 h-3.5" />
          <span className="text-xs font-black">レスキュー急募！</span>
        </div>
        <span className="text-xs text-muted-foreground font-medium">まもなく終了</span>
      </div>
      <div className="flex gap-3 overflow-x-auto hide-scrollbar px-4 pb-1">
        {urgentBags.map(bag => <CompactBagCard key={bag.id} bag={bag} />)}
      </div>
    </div>
  );
}

function RecommendedSection({ bags }: { bags: SurpriseBagWithStore[] }) {
  const recommendedBags = bags.filter(b => b.stockCount > 0).slice(0, 8);
  if (recommendedBags.length === 0) return null;
  return (
    <div className="shrink-0 pt-2 pb-1">
      <div className="flex items-center justify-between px-4 mb-3">
        <div className="flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-primary" />
          <span className="text-sm font-black text-foreground">今日のおすすめ</span>
        </div>
        <span className="text-xs text-muted-foreground">{recommendedBags.length}件</span>
      </div>
      <div className="flex gap-3 overflow-x-auto hide-scrollbar px-4 pb-1">
        {recommendedBags.map(bag => <CompactBagCard key={bag.id} bag={bag} />)}
      </div>
    </div>
  );
}

// ─── メイン ───────────────────────────────────────────────────────────────────
export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('default');
  const [showSort, setShowSort] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const { isApprovedOwner } = useMyStore();
  const { data: bags, isLoading: isLoadingBags } = useListAllBags();

  // 絞り込みが active かどうか
  const isFiltering = searchQuery.trim() !== '' || activeCategory !== 'all' || inStockOnly || sortKey !== 'default';

  const filteredBags = useMemo(() => {
    let result = bags || [];

    // キーワード
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(b =>
        b.title.toLowerCase().includes(q) ||
        b.store.name.toLowerCase().includes(q) ||
        b.store.city?.toLowerCase().includes(q) ||
        b.store.category?.toLowerCase().includes(q)
      );
    }

    // カテゴリー
    if (activeCategory !== 'all') {
      result = result.filter(b => b.store.category === activeCategory);
    }

    // 在庫あり
    if (inStockOnly) {
      result = result.filter(b => b.stockCount > 0);
    }

    // 並び替え
    if (sortKey === 'time_asc') {
      result = [...result].sort((a, b) => (a.pickupStart || '').localeCompare(b.pickupStart || ''));
    } else if (sortKey === 'price_asc') {
      result = [...result].sort((a, b) => a.discountedPrice - b.discountedPrice);
    } else if (sortKey === 'price_desc') {
      result = [...result].sort((a, b) => b.discountedPrice - a.discountedPrice);
    }

    return result;
  }, [bags, searchQuery, activeCategory, inStockOnly, sortKey]);

  const allBags = bags || [];
  const activeFilterCount = [
    activeCategory !== 'all',
    inStockOnly,
    sortKey !== 'default',
  ].filter(Boolean).length;

  function clearAll() {
    setSearchQuery('');
    setActiveCategory('all');
    setInStockOnly(false);
    setSortKey('default');
  }

  const currentSortLabel = SORT_OPTIONS.find(o => o.value === sortKey)?.label || 'おすすめ順';

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100dvh-64px)] overflow-hidden">

        {/* ── Sticky ヘッダーエリア ── */}
        <div className="shrink-0 bg-background border-b border-border/50 z-20 shadow-sm">

          {/* Desktop top bar */}
          <div className="hidden md:flex items-center justify-between px-5 py-3 border-b border-border">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-black text-foreground">大阪エリアの出品</h1>
              <span className="bg-primary/10 text-primary px-2.5 py-1 rounded-full font-bold text-sm">
                {filteredBags.length}件
              </span>
            </div>
            {isApprovedOwner && (
              <Link href="/store-dashboard">
                <button className="flex items-center gap-2 bg-primary text-primary-foreground font-bold px-4 py-2.5 rounded-xl text-sm hover:bg-primary/90 active:scale-95 transition-all shadow-sm">
                  <Store className="w-4 h-4" />ダッシュボード
                </button>
              </Link>
            )}
          </div>

          {/* 検索バー */}
          <div className="px-4 pt-3 pb-2">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="お店や食べ物を検索..."
                className="w-full bg-secondary/60 border border-border text-foreground rounded-2xl pl-10 pr-10 py-3 text-sm font-medium focus:bg-card focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all placeholder:text-muted-foreground"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-muted-foreground/20 flex items-center justify-center active:scale-90">
                  <X className="w-3 h-3 text-muted-foreground" />
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
                className={`whitespace-nowrap flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm shrink-0 border
                  ${activeCategory === cat.value
                    ? 'bg-primary text-primary-foreground border-primary shadow-primary/20'
                    : 'bg-card text-foreground border-border hover:border-primary/40'
                  }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* 絞り込みコントロールバー */}
          <div className="flex items-center gap-2 px-4 pb-3 pt-1">

            {/* レスキュー待ちのみトグル */}
            <button
              onClick={() => setInStockOnly(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all
                ${inStockOnly
                  ? 'bg-green-100 text-green-700 border-green-300'
                  : 'bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
                }`}
            >
              {/* トグルドット */}
              <span className={`w-7 h-4 rounded-full flex items-center transition-colors ${inStockOnly ? 'bg-green-500' : 'bg-muted'}`}>
                <span className={`w-3 h-3 bg-white rounded-full shadow transition-transform mx-0.5 ${inStockOnly ? 'translate-x-3' : 'translate-x-0'}`} />
              </span>
              レスキュー待ちのみ
            </button>

            {/* 並び替えドロップダウン */}
            <div className="relative">
              <button
                onClick={() => setShowSort(v => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all
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
                    transition={{ duration: 0.15 }}
                    className="absolute top-full mt-1.5 left-0 z-50 bg-card border border-border rounded-2xl shadow-xl overflow-hidden min-w-[150px]"
                  >
                    {SORT_OPTIONS.map(opt => (
                      <button key={opt.value} onClick={() => { setSortKey(opt.value); setShowSort(false); }}
                        className={`w-full text-left px-4 py-3 text-xs font-bold transition-colors hover:bg-secondary
                          ${sortKey === opt.value ? 'text-primary bg-primary/5' : 'text-foreground'}`}>
                        {sortKey === opt.value && <span className="mr-1.5">✓</span>}
                        {opt.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* スペーサー */}
            <div className="flex-1" />

            {/* 件数 + リセット */}
            <div className="flex items-center gap-2">
              {isFiltering && (
                <span className="text-xs text-muted-foreground font-medium">{filteredBags.length}件</span>
              )}
              {activeFilterCount > 0 && (
                <button onClick={clearAll}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-destructive/8 text-destructive border border-destructive/20 hover:bg-destructive/15 transition-colors">
                  <X className="w-3 h-3" />
                  リセット
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── スクロールエリア ── */}
        <div className="flex-1 overflow-y-auto bg-secondary/10" onClick={() => showSort && setShowSort(false)}>

          <AnimatePresence mode="wait">
            {/* ── 絞り込みモード ── */}
            {isFiltering ? (
              <motion.div
                key="filtered"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="px-4 pt-4 pb-6"
              >
                {isLoadingBags ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-64 bg-card rounded-2xl animate-pulse border border-border" />)}
                  </div>
                ) : filteredBags.length > 0 ? (
                  <motion.div
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                    initial="hidden"
                    animate="show"
                    variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } }}
                  >
                    {filteredBags.map(bag => (
                      <motion.div key={bag.id} variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}>
                        <BagCard bag={bag} />
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  /* ── 空の状態 ── */
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center py-20 px-6"
                  >
                    <div className="w-24 h-24 bg-card border-2 border-dashed border-border rounded-3xl flex items-center justify-center mb-5 shadow-sm">
                      <PackageOpen className="w-10 h-10 text-muted-foreground/50" />
                    </div>
                    <h3 className="text-lg font-black text-foreground mb-2 text-center">
                      条件に一致するレスキュー先が<br />見つかりませんでした
                    </h3>
                    <p className="text-sm text-muted-foreground text-center mb-6 leading-relaxed">
                      検索キーワードや絞り込み条件を<br />変えてみてください
                    </p>
                    <button
                      onClick={clearAll}
                      className="px-6 py-2.5 bg-primary text-primary-foreground rounded-2xl text-sm font-bold shadow-md shadow-primary/20 active:scale-95 transition-transform"
                    >
                      条件をリセットする
                    </button>
                  </motion.div>
                )}
              </motion.div>

            ) : (
              /* ── 通常ホーム ── */
              <motion.div
                key="home"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {/* 急募セクション・おすすめ */}
                {!isLoadingBags && allBags.length > 0 && (
                  <>
                    <UrgentSection bags={allBags} />
                    <div className="mx-4 my-2 border-t border-border/40" />
                    <RecommendedSection bags={allBags} />
                    <div className="flex items-center justify-between px-4 pt-3 pb-2">
                      <span className="text-sm font-black text-foreground">すべての出品</span>
                      <span className="text-xs text-muted-foreground">{allBags.length}件</span>
                    </div>
                  </>
                )}

                {/* 店舗ダッシュボードバナー（モバイル） */}
                {isApprovedOwner && (
                  <Link href="/store-dashboard" className="md:hidden mx-4 mt-1 mb-3 block">
                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Store className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-bold text-sm text-foreground">店舗ダッシュボード</div>
                          <div className="text-xs text-muted-foreground">バッグ管理・予約確認</div>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </Link>
                )}

                {/* バッググリッド */}
                <div className="px-4 pb-4">
                  {isLoadingBags ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[1, 2, 3, 4].map(i => <div key={i} className="h-64 bg-card rounded-2xl animate-pulse border border-border" />)}
                    </div>
                  ) : allBags.length > 0 ? (
                    <motion.div
                      className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                      initial="hidden"
                      animate="show"
                      variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } }}
                    >
                      {allBags.map(bag => (
                        <motion.div key={bag.id} variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}>
                          <BagCard bag={bag} />
                        </motion.div>
                      ))}
                    </motion.div>
                  ) : (
                    <div className="text-center py-20 px-4">
                      <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-bold text-foreground">出品中の商品がありません</h3>
                      <p className="text-muted-foreground mt-2 text-sm">後でもう一度チェックしてください。</p>
                    </div>
                  )}
                </div>

                {/* キャンペーンバナー */}
                <CampaignBanners />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ソートドロップダウン外クリック */}
      {showSort && <div className="fixed inset-0 z-40" onClick={() => setShowSort(false)} />}
    </Layout>
  );
}
