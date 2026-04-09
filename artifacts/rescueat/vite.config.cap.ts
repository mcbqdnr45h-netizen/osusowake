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
  },
});
