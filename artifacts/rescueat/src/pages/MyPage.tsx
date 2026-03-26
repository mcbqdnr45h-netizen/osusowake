import React, { useEffect, useRef } from 'react';
import { Layout } from '@/components/Layout';
import { StoreLayout } from '@/components/StoreLayout';
import { useUserId } from '@/hooks/use-user';
import { useMyStore } from '@/hooks/use-my-store';
import { useListReservations } from '@workspace/api-client-react';
import { User, Leaf, ShoppingBag, ChevronRight, Settings, HelpCircle, LogOut, Store as StoreIcon, CreditCard, Receipt, Mail, Scale, Star, Clock, XCircle, FileCheck, Camera, MessageSquare } from 'lucide-react';
import { MyTown } from '@/components/MyTown';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';

export default function MyPage() {
  const userId = useUserId();
  const { store, loading: loadingStore, fetchError, isApprovedOwner, needsBankSetup } = useMyStore();
  const [, navigate] = useLocation();
  const { user, profile, isLoading: authLoading, signOut, refreshProfile } = useAuth();
  const roleFixedRef = useRef(false);

  // ── ストアがあるのに customer 表示の場合 → role を修正してプロフィールを再取得 ──
  useEffect(() => {
    if (!loadingStore && !authLoading && store && user && profile?.role !== 'store_owner' && !roleFixedRef.current) {
      roleFixedRef.current = true;
      const base = import.meta.env.BASE_URL?.replace(/\/$/, '') ?? '';
      fetch(`${base}/api/stores/fix-owner-role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerId: user.id }),
      })
        .then(() => refreshProfile())
        .catch(() => {});
    }
  }, [loadingStore, authLoading, store, user, profile?.role]);

  const { data: reservations } = useListReservations({ userId: userId || '' }, {
    query: { enabled: !!userId }
  });

  const pickedUpReservations = reservations?.filter(r => r.status === 'picked_up') || [];
  const pickedUpCount  = pickedUpReservations.length;
  const foodSavedKg    = +(pickedUpCount * 0.5).toFixed(1);
  const co2Saved       = +(pickedUpCount * 2.5).toFixed(1);

  async function handleLogout() {
    await signOut();
    navigate('/welcome');
  }

  const isStoreOwner = profile?.role === 'store_owner';

  // Auth確定前はスケルトン表示でフラッシュを防ぐ
  // キャッシュから store が読めている場合はスケルトン不要
  if (authLoading || (isStoreOwner && loadingStore && store === null)) {
    return (
      <Layout showBottomNav>
        <div className="max-w-md mx-auto py-8 px-4 pb-24 animate-pulse">
          <div className="h-8 w-32 bg-muted rounded-xl mb-6" />
          <div className="bg-card border border-border rounded-2xl p-5 mb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-muted rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-40 bg-muted rounded-lg" />
                <div className="h-4 w-24 bg-muted rounded-lg" />
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-2xl overflow-hidden mb-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 border-b border-border last:border-0">
                <div className="w-10 h-10 bg-muted rounded-full shrink-0" />
                <div className="h-4 flex-1 bg-muted rounded-lg" />
                <div className="w-4 h-4 bg-muted rounded" />
              </div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  const pageContent = (
    <div className="max-w-md mx-auto py-8 px-4 pb-24">
        <h1 className="text-2xl font-black mb-6 text-foreground">マイページ</h1>

        {/* Profile Card */}
        <div className="bg-card border border-border rounded-2xl p-5 mb-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center text-primary shrink-0 border border-primary/30">
              <User className="w-8 h-8" />
            </div>
            <div className="min-w-0 flex-1">
              {user ? (
                <>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-black text-foreground truncate">
                      {profile?.role === 'store_owner' && store?.name
                        ? store.name
                        : profile?.display_name || user.email?.split('@')[0] || user.email}
                    </h2>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0
                      ${profile?.role === 'store_owner'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                        : 'bg-primary/10 text-primary'
                      }`}>
                      {profile?.role === 'store_owner' ? '🏪 店舗オーナー' : '👤 お客様'}
                    </span>
                  </div>
                  {profile?.role === 'store_owner' && store?.name ? (
                    isApprovedOwner ? (
                      <p className="text-xs text-green-600 font-bold mt-1 flex items-center gap-1">
                        ✅ Stripe連携済み・公式パートナー
                      </p>
                    ) : (
                      <p className="text-xs text-amber-600 font-bold mt-1">公式パートナー（審査中）</p>
                    )
                  ) : (
                    <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
                      <Mail className="w-3 h-3" />
                      <span>{user.email}</span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <h2 className="text-xl font-bold text-foreground">ゲストユーザー</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    <Link href="/login" className="text-primary font-bold underline underline-offset-2">ログイン</Link>
                    {' '}または{' '}
                    <Link href="/signup" className="text-primary font-bold underline underline-offset-2">新規登録</Link>
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── おすそ分けスコア（カスタマーのみ） ── */}
        {!isStoreOwner && <div className="mb-4">

          {/* ヒーローカード：スコア全体 */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="relative rounded-2xl overflow-hidden mb-3 shadow-md"
            style={{ background: 'linear-gradient(135deg, #FF8C00 0%, #FF6B00 60%, #E55A00 100%)' }}
          >
            {/* 背景装飾円 */}
            <div className="absolute -top-6 -right-6 w-28 h-28 bg-white/10 rounded-full" />
            <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-white/5 rounded-full" />

            <div className="relative px-5 pt-5 pb-4">
              {/* 達成回数バッジ */}
              <div className="flex items-center justify-end mb-3">
                <div className="flex items-center gap-1 bg-white/20 px-2.5 py-1 rounded-full">
                  <Star className="w-3.5 h-3.5 text-yellow-200 fill-yellow-200" />
                  <span className="text-white text-xs font-black">{pickedUpCount}回</span>
                </div>
              </div>

              {/* メインメッセージ */}
              <div className="mb-1">
                <p className="text-white/80 text-xs font-medium mb-0.5">
                  あなたはこれまでに
                </p>
                <div className="flex items-end gap-2">
                  <span className="text-5xl font-black text-white leading-none">{foodSavedKg}</span>
                  <span className="text-white text-xl font-bold mb-1">kg</span>
                  <span className="text-white/80 text-sm font-bold mb-1.5">の食品ロスを防ぎました</span>
                </div>
              </div>

              {/* 称賛メッセージ */}
              <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2.5 mt-3">
                <p className="text-white font-black text-sm text-center">
                  {pickedUpCount === 0
                    ? '🌟 最初のおすそ分けで街が変わりはじめる！'
                    : pickedUpCount < 5
                    ? '🌾 素敵なスタートです！続けてみましょう'
                    : pickedUpCount < 15
                    ? '🌿 ナイスおすそ分け！街が育っています'
                    : '🏆 すごい！あなたは街の守護者です'
                  }
                </p>
              </div>
            </div>

            {/* 3統計バー */}
            <div className="bg-black/10 px-5 py-3 flex items-center justify-around border-t border-white/10">
              <div className="text-center">
                <div className="text-white font-black text-xl leading-none">{pickedUpCount}</div>
                <div className="text-white/70 text-[10px] font-bold mt-0.5 flex items-center gap-0.5">
                  <ShoppingBag className="w-3 h-3" />おすそ分け回数
                </div>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div className="text-center">
                <div className="text-white font-black text-xl leading-none">{foodSavedKg}</div>
                <div className="text-white/70 text-[10px] font-bold mt-0.5 flex items-center gap-0.5">
                  <Scale className="w-3 h-3" />削減食品量 (kg)
                </div>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div className="text-center">
                <div className="text-white font-black text-xl leading-none">{co2Saved}</div>
                <div className="text-white/70 text-[10px] font-bold mt-0.5 flex items-center gap-0.5">
                  <Leaf className="w-3 h-3" />CO2削減 (kg)
                </div>
              </div>
            </div>
          </motion.div>

        </div>}

        {/* ── マイタウン（カスタマーのみ・インライン表示）── */}
        {!isStoreOwner && (
          <MyTown purchaseCount={pickedUpCount} />
        )}

        {/* ── 店舗オーナー：接続エラー中（リトライ待機）── */}
        {profile?.role === 'store_owner' && !loadingStore && store === null && fetchError && (
          <div className="mb-4 bg-muted/50 border border-border rounded-2xl p-5 flex items-center gap-3">
            <div className="w-8 h-8 border-[3px] border-primary border-t-transparent rounded-full animate-spin shrink-0" />
            <div>
              <p className="font-bold text-foreground text-sm">店舗情報を確認中...</p>
              <p className="text-xs text-muted-foreground mt-0.5">しばらくお待ちください</p>
            </div>
          </div>
        )}

        {/* ── 店舗オーナー：未申請バナー（store が存在しない場合のみ） ── */}
        {profile?.role === 'store_owner' && !loadingStore && store === null && !fetchError && (
          <div className="mb-4 bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-primary/30 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
                <FileCheck className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-black text-foreground text-base">店舗申請がまだ完了していません</p>
                <p className="text-xs text-muted-foreground mt-0.5">審査通過後すぐに出品できます</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/store-onboarding')}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 px-4 rounded-lg shadow-md flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              <FileCheck className="w-5 h-5" />
              店舗情報を登録して申請する
            </button>
          </div>
        )}

        {/* ── 店舗オーナー：振込先口座が未登録（approved + stripeAccountId なし） ── */}
        {profile?.role === 'store_owner' && !loadingStore && needsBankSetup && (
          <div className="mb-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center shrink-0">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="font-black text-foreground text-base">振込先口座の登録が必要です</p>
                <p className="text-xs text-muted-foreground mt-0.5">売上を受け取るための口座を登録してください</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/store/bank-setup')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg shadow-md flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              <CreditCard className="w-5 h-5" />
              振込先口座を登録する
            </button>
          </div>
        )}

        {/* ── 店舗オーナー：口座登録済み・審査待ちバナー（applied） ── */}
        {profile?.role === 'store_owner' && !loadingStore && store?.status === 'applied' && (
          <div className="mb-4 bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-300 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-foreground text-base">申請受付完了 — 審査中</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  口座・本人確認情報を受け付けました。Stripeの審査がバックグラウンドで進行中です。
                </p>
              </div>
              <span className="ml-auto text-[10px] font-black bg-amber-100 text-amber-700 px-2 py-1 rounded-full shrink-0">審査中</span>
            </div>
          </div>
        )}

        {/* ── 店舗オーナー：承認済み・Stripe連携完了（緑カード） ── */}
        {profile?.role === 'store_owner' && !loadingStore && isApprovedOwner && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, type: 'spring', stiffness: 200, damping: 22 }}
            className="mb-4 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl p-5 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center shrink-0">
                <FileCheck className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-green-900 text-base leading-tight">
                  ✅ 公式アカウント認証済み
                </p>
                <p className="text-xs text-green-700 font-semibold mt-0.5">
                  入金設定完了 — 出品・売上受取が可能です
                </p>
              </div>
              <span className="text-[10px] font-black bg-green-200 text-green-800 px-2.5 py-1 rounded-full shrink-0 whitespace-nowrap">
                有効
              </span>
            </div>
          </motion.div>
        )}

        {/* Menu List */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">

          {!isStoreOwner && (
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
          )}


          {profile?.role === 'store_owner' && (store?.status === 'pending' || store?.status === 'pending_review' || store?.status === 'applied') && (
            <Link
              href="/store-dashboard"
              className="flex items-center gap-4 p-4 hover:bg-secondary/50 transition-colors border-b border-border"
            >
              <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-foreground">店舗申請 — 審査中</div>
                <div className="text-xs text-muted-foreground">1〜2営業日以内に結果をお知らせします</div>
              </div>
              <span className="text-[10px] font-black bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">審査中</span>
            </Link>
          )}

          {profile?.role === 'store_owner' && store?.status === 'rejected' && (
            <Link
              href="/store-dashboard"
              className="flex items-center gap-4 p-4 hover:bg-secondary/50 transition-colors border-b border-border"
            >
              <div className="w-10 h-10 bg-red-100 text-red-500 rounded-full flex items-center justify-center shrink-0">
                <XCircle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-foreground">店舗申請が却下されました</div>
                <div className="text-xs text-muted-foreground">詳細を確認・再申請する</div>
              </div>
              <span className="text-[10px] font-black bg-red-100 text-red-500 px-2 py-0.5 rounded-full">却下</span>
            </Link>
          )}

          {profile?.role === 'store_owner' && isApprovedOwner && (
            <Link
              href="/store/profile-edit"
              className="flex items-center gap-4 p-4 hover:bg-secondary/50 transition-colors border-b border-border"
            >
              <div className="w-10 h-10 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center shrink-0">
                <Camera className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-foreground">店舗プロフィール編集</div>
                <div className="text-xs text-muted-foreground">カバー写真・紹介文・営業時間など</div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </Link>
          )}

          {profile?.role === 'store_owner' && isApprovedOwner && (
            <Link
              href="/store/reviews"
              className="flex items-center gap-4 p-4 hover:bg-secondary/50 transition-colors border-b border-border"
            >
              <div className="w-10 h-10 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center shrink-0">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-foreground">お客様からのレビュー</div>
                <div className="text-xs text-muted-foreground">レビュー確認・返信管理</div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </Link>
          )}

          {profile?.role === 'store_owner' && isApprovedOwner && (
            <Link
              href="/store/legal"
              className="flex items-center gap-4 p-4 hover:bg-secondary/50 transition-colors border-b border-border"
            >
              <div className="w-10 h-10 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center shrink-0">
                <Scale className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-foreground">特定商取引法に基づく表記の設定</div>
                <div className="text-xs text-muted-foreground">販売事業者情報・法的表示事項</div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </Link>
          )}

          {!isStoreOwner && (
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
          )}

          <Link
            href="/help"
            className="flex items-center gap-4 p-4 hover:bg-secondary/50 transition-colors border-b border-border"
          >
            <div className="w-10 h-10 bg-secondary text-foreground rounded-full flex items-center justify-center shrink-0">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div className="flex-1 font-bold text-foreground">ヘルプ・お問い合わせ</div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </Link>

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

        {/* 法的情報リンク */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <Link href="/tokusho" className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors">
            特定商取引法に基づく表記
          </Link>
          <span className="text-muted-foreground/30 text-xs">|</span>
          <Link href="/terms" className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors">
            利用規約
          </Link>
          <span className="text-muted-foreground/30 text-xs">|</span>
          <Link href="/privacy" className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors">
            プライバシーポリシー
          </Link>
        </div>
        <p className="text-center text-[10px] text-muted-foreground/40 mt-2 mb-2">© 2025 OsusOwake All rights reserved.</p>
      </div>
  );

  if (isStoreOwner) {
    return <StoreLayout showHeader={false}>{pageContent}</StoreLayout>;
  }
  return <Layout>{pageContent}</Layout>;
}
