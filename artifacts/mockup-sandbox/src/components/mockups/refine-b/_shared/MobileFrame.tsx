import React from 'react';
import './tokens.css';

export function MobileFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full min-h-screen bg-neutral-100 flex items-center justify-center p-4 sm:p-8">
      <div 
        className="refine-b-scope relative w-full max-w-[420px] h-[900px] overflow-y-auto overflow-x-hidden shadow-2xl rounded-[40px] border-[8px] border-white/50"
      >
        {/* Mock Status Bar Spacing */}
        <div className="w-full pt-12 pb-8 px-4 h-full flex flex-col">
          {children}
        </div>
      </div>
    </div>
  );
}
