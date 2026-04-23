import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  base: "/",
  define: {
    'import.meta.env.VITE_MAPS_API_KEY': JSON.stringify(process.env.Maps_API_KEY ?? ''),
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
