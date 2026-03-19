import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { MapView } from '@/components/Map';
import { BagCard } from '@/components/BagCard';
import { useListAllBags, useListStores } from '@workspace/api-client-react';
import { Search, Map as MapIcon, List, Store, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';

const CATEGORIES = ['全て', 'ベーカリー', 'レストラン', 'カフェ', 'スーパー', 'コンビニ'];

export default function Home() {
  const [viewMode, setViewMode] = useState<'both' | 'map' | 'list'>('both');
  const [activeCategory, setActiveCategory] = useState('全て');
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);

  const { data: bags, isLoading: isLoadingBags } = useListAllBags();
  const { data: stores, isLoading: isLoadingStores } = useListStores();

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserPosition([pos.coords.latitude, pos.coords.longitude]);
        },
        () => {},
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, []);

  const getCategoryKey = (label: string) => {
    switch (label) {
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
      <div className="flex flex-col h-[calc(100dvh-64px)] overflow-hidden">

        {/* Desktop Top Bar */}
        <div className="hidden md:flex items-center justify-between px-5 py-3 border-b border-border bg-background z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-black text-foreground">
              {userPosition ? '現在地周辺の出品' : '大阪エリアの出品'}
            </h1>
            <span className="bg-primary/10 text-primary px-2.5 py-1 rounded-full font-bold text-sm">
              {filteredBags.length}件
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/register-store">
              <button className="flex items-center gap-2 bg-primary text-primary-foreground font-bold px-4 py-2.5 rounded-xl text-sm hover:bg-primary/90 active:scale-95 transition-all shadow-sm">
                <Store className="w-4 h-4" />
                お店を登録する
              </button>
            </Link>
            <div className="flex bg-muted rounded-lg p-1">
              {(['both', 'map', 'list'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${viewMode === mode ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {mode === 'both' ? '両方' : mode === 'map' ? '地図のみ' : 'リストのみ'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile Top Bar */}
        <div className="md:hidden flex items-center bg-background border-b border-border z-10">
          <button
            onClick={() => setViewMode('list')}
            className={`flex-1 py-3.5 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${viewMode !== 'map' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
          >
            <List className="w-4 h-4" /> 一覧
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`flex-1 py-3.5 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${viewMode === 'map' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
          >
            <MapIcon className="w-4 h-4" /> 地図
          </button>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden relative bg-background">

          {/* MAP */}
          {(viewMode === 'both' || viewMode === 'map') && (
            <div className={`${viewMode === 'map' ? 'w-full' : 'hidden md:block w-1/2'} h-full relative z-0 bg-muted`}>
              {!isLoadingStores && stores ? (
                <MapView stores={stores} userPosition={userPosition} />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          )}

          {/* LIST */}
          {(viewMode === 'both' || viewMode === 'list') && (
            <div className={`${viewMode === 'list' ? 'w-full' : 'w-full md:w-1/2'} h-full flex flex-col relative z-10 bg-background md:border-l border-border`}>

              {/* Category Chips */}
              <div className="flex overflow-x-auto hide-scrollbar gap-2 px-4 py-3 border-b border-border/50 shrink-0 bg-background">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-all shadow-sm min-h-[36px]
                      ${activeCategory === cat
                        ? 'bg-primary text-primary-foreground shadow-primary/20'
                        : 'bg-card text-foreground border border-border hover:bg-secondary'
                      }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Store Registration Banner (mobile only) */}
              <Link href="/register-store" className="md:hidden mx-4 mt-3 shrink-0">
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Store className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-foreground">お店を登録する</div>
                      <div className="text-xs text-muted-foreground">初期費用0円・成果報酬型</div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </Link>

              {/* Bags List */}
              <div className="flex-1 overflow-y-auto p-4 md:p-5 bg-secondary/10">
                {isLoadingBags ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      show: { opacity: 1, transition: { staggerChildren: 0.07 } }
                    }}
                  >
                    {filteredBags.map(bag => (
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
                    <h3 className="text-lg font-bold text-foreground">該当するバッグがありません</h3>
                    <p className="text-muted-foreground mt-2 text-sm">別のカテゴリーを選択するか、後でもう一度チェックしてください。</p>
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
