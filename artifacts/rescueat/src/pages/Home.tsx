import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { MapView } from '@/components/Map';
import { BagCard } from '@/components/BagCard';
import { useListAllBags, useListStores } from '@workspace/api-client-react';
import { MapPin, Search, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: bags, isLoading: isLoadingBags } = useListAllBags();
  const { data: stores, isLoading: isLoadingStores } = useListStores();

  const filteredBags = bags?.filter(bag => 
    bag.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    bag.store.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <Layout>
      <div className="flex flex-col md:flex-row h-[calc(100vh-64px)] md:h-[calc(100vh-64px)] overflow-hidden relative">
        
        {/* Mobile Search Bar - Absolute over map */}
        <div className="md:hidden absolute top-4 left-4 right-4 z-10">
          <div className="bg-background/90 backdrop-blur-xl border border-border rounded-2xl shadow-lg p-2 flex items-center gap-2">
            <Search className="w-5 h-5 text-muted-foreground ml-2" />
            <input 
              type="text" 
              placeholder="お店や食事を探す..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none focus:ring-0 outline-none text-sm placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Map Section - Top half on mobile, left half on desktop */}
        <div className="h-[40vh] md:h-full md:w-1/2 lg:w-[55%] relative flex-shrink-0 z-0 bg-muted">
          {!isLoadingStores && stores ? (
            <MapView stores={stores} />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>

        {/* List Section - Bottom half on mobile, right half on desktop */}
        <div className="flex-1 bg-secondary/30 rounded-t-3xl md:rounded-none -mt-6 md:mt-0 relative z-20 shadow-[0_-8px_30px_-15px_rgba(0,0,0,0.1)] md:shadow-none overflow-y-auto hide-scrollbar">
          <div className="p-4 md:p-6 lg:p-8">
            
            {/* Desktop Header */}
            <div className="hidden md:flex justify-between items-center mb-8">
              <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  レスキューを待っている食事 <Sparkles className="w-5 h-5 text-accent" />
                </h1>
                <p className="text-muted-foreground mt-1">現在地周辺のサプライズバッグ</p>
              </div>
              <div className="bg-background border border-border rounded-xl shadow-sm p-2 flex items-center gap-2 w-64">
                <Search className="w-4 h-4 text-muted-foreground ml-2" />
                <input 
                  type="text" 
                  placeholder="検索..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent border-none focus:ring-0 outline-none text-sm placeholder:text-muted-foreground"
                />
              </div>
            </div>

            {/* Mobile Drag Indicator */}
            <div className="w-12 h-1.5 bg-border rounded-full mx-auto mb-4 md:hidden" />

            <div className="md:hidden flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold">現在地周辺</h2>
            </div>

            {/* Bags Grid */}
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
              <div className="text-center py-16 px-4">
                <img 
                  src={`${import.meta.env.BASE_URL}images/empty-bag.png`} 
                  alt="No bags found" 
                  className="w-32 h-32 mx-auto mb-4 opacity-80"
                />
                <h3 className="text-lg font-bold text-foreground">バッグが見つかりません</h3>
                <p className="text-muted-foreground mt-2 text-sm">
                  条件を変えて検索するか、後でもう一度チェックしてください。
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
