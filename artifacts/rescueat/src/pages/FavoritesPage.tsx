import React from 'react';
import { Layout } from '@/components/Layout';
import { Heart } from 'lucide-react';

export default function FavoritesPage() {
  return (
    <Layout>
      <div className="max-w-3xl mx-auto py-12 px-4 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6 shadow-sm border border-primary/20">
          <Heart className="w-12 h-12 text-primary" />
        </div>
        <h1 className="text-2xl font-black mb-3 text-foreground">お気に入り機能は準備中です</h1>
        <p className="text-muted-foreground font-medium max-w-md leading-relaxed">
          よく行くお店を登録して、新着のサプライズバッグの通知を受け取れる機能を開発中です。お楽しみに！
        </p>
        <button className="mt-8 bg-primary text-primary-foreground font-bold px-8 py-3.5 rounded-full shadow-lg hover:bg-primary/90 transition-all active:scale-95">
          一覧に戻る
        </button>
      </div>
    </Layout>
  );
}
