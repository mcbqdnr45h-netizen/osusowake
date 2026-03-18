import React from 'react';
import { Link, useLocation } from 'wouter';
import { Map, ShoppingBag, Store, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LayoutProps {
  children: React.ReactNode;
  showBottomNav?: boolean;
}

export function Layout({ children, showBottomNav = true }: LayoutProps) {
  const [location] = useLocation();

  const navItems = [
    { href: '/', icon: Map, label: '探す' },
    { href: '/my-reservations', icon: ShoppingBag, label: '予約' },
    { href: '/store-dashboard', icon: Store, label: '店舗' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground pb-[80px] md:pb-0 flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <img 
              src={`${import.meta.env.BASE_URL}images/logo.png`} 
              alt="RescuEat Logo" 
              className="w-10 h-10 rounded-xl shadow-sm group-hover:scale-105 transition-transform"
            />
            <span className="font-display font-bold text-2xl tracking-tight text-primary">
              Rescu<span className="text-foreground">Eat</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link 
                key={item.href} 
                href={item.href}
                className={`font-medium transition-colors hover:text-primary ${
                  location === item.href ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <div className="flex items-center gap-2 bg-secondary/50 px-3 py-1.5 rounded-full ml-4">
              <User className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-secondary-foreground">ゲスト</span>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Nav */}
      {showBottomNav && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border shadow-[0_-10px_30px_rgba(0,0,0,0.05)] pb-safe">
          <div className="flex items-center justify-around h-16 px-2">
            {navItems.map((item) => {
              const isActive = location === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative flex flex-col items-center justify-center w-full h-full space-y-1"
                >
                  <div className={`p-1.5 rounded-full transition-all duration-300 ${isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}>
                    <Icon className={`w-6 h-6 ${isActive ? 'fill-primary/20' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                    {item.label}
                  </span>
                  {isActive && (
                    <motion.div 
                      layoutId="bottom-nav-indicator"
                      className="absolute top-0 w-8 h-1 bg-primary rounded-b-full"
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
