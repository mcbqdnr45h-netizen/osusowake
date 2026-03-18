import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { useListAllBags } from '@workspace/api-client-react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { BagCard } from '@/components/BagCard';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const { data: bags, isLoading } = useListAllBags();

  const filteredBags = bags?.filter(b => 
    b.title.toLowerCase().includes(query.toLowerCase()) || 
    b.store.name.toLowerCase().includes(query.toLowerCase())
  ) || [];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-6 px-4">
        <div className="relative mb-8">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="h-6 w-6 text-muted-foreground" />
          </div>
          <input
            type="text"
            className="w-full bg-card border-2 border-primary/20 text-foreground rounded-2xl pl-12 pr-12 py-4 text-lg font-bold shadow-sm focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:font-normal placeholder:text-muted-foreground"
            placeholder="店舗名、商品名で検索..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="absolute inset-y-0 right-4 flex items-center">
            <SlidersHorizontal className="h-6 w-6 text-primary hover:text-primary/80 transition-colors" />
          </button>
        </div>

        <div className="mb-4 text-muted-foreground font-bold flex items-center justify-between">
          <span>{query ? `「${query}」の検索結果: ${filteredBags.length}件` : 'おすすめのバッグ'}</span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-64 bg-card rounded-2xl animate-pulse" />)}
          </div>
        ) : filteredBags.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredBags.map(bag => (
              <BagCard key={bag.id} bag={bag} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-card rounded-2xl border border-dashed border-border">
            <Search className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-foreground">見つかりませんでした</h3>
            <p className="text-muted-foreground mt-1">別のキーワードをお試しください</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
