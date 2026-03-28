import React, { useEffect, useRef, useState } from 'react';
import { Layout } from '@/components/Layout';
import { useUserId } from '@/hooks/use-user';
import { useMyStore } from '@/hooks/use-my-store';
import { useListReservations } from '@workspace/api-client-react';
import { User, Leaf, ShoppingBag, Heart, ChevronRight, Settings, HelpCircle, LogOut, Store as StoreIcon, CreditCard, Receipt, Mail, Scale, Star, Clock, XCircle, FileCheck, Camera, MessageSquare, Bell, Megaphone, CheckCircle, Flag, ShieldCheck, ArrowLeft } from 'lucide-react';
import { MyTown } from '@/components/MyTown';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const ADMIN_EMAIL = 'yuuhi0125416@icloud.com';

export default function MyPage() {
  const userId = useUserId();
  const { store, loading: loadingStore, fetchError, isApprovedOwner, needsBankSetup } = useMyStore();
  const [, navigate] = useLocation();
  const { user, profile, session, isLoading: authLoading, signOut, refreshProfile } = useAuth();

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

  // ── お知らせ（通知）──
  const [notifications, setNotifications] = useState<{ id: number; title: string; body: string; type: string; read: boolean; createdAt: string }[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // スクロールロック
  useEffect(() => {
    if (showSettings) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showSettings]);

  useEffect(() => {
    if (!userId || !session?.access_token) return;
    const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, '') || '';
    fetch(`${BASE_URL}/api/notifications`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then(r => r.ok ? r.json() : { notifications: [], unreadCount: 0 })
      .then(d => { setNotifications(d.notifications || []); setUnreadCount(d.unreadCount || 0); })
      .catch(() => {});
  }, [userId, session?.access_token]);

  async function handleLogout() {
    await signOut();
    navigate('/welcome');
  }

  const isStoreOwner = profile?.role === 'store_owner';
  const isAdmin = user?.email === ADMIN_EMAIL;

  // Auth確定前はスケルトン表示でフラッシュを防ぐ
  // キャッシュから store が読めている場合はスケルトン不要
  if (authLoading || (isStoreOwner && loadingStore && store === null)) {
    return (
      <Layout showBottomNav>
        <div className="w-full py-8 px-4 pb-24 animate-pulse">
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
    <div
      className="w-full px-4 pb-24"
      style={{ paddingTop: '1.5rem' }}
    >
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-lg font-black text-foreground">マイページ</h1>
          <div className="flex items-center gap-2">
            {userId && (
              <button
                onClick={() => setShowNotifications(v => !v)}
                className="relative p-2 rounded-xl bg-secondary/60 hover:bg-secondary transition-colors">
                <Bell className="w-5 h-5 text-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-destructive text-white text-[10px] font-black rounded-full flex items-center justify-center px-1">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            )}
            {!isStoreOwner && (
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 rounded-xl bg-secondary/60 hover:bg-secondary transition-colors">
                <Settings className="w-5 h-5 text-foreground" />
              </button>
            )}
          </div>
        </div>

        {/* お知らせパネル */}
        {showNotifications && (
          <div className="bg-card rounded-2xl border border-border mb-4 overflow-hidden"
            style={{ boxShadow: '0 2px 8px -1px rgba(10,8,6,0.08)' }}>
            <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
              <span className="font-black text-sm text-foreground flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-primary" />お知らせ
              </span>
              <button onClick={() => setShowNotifications(false)} className="text-xs text-muted-foreground hover:text-foreground">閉じる</button>
            </div>
            {notifications.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-muted-foreground">お知らせはありません</p>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {notifications.slice(0, 8).map(n => (
                  <div key={n.id} className={`px-4 py-3 ${!n.read ? 'bg-primary/[0.03]' : ''}`}>
                    <div className="flex items-start gap-2.5">
                      {(() => {
                        switch (n.type) {
                          case 'new_bag':         return <ShoppingBag className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />;
                          case 'bag_sold':        return <Receipt className="w-3.5 h-3.5 text-green-600 shrink-0 mt-0.5" />;
                          case 'pickup_reminder': return <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />;
                          case 'store_approved':  return <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />;
                          case 'store_rejected':  return <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />;
                          default:                return <Megaphone className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />;
                        }
                      })()}
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-bold ${!n.read ? 'text-foreground' : 'text-muted-foreground'}`}>{n.title}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{n.body}</p>
                        <p className="text-[10px] text-muted-foreground/50 mt-1">
                          {new Date(n.createdAt).toLocaleDateString('ja-JP')}
                        </p>
                      </div>
                      {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-card rounded-2xl p-3 mb-2"
          style={{ boxShadow: '0 2px 8px -1px rgba(10,8,6,0.08), 0 1px 3px -1px rgba(10,8,6,0.04)' }}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center text-primary shrink-0 border border-primary/30">
              <User className="w-6 h-6" />
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

        {/* ── おすそわけスコア（カスタマーのみ） ── */}
        {!isStoreOwner && <div className="mb-2 -mx-4">

          {/* ヒーローカード：スコア全体 */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="relative overflow-hidden mb-0"
            style={{ background: 'linear-gradient(135deg, #FF8C00 0%, #FF6B00 60%, #E55A00 100%)' }}
          >
            {/* 背景装飾円 */}
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />
            <div className="absolute -bottom-3 -left-3 w-16 h-16 bg-white/5 rounded-full" />

            <div className="relative px-4 pt-2.5 pb-2">
              {/* 達成回数バッジ */}
              <div className="flex items-center justify-end mb-1">
                <div className="flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full">
                  <Star className="w-3 h-3 text-yellow-200 fill-yellow-200" />
                  <span className="text-white text-[11px] font-black">{pickedUpCount}回</span>
                </div>
              </div>

              {/* メインメッセージ */}
              <div className="mb-0">
                <p className="text-white/80 text-[10px] font-medium mb-0">
                  あなたはこれまでに
                </p>
                <div className="flex items-end gap-1.5">
                  <span className="text-3xl font-black text-white leading-none">{foodSavedKg}</span>
                  <span className="text-white text-sm font-bold mb-0.5">kg</span>
                  <span className="text-white/80 text-[11px] font-bold mb-0.5">の食品ロスを防ぎました</span>
                </div>
              </div>

              {/* 称賛メッセージ */}
              <div className="bg-white/15 backdrop-blur-sm rounded-xl px-3 py-1.5 mt-1.5">
                <p className="text-white font-black text-[11px] text-center">
                  {pickedUpCount === 0
                    ? '🌟 最初のおすそわけで街が変わりはじめる！'
                    : pickedUpCount < 5
                    ? '🌾 素敵なスタートです！続けてみましょう'
                    : pickedUpCount < 15
                    ? '🌿 ナイスおすそわけ！街が育っています'
                    : '🏆 すごい！あなたは街の守護者です'
                  }
                </p>
              </div>
            </div>

            {/* 3統計バー */}
            <div className="bg-black/10 px-4 py-1.5 flex items-center justify-around border-t border-white/10">
              <div className="text-center">
                <div className="text-white font-black text-sm leading-none">{pickedUpCount}</div>
                <div className="text-white/70 text-[10px] font-bold mt-0.5 flex items-center gap-0.5">
                  <ShoppingBag className="w-3 h-3" />おすそわけ回数
                </div>
              </div>
              <div className="w-px h-5 bg-white/20" />
              <div className="text-center">
                <div className="text-white font-black text-sm leading-none">{foodSavedKg}</div>
                <div className="text-white/70 text-[10px] font-bold mt-0.5 flex items-center gap-0.5">
                  <Scale className="w-3 h-3" />削減食品量 (kg)
                </div>
              </div>
              <div className="w-px h-5 bg-white/20" />
              <div className="text-center">
                <div className="text-white font-black text-sm leading-none">{co2Saved}</div>
                <div className="text-white/70 text-[10px] font-bold mt-0.5 flex items-center gap-0.5">
                  <Leaf className="w-3 h-3" />CO2削減 (kg)
                </div>
              </div>
            </div>
          </motion.div>

        </div>}

        {/* ── マイタウン（カスタマーのみ・インライン表示）── */}
        {!isStoreOwner && (
          <div className="-mx-4 mb-2">
            <MyTown purchaseCount={pickedUpCount} />
          </div>
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

        {/* ── 店舗オーナー：承認済み・Stripe連携完了（緑バッジ・コンパクト版） ── */}
        {profile?.role === 'store_owner' && !loadingStore && isApprovedOwner && (
          <div className="mb-3 flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
            <FileCheck className="w-4 h-4 text-green-600 shrink-0" />
            <p className="text-xs font-black text-green-800 flex-1">✅ 公式アカウント認証済み・出品可能</p>
            <span className="text-[9px] font-black bg-green-200 text-green-800 px-2 py-0.5 rounded-full shrink-0">有効</span>
          </div>
        )}

        {/* ── 神モード（管理者専用） ── */}
        {isAdmin && (
          <Link
            href="/admin"
            className="flex items-center gap-3 mb-3 rounded-2xl px-4 py-3 overflow-hidden relative
              bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600
              shadow-[0_4px_20px_rgba(124,58,237,0.40)]
              hover:shadow-[0_6px_24px_rgba(124,58,237,0.55)] hover:-translate-y-0.5
              tap-scale transition-all duration-200"
          >
            <div className="absolute inset-0 opacity-20 pointer-events-none"
              style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 0%, transparent 60%)' }} />
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0 backdrop-blur-sm border border-white/30">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="font-black text-white text-sm leading-tight">⚡️ 神モード</div>
              <div className="text-white/70 text-[11px] mt-0.5">管理者ダッシュボード</div>
            </div>
            <ChevronRight className="w-4 h-4 text-white/60" />
          </Link>
        )}

        {/* ── 店舗オーナー：設定コンテンツをインライン表示 ── */}
        {isStoreOwner && (
          <div className="mt-4 space-y-3">

            {/* 店舗管理 */}
            <div>
              <p className="text-[11px] font-black text-muted-foreground uppercase tracking-wider mb-1.5 px-1">店舗管理</p>
              <div className="bg-card rounded-2xl overflow-hidden"
                style={{ boxShadow: '0 2px 8px -1px rgba(10,8,6,0.07)' }}>
                {(store?.status === 'pending' || store?.status === 'pending_review' || store?.status === 'applied') && (
                  <Link
                    href="/store-dashboard"
                    className="flex items-center gap-3 py-3 px-4 hover:bg-secondary/50 transition-colors border-b border-border last:border-0"
                  >
                    <div className="w-9 h-9 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-foreground text-sm">店舗申請 — 審査中</div>
                      <div className="text-xs text-muted-foreground">1〜2営業日以内に結果をお知らせします</div>
                    </div>
                    <span className="text-[10px] font-black bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">審査中</span>
                  </Link>
                )}
                {store?.status === 'rejected' && (
                  <Link
                    href="/store/bank-setup"
                    className="flex items-center gap-3 py-3 px-4 hover:bg-secondary/50 transition-colors border-b border-border last:border-0"
                  >
                    <div className="w-9 h-9 bg-red-100 text-red-500 rounded-full flex items-center justify-center shrink-0">
                      <XCircle className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-foreground text-sm">店舗申請が却下されました</div>
                      <div className="text-xs text-muted-foreground">
                        {store.rejectionReason
                          ? `理由：${store.rejectionReason.slice(0, 30)}${store.rejectionReason.length > 30 ? '…' : ''}`
                          : 'Stripe口座を再設定して再申請する'}
                      </div>
                    </div>
                    <span className="text-[10px] font-black bg-red-100 text-red-500 px-2 py-0.5 rounded-full">再申請</span>
                  </Link>
                )}
                {isApprovedOwner && (
                  <Link
                    href="/store/profile-edit"
                    className="flex items-center gap-3 py-3 px-4 hover:bg-secondary/50 transition-colors border-b border-border"
                  >
                    <div className="w-9 h-9 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center shrink-0">
                      <Camera className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-foreground text-sm">店舗プロフィール編集</div>
                      <div className="text-xs text-muted-foreground">カバー写真・紹介文・営業時間など</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </Link>
                )}
                {isApprovedOwner && (
                  <Link
                    href="/store/reviews"
                    className="flex items-center gap-3 py-3 px-4 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="w-9 h-9 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center shrink-0">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-foreground text-sm">お客様からのレビュー</div>
                      <div className="text-xs text-muted-foreground">レビュー確認・返信管理</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </Link>
                )}
              </div>
            </div>

            {/* アカウント・サポート */}
            <div>
              <p className="text-[11px] font-black text-muted-foreground uppercase tracking-wider mb-1.5 px-1">アカウント・サポート</p>
              <div className="bg-card rounded-2xl overflow-hidden"
                style={{ boxShadow: '0 2px 8px -1px rgba(10,8,6,0.07)' }}>
                <Link
                  href="/report-store"
                  className="flex items-center gap-3 py-3 px-4 hover:bg-secondary/50 transition-colors border-b border-border"
                >
                  <div className="w-9 h-9 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center shrink-0">
                    <Flag className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-foreground text-sm">食品ロスのお店を教えて</div>
                    <div className="text-xs text-muted-foreground">OsusOwakeスタッフが直接お伺いします</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </Link>
                <Link
                  href="/help"
                  className="flex items-center gap-3 py-3 px-4 hover:bg-secondary/50 transition-colors border-b border-border"
                >
                  <div className="w-9 h-9 bg-secondary text-foreground rounded-full flex items-center justify-center shrink-0">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div className="flex-1 font-bold text-foreground text-sm">ヘルプ・お問い合わせ</div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </Link>
                <Link
                  href="/settings"
                  className="flex items-center gap-3 py-3 px-4 hover:bg-secondary/50 transition-colors border-b border-border"
                >
                  <div className="w-9 h-9 bg-secondary text-foreground rounded-full flex items-center justify-center shrink-0">
                    <Settings className="w-4 h-4" />
                  </div>
                  <div className="flex-1 font-bold text-foreground text-sm">アカウント設定</div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 py-3 px-4 hover:bg-destructive/5 transition-colors text-left text-destructive"
                >
                  <div className="w-9 h-9 bg-destructive/10 text-destructive rounded-full flex items-center justify-center shrink-0">
                    <LogOut className="w-4 h-4" />
                  </div>
                  <div className="flex-1 font-bold text-sm">ログアウト</div>
                </button>
              </div>
            </div>

            {/* 法的情報リンク */}
            <div className="pt-2 pb-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
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
              <p className="w-full text-center text-[10px] text-muted-foreground/40 mt-1">© 2025 OsusOwake All rights reserved.</p>
            </div>

          </div>
        )}

      </div>
  );

  // ── 設定パネル（フルスクリーンモーダル） ──
  const settingsSheet = (
    <AnimatePresence>
      {showSettings && (
        <>
          {/* 背景オーバーレイ */}
          <motion.div
            key="settings-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
            onClick={() => setShowSettings(false)}
          />

          {/* スライドアップパネル */}
          <motion.div
            key="settings-panel"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="fixed left-3 right-3 bottom-3 z-50 bg-background rounded-3xl overflow-hidden flex flex-col"
            style={{
              maxHeight: '88dvh',
              paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.5rem)',
              boxShadow: '0 -4px 40px rgba(0,0,0,0.18)',
            }}
          >
            {/* ハンドルバー */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 bg-border rounded-full" />
            </div>

            {/* ヘッダー */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border/60 shrink-0">
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 -ml-2 rounded-xl hover:bg-secondary transition-colors text-foreground"
                aria-label="閉じる"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="text-base font-black text-foreground flex-1">設定</h2>
              <Settings className="w-4 h-4 text-muted-foreground" />
            </div>

            {/* スクロール可能なコンテンツ */}
            <div className="overflow-y-auto overflow-x-hidden flex-1 px-4 py-4 space-y-3">

              {/* ── 購入履歴 ── */}
              <div className="bg-card rounded-2xl overflow-hidden"
                style={{ boxShadow: '0 2px 12px -2px rgba(10,8,6,0.09)' }}>
                <Link
                  href="/orders"
                  onClick={() => setShowSettings(false)}
                  className="flex items-center gap-3.5 py-3.5 px-4 hover:bg-secondary/50 active:bg-secondary/70 transition-colors"
                >
                  <div className="w-9 h-9 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div className="flex-1 font-bold text-foreground text-sm">購入履歴・領収書</div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/60" />
                </Link>
              </div>

              {/* ── 店舗管理（店舗オーナーのみ） ── */}
              {isStoreOwner && (
                <div>
                  <p className="text-[11px] font-black text-muted-foreground uppercase tracking-wider mb-1.5 px-1">店舗管理</p>
                  <div className="bg-card rounded-2xl overflow-hidden"
                    style={{ boxShadow: '0 2px 12px -2px rgba(10,8,6,0.09)' }}>
                    {(store?.status === 'pending' || store?.status === 'pending_review' || store?.status === 'applied') && (
                      <Link
                        href="/store-dashboard"
                        onClick={() => setShowSettings(false)}
                        className="flex items-center gap-3.5 py-3.5 px-4 hover:bg-secondary/50 active:bg-secondary/70 transition-colors border-b border-border last:border-0"
                      >
                        <div className="w-9 h-9 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-foreground text-sm">店舗申請 — 審査中</div>
                          <div className="text-xs text-muted-foreground mt-0.5">1〜2営業日以内に結果をお知らせします</div>
                        </div>
                        <span className="text-[10px] font-black bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">審査中</span>
                      </Link>
                    )}
                    {store?.status === 'rejected' && (
                      <Link
                        href="/store/bank-setup"
                        onClick={() => setShowSettings(false)}
                        className="flex items-center gap-3.5 py-3.5 px-4 hover:bg-secondary/50 active:bg-secondary/70 transition-colors border-b border-border last:border-0"
                      >
                        <div className="w-9 h-9 bg-red-100 text-red-500 rounded-xl flex items-center justify-center shrink-0">
                          <XCircle className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-foreground text-sm">店舗申請が却下されました</div>
                          <div className="text-xs text-muted-foreground mt-0.5">Stripe口座を再設定して再申請する</div>
                        </div>
                        <span className="text-[10px] font-black bg-red-100 text-red-500 px-2 py-0.5 rounded-full">再申請</span>
                      </Link>
                    )}
                    {isApprovedOwner && (
                      <Link
                        href="/store/profile-edit"
                        onClick={() => setShowSettings(false)}
                        className="flex items-center gap-3.5 py-3.5 px-4 hover:bg-secondary/50 active:bg-secondary/70 transition-colors border-b border-border"
                      >
                        <div className="w-9 h-9 bg-orange-100 text-orange-500 rounded-xl flex items-center justify-center shrink-0">
                          <Camera className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-foreground text-sm">店舗プロフィール編集</div>
                          <div className="text-xs text-muted-foreground mt-0.5">カバー写真・紹介文・営業時間など</div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground/60" />
                      </Link>
                    )}
                    {isApprovedOwner && (
                      <Link
                        href="/store/reviews"
                        onClick={() => setShowSettings(false)}
                        className="flex items-center gap-3.5 py-3.5 px-4 hover:bg-secondary/50 active:bg-secondary/70 transition-colors"
                      >
                        <div className="w-9 h-9 bg-amber-100 text-amber-500 rounded-xl flex items-center justify-center shrink-0">
                          <MessageSquare className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-foreground text-sm">お客様からのレビュー</div>
                          <div className="text-xs text-muted-foreground mt-0.5">レビュー確認・返信管理</div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground/60" />
                      </Link>
                    )}
                  </div>
                </div>
              )}

              {/* ── アカウント・サポート ── */}
              <div>
                <p className="text-[11px] font-black text-muted-foreground uppercase tracking-wider mb-1.5 px-1">アカウント・サポート</p>
                <div className="bg-card rounded-2xl overflow-hidden"
                  style={{ boxShadow: '0 2px 12px -2px rgba(10,8,6,0.09)' }}>
                  {!isStoreOwner && (
                    <Link
                      href="/settings"
                      onClick={() => setShowSettings(false)}
                      className="flex items-center gap-3.5 py-3.5 px-4 hover:bg-secondary/50 active:bg-secondary/70 transition-colors border-b border-border"
                    >
                      <div className="w-9 h-9 bg-secondary text-foreground rounded-xl flex items-center justify-center shrink-0">
                        <Settings className="w-4 h-4" />
                      </div>
                      <div className="flex-1 font-bold text-foreground text-sm">アカウント設定</div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/60" />
                    </Link>
                  )}
                  <Link
                    href="/report-store"
                    onClick={() => setShowSettings(false)}
                    className="flex items-center gap-3.5 py-3.5 px-4 hover:bg-secondary/50 active:bg-secondary/70 transition-colors border-b border-border"
                  >
                    <div className="w-9 h-9 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center shrink-0">
                      <Flag className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-foreground text-sm">食品ロスのお店を教えて</div>
                      <div className="text-xs text-muted-foreground mt-0.5">OsusOwakeスタッフが直接お伺いします</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/60" />
                  </Link>
                  <Link
                    href="/help"
                    onClick={() => setShowSettings(false)}
                    className="flex items-center gap-3.5 py-3.5 px-4 hover:bg-secondary/50 active:bg-secondary/70 transition-colors border-b border-border"
                  >
                    <div className="w-9 h-9 bg-secondary text-foreground rounded-xl flex items-center justify-center shrink-0">
                      <HelpCircle className="w-4 h-4" />
                    </div>
                    <div className="flex-1 font-bold text-foreground text-sm">ヘルプ・お問い合わせ</div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/60" />
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3.5 py-3.5 px-4 hover:bg-destructive/5 active:bg-destructive/10 transition-colors text-left text-destructive"
                  >
                    <div className="w-9 h-9 bg-destructive/10 text-destructive rounded-xl flex items-center justify-center shrink-0">
                      <LogOut className="w-4 h-4" />
                    </div>
                    <div className="flex-1 font-bold text-sm">ログアウト</div>
                  </button>
                </div>
              </div>

              {/* 法的情報リンク */}
              <div className="pt-2 pb-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
                <Link href="/tokusho" onClick={() => setShowSettings(false)} className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors">
                  特定商取引法に基づく表記
                </Link>
                <span className="text-muted-foreground/30 text-xs">|</span>
                <Link href="/terms" onClick={() => setShowSettings(false)} className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors">
                  利用規約
                </Link>
                <span className="text-muted-foreground/30 text-xs">|</span>
                <Link href="/privacy" onClick={() => setShowSettings(false)} className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors">
                  プライバシーポリシー
                </Link>
                <p className="w-full text-center text-[10px] text-muted-foreground/40 mt-1">© 2025 OsusOwake All rights reserved.</p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <Layout>{pageContent}</Layout>
      {settingsSheet}
    </>
  );
}
