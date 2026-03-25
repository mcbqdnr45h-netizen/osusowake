import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute, GuestRoute } from "@/components/ProtectedRoute";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";

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
import StoreLegal from "./pages/StoreLegal";
import StoreLegalPublic from "./pages/StoreLegalPublic";
import HelpPage from "./pages/HelpPage";
import TokushoPage from "./pages/TokushoPage";

// ── ルートガードファクトリ ─────────────────────────────────────────────────────
// 認証が必要なルート
const Protected = (C: React.ComponentType, role?: 'customer' | 'store_owner') =>
  function ProtectedWrapper() { return <ProtectedRoute component={C} requireRole={role} />; };

// ゲスト専用ルート（ログイン済みなら自動リダイレクト）
const Guest = (C: React.ComponentType) =>
  function GuestWrapper() { return <GuestRoute component={C} />; };

// ── 各ページのラッパー（コンポーネント安定化のため外で定義）──────────────────────
const GuardedLogin          = Guest(Login);
const GuardedSignUp         = Guest(SignUp);
const GuardedStoreLogin     = Guest(StoreLogin);
const GuardedStoreSignUp    = Guest(StoreSignUp);
const GuardedMyPage         = Protected(MyPage);
const GuardedMyReservations = Protected(MyReservations);
const GuardedCheckout       = Protected(Checkout);
const GuardedOrderTicket    = Protected(OrderTicket);
const GuardedOrders         = Protected(Orders);
const GuardedSettings       = Protected(Settings);
const GuardedPaymentMethods = Protected(PaymentMethods);
const GuardedFavorites      = Protected(FavoritesPage);
const GuardedStoreDashboard  = Protected(StoreDashboard, 'store_owner');
const GuardedStoreOwnerDash  = Protected(StoreOwnerDashboard, 'store_owner');
const GuardedStoreBags       = Protected(StoreBagsPage, 'store_owner');
const GuardedStoreSales      = Protected(StoreSalesPage, 'store_owner');
const GuardedRegisterStore   = Protected(RegisterStore, 'store_owner');
const GuardedStoreOnboarding = Protected(StoreOnboarding, 'store_owner');
const GuardedStripeBankSetup = Protected(StripeBankSetup, 'store_owner');
const GuardedAdmin           = Protected(AdminDashboard);
const GuardedAdminVerify     = Protected(AdminVerifyShops);
const GuardedStoreProfileEdit = Protected(StoreProfileEdit, 'store_owner');
const GuardedStoreReviews    = Protected(StoreReviews, 'store_owner');
const GuardedStoreLegal      = Protected(StoreLegal, 'store_owner');

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

// ── ページ遷移フェードアニメーション ─────────────────────────────────────────
const pageVariants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -4, transition: { duration: 0.15, ease: 'easeIn' } },
};

function AnimatedRoutes() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return (
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
          <Route path="/" component={Home} />
          <Route path="/welcome" component={Welcome} />
          <Route path="/search" component={SearchPage} />
          <Route path="/map"    component={SearchPage} />
          <Route path="/bags/:id" component={BagDetail} />
          <Route path="/terms" component={Terms} />
          <Route path="/privacy" component={Privacy} />
          <Route path="/help" component={HelpPage} />
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
          <Route path="/store/legal"     component={GuardedStoreLegal} />

          {/* ── 公開 特商法表記 ── */}
          <Route path="/stores/:id/legal" component={StoreLegalPublic} />

          {/* ── 管理者 ── */}
          <Route path="/admin" component={GuardedAdmin} />
          <Route path="/admin-verify-shops" component={GuardedAdminVerify} />

          <Route component={NotFound} />
        </Switch>
      </motion.div>
    </AnimatePresence>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <FavoritesProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <AnimatedRoutes />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </FavoritesProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
