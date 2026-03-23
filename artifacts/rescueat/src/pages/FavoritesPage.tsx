import React from 'react';
import { Layout } from '@/components/Layout';
import { StoreLayout } from '@/components/StoreLayout';
import { Heart, Store, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'wouter';
import { useListAllBags, useListStores } from '@workspace/api-client-react';
import { useFavorites } from '@/contexts/FavoritesContext';
import { BagCard } from '@/components/BagCard';
import { getCategoryIcon } from '@/lib/category-utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function FavoritesPage() {
  const { profile } = useAuth();
  const { favorites, toggle, isFavorite } = useFavorites();
  const { data: bags, isLoading: bagsLoading } = useListAllBags();
  const { data: stores, isLoading: storesLoading } = useListStores();

  const isLoading = bagsLoading || storesLoading;
  const isStoreOwner = profile?.role === 'store_owner';

  const favoriteStores = stores?.filter(s => isFavorite(s.id)) ?? [];

  const favoriteBags = bags?.filter(b => isFavorite(b.store.id)) ?? [];

  const content = (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-24">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center">
            <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
          </div>
          <div>
            <h1 className="text-2xl font-black">お気に入り</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {favoriteStores.length > 0
                ? `${favoriteStores.length}店舗をフォロー中`
                : 'お気に入りの店舗をフォローしましょう'}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-card rounded-2xl animate-pulse border border-border" />
            ))}
          </div>
        ) : favoriteStores.length === 0 ? (
          /* ── Empty State ── */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center min-h-[60vh] text-center"
          >
            <div className="relative mb-6">
              <div className="w-28 h-28 bg-rose-50 border-2 border-rose-100 rounded-full flex items-center justify-center">
                <Heart className="w-14 h-14 text-rose-200" strokeWidth={1.5} />
              </div>
              <div className="absolute -bottom-1 -right-1 text-3xl">🛍️</div>
            </div>
            <h2 className="text-xl font-black mb-2 text-foreground">
              まだお気に入り店舗がありません
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mb-8">
              お店のカードにある <Heart className="inline w-3.5 h-3.5 text-rose-400" /> をタップして、<br />
              お気に入りの店舗をフォローしましょう！
            </p>
            <Link href="/">
              <button className="flex items-center gap-2 bg-primary text-primary-foreground font-bold px-8 py-3.5 rounded-full shadow-lg hover:bg-primary/90 transition-all active:scale-95">
                お店を探してみる
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </motion.div>
        ) : (
          <>
            {/* Favorite Stores Chips */}
            <div className="mb-6">
              <h2 className="text-sm font-bold text-muted-foreground mb-3 uppercase tracking-wide">フォロー中の店舗</h2>
              <div className="flex flex-wrap gap-2">
                {favoriteStores.map(store => (
                  <button
                    key={store.id}
                    onClick={() => toggle(store.id)}
                    className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-full text-sm font-bold hover:bg-rose-100 transition-colors group"
                  >
                    <span>{getCategoryIcon(store.category)}</span>
                    <span>{store.name}</span>
                    <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500 group-hover:fill-none group-hover:text-rose-400 transition-all" />
                  </button>
                ))}
              </div>
            </div>

            {/* Bags from Favorited Stores */}
            <div>
              <h2 className="text-sm font-bold text-muted-foreground mb-3 uppercase tracking-wide flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5" />
                お気に入り店舗の出品中バッグ
                {favoriteBags.length > 0 && (
                  <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full font-black text-xs">
                    {favoriteBags.length}件
                  </span>
                )}
              </h2>

              {favoriteBags.length === 0 ? (
                <div className="text-center py-12 bg-card rounded-2xl border-2 border-dashed border-border">
                  <div className="text-4xl mb-3">😴</div>
                  <p className="font-bold text-foreground mb-1">現在出品中のバッグはありません</p>
                  <p className="text-xs text-muted-foreground">
                    お気に入り店舗が出品したら、ここに表示されます
                  </p>
                </div>
              ) : (
                <AnimatePresence>
                  <motion.div
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                    initial="hidden"
                    animate="show"
                    variants={{
                      hidden: { opacity: 0 },
                      show: { opacity: 1, transition: { staggerChildren: 0.07 } },
                    }}
                  >
                    {favoriteBags.map(bag => (
                      <motion.div
                        key={bag.id}
                        variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
                      >
                        <BagCard bag={bag} />
                      </motion.div>
                    ))}
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          </>
        )}
      </div>
  );

  if (isStoreOwner) return <StoreLayout showHeader={false}>{content}</StoreLayout>;
  return <Layout>{content}</Layout>;
}
