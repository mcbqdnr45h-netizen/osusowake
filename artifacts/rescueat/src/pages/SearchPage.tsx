import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { MapView } from '@/components/Map';
import { BagCard } from '@/components/BagCard';
import { useListAllBags, useListStores } from '@workspace/api-client-react';
import { Search, Map as MapIcon, List } from 'lucide-react';
import { motion } from 'framer-motion';

type ViewMode = 'map' | 'list';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [view, setView] = useState<ViewMode>('map');

  const { data: bags, isLoading: bagsLoading } = useListAllBags();
  const { data: stores } = useListStores();

  const filteredBags = bags?.filter(b =>
    !query ||
    b.title.toLowerCase().includes(query.toLowerCase()) ||
    b.store.name.toLowerCase().includes(query.toLowerCase()) ||
    b.store.city?.toLowerCase().includes(query.toLowerCase())
  ) || [];

  const filteredStoreIds = new Set(filteredBags.map(b => b.store.id));
  const displayStores = (stores || []).filter(s => !query || filteredStoreIds.has(s.id));

  return (
    <Layout>
      {/* ── マップビュー ── */}
      {view === 'map' && (
        <div className="relative" style={{ height: 'calc(100dvh - 64px)' }}>

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
            <MapView stores={displayStores} />
          </div>

        </div>
      )}

      {/* ── リストビュー ── */}
      {view === 'list' && (
        <div className="max-w-4xl mx-auto py-5 px-4">
          {/* 検索バー + トグル */}
          <div className="flex gap-2 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                className="w-full bg-card border-2 border-primary/20 text-foreground rounded-2xl pl-12 pr-4 py-3.5 text-base font-bold shadow-sm focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:font-normal placeholder:text-muted-foreground"
                placeholder="店舗名、商品名で検索..."
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>
            <button
              onClick={() => setView('map')}
              className="h-[52px] px-4 bg-primary text-primary-foreground rounded-2xl flex items-center gap-2 text-sm font-bold shadow-md shadow-primary/20 active:scale-95 transition-transform"
            >
              <MapIcon className="w-4 h-4" />
              地図
            </button>
          </div>

          {/* 件数表示 */}
          <div className="mb-4 flex items-center justify-between text-sm text-muted-foreground font-bold">
            <span>{query ? `「${query}」の検索結果: ${filteredBags.length}件` : `全${filteredBags.length}件のバッグ`}</span>
          </div>

          {/* バッグ一覧 */}
          {bagsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-64 bg-card rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : filteredBags.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredBags.map((bag, i) => (
                <motion.div
                  key={bag.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <BagCard bag={bag} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-card rounded-2xl border border-dashed border-border">
              <Search className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-foreground">見つかりませんでした</h3>
              <p className="text-muted-foreground mt-1 text-sm">別のキーワードをお試しください</p>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}
