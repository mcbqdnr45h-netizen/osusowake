import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import type { Plugin } from "vite";

function removeCrossorigin(): Plugin {
  return {
    name: 'remove-crossorigin',
    transformIndexHtml(html: string) {
      return html
        .replace(/<script ([^>]*?)crossorigin([^>]*?)>/g, '<script $1$2>')
        .replace(/<link ([^>]*?)crossorigin([^>]*?)>/g, '<link $1$2>')
        .replace(/\s{2,}/g, ' ');
    },
  };
}

// Mac 側ローカルビルド時に Replit Secret が無くてもキーが埋め込まれるよう実値を fallback として保持。
// (Maps JS API キーは iOS Bundle ID 制限付きクライアント用キーで Web 版 bundle にも公開されている前提)
// 安全性は Google Cloud Console の Bundle ID / HTTP Referrer 制限で担保する。
const MAPS_API_KEY_FALLBACK = "AIzaSyAd7THuZ2Dutmu_w2sXe6IqeCA8XoNOf3U";
const MAPS_API_KEY =
  process.env.VITE_MAPS_API_KEY ??
  process.env.Maps_API_KEY ??
  process.env.MAPS_API_KEY ??
  MAPS_API_KEY_FALLBACK;

export default defineConfig({
  base: "/",
  define: {
    'import.meta.env.VITE_MAPS_API_KEY': JSON.stringify(MAPS_API_KEY),
    'import.meta.env.VITE_GOOGLE_MAPS_API_KEY': JSON.stringify(MAPS_API_KEY),
    'import.meta.env.VITE_IS_CAPACITOR': JSON.stringify('true'),
    'import.meta.env.VITE_STRIPE_PK': JSON.stringify(process.env.STRIPE_PUBLISHABLE_KEY ?? ''),
    'import.meta.env.VITE_BASE_URL': JSON.stringify('/'),
    'import.meta.env.VITE_API_BASE': JSON.stringify('https://osusowakejapan.org'),
    // ★ ハードコード fallback を撤去 (gitleaks/SAST 警告解消)。
    //   ローカルの VITE_* 環境変数を優先、 無ければ Replit Secret (SUPABASE_*) を fallback。
    //   どちらも無ければ build 時に throw して silent 失敗を防止。
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(
      process.env.VITE_SUPABASE_URL
        ?? process.env.SUPABASE_URL
        ?? (() => { throw new Error('[vite.cap] SUPABASE_URL / VITE_SUPABASE_URL が未設定です'); })()
    ),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(
      process.env.VITE_SUPABASE_ANON_KEY
        ?? process.env.SUPABASE_ANON_KEY
        ?? (() => { throw new Error('[vite.cap] SUPABASE_ANON_KEY / VITE_SUPABASE_ANON_KEY が未設定です'); })()
    ),
  },
  plugins: [
    react(),
    tailwindcss(),
    removeCrossorigin(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist-cap"),
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(import.meta.dirname, "index.cap.html"),
    },
  },
});
