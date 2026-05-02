import React from 'react';
import './tokens.css';

export function MobileFrame({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`refine-a-scope w-full h-[900px] max-w-[420px] mx-auto relative overflow-hidden bg-[#FBFBFA] flex flex-col ${className}`}>
      {/* 偽のステータスバー余白用 */}
      {children}
    </div>
  );
}