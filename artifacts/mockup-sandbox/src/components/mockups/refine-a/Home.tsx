import React, { useState } from 'react';
import { Search, Bell, Map as MapIcon, ChevronDown } from 'lucide-react';
import { MobileFrame } from './_shared/MobileFrame';
import { BagCard } from './_shared/BagCard';
import { mockBags } from './_shared/mockBags';

const SCROLL_CATS = [
  { label: 'All', value: 'all', emoji: '✧' },
  { label: 'Meals', value: 'meals', emoji: '🍱' },
  { label: 'Bakery', value: 'bakery_sweets', emoji: '🥐' },
  { label: 'Ingredients', value: 'ingredients', emoji: '🥬' },
];

export default function Home() {
  const [activeCategory, setActiveCategory] = useState('all');
  
  const urgentBags = mockBags.filter(b => b.lowStock).slice(0, 4);
  const recommendedBags = mockBags.filter(b => !b.lowStock).slice(0, 4);

  return (
    <MobileFrame>
      <div className="flex-1 overflow-y-auto hide-scrollbar pb-32">
        {/* Header */}
        <header className="px-6 pt-14 pb-4 flex items-center justify-between sticky top-0 bg-[#FBFBFA]/90 backdrop-blur-md z-30">
          <div className="flex items-center gap-2">
            <span className="font-serif text-xl tracking-wider text-[#E8786C]">おすそわけ</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-[#2C2C2A] hover:opacity-70 transition-opacity">
              <Search className="w-5 h-5" strokeWidth={1.5} />
            </button>
            <button className="text-[#2C2C2A] hover:opacity-70 transition-opacity relative">
              <Bell className="w-5 h-5" strokeWidth={1.5} />
              <span className="absolute 1 top-0 right-0 w-2 h-2 bg-[#E8786C] rounded-full border border-[#FBFBFA]"></span>
            </button>
          </div>
        </header>

        {/* Categories */}
        <div className="px-6 py-4 flex gap-4 overflow-x-auto hide-scrollbar thin-border-b">
          {SCROLL_CATS.map(cat => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={`flex flex-col items-center gap-1 min-w-fit transition-opacity ${
                activeCategory === cat.value ? 'opacity-100' : 'opacity-40 hover:opacity-70'
              }`}
            >
              <span className="text-xl">{cat.emoji}</span>
              <span className="text-[10px] tracking-wider uppercase font-medium">{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Section: Urgent */}
        <section className="pt-10 pb-8">
          <div className="px-6 mb-6 flex items-end justify-between">
            <div>
              <h2 className="text-2xl mb-1">もうすぐ終わる</h2>
              <p className="en-title">Closing soon</p>
            </div>
            <button className="flex items-center gap-1 text-[11px] text-[#6B6862] tracking-wider uppercase">
              See all <ChevronDown className="w-3 h-3 -rotate-90" />
            </button>
          </div>
          
          <div className="flex overflow-x-auto hide-scrollbar px-6 gap-5 snap-x">
            {urgentBags.map(bag => (
              <div key={bag.id} className="snap-start">
                <BagCard bag={bag} />
              </div>
            ))}
          </div>
        </section>

        {/* Section: Recommended */}
        <section className="pt-8 pb-12 bg-[#F4F1EA]">
          <div className="px-6 mb-6 flex items-end justify-between">
            <div>
              <h2 className="text-2xl mb-1">今日のおすすめ</h2>
              <p className="en-title">Today's curation</p>
            </div>
            <button className="flex items-center gap-1 text-[11px] text-[#6B6862] tracking-wider uppercase">
              See all <ChevronDown className="w-3 h-3 -rotate-90" />
            </button>
          </div>
          
          <div className="flex overflow-x-auto hide-scrollbar px-6 gap-5 snap-x">
            {recommendedBags.map(bag => (
              <div key={bag.id} className="snap-start">
                <BagCard bag={bag} />
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Floating Map Button */}
      <button className="absolute bottom-8 right-6 w-14 h-14 bg-[#2C2C2A] rounded-full flex items-center justify-center text-[#FBFBFA] shadow-lg hover:scale-105 transition-transform z-40">
        <MapIcon className="w-6 h-6" strokeWidth={1.5} />
      </button>
    </MobileFrame>
  );
}