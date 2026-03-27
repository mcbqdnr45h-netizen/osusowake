import React from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute, GuestRoute, GuestWallRoute } from "@/components/ProtectedRoute";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { useAppSettings } from "@/hooks/use-app-settings";
import MaintenancePage from "./pages/MaintenancePage";

import Home from "./pages/Home";
import BagDetail from "./pages/BagDetail";
import Checkout from "./pages/Checkout";
import MyReservations from "./pages/MyReservations";
import StoreDashboard from "./pages/StoreDashboard";
import StoreOwnerDashboard from "./pages/StoreOwnerDashboard";
import StoreBagsPage from "./pages/StoreBagsPage";
import StoreSalesPage from "./pages/StoreSalesPage";
import SearchPage from "./pages/SearchPage";
import FavoritesPage from "./pages/FavoritesPage";
import MyPage from "./pages/MyPage";
import RegisterStore from "./pages/RegisterStore";
import AdminVerifyShops from "./pages/AdminVerifyShops";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Welcome from "./pages/Welcome";
import SignUp from "./pages/SignUp";
import Login from "./pages/Login";
import StoreLogin from "./pages/StoreLogin";
import StoreSignUp from "./pages/StoreSignUp";
import VerifyEmail from "./pages/VerifyEmail";
import Settings from "./pages/Settings";
import PaymentMethods from "./pages/PaymentMethods";
import Orders from "./pages/Orders";
import StoreOnboarding from "./pages/StoreOnboarding";
import StripeBankSetup from "./pages/StripeBankSetup";
import AdminDashboard from "./pages/AdminDashboard";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import CheckoutCancel from "./pages/CheckoutCancel";
import OrderTicket from "./pages/OrderTicket";
import NotFound from "./pages/not-found";
import SupabaseTest from "./pages/SupabaseTest";
import StoreProfileEdit from "./pages/StoreProfileEdit";
import StoreReviews from "./pages/StoreReviews";
import StoreDetailPublic from "./pages/StoreDetailPublic";
import HelpPage from "./pages/HelpPage";
import TokushoPage from "./pages/TokushoPage";
import MyTownPage from "./pages/MyTownPage";
import SalesLeadForm from "./pages/SalesLeadForm";

// ── ルートガードファクトリ ─────────────────────────────────────────────────────
// 認証が必要なルート
const Protected = (C: React.ComponentType, role?: 'customer' | 'store_owner') =>
  function ProtectedWrapper() { return <ProtectedRoute component={C} requireRole={role} />; };

// ゲスト専用ルート（ログイン済みなら自動リダイレクト）
const Guest = (C: React.ComponentType) =>
  function GuestWrapper() { return <GuestRoute component={C} />; };

// ゲストウォール（未ログインはプレースホルダー、ログイン済みは通常表示）
const GuestWall = (C: React.ComponentType) =>
  function GuestWallWrapper() { return <GuestWallRoute component={C} />; };

// ── 各ページのラッパー（コンポーネント安定化のため外で定義）──────────────────────
const GuardedLogin          = Guest(Login);
const GuardedSignUp         = Guest(SignUp);
const GuardedStoreLogin     = Guest(StoreLogin);
const GuardedStoreSignUp    = Guest(StoreSignUp);
// タブページ：未ログインはプレースホルダー（ウォール）
const GuardedMyPage         = GuestWall(MyPage);
const GuardedMyReservations = GuestWall(MyReservations);
const GuardedOrders         = GuestWall(Orders);
const GuardedFavorites      = GuestWall(FavoritesPage);
// チェックアウト・チケット・設定は完全保護（ウェルカム画面へリダイレクト）
const GuardedCheckout       = Protected(Checkout);
const GuardedOrderTicket    = Protected(OrderTicket);
const GuardedSettings       = Protected(Settings);
const GuardedPaymentMethods = Protected(PaymentMethods);
const GuardedStoreDashboard  = Protected(StoreDashboard, 'store_owner');
const GuardedStoreOwnerDash  = Protected(StoreOwnerDashboard, 'store_owner');
const GuardedStoreBags       = Protected(StoreBagsPage, 'store_owner');
const GuardedStoreSales      = Protected(StoreSalesPage, 'store_owner');
const GuardedRegisterStore   = Protected(RegisterStore, 'store_owner');
const GuardedStoreOnboarding = Protected(StoreOnboarding, 'store_owner');
const GuardedStripeBankSetup = Protected(StripeBankSetup, 'store_owner');
const GuardedAdminVerify     = Protected(AdminVerifyShops);
const GuardedStoreProfileEdit = Protected(StoreProfileEdit, 'store_owner');
const GuardedStoreReviews    = Protected(StoreReviews, 'store_owner');

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: (failureCount, error: unknown) => {
        const status = (error as any)?.status as number | undefined;
        if (status !== undefined && status >= 400 && status < 500) return false;
        return failureCount < 1;
      },
      staleTime: 1000 * 60 * 2,
    },
  },
});

// ── ホームルーター: ゲスト・ログイン済み共にHomeを表示 ──────────────────────
function HomeRouter() {
  return <Home />;
}

// ── ページ遷移ローディングオーバーレイ（ロゴグロウ）────────────────────────
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
            {/* OsusOwake ロゴマーク */}
            <div className="relative">
              <motion.div
                animate={{ opacity: [0.4, 0.9, 0.4] }}
                transition={{ duration: 0.6, ease: 'easeInOut' }}
                className="absolute inset-0 rounded-2xl blur-xl"
                style={{ background: 'radial-gradient(circle, rgba(242,100,25,0.55) 0%, transparent 70%)' }}
              />
              <div
                className="relative w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #F07826 0%, #E85A0C 100%)' }}
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

// ── ページ遷移フェードアニメーション ─────────────────────────────────────────
const pageVariants = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1], delay: 0.12 } },
  exit:    { opacity: 0, transition: { duration: 0.1, ease: 'easeIn' } },
};

function AnimatedRoutes() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return (
    <>
      <PageTransitionOverlay />
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
          <Route path="/success" component={CheckoutSuccess} />
          <Route path="/cancel" component={CheckoutCancel} />
          <Route path="/supabase-test" component={SupabaseTest} />

          {/* ── ゲスト専用（ログイン済みなら自動リダイレクト）── */}
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
          <Route path="/register-store"  component={GuardedRegisterStore} />
          <Route path="/store-onboarding" component={GuardedStoreOnboarding} />
          <Route path="/store/bank-setup" component={GuardedStripeBankSetup} />
          <Route path="/store/profile-edit" component={GuardedStoreProfileEdit} />
          <Route path="/store/reviews"   component={GuardedStoreReviews} />

          {/* ── 公開 店舗詳細 ── */}
          <Route path="/stores/:id" component={StoreDetailPublic} />

          {/* ── 管理者 ── */}
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/admin-verify-shops" component={GuardedAdminVerify} />

          <Route component={NotFound} />
        </Switch>
      </motion.div>
      </AnimatePresence>
    </>
  );
}

const ADMIN_EMAIL = 'yuuhi0125416@icloud.com';

function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const { settings, isMaintenanceMode } = useAppSettings();
  const { user } = useAuth();
  const [location] = useLocation();

  // 管理者は常に通過 + /admin ルートは常に通過
  const isAdmin = user?.email === ADMIN_EMAIL;
  const isAdminRoute = location === '/admin' || location.startsWith('/admin/');

  if (isMaintenanceMode && !isAdmin && !isAdminRoute) {
    return <MaintenancePage settings={settings} />;
  }
  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <FavoritesProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <MaintenanceGate>
                <AnimatedRoutes />
              </MaintenanceGate>
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </FavoritesProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
