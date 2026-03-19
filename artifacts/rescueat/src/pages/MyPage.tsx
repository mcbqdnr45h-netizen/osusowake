import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { useUserId } from '@/hooks/use-user';
import { useListReservations } from '@workspace/api-client-react';
import { User, Leaf, ShoppingBag, ChevronRight, Settings, HelpCircle, LogOut, Store as StoreIcon, X, MapPin } from 'lucide-react';
import { Link } from 'wouter';

function LimitedModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-6"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <MapPin className="w-6 h-6 text-primary" />
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <h3 className="text-lg font-black mb-2">先行公開エリア限定</h3>
        <p className="text-muted-foreground text-sm leading-relaxed mb-5">
          現在、<span className="font-bold text-foreground">吹田・高槻エリア限定の先行公開中</span>のため、この機能を制限しています。<br /><br />
          正式リリース時に順次開放予定です。ご不便をおかけして申し訳ありません。
        </p>
        <button
          onClick={onClose}
          className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl hover:bg-primary/90 active:scale-[0.98] transition-all"
        >
          閉じる
        </button>
      </div>
    </div>
  );
}

export default function MyPage() {
  const userId = useUserId();
  const [showLimited, setShowLimited] = useState(false);

  const { data: reservations } = useListReservations({ userId: userId || '' }, {
    query: { enabled: !!userId }
  });

  const pickedUpCount = reservations?.filter(r => r.status === 'picked_up').length || 0;
  const co2Saved = pickedUpCount * 2.5;

  return (
    <Layout>
      {showLimited && <LimitedModal onClose={() => setShowLimited(false)} />}

      <div className="max-w-md mx-auto py-8 px-4">
        <h1 className="text-2xl font-black mb-6 text-foreground">マイページ</h1>

        {/* Profile Card */}
        <div className="bg-card border border-border rounded-2xl p-6 flex items-center gap-4 mb-6 shadow-sm">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center text-primary shrink-0 border border-primary/30">
            <User className="w-8 h-8" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-foreground">ゲストユーザー</h2>
            <p className="text-sm text-muted-foreground mt-1 truncate">ID: {userId}</p>
          </div>
        </div>

        {/* Impact Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-5 text-center shadow-sm">
            <ShoppingBag className="w-8 h-8 text-primary mx-auto mb-2" />
            <div className="text-3xl font-black text-primary">{pickedUpCount}</div>
            <div className="text-xs font-bold text-primary/80 mt-1">レスキューした食事</div>
          </div>
          <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/5 border border-emerald-500/20 rounded-2xl p-5 text-center shadow-sm">
            <Leaf className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <div className="text-3xl font-black text-emerald-700">
              {co2Saved}<span className="text-lg font-bold ml-0.5">kg</span>
            </div>
            <div className="text-xs font-bold text-emerald-700/80 mt-1">削減したCO2排出量</div>
          </div>
        </div>

        {/* Menu List */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">

          {/* 店舗管理ダッシュボード → 承認ページへ */}
          <Link
            href="/admin-verify-shops"
            className="flex items-center gap-4 p-4 hover:bg-secondary/50 transition-colors border-b border-border"
          >
            <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center shrink-0">
              <StoreIcon className="w-5 h-5" />
            </div>
            <div className="flex-1 font-bold text-foreground">店舗管理ダッシュボード</div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </Link>

          {/* アカウント設定 → 制限ポップアップ */}
          <button
            onClick={() => setShowLimited(true)}
            className="w-full flex items-center gap-4 p-4 hover:bg-secondary/50 transition-colors border-b border-border text-left"
          >
            <div className="w-10 h-10 bg-muted text-muted-foreground rounded-full flex items-center justify-center shrink-0">
              <Settings className="w-5 h-5" />
            </div>
            <div className="flex-1 font-bold text-foreground">アカウント設定</div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

          {/* ヘルプ → 制限ポップアップ */}
          <button
            onClick={() => setShowLimited(true)}
            className="w-full flex items-center gap-4 p-4 hover:bg-secondary/50 transition-colors border-b border-border text-left"
          >
            <div className="w-10 h-10 bg-muted text-muted-foreground rounded-full flex items-center justify-center shrink-0">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div className="flex-1 font-bold text-foreground">ヘルプ・お問い合わせ</div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

          {/* ログアウト */}
          <button
            onClick={() => setShowLimited(true)}
            className="w-full flex items-center gap-4 p-4 hover:bg-destructive/5 transition-colors text-left text-destructive"
          >
            <div className="w-10 h-10 bg-destructive/10 text-destructive rounded-full flex items-center justify-center shrink-0">
              <LogOut className="w-5 h-5" />
            </div>
            <div className="flex-1 font-bold">ログアウト</div>
          </button>
        </div>

        {/* Area badge */}
        <div className="mt-6 bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 flex items-center gap-3">
          <MapPin className="w-4 h-4 text-primary shrink-0" />
          <p className="text-xs text-muted-foreground">
            <span className="font-bold text-foreground">吹田・高槻エリア</span>限定の先行公開中です。近日、大阪全域へ拡大予定。
          </p>
        </div>
      </div>
    </Layout>
  );
}
