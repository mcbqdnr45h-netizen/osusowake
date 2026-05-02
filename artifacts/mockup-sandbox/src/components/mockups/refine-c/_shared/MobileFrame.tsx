import React from 'react';
import './tokens.css';

export function MobileFrame({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`refine-c-scope w-[420px] h-[900px] overflow-y-auto relative hide-scrollbar flex flex-col ${className}`} style={{ backgroundColor: 'var(--c-background)' }}>
      {children}
    </div>
  );
}