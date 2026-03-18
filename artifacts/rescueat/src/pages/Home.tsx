import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { MapView } from '@/components/Map';
import { BagCard } from '@/components/BagCard';
import { useListAllBags, useListStores } from '@workspace/api-client-react';
import { Search, Map as MapIcon, List } from 'lucide-react';
import { motion } from 'framer-motion';

const CATEGORIES = ['全て', 'ベーカリー', 'レストラン', 'カフェ', 'スーパー', 'コンビニ'];

export default function Home() {
  const [viewMode, setViewMode] = useState<'both' | 'map' | 'list'>('both');
  const [activeCategory, setActiveCategory] = useState('全て');
  
  const { data: bags, isLoading: isLoadingBags } = useListAllBags();
  const { data: stores, isLoading: isLoadingStores } = useListStores();

  const getCategoryKey = (label: string) => {
    switch(label) {
      case 'ベーカリー': return 'bakery';
      case 'レストラン': return 'restaurant';
      case 'カフェ': return 'cafe';
      case 'スーパー': return 'supermarket';
      case 'コンビニ': return 'convenience';
      default: return 'all';
    }
  };

  const filteredBags = bags?.filter(bag => {
    if (activeCategory !== '全て') {
      if (bag.store.category !== getCategoryKey(activeCategory)) return false;
    }
    return true;
  }) || [];

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-64px)] md:h-[calc(100vh-64px)] overflow-hidden">
        
        {/* Top View Toggle & Filters (Desktop) */}
        <div className="hidden md:flex items-center justify-between p-4 border-b border-border bg-background z-10 shadow-sm">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-foreground">大阪エリアの出品</h1>
            <span className="bg-primary/10 text-primary px-2 py-1 rounded font-bold text-sm ml-2">
              {filteredBags.length}件
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex bg-muted rounded-lg p-1">
              <button 
                onClick={() => setViewMode('both')}
                className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${viewMode === 'both' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                両方
              </button>
              <button 
                onClick={() => setViewMode('map')}
                className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${viewMode === 'map' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                地図のみ
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${viewMode === 'list' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                リストのみ
              </button>
            </div>
          </div>
        </div>

        {/* Mobile View Toggle */}
        <div className="md:hidden flex bg-background border-b border-border z-10">
          <button 
            onClick={() => setViewMode('list')}
            className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${viewMode !== 'map' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
          >
            <List className="w-4 h-4" /> 一覧
          </button>
          <button 
            onClick={() => setViewMode('map')}
            className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${viewMode === 'map' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
          >
            <MapIcon className="w-4 h-4" /> 地図
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex flex-1 overflow-hidden relative bg-background">
          
          {/* MAP VIEW */}
          {(viewMode === 'both' || viewMode === 'map') && (
            <div className={`${viewMode === 'map' ? 'w-full' : 'hidden md:block w-1/2'} h-full relative z-0 bg-muted`}>
              {!isLoadingStores && stores ? (
                <MapView stores={stores} />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
          )}

          {/* LIST VIEW */}
          {(viewMode === 'both' || viewMode === 'list') && (
            <div className={`${viewMode === 'list' ? 'w-full' : 'w-full md:w-1/2'} h-full flex flex-col relative z-10 bg-background md:border-l border-border`}>
              
              {/* Category Filter Chips */}
              <div className="flex overflow-x-auto hide-scrollbar gap-2 p-4 border-b border-border/50 shrink-0 bg-background/80 backdrop-blur">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-all shadow-sm
                      ${activeCategory === cat 
                        ? 'bg-primary text-primary-foreground shadow-primary/20' 
                        : 'bg-card text-foreground border border-border hover:bg-secondary'
                      }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Bags List */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-secondary/10">
                {isLoadingBags ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="h-64 bg-card rounded-2xl animate-pulse border border-border" />
                    ))}
                  </div>
                ) : filteredBags.length > 0 ? (
                  <motion.div 
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-8"
                    initial="hidden"
                    animate="show"
                    variants={{
                      hidden: { opacity: 0 },
                      show: { opacity: 1, transition: { staggerChildren: 0.1 } }
                    }}
                  >
                    {filteredBags.map(bag => (
                      <motion.div key={bag.id} variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
                        <BagCard bag={bag} />
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <div className="text-center py-20 px-4">
                    <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">該当するバッグがありません</h3>
                    <p className="text-muted-foreground mt-2 text-sm">
                      別のカテゴリーを選択するか、後でもう一度チェックしてください。
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
