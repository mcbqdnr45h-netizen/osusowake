import React, { Suspense, useRef } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import logoUrl from "@/lib/logo";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { MyStoresProvider, useMyStoresContext } from "@/contexts/MyStoresContext";
import { ProtectedRoute, GuestRoute, GuestWallRoute } from "@/components/ProtectedRoute";
import { AdminMfaModal } from "@/components/AdminMfaModal";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { useAppSettings } from "@/hooks/use-app-settings";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import MaintenancePage from "./pages/MaintenancePage";
import { listStores, getListStoresQueryKey, listAllBags, getListAllBagsQueryKey, listReservations, getListReservationsQueryKey } from "@workspace/api-client-react";

// ── クリティカルパス：初回表示に必要なページは eager import ──
import Home from "./pages/Home";
import SearchPage from "./pages/SearchPage";
import Welcome from "./pages/Welcome";
import NotFound from "./pages/not-found";

// ── 残りのページはすべて lazy import（コード分割でバンドルを小型化）──
// ★ 高頻度ページは import 関数を抽出 → PrefetchOnAuth で事前ロードに利用
const importBagDetail = () => import("./pages/BagDetail");
const BagDetail          = React.lazy(importBagDetail);
const Checkout           = React.lazy(() => import("./pages/Checkout"));
const importMyReservations = () => import("./pages/MyReservations");
const MyReservations     = React.lazy(importMyReservations);
const importStoreDashboard = () => import("./pages/StoreDashboard");
const StoreDashboard     = React.lazy(importStoreDashboard);
const importStoreOwnerDashboard = () => import("./pages/StoreOwnerDashboard");
const StoreOwnerDashboard= React.lazy(importStoreOwnerDashboard);
const StoreReapply       = React.lazy(() => import("./pages/StoreReapply"));
const importStoreBagsPage = () => import("./pages/StoreBagsPage");
const StoreBagsPage      = React.lazy(importStoreBagsPage);
const importStoreSalesPage = () => import("./pages/StoreSalesPage");
const StoreSalesPage     = React.lazy(importStoreSalesPage);
const importFavoritesPage = () => import("./pages/FavoritesPage");
const FavoritesPage      = React.lazy(importFavoritesPage);
const importMyPage = () => import("./pages/MyPage");
const MyPage             = React.lazy(importMyPage);
// RegisterStore は廃止 — /register-store は /store-onboarding へリダイレクト
function RegisterStoreRedirect() {
  const [, navigate] = useLocation();
  useEffect(() => { navigate('/store-onboarding', { replace: true }); }, [navigate]);
  return null;
}
const Terms              = React.lazy(() => import("./pages/Terms"));
const Privacy            = React.lazy(() => import("./pages/Privacy"));
const SignUp             = React.lazy(() => import("./pages/SignUp"));
const Login              = React.lazy(() => import("./pages/Login"));
const StoreLogin         = React.lazy(() => import("./pages/StoreLogin"));
const StoreSignUp        = React.lazy(() => import("./pages/StoreSignUp"));
const VerifyEmail        = React.lazy(() => import("./pages/VerifyEmail"));
const Settings           = React.lazy(() => import("./pages/Settings"));
const PaymentMethods     = React.lazy(() => import("./pages/PaymentMethods"));
const importOrders = () => import("./pages/Orders");
const Orders             = React.lazy(importOrders);
const StoreOnboarding    = React.lazy(() => import("./pages/StoreOnboarding"));
const StripeBankSetup    = React.lazy(() => import("./pages/StripeBankSetup"));
const AdminDashboard     = React.lazy(() => import("./pages/AdminDashboard"));
const AdminStorePage     = React.lazy(() => import("./pages/AdminStorePage"));
const CheckoutSuccess    = React.lazy(() => import("./pages/CheckoutSuccess"));
const CheckoutCancel     = React.lazy(() => import("./pages/CheckoutCancel"));
const OrderTicket        = React.lazy(() => import("./pages/OrderTicket"));
const SupabaseTest       = React.lazy(() => import("./pages/SupabaseTest"));
const StoreProfileEdit   = React.lazy(() => import("./pages/StoreProfileEdit"));
const StoreReviews       = React.lazy(() => import("./pages/StoreReviews"));
const StoreDetailPublic  = React.lazy(() => import("./pages/StoreDetailPublic"));
const HelpPage           = React.lazy(() => import("./pages/HelpPage"));
const UsageGuide         = React.lazy(() => import("./pages/UsageGuide"));
const TokushoPage        = React.lazy(() => import("./pages/TokushoPage"));
const MyTownPage         = React.lazy(() => import("./pages/MyTownPage"));
const RankingPage        = React.lazy(() => import("./pages/RankingPage"));
const SalesLeadForm      = React.lazy(() => import("./pages/SalesLeadForm"));
const ResetPassword      = React.lazy(() => import("./pages/ResetPassword"));
const AuthCallback       = React.lazy(() => import("./pages/AuthCallback"));
const FlyerUser          = React.lazy(() => import("./pages/FlyerUser"));
const FlyerStore         = React.lazy(() => import("./pages/FlyerStore"));

// ── ルートガードファクトリ ─────────────────────────────────────────────────────
const Protected = (C: React.ComponentType, role?: 'customer' | 'store_owner') =>
  function ProtectedWrapper() { return <ProtectedRoute component={C} requireRole={role} />; };

const Guest = (C: React.ComponentType) =>
  function GuestWrapper() { return <GuestRoute component={C} />; };

const GuestWall = (C: React.ComponentType) =>
  function GuestWallWrapper() { return <GuestWallRoute component={C} />; };

// ── 各ページのラッパー ──────────────────────────────────────────────────────
const GuardedLogin          = Guest(Login);
const GuardedSignUp         = Guest(SignUp);
const GuardedStoreLogin     = Guest(StoreLogin);
const GuardedStoreSignUp    = Guest(StoreSignUp);
const GuardedMyPage         = GuestWall(MyPage);
const GuardedMyReservations = GuestWall(MyReservations);
const GuardedOrders         = GuestWall(Orders);
const GuardedFavorites      = GuestWall(FavoritesPage);
const GuardedCheckout       = Protected(Checkout);
const GuardedOrderTicket    = Protected(OrderTicket);
const GuardedSettings       = Protected(Settings);
const GuardedPaymentMethods = Protected(PaymentMethods);
const GuardedStoreDashboard  = Protected(StoreDashboard, 'store_owner');
const GuardedStoreOwnerDash  = Protected(StoreOwnerDashboard, 'store_owner');
const GuardedStoreBags       = Protected(StoreBagsPage, 'store_owner');
const GuardedStoreSales      = Protected(StoreSalesPage, 'store_owner');
const GuardedStoreOnboarding = Protected(StoreOnboarding, 'store_owner');
const GuardedStripeBankSetup = Protected(StripeBankSetup, 'store_owner');
const GuardedStoreProfileEdit = Protected(StoreProfileEdit, 'store_owner');
const GuardedStoreReviews    = Protected(StoreReviews, 'store_owner');
const GuardedStoreReapply    = Protected(StoreReapply, 'store_owner');

// ── QueryClient: キャッシュ設定 ───────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: (failureCount, error: unknown) => {
        const status = (error as any)?.status as number | undefined;
        if (status !== undefined && status >= 400 && status < 500) return false;
        return failureCount < 1;
      },
      staleTime: 1000 * 60 * 2,   // 2分間キャッシュを新鮮とみなす
      gcTime:    1000 * 60 * 10,  // 10分間メモリに保持（画面遷移後も再利用）
    },
  },
});

// ── 起動時プリフェッチ：Reactレンダリングより前にフェッチ開始（最速） ─────
// コンポーネントマウントを待たずモジュール初期化時点でリクエストを発行する
queryClient.prefetchQuery({
  queryKey: getListStoresQueryKey(),
  queryFn: () => listStores(),
  staleTime: 1000 * 60 * 2,
});
queryClient.prefetchQuery({
  queryKey: getListAllBagsQueryKey(),
  queryFn: () => listAllBags(),
  staleTime: 1000 * 60 * 2,
});

// ── 起動時チャンクプリフェッチ：bottom-nav タブとよく使うページの lazy chunk を
//   アプリ起動の瞬間からバックグラウンドダウンロード。 ログインを待たない。
//   こうすると、 ユーザがタブをタップした時には チャンクがすでにキャッシュ済 →
//   Suspense フォールバック (PageSkeleton) がほぼ出なくなる。
//   requestIdleCallback で「初回描画を妨げない優先度」 で並列ダウンロード。
const __idle = (cb: () => void) => {
  const w = window as unknown as { requestIdleCallback?: (cb: () => void) => void };
  if (typeof w.requestIdleCallback === 'function') w.requestIdleCallback(cb);
  else setTimeout(cb, 200);
};
__idle(() => {
  // bottom-nav タブ系 (高優先)
  importMyPage().catch(() => {});
  importFavoritesPage().catch(() => {});
  importMyReservations().catch(() => {});
  // よく使うサブページ
  importBagDetail().catch(() => {});
  importOrders().catch(() => {});
  // 店舗オーナー系 (低優先 — さらに遅延)
  setTimeout(() => {
    importStoreDashboard().catch(() => {});
    importStoreOwnerDashboard().catch(() => {});
    importStoreBagsPage().catch(() => {});
    importStoreSalesPage().catch(() => {});
  }, 1500);
});

// ── ページ遷移ローディングオーバーレイ ──────────────────────────────────────
function PageTransitionOverlay() {
  const [location] = useLocation();
  const [visible, setVisible] = React.useState(false);

  useEffect(() => {
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 320);
    return () => clearTimeout(t);
  }, [location]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="page-loader"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.18 } }}
          transition={{ duration: 0.08 }}
          className="fixed inset-0 z-[999] bg-background flex items-center justify-center pointer-events-none"
        >
          <motion.div
            animate={{ scale: [1, 1.12, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className="flex flex-col items-center gap-2"
          >
            <div className="relative">
              <motion.div
                animate={{ opacity: [0.4, 0.9, 0.4] }}
                transition={{ duration: 0.6, ease: 'easeInOut' }}
                className="absolute inset-0 rounded-2xl blur-xl"
                style={{ background: 'radial-gradient(circle, rgba(232,120,108,0.55) 0%, transparent 70%)' }}
              />
              <img
                src={logoUrl}
                alt="おすそわけ"
                className="relative w-14 h-14 rounded-2xl object-cover"
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── lazy ページ読み込み中のスケルトンフォールバック ─────────────────────────
function PageSkeleton() {
  return (
    <div className="min-h-dvh bg-background flex flex-col">
      {/* コンテンツエリア */}
      <div className="flex-1 px-4 pt-safe-or-5 pb-24 space-y-4">
        {/* タイトル行 */}
        <div className="h-6 w-1/3 bg-muted rounded-xl animate-pulse" />
        {/* カードスケルトン × 4 */}
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="rounded-2xl bg-card border border-border/40 overflow-hidden">
            <div className="h-32 bg-muted animate-pulse" />
            <div className="p-3 space-y-2">
              <div className="h-3 bg-muted rounded-full animate-pulse w-2/3" />
              <div className="h-2.5 bg-muted rounded-full animate-pulse w-1/2" />
            </div>
          </div>
        ))}
      </div>
      {/* ボトムナビゲーション枠 */}
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border/50 flex items-center justify-around px-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="w-6 h-6 bg-muted rounded-lg animate-pulse" />
            <div className="w-8 h-2 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── ページ遷移フェードアニメーション ─────────────────────────────────────────
const pageVariants = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] as [number, number, number, number], delay: 0.12 } },
  exit:    { opacity: 0, transition: { duration: 0.1, ease: 'easeIn' as const } },
};

function AnimatedRoutes() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return (
    <>
      <ErrorBoundary>
      <Suspense fallback={<PageSkeleton />}>
        <div style={{ display: 'contents' }}>
            <Switch>
              {/* ── パブリックページ ── */}
              <Route path="/" component={HomeRouter} />
              <Route path="/welcome" component={Welcome} />
              <Route path="/search" component={SearchPage} />
              <Route path="/map"    component={SearchPage} />
              <Route path="/bags/:id" component={BagDetail} />
              <Route path="/terms" component={Terms} />
              <Route path="/privacy" component={Privacy} />
              <Route path="/legal" component={TokushoPage} />
              <Route path="/help" component={HelpPage} />
              <Route path="/usage-guide" component={UsageGuide} />
              <Route path="/guide" component={UsageGuide} />
              <Route path="/flyer/user" component={FlyerUser} />
              <Route path="/flyer/store" component={FlyerStore} />
              <Route path="/report-store" component={SalesLeadForm} />
              <Route path="/tokusho" component={TokushoPage} />
              <Route path="/verify-email" component={VerifyEmail} />
              <Route path="/reset-password" component={ResetPassword} />
              <Route path="/auth-callback" component={AuthCallback} />
              <Route path="/success" component={CheckoutSuccess} />
              <Route path="/cancel" component={CheckoutCancel} />
              {/* /supabase-test は開発専用 — 本番環境では非公開 */}
              {import.meta.env.DEV && <Route path="/supabase-test" component={SupabaseTest} />}

              {/* ── ゲスト専用 ── */}
              <Route path="/login" component={GuardedLogin} />
              <Route path="/signup" component={GuardedSignUp} />
              {/* /register は /signup の互換エイリアス (古いブックマーク・外部リンク対策) */}
              <Route path="/register" component={GuardedSignUp} />
              <Route path="/store/login" component={GuardedStoreLogin} />
              <Route path="/store/signup" component={GuardedStoreSignUp} />

              {/* ── 要ログイン（一般ユーザー）── */}
              <Route path="/mypage" component={GuardedMyPage} />
              <Route path="/my-reservations" component={GuardedMyReservations} />
              <Route path="/my-town" component={MyTownPage} />
              <Route path="/ranking" component={RankingPage} />
              <Route path="/checkout/:id" component={GuardedCheckout} />
              <Route path="/orders/:id" component={GuardedOrderTicket} />
              <Route path="/orders" component={GuardedOrders} />
              <Route path="/settings" component={GuardedSettings} />
              <Route path="/payment-methods" component={GuardedPaymentMethods} />
              <Route path="/favorites" component={GuardedFavorites} />

              {/* ── 店舗オーナー専用 ── */}
              <Route path="/store/dashboard" component={GuardedStoreDashboard} />
              <Route path="/store/bags"      component={GuardedStoreBags} />
              <Route path="/store/sales"     component={GuardedStoreSales} />
              <Route path="/store-dashboard" component={GuardedStoreOwnerDash} />
              <Route path="/register-store"  component={RegisterStoreRedirect} />
              <Route path="/store-onboarding" component={GuardedStoreOnboarding} />
              <Route path="/store/bank-setup" component={GuardedStripeBankSetup} />
              <Route path="/store/profile-edit" component={GuardedStoreProfileEdit} />
              <Route path="/store/reviews"   component={GuardedStoreReviews} />
              <Route path="/store/reapply"   component={GuardedStoreReapply} />

              {/* ── 公開 店舗詳細 ── */}
              <Route path="/stores/:id" component={StoreDetailPublic} />

              {/* ── 管理者 ── */}
              <Route path="/admin" component={AdminDashboard} />
              <Route path="/admin/store/:id" component={AdminStorePage} />

              <Route component={NotFound} />
            </Switch>
        </div>
      </Suspense>
      </ErrorBoundary>
    </>
  );
}

// ── ホームルーター ──────────────────────────────────────────────────────────
function HomeRouter() {
  return <Home />;
}

function RoleReconciler() {
  const { user, profile, isLoading: authLoading, refreshProfile } = useAuth();
  const { stores, loading: storesLoading } = useMyStoresContext();
  const fixedRef = useRef(false);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelledRef = useRef(false);
  const BASE = import.meta.env.BASE_URL?.replace(/\/$/, '') ?? '';

  useEffect(() => {
    // 両方の読み込みが完了するまで待つ
    if (authLoading || storesLoading) return;
    // ユーザーが存在し、かつ店舗を1つ以上持っているのに customer になっている場合のみ修正
    if (!user) return;
    if (stores.length === 0) return;
    if (profile?.role === 'store_owner') return;
    if (fixedRef.current) return;

    fixedRef.current = true;
    cancelledRef.current = false;

    const doFix = async () => {
      if (cancelledRef.current) return;
      try {
        // 認証必須エンドポイントなので Bearer token を付与（自分の role しか直せない）
        const { authedFetch } = await import('@/lib/authed-fetch');
        const res = await authedFetch(`${BASE}/api/stores/fix-owner-role`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ownerId: user.id }),
        });
        if (cancelledRef.current) return;
        if (res.ok) {
          await refreshProfile();
        } else if (res.status === 401) {
          // ★ 一時的なセッション未確立 (起動直後など) の可能性 → fixedRef を解除し、
          //    profile/session が再評価される次回 effect 起動で再試行できるようにする。
          //    ただし即座に setTimeout は組まない (auth state 変化トリガーに任せる)
          fixedRef.current = false;
          return;
        } else {
          console.warn('[RoleReconciler] fix-owner-role HTTP error:', res.status);
          if (retryCountRef.current < 2) {
            retryCountRef.current += 1;
            fixedRef.current = false;
            retryTimerRef.current = setTimeout(doFix, 3000);
          }
        }
      } catch (err) {
        if (cancelledRef.current) return;
        console.warn('[RoleReconciler] fix-owner-role 例外:', err);
        if (retryCountRef.current < 2) {
          retryCountRef.current += 1;
          fixedRef.current = false;
          retryTimerRef.current = setTimeout(doFix, 3000);
        }
      }
    };

    doFix();

    return () => {
      cancelledRef.current = true;
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, storesLoading, user?.id, profile?.role, stores.length]);

  return null;
}

// ── ナビゲーション監視: あらゆる URL 変化を console.log にダンプ ──
//   wouter の useLocation フック値が変わった瞬間を検出 → そのタイミングで
//   どこから navigate() が呼ばれたかを「直前の logNav」 と突き合わせて推定。
//   原因特定後は削除してOK。
function NavLogger() {
  const [location] = useLocation();
  const prev = useRef(location);
  useEffect(() => {
    if (prev.current !== location) {
      // eslint-disable-next-line no-console
      console.log(`[nav] *** URL changed: ${prev.current} → ${location} *** (${new Date().toLocaleTimeString()})`);
      prev.current = location;
    }
  }, [location]);
  return null;
}

function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const { settings, isMaintenanceMode } = useAppSettings();
  const { isAdmin, isLoading: authLoading } = useAuth();
  const [location] = useLocation();

  const isAdminRoute = location === '/admin' || location.startsWith('/admin/');
  const isLoginRoute = location === '/login' || location === '/store/login';

  // auth ロード中 or 管理者ルート or ログインページ は常に表示
  if (!isMaintenanceMode || authLoading || isAdmin || isAdminRoute || isLoginRoute) {
    return <>{children}</>;
  }
  return <MaintenancePage settings={settings} />;
}

function App() {
  // 起動時に「前回の印刷で残ってしまった osusowake-print-root」 を削除する。
  // iOS Safari など afterprint が発火しないブラウザで stuck し、
  // 商品詳細ページなどの下部に領収書 DOM が見えてしまう問題への保険。
  useEffect(() => {
    const stale = document.getElementById('osusowake-print-root');
    if (stale && stale.parentNode) stale.parentNode.removeChild(stale);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MyStoresProvider>
          <FavoritesProvider>
            <TooltipProvider>
              <PrefetchOnAuth />
              <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                <NavLogger />
                <RoleReconciler />
                <MaintenanceGate>
                  <AnimatedRoutes />
                </MaintenanceGate>
              </WouterRouter>
              <AdminMfaModal />
              <Toaster />
            </TooltipProvider>
          </FavoritesProvider>
        </MyStoresProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

// ★ ログイン直後にユーザ固有データをバックグラウンド prefetch。
//   こうしておくと「マイバッグ / 購入履歴 / マイページ統計」 など、
//   どの画面に遷移してもキャッシュ済みで「ローディング無し」 で即表示される。
//   失敗しても無視 (ベストエフォート)。
//   ★ チャンクの prefetch は モジュール初期化時 (上の __idle) で既に発火済 →
//     ここではユーザ固有 API データのみ。
function PrefetchOnAuth() {
  const { user } = useAuth();
  usePushNotifications();
  useEffect(() => {
    if (!user?.id) return;
    const params = { userId: user.id };
    queryClient.prefetchQuery({
      queryKey: getListReservationsQueryKey(params),
      queryFn: ({ signal }) => listReservations(params, { signal }),
      staleTime: 1000 * 60 * 2,
    }).catch(() => {});
  }, [user?.id]);
  return null;
}

export default App;
