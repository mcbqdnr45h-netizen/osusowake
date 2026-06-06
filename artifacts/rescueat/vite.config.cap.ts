import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import type { Plugin } from "vite";
import { flattenCascadeLayers } from "./vite-flatten-layers";

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

export default defineConfig(({ mode }) => {
  // .env / .env.local / .env.[mode] / .env.[mode].local を全て読み込む。
  // 第3引数 '' で prefix フィルタ無効化 (VITE_ 以外の SUPABASE_URL 等も拾う)。
  const fileEnv = loadEnv(mode, import.meta.dirname, '');
  const env = { ...fileEnv, ...process.env };

  const MAPS_API_KEY =
    env.VITE_MAPS_API_KEY ??
    env.Maps_API_KEY ??
    env.MAPS_API_KEY ??
    MAPS_API_KEY_FALLBACK;

  const SUPABASE_URL = env.VITE_SUPABASE_URL ?? env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY ?? env.SUPABASE_ANON_KEY;
  if (!SUPABASE_URL) throw new Error('[vite.cap] SUPABASE_URL / VITE_SUPABASE_URL が未設定です');
  if (!SUPABASE_ANON_KEY) throw new Error('[vite.cap] SUPABASE_ANON_KEY / VITE_SUPABASE_ANON_KEY が未設定です');

  return {
    base: "/",
    define: {
      'import.meta.env.VITE_MAPS_API_KEY': JSON.stringify(MAPS_API_KEY),
      'import.meta.env.VITE_GOOGLE_MAPS_API_KEY': JSON.stringify(MAPS_API_KEY),
      'import.meta.env.VITE_IS_CAPACITOR': JSON.stringify('true'),
      'import.meta.env.VITE_STRIPE_PK': JSON.stringify(env.STRIPE_PUBLISHABLE_KEY ?? env.VITE_STRIPE_PK ?? ''),
      'import.meta.env.VITE_BASE_URL': JSON.stringify('/'),
      'import.meta.env.VITE_API_BASE': JSON.stringify('https://osusowakejapan.org'),
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(SUPABASE_ANON_KEY),
    },
    plugins: [
      react(),
      tailwindcss(),
      flattenCascadeLayers(),
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
    // ★ vite.config.ts と同じ理由で古い Android WebView 対応のため
    //    Lightning CSS で oklch() / color-mix() を transpile する。
    css: {
      transformer: 'lightningcss',
      lightningcss: {
        targets: {
          chrome:  90 << 16,
          safari:  14 << 16,
          firefox: 88 << 16,
          android: 5  << 16,
        },
      },
    },
    build: {
      outDir: path.resolve(import.meta.dirname, "dist-cap"),
      emptyOutDir: true,
      cssMinify: 'lightningcss',
      rollupOptions: {
        input: path.resolve(import.meta.dirname, "index.cap.html"),
      },
    },
  };
});
