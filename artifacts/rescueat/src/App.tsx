import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { FavoritesProvider } from "@/contexts/FavoritesContext";

import Home from "./pages/Home";
import BagDetail from "./pages/BagDetail";
import Checkout from "./pages/Checkout";
import MyReservations from "./pages/MyReservations";
import StoreDashboard from "./pages/StoreDashboard";
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
import VerifyEmail from "./pages/VerifyEmail";
import Settings from "./pages/Settings";
import PaymentMethods from "./pages/PaymentMethods";
import Orders from "./pages/Orders";
import StoreOnboarding from "./pages/StoreOnboarding";
import AdminDashboard from "./pages/AdminDashboard";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import CheckoutCancel from "./pages/CheckoutCancel";
import OrderTicket from "./pages/OrderTicket";
import NotFound from "./pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      // 4xx エラー（クライアントエラー）はリトライしない。5xx のみリトライ。
      retry: (failureCount, error: unknown) => {
        const status = (error as any)?.status as number | undefined;
        if (status !== undefined && status >= 400 && status < 500) return false;
        return failureCount < 1;
      },
      staleTime: 1000 * 60 * 2, // 2 minutes
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/welcome" component={Welcome} />
      <Route path="/signup" component={SignUp} />
      <Route path="/login" component={Login} />
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path="/search" component={SearchPage} />
      <Route path="/favorites" component={FavoritesPage} />
      <Route path="/mypage" component={MyPage} />
      <Route path="/bags/:id" component={BagDetail} />
      <Route path="/checkout/:id" component={Checkout} />
      <Route path="/my-reservations" component={MyReservations} />
      <Route path="/orders/:id" component={OrderTicket} />
      <Route path="/store-dashboard" component={StoreDashboard} />
      <Route path="/register-store" component={RegisterStore} />
      <Route path="/admin-verify-shops" component={AdminVerifyShops} />
      <Route path="/settings" component={Settings} />
      <Route path="/payment-methods" component={PaymentMethods} />
      <Route path="/orders" component={Orders} />
      <Route path="/store-onboarding" component={StoreOnboarding} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/success" component={CheckoutSuccess} />
      <Route path="/cancel" component={CheckoutCancel} />
      <Route path="/terms" component={Terms} />
      <Route path="/privacy" component={Privacy} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <FavoritesProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </FavoritesProvider>
    </QueryClientProvider>
  );
}

export default App;
