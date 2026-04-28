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

// Maps JS API キーはクライアント bundle に埋め込まれるため、Google Cloud Console の
// HTTP Referrer 制限 / iOS Bundle ID 制限で保護することが前提（コードに値を持たない）。
// ビルド時に env が無ければ空文字 → maps-loader が "nokey" 状態で安全側に倒す。
const MAPS_API_KEY = process.env.VITE_MAPS_API_KEY ?? process.env.Maps_API_KEY ?? '';
if (!MAPS_API_KEY) {
  console.warn('[vite.config.cap] VITE_MAPS_API_KEY / Maps_API_KEY が未設定 — 地図機能は無効でビルドします');
}

export default defineConfig({
  base: "/",
  define: {
    'import.meta.env.VITE_MAPS_API_KEY': JSON.stringify(MAPS_API_KEY),
    'import.meta.env.VITE_IS_CAPACITOR': JSON.stringify('true'),
    'import.meta.env.VITE_STRIPE_PK': JSON.stringify(process.env.STRIPE_PUBLISHABLE_KEY ?? ''),
    'import.meta.env.VITE_BASE_URL': JSON.stringify('/'),
    'import.meta.env.VITE_API_BASE': JSON.stringify('https://osusowakejapan.org'),
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(
      process.env.VITE_SUPABASE_URL ?? 'https://dqybzbsdqpbfpimapnwx.supabase.co'
    ),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(
      process.env.VITE_SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxeWJ6YnNkcXBiZnBpbWFwbnd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwOTcyMzgsImV4cCI6MjA4OTY3MzIzOH0.oEZDaDldnTJ190VRt7hsbrypwQ05RaI1OUhQOLjO6pc'
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
