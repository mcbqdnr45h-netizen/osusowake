import React, { useState } from 'react';
import { MobileFrame } from './_shared/MobileFrame';
import { mockBags } from './_shared/mockBags';
import { BagCard } from './_shared/BagCard';
import { Search, MapPin, SlidersHorizontal, Bell } from 'lucide-react';

export default function Home() {
  const [activeCat, setActiveCat] = useState('all');

  const categories = [
    { id: 'all', label: 'すべて' },
    { id: 'meals', label: 'お惣菜・弁当' },
    { id: 'bakery_sweets', label: 'パン・スイーツ' },
    { id: 'ingredients', label: '食材' },
  ];

  const urgentBags = mockBags.filter(b => b.lowStock && !b.soldOut);
  const recommendedBags = mockBags.filter(b => !b.soldOut);

  return (
    <MobileFrame>
      <div className="flex flex-col h-full relative">
        
        {/* Header */}
        <header className="flex flex-col gap-4 mb-6 relative z-10">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-black text-[var(--rb-text)] tracking-tight">おすそわけ</h1>
            <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-[var(--rb-shadow-card)] relative">
              <Bell className="w-5 h-5 text-[var(--rb-text-muted)]" />
              <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-[var(--rb-primary)] rounded-full border-2 border-white" />
            </button>
          </div>

          <div className="flex gap-2">
            <div className="flex-1 h-12 bg-white rounded-2xl shadow-[var(--rb-shadow-card)] flex items-center px-4 gap-2 border border-[var(--rb-border)]">
              <Search className="w-5 h-5 text-[var(--rb-text-muted)] opacity-60" />
              <input 
                type="text" 
                placeholder="お店や料理を検索" 
                className="bg-transparent border-none outline-none text-sm w-full placeholder-[var(--rb-text-muted)]"
              />
            </div>
            <button className="w-12 h-12 bg-white rounded-2xl shadow-[var(--rb-shadow-card)] flex items-center justify-center border border-[var(--rb-border)] shrink-0">
              <SlidersHorizontal className="w-5 h-5 text-[var(--rb-text)]" />
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto rb-no-scrollbar pb-1 pt-1 -mx-4 px-4">
            {categories.map(c => (
              <button
                key={c.id}
                onClick={() => setActiveCat(c.id)}
                className={`px-4 py-2 rounded-2xl text-sm font-bold whitespace-nowrap transition-all border ${
                  activeCat === c.id 
                    ? 'bg-[var(--rb-text)] text-white border-[var(--rb-text)] shadow-[var(--rb-shadow-card)]'
                    : 'bg-white text-[var(--rb-text-muted)] border-[var(--rb-border)] shadow-sm'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto rb-no-scrollbar pb-24 -mx-4 px-4 flex flex-col gap-8 relative z-10">
          
          <section>
            <div className="flex justify-between items-end mb-3">
              <h2 className="text-lg font-bold text-[var(--rb-text)]">もうすぐ終わるおすそわけ</h2>
            </div>
            <div className="flex gap-3 overflow-x-auto rb-no-scrollbar pb-2 -mx-4 px-4">
              {urgentBags.map(bag => (
                <div key={bag.id} className="shrink-0">
                  <BagCard bag={bag} compact />
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[var(--rb-text)] mb-3">今日のおすすめ</h2>
            <div className="flex flex-col">
              {recommendedBags.map(bag => (
                <BagCard key={bag.id} bag={bag} />
              ))}
            </div>
          </section>

        </div>

        {/* Floating Map Button */}
        <div className="absolute bottom-6 right-0 z-50">
          <button className="rb-btn flex items-center gap-2 px-5 py-3.5 shadow-xl">
            <MapPin className="w-5 h-5" />
            <span>マップを見る</span>
          </button>
        </div>

      </div>
    </MobileFrame>
  );
}
