import React from 'react';
import { MobileFrame } from './_shared/MobileFrame';
import { BagCard } from './_shared/BagCard';
import { mockBags } from './_shared/mockBags';
import { Search, Bell, Map as MapIcon, ChevronRight } from 'lucide-react';

export default function Home() {
  const urgentBags = mockBags.filter(b => b.lowStock && !b.soldOut).slice(0, 3);
  const recommendedBags = mockBags.filter(b => !b.soldOut).slice(0, 5);

  return (
    <MobileFrame>
      {/* Header */}
      <header className="px-6 pt-14 pb-4 sticky top-0 z-20 backdrop-blur-xl" style={{ backgroundColor: 'rgba(251,251,250,0.85)' }}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <img src="/__mockup/images/refine-c/logo.png" alt="logo" className="w-8 h-8 rounded-lg object-cover border border-[#E8E4DF]" />
            <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--c-primary)' }}>Osusowake</h1>
          </div>
          <div className="flex gap-3">
            <button className="w-10 h-10 rounded-full flex items-center justify-center border transition-colors hover:bg-gray-50" style={{ borderColor: 'var(--c-border)', color: 'var(--c-text-main)' }}>
              <Search className="w-5 h-5" />
            </button>
            <button className="w-10 h-10 rounded-full flex items-center justify-center border relative transition-colors hover:bg-gray-50" style={{ borderColor: 'var(--c-border)', color: 'var(--c-text-main)' }}>
              <Bell className="w-5 h-5" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--c-primary)' }} />
            </button>
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-6 px-6 pb-2">
          {['すべて', '料理・お惣菜', 'パン・スイーツ', '食材・その他'].map((cat, i) => (
            <button 
              key={cat}
              className={`px-4 py-2 rounded-full text-[13px] font-bold whitespace-nowrap transition-colors border ${i === 0 ? '' : 'bg-transparent'}`}
              style={{
                backgroundColor: i === 0 ? 'var(--c-primary)' : 'var(--c-surface)',
                color: i === 0 ? 'white' : 'var(--c-text-main)',
                borderColor: i === 0 ? 'var(--c-primary)' : 'var(--c-border)'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 pb-24">
        {/* Section 1: Urgent */}
        <section className="mt-6">
          <div className="px-6 mb-4 flex items-end justify-between">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-mag-num text-[40px] leading-none" style={{ color: 'var(--c-primary)' }}>01</span>
                <div className="h-0.5 w-8" style={{ backgroundColor: 'var(--c-primary)' }} />
              </div>
              <h2 className="text-xl text-mag-title">もうすぐ終わる</h2>
              <p className="text-xs font-bold uppercase tracking-widest mt-1" style={{ color: 'var(--c-text-muted)' }}>Ending Soon</p>
            </div>
            <button className="flex items-center text-xs font-bold pb-1" style={{ color: 'var(--c-primary)' }}>
              すべて見る <ChevronRight className="w-4 h-4 ml-0.5" />
            </button>
          </div>
          
          <div className="px-6 flex flex-col gap-6">
            {urgentBags.map(bag => (
              <BagCard key={`urgent-${bag.id}`} bag={bag} />
            ))}
          </div>
        </section>

        <div className="h-px w-full my-8" style={{ backgroundColor: 'var(--c-border)' }} />

        {/* Section 2: Recommended */}
        <section>
          <div className="px-6 mb-4 flex items-end justify-between">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-mag-num text-[40px] leading-none" style={{ color: 'var(--c-text-main)' }}>02</span>
                <div className="h-0.5 w-8" style={{ backgroundColor: 'var(--c-text-main)' }} />
              </div>
              <h2 className="text-xl text-mag-title">今日のおすすめ</h2>
              <p className="text-xs font-bold uppercase tracking-widest mt-1" style={{ color: 'var(--c-text-muted)' }}>Today's Pick</p>
            </div>
            <button className="flex items-center text-xs font-bold pb-1" style={{ color: 'var(--c-text-main)' }}>
              すべて見る <ChevronRight className="w-4 h-4 ml-0.5" />
            </button>
          </div>

          <div className="px-6 flex flex-col gap-6">
            {recommendedBags.map(bag => (
              <BagCard key={`rec-${bag.id}`} bag={bag} />
            ))}
          </div>
        </section>
      </main>

      {/* Floating Map Button */}
      <button 
        className="fixed bottom-8 right-6 w-16 h-16 rounded-full flex items-center justify-center shadow-xl transition-transform hover:scale-105 z-50 animate-c-pulse"
        style={{ backgroundColor: 'var(--c-text-main)', color: 'white' }}
      >
        <MapIcon className="w-6 h-6" />
      </button>

    </MobileFrame>
  );
}