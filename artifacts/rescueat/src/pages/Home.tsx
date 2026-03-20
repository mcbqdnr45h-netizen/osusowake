import React, { useState, useEffect, useRef } from 'react';
import { Layout } from '@/components/Layout';
import { MapView } from '@/components/Map';
import { BagCard } from '@/components/BagCard';
import { useListAllBags, useListStores, SurpriseBagWithStore } from '@workspace/api-client-react';
import { Search, Map as MapIcon, List, Store, ChevronRight, Clock, Flame, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'wouter';
import { getCategoryIcon, getCategoryImage } from '@/lib/category-utils';
import { useFavorites } from '@/contexts/FavoritesContext';
import { Heart } from 'lucide-react';

const CATEGORIES = ['全て', 'ベーカリー', 'レストラン', 'カフェ', 'スーパー', 'コンビニ'];

const BANNERS = [
  {
    id: 1,
    emoji: '🌱',
    title: '初回限定！レスキュー応援',
    highlight: '500円OFF',
    sub: '初めての方限定クーポン配布中',
    from: 'from-[#2D5A51]',
    to: 'to-[#4A8C7F]',
    accent: 'bg-white/20',
    badge: 'bg-white text-[#2D5A51]',
  },
  {
    id: 2,
    emoji: '🥐',
    title: '春のパン祭り！対象のパン屋さんが',
    highlight: 'ポイント2倍',
    sub: '3/20（木）〜3/31（日）の期間限定',
    from: 'from-amber-500',
    to: 'to-orange-400',
    accent: 'bg-white/20',
    badge: 'bg-white text-amber-600',
  },
  {
    id: 3,
    emoji: '🍱',
    title: 'お弁当レスキュー特集！',
    highlight: '今日のランチをお得に',
    sub: '在庫わずか・売切れ次第終了',
    from: 'from-rose-500',
    to: 'to-pink-400',
    accent: 'bg-white/20',
    badge: 'bg-white text-rose-600',
  },
];

function CampaignBanners() {
  const [active, setActive] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function resetTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActive(prev => (prev + 1) % BANNERS.length);
    }, 4000);
  }

  useEffect(() => {
    resetTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  return (
    <div className="shrink-0 px-4 pt-4 pb-2">
      <div className="relative overflow-hidden rounded-2xl shadow-md">
        <AnimatePresence mode="wait">
          {BANNERS.map((b, i) =>
            i === active ? (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.35, ease: 'easeInOut' }}
                className={`bg-gradient-to-br ${b.from} ${b.to} px-5 py-5 flex items-center gap-4`}
              >
                <div className={`w-14 h-14 ${b.accent} rounded-2xl flex items-center justify-center shrink-0 text-3xl`}>
                  {b.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white/80 text-xs font-medium leading-none mb-1">{b.title}</p>
                  <p className="text-white text-xl font-black leading-tight">{b.highlight}</p>
                  <p className="text-white/70 text-xs mt-1">{b.sub}</p>
                </div>
                <span className={`${b.badge} text-xs font-black px-2.5 py-1.5 rounded-lg shrink-0 shadow-sm`}>
                  詳しく
                </span>
              </motion.div>
            ) : null
          )}
        </AnimatePresence>

        {/* Dots */}
        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1.5">
          {BANNERS.map((_, i) => (
            <button
              key={i}
              onClick={() => { setActive(i); resetTimer(); }}
              className={`rounded-full transition-all duration-300 ${i === active ? 'w-5 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/40'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function CompactBagCard({ bag }: { bag: SurpriseBagWithStore }) {
  const { isFavorite, toggle } = useFavorites();
  const isSoldOut = bag.stockCount <= 0;
  const discountPercent = Math.round((1 - bag.discountedPrice / bag.originalPrice) * 100);
  const isLowStock = bag.stockCount > 0 && bag.stockCount < 3;
  const favorited = isFavorite(bag.store.id);

  return (
    <Link
      href={isSoldOut ? '#' : `/bags/${bag.id}`}
      onClick={(e) => isSoldOut && e.preventDefault()}
      className={`group block relative w-44 shrink-0 rounded-2xl overflow-hidden shadow-md border border-border/50 bg-card transition-all duration-200 ${isSoldOut ? 'opacity-60 grayscale cursor-not-allowed' : 'hover:-translate-y-0.5 hover:shadow-lg'}`}
    >
      {/* Image */}
      <div className="relative h-28 bg-muted overflow-hidden">
        <img
          src={bag.store.imageUrl || getCategoryImage(bag.store.category)}
          alt={bag.store.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

        {/* Badges */}
        <div className="absolute top-2 left-2">
          <span className="bg-white/90 backdrop-blur-sm text-foreground text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            {getCategoryIcon(bag.store.category)} {bag.store.name.slice(0, 6)}{bag.store.name.length > 6 ? '…' : ''}
          </span>
        </div>
        <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
          {!isSoldOut && (
            <span className="bg-accent text-accent-foreground text-[10px] font-black px-1.5 py-0.5 rounded-md">
              {discountPercent}% OFF
            </span>
          )}
          {isLowStock && (
            <span className="bg-destructive text-destructive-foreground text-[9px] font-black px-1.5 py-0.5 rounded-md animate-pulse">
              残りわずか
            </span>
          )}
        </div>

        {/* Heart */}
        <button
          onClick={e => { e.preventDefault(); e.stopPropagation(); toggle(bag.store.id); }}
          className={`absolute bottom-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all active:scale-90 ${favorited ? 'bg-rose-500' : 'bg-white/80 backdrop-blur-sm'}`}
        >
          <Heart className={`w-3 h-3 ${favorited ? 'fill-white stroke-white' : 'fill-none stroke-rose-400'}`} />
        </button>
      </div>

      {/* Info */}
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
        {urgentBags.map(bag => (
          <CompactBagCard key={bag.id} bag={bag} />
        ))}
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
        {recommendedBags.map(bag => (
          <CompactBagCard key={bag.id} bag={bag} />
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const [viewMode, setViewMode] = useState<'both' | 'map' | 'list'>('both');
  const [activeCategory, setActiveCategory] = useState('全て');
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);

  const { data: bags, isLoading: isLoadingBags } = useListAllBags();
  const { data: stores, isLoading: isLoadingStores } = useListStores();

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

  const allBags = bags || [];

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
            <div className={`${viewMode === 'list' ? 'w-full' : 'w-full md:w-1/2'} h-full flex flex-col relative z-10 bg-background md:border-l border-border overflow-hidden`}>

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

              {/* Scrollable content area */}
              <div className="flex-1 overflow-y-auto bg-secondary/10">

                {/* ── Campaign Banners ── */}
                <CampaignBanners />

                {/* ── Urgent / Recommended sections (only when no category filter) ── */}
                {activeCategory === '全て' && !isLoadingBags && allBags.length > 0 && (
                  <>
                    <UrgentSection bags={allBags} />

                    <div className="mx-4 my-2 border-t border-border/40" />

                    <RecommendedSection bags={allBags} />

                    {/* All bags section header */}
                    <div className="flex items-center justify-between px-4 pt-3 pb-2">
                      <span className="text-sm font-black text-foreground">すべての出品</span>
                      <span className="text-xs text-muted-foreground">{filteredBags.length}件</span>
                    </div>
                  </>
                )}

                {/* Store Registration Banner (mobile only) */}
                <Link href="/register-store" className="md:hidden mx-4 mt-1 mb-3 block shrink-0">
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

                {/* ── All Bags Grid ── */}
                <div className="px-4 pb-8">
                  {isLoadingBags ? (
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
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
