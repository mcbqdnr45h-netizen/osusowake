import React, { Suspense, useRef } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
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
import MaintenancePage from "./pages/MaintenancePage";
import { listStores, getListStoresQueryKey, listAllBags, getListAllBagsQueryKey } from "@workspace/api-client-react";

// ── クリティカルパス：初回表示に必要なページは eager import ──
import Home from "./pages/Home";
import SearchPage from "./pages/SearchPage";
import Welcome from "./pages/Welcome";
import NotFound from "./pages/not-found";

// ── 残りのページはすべて lazy import（コード分割でバンドルを小型化）──
const BagDetail          = React.lazy(() => import("./pages/BagDetail"));
const Checkout           = React.lazy(() => import("./pages/Checkout"));
const MyReservations     = React.lazy(() => import("./pages/MyReservations"));
const StoreDashboard     = React.lazy(() => import("./pages/StoreDashboard"));
const StoreOwnerDashboard= React.lazy(() => import("./pages/StoreOwnerDashboard"));
const StoreReapply       = React.lazy(() => import("./pages/StoreReapply"));
const StoreBagsPage      = React.lazy(() => import("./pages/StoreBagsPage"));
const StoreSalesPage     = React.lazy(() => import("./pages/StoreSalesPage"));
const FavoritesPage      = React.lazy(() => import("./pages/FavoritesPage"));
const MyPage             = React.lazy(() => import("./pages/MyPage"));
// RegisterStore は廃止 — /register-store は /store-onboarding へリダイレクト
function RegisterStoreRedirect() {
  const [, navigate] = useLocation();
  useEffect(() => { navigate('/store-onboarding', { replace: true }); }, [navigate]);
  return null;
}
const AdminVerifyShops   = React.lazy(() => import("./pages/AdminVerifyShops"));
const Terms              = React.lazy(() => import("./pages/Terms"));
const Privacy            = React.lazy(() => import("./pages/Privacy"));
const SignUp             = React.lazy(() => import("./pages/SignUp"));
const Login              = React.lazy(() => import("./pages/Login"));
const StoreLogin         = React.lazy(() => import("./pages/StoreLogin"));
const StoreSignUp        = React.lazy(() => import("./pages/StoreSignUp"));
const VerifyEmail        = React.lazy(() => import("./pages/VerifyEmail"));
const Settings           = React.lazy(() => import("./pages/Settings"));
const PaymentMethods     = React.lazy(() => import("./pages/PaymentMethods"));
const Orders             = React.lazy(() => import("./pages/Orders"));
const StoreOnboarding    = React.lazy(() => import("./pages/StoreOnboarding"));
const StripeBankSetup    = React.lazy(() => import("./pages/StripeBankSetup"));
const AdminDashboard     = React.lazy(() => import("./pages/AdminDashboard"));
const CheckoutSuccess    = React.lazy(() => import("./pages/CheckoutSuccess"));
const CheckoutCancel     = React.lazy(() => import("./pages/CheckoutCancel"));
const OrderTicket        = React.lazy(() => import("./pages/OrderTicket"));
const SupabaseTest       = React.lazy(() => import("./pages/SupabaseTest"));
const StoreProfileEdit   = React.lazy(() => import("./pages/StoreProfileEdit"));
const StoreReviews       = React.lazy(() => import("./pages/StoreReviews"));
const StoreDetailPublic  = React.lazy(() => import("./pages/StoreDetailPublic"));
const HelpPage           = React.lazy(() => import("./pages/HelpPage"));
const TokushoPage        = React.lazy(() => import("./pages/TokushoPage"));
const MyTownPage         = React.lazy(() => import("./pages/MyTownPage"));
const SalesLeadForm      = React.lazy(() => import("./pages/SalesLeadForm"));
const ResetPassword      = React.lazy(() => import("./pages/ResetPassword"));

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
const GuardedAdminVerify     = Protected(AdminVerifyShops);
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
              <div
                className="relative w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #EF8478 0%, #D8655C 100%)' }}
              >
                <span className="text-white font-black text-xl" style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.04em' }}>Ow</span>
              </div>
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
      <PageTransitionOverlay />
      <ErrorBoundary>
      <Suspense fallback={<PageSkeleton />}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            style={{ display: 'contents' }}
          >
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
              <Route path="/report-store" component={SalesLeadForm} />
              <Route path="/tokusho" component={TokushoPage} />
              <Route path="/verify-email" component={VerifyEmail} />
              <Route path="/reset-password" component={ResetPassword} />
              <Route path="/success" component={CheckoutSuccess} />
              <Route path="/cancel" component={CheckoutCancel} />
              {/* /supabase-test は開発専用 — 本番環境では非公開 */}
              {import.meta.env.DEV && <Route path="/supabase-test" component={SupabaseTest} />}

              {/* ── ゲスト専用 ── */}
              <Route path="/login" component={GuardedLogin} />
              <Route path="/signup" component={GuardedSignUp} />
              <Route path="/store/login" component={GuardedStoreLogin} />
              <Route path="/store/signup" component={GuardedStoreSignUp} />

              {/* ── 要ログイン（一般ユーザー）── */}
              <Route path="/mypage" component={GuardedMyPage} />
              <Route path="/my-reservations" component={GuardedMyReservations} />
              <Route path="/my-town" component={MyTownPage} />
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
              <Route path="/admin-verify-shops" component={GuardedAdminVerify} />

              <Route component={NotFound} />
            </Switch>
          </motion.div>
        </AnimatePresence>
      </Suspense>
      </ErrorBoundary>
    </>
  );
}

// ── ホームルーター ──────────────────────────────────────────────────────────
function HomeRouter() {
  return <Home />;
}

// ── ロール整合チェック：store があるのに customer のままになるバグを防ぐ ──────────
// MyPage だけでなくアプリ全体で動作し、ページ問わず確実に store_owner ロールへ修正する
function RoleReconciler() {
  const { user, profile, isLoading: authLoading, refreshProfile } = useAuth();
  const { stores, loading: storesLoading } = useMyStoresContext();
  const fixedRef = useRef(false);
  const retryCountRef = useRef(0);
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

    const doFix = async () => {
      try {
        const res = await fetch(`${BASE}/api/stores/fix-owner-role`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ownerId: user.id }),
        });
        if (res.ok) {
          await refreshProfile();
        } else {
          console.warn('[RoleReconciler] fix-owner-role HTTP error:', res.status);
          // リトライ（最大2回）
          if (retryCountRef.current < 2) {
            retryCountRef.current += 1;
            fixedRef.current = false;
            setTimeout(doFix, 3000);
          }
        }
      } catch (err) {
        console.warn('[RoleReconciler] fix-owner-role 例外:', err);
        if (retryCountRef.current < 2) {
          retryCountRef.current += 1;
          fixedRef.current = false;
          setTimeout(doFix, 3000);
        }
      }
    };

    doFix();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, storesLoading, user?.id, profile?.role, stores.length]);

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
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MyStoresProvider>
          <FavoritesProvider>
            <TooltipProvider>
              <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
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

export default App;
