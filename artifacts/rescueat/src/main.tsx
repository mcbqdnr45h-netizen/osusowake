import { createRoot } from "react-dom/client";
import { setAuthTokenProvider } from "@workspace/api-client-react";
import App from "./App";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { supabase } from "@/lib/supabase";
import "./index.css";

// 生成 API クライアント (customFetch) に Supabase access_token を自動付与する。
// これにより `requireAuth` が必要な全エンドポイントが、 個々の Hook で
// 手動 Bearer 設定不要になり、 401 の取りこぼし・回帰を防げる。
setAuthTokenProvider(async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  } catch {
    return null;
  }
});

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
