import React, { useState, useMemo } from 'react';
import { Layout } from '@/components/Layout';
import { MapView } from '@/components/Map';
import { BagCard } from '@/components/BagCard';
import { useListAllBags, useListStores } from '@workspace/api-client-react';
import { Search, Map as MapIcon, List, SlidersHorizontal, X, ChevronDown, ArrowUpDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type ViewMode = 'map' | 'list';
type SortKey = 'default' | 'price_asc' | 'price_desc' | 'stock_desc';

const CATEGORIES = [
  { label: '全て', value: '' },
  { label: '🥐 ベーカリー', value: 'bakery' },
  { label: '🍱 レストラン', value: 'restaurant' },
  { label: '☕ カフェ', value: 'cafe' },
  { label: '🛒 スーパー', value: 'supermarket' },
  { label: '🏪 コンビニ', value: 'convenience' },
];

const SORT_OPTIONS: { label: string; value: SortKey }[] = [
  { label: 'おすすめ順', value: 'default' },
  { label: '価格が安い順', value: 'price_asc' },
  { label: '価格が高い順', value: 'price_desc' },
  { label: '在庫が多い順', value: 'stock_desc' },
];

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [view, setView] = useState<ViewMode>('map');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState<SortKey>('default');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [showSort, setShowSort] = useState(false);

  const { data: bags, isLoading: bagsLoading } = useListAllBags();
  const { data: stores } = useListStores();

  const filteredBags = useMemo(() => {
    let result = bags || [];

    // テキスト検索
    if (query) {
      const q = query.toLowerCase();
      result = result.filter(b =>
        b.title.toLowerCase().includes(q) ||
        b.store.name.toLowerCase().includes(q) ||
        b.store.city?.toLowerCase().includes(q) ||
        b.store.category?.toLowerCase().includes(q)
      );
    }

    // カテゴリ絞り込み
    if (category) {
      result = result.filter(b => b.store.category === category);
    }

    // 在庫あり絞り込み
    if (inStockOnly) {
      result = result.filter(b => b.stockCount > 0);
    }

    // ソート
    if (sort === 'price_asc') {
      result = [...result].sort((a, b) => a.discountedPrice - b.discountedPrice);
    } else if (sort === 'price_desc') {
      result = [...result].sort((a, b) => b.discountedPrice - a.discountedPrice);
    } else if (sort === 'stock_desc') {
      result = [...result].sort((a, b) => b.stockCount - a.stockCount);
    }

    return result;
  }, [bags, query, category, sort, inStockOnly]);

  const filteredStoreIds = new Set(filteredBags.map(b => b.store.id));
  const displayStores = (stores || []).filter(s => !query || filteredStoreIds.has(s.id));

  const activeFilterCount = [
    category !== '',
    inStockOnly,
    sort !== 'default',
  ].filter(Boolean).length;

  const currentSortLabel = SORT_OPTIONS.find(o => o.value === sort)?.label || 'おすすめ順';

  function clearAllFilters() {
    setCategory('');
    setInStockOnly(false);
    setSort('default');
    setQuery('');
  }

  return (
    <Layout hideFooter={view === 'map'}>
      {/* ── マップビュー ── */}
      {view === 'map' && (
        <div className="relative h-[calc(100dvh_-_144px)] md:h-[calc(100dvh_-_64px)]">
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
          <div className="absolute inset-0">
            <MapView stores={displayStores} />
          </div>
        </div>
      )}

      {/* ── リストビュー ── */}
      {view === 'list' && (
        <div className="max-w-4xl mx-auto pb-6">

          {/* ── 検索バー ── */}
          <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border/50 px-4 pt-4 pb-3 space-y-3">

            {/* Row 1: 検索 + 地図切替 */}
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

            {/* Row 2: カテゴリチップ */}
            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-0.5">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 border
                    ${category === cat.value
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-card text-foreground border-border hover:border-primary/50'
                    }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Row 3: ソート + 在庫フィルター + リセット */}
            <div className="flex items-center gap-2">
              {/* ソートボタン */}
              <div className="relative">
                <button
                  onClick={() => setShowSort(v => !v)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all
                    ${sort !== 'default' ? 'bg-primary/10 text-primary border-primary/30' : 'bg-card text-foreground border-border hover:border-primary/40'}`}
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  {currentSortLabel}
                  <ChevronDown className={`w-3 h-3 transition-transform ${showSort ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {showSort && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full mt-1.5 left-0 z-50 bg-card border border-border rounded-2xl shadow-xl overflow-hidden min-w-[160px]"
                    >
                      {SORT_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => { setSort(opt.value); setShowSort(false); }}
                          className={`w-full text-left px-4 py-3 text-xs font-bold transition-colors hover:bg-secondary
                            ${sort === opt.value ? 'text-primary bg-primary/5' : 'text-foreground'}`}
                        >
                          {sort === opt.value && <span className="mr-1.5">✓</span>}
                          {opt.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 在庫ありトグル */}
              <button
                onClick={() => setInStockOnly(v => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all
                  ${inStockOnly ? 'bg-green-100 text-green-700 border-green-300' : 'bg-card text-foreground border-border hover:border-primary/40'}`}
              >
                <span className={`w-2 h-2 rounded-full ${inStockOnly ? 'bg-green-500' : 'bg-muted-foreground/40'}`} />
                在庫あり
              </button>

              {/* スペーサー */}
              <div className="flex-1" />

              {/* 件数 + リセット */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium">{filteredBags.length}件</span>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 transition-colors"
                  >
                    <X className="w-3 h-3" />
                    リセット ({activeFilterCount})
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ── バッグ一覧 ── */}
          <div className="px-4 pt-4">
            {bagsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-64 bg-card rounded-2xl animate-pulse border border-border" />
                ))}
              </div>
            ) : filteredBags.length > 0 ? (
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                initial="hidden"
                animate="show"
                variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } }}
              >
                {filteredBags.map((bag, i) => (
                  <motion.div
                    key={bag.id}
                    variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
                  >
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
                  <button
                    onClick={clearAllFilters}
                    className="mt-4 px-5 py-2 bg-primary text-primary-foreground rounded-full text-sm font-bold"
                  >
                    絞り込みをリセット
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ソートドロップダウン外クリックで閉じる */}
      {showSort && (
        <div className="fixed inset-0 z-40" onClick={() => setShowSort(false)} />
      )}
    </Layout>
  );
}
