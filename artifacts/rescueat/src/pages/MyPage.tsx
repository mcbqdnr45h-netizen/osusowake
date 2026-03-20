import React from 'react';
import { Layout } from '@/components/Layout';
import { useUserId } from '@/hooks/use-user';
import { useListReservations } from '@workspace/api-client-react';
import { User, Leaf, ShoppingBag, ChevronRight, Settings, HelpCircle, LogOut, Store as StoreIcon, Coins, Lock, Sparkles, CreditCard, Receipt } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { getUserEcoRank, getUserProgress } from '@/lib/eco-rank';

const POINT_RATE = 0.03;

export default function MyPage() {
  const userId = useUserId();
  const [, navigate] = useLocation();

  const { data: reservations } = useListReservations({ userId: userId || '' }, {
    query: { enabled: !!userId }
  });

  const pickedUpReservations = reservations?.filter(r => r.status === 'picked_up') || [];
  const pickedUpCount = pickedUpReservations.length;
  const co2Saved = +(pickedUpCount * 2.5).toFixed(1);
  const ecoRank = getUserEcoRank(co2Saved);
  const progress = getUserProgress(co2Saved, ecoRank);

  // Points calculation: 3% of total paid amount
  const totalSpent = pickedUpReservations.reduce((sum, r) => sum + (r.totalPrice || 0), 0);
  const totalPoints = Math.floor(totalSpent * POINT_RATE);

  function handleLogout() {
    navigate('/welcome');
  }

  return (
    <Layout>
      <div className="max-w-md mx-auto py-8 px-4 pb-24">
        <h1 className="text-2xl font-black mb-6 text-foreground">マイページ</h1>

        {/* Profile Card */}
        <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4 mb-4 shadow-sm">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center text-primary shrink-0 border border-primary/30">
            <User className="w-8 h-8" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-foreground">ゲストユーザー</h2>
            <p className="text-sm text-muted-foreground mt-1 truncate">ID: {userId}</p>
          </div>
        </div>

        {/* ── Points Card ── */}
        <div className="mb-4 rounded-2xl overflow-hidden shadow-sm border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
          {/* Top: balance */}
          <div className="px-5 pt-5 pb-4">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-500" />
                <span className="font-black text-amber-800 text-sm">保有ポイント</span>
              </div>
              <span className="text-xs text-amber-600 font-medium bg-amber-100 px-2 py-0.5 rounded-full">
                {(POINT_RATE * 100).toFixed(0)}%還元
              </span>
            </div>
            <div className="flex items-end gap-1.5 mt-2">
              <span className="text-4xl font-black text-amber-500 leading-none">{totalPoints.toLocaleString()}</span>
              <span className="text-lg font-bold text-amber-400 mb-0.5">pt</span>
            </div>
            {totalSpent > 0 && (
              <p className="text-xs text-amber-600 mt-1">
                累計購入額 ¥{totalSpent.toLocaleString()} の {(POINT_RATE * 100).toFixed(0)}%分
              </p>
            )}
          </div>

          {/* Bottom: Coming Soon redemption */}
          <div className="mx-4 mb-4 bg-white/70 backdrop-blur-sm border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-black text-amber-700">ポイント利用</span>
                <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  近日公開予定
                </span>
              </div>
              <p className="text-[11px] text-amber-600 mt-0.5 leading-relaxed">
                今のうちにポイントを貯めておきましょう！
              </p>
            </div>
          </div>

          {/* Earn note */}
          <div className="px-5 pb-5">
            <div className="h-px bg-amber-200 mb-3" />
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <p className="text-xs text-amber-600">
                購入のたびに <span className="font-black">{(POINT_RATE * 100).toFixed(0)}%</span> のポイントが貯まります
              </p>
            </div>
          </div>
        </div>

        {/* Impact Stats */}
        <div className="mb-4">
          {/* Rescue count */}
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-5 text-center shadow-sm mb-3">
            <ShoppingBag className="w-8 h-8 text-primary mx-auto mb-2" />
            <div className="text-3xl font-black text-primary">{pickedUpCount}</div>
            <div className="text-xs font-bold text-primary/80 mt-1">レスキューした食事</div>
          </div>

          {/* Eco rank CO2 card */}
          <div className={`border-2 rounded-2xl p-5 shadow-sm transition-all duration-500 ${ecoRank.sectionBg} ${ecoRank.sectionBorder}`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-black ${ecoRank.badgeBg} ${ecoRank.badgeText}`}>
                <span className="text-base leading-none">{ecoRank.icon}</span>
                {ecoRank.label}
              </div>
              <div className={`text-xs font-bold px-2 py-1 rounded-lg ${ecoRank.valueBg} ${ecoRank.labelText}`}>
                Lv.{ecoRank.rank}
              </div>
            </div>

            <div className="flex items-end gap-1 mb-1">
              <Leaf className={`w-6 h-6 mb-1 ${ecoRank.valueText}`} />
              <span className={`text-4xl font-black leading-none ${ecoRank.valueText}`}>{co2Saved}</span>
              <span className={`text-base font-bold mb-0.5 ${ecoRank.labelText}`}>kg</span>
              <span className={`text-xs font-bold mb-1 ml-1 ${ecoRank.labelText}`}>CO2削減</span>
            </div>

            {ecoRank.rank < 3 && (
              <div className="mt-3">
                <div className={`w-full h-2 rounded-full ${ecoRank.rank === 1 ? 'bg-green-200 dark:bg-green-800' : 'bg-emerald-300 dark:bg-emerald-700'} overflow-hidden`}>
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${ecoRank.progressColor}`}
                    style={{ width: `${Math.max(4, progress)}%` }}
                  />
                </div>
                <p className={`text-[10px] font-bold mt-1.5 ${ecoRank.labelText}`}>{ecoRank.sublabel}</p>
              </div>
            )}
            {ecoRank.rank === 3 && (
              <p className={`text-xs font-bold mt-2 ${ecoRank.labelText}`}>{ecoRank.sublabel}</p>
            )}
          </div>
        </div>

        {/* Menu List */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">

          <Link
            href="/orders"
            className="flex items-center gap-4 p-4 hover:bg-secondary/50 transition-colors border-b border-border"
          >
            <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center shrink-0">
              <Receipt className="w-5 h-5" />
            </div>
            <div className="flex-1 font-bold text-foreground">購入履歴・領収書</div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </Link>

          <Link
            href="/payment-methods"
            className="flex items-center gap-4 p-4 hover:bg-secondary/50 transition-colors border-b border-border"
          >
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div className="flex-1 font-bold text-foreground">支払い管理センター</div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </Link>

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

          <Link
            href="/settings"
            className="flex items-center gap-4 p-4 hover:bg-secondary/50 transition-colors border-b border-border"
          >
            <div className="w-10 h-10 bg-secondary text-foreground rounded-full flex items-center justify-center shrink-0">
              <Settings className="w-5 h-5" />
            </div>
            <div className="flex-1 font-bold text-foreground">アカウント設定</div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </Link>

          <a
            href="https://forms.gle/uhMoXjjF9YzkR52a6"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-4 hover:bg-secondary/50 transition-colors border-b border-border"
          >
            <div className="w-10 h-10 bg-secondary text-foreground rounded-full flex items-center justify-center shrink-0">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div className="flex-1 font-bold text-foreground">ヘルプ・お問い合わせ</div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </a>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 p-4 hover:bg-destructive/5 transition-colors text-left text-destructive"
          >
            <div className="w-10 h-10 bg-destructive/10 text-destructive rounded-full flex items-center justify-center shrink-0">
              <LogOut className="w-5 h-5" />
            </div>
            <div className="flex-1 font-bold">ログアウト</div>
          </button>
        </div>
      </div>
    </Layout>
  );
}
