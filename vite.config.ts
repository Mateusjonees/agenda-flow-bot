import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "prompt",
      includeAssets: ["logo.png", "robots.txt", "foguetinho.png"],
      manifest: {
        name: "Foguete Gestão Empresarial",
        short_name: "Foguete",
        description: "Sistema completo de gestão empresarial com automação inteligente",
        theme_color: "#E31837",
        background_color: "#0A0A0A",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
        categories: ["business", "productivity"],
        screenshots: [
          {
            src: "/logo.png",
            sizes: "540x720",
            type: "image/png",
          }
        ],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60, // 1 hour
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-stylesheets",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-webfonts",
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Enable minification
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        passes: 2, // Multiple compression passes
      },
      mangle: {
        safari10: true,
      },
    },
    // Target modern browsers for smaller output
    target: "es2020",
    // Split chunks for better caching
    rollupOptions: {
      output: {
        manualChunks(id) {
          // React core
          if (id.includes("node_modules/react/") || 
              id.includes("node_modules/react-dom/") || 
              id.includes("node_modules/react-router")) {
            return "vendor-react";
          }
          // Radix UI components
          if (id.includes("@radix-ui")) {
            return "vendor-radix";
          }
          // Charts - lazy loaded
          if (id.includes("recharts") || id.includes("d3-")) {
            return "vendor-charts";
          }
          // Framer Motion - lazy loaded  
          if (id.includes("framer-motion")) {
            return "vendor-motion";
          }
          // Data fetching
          if (id.includes("@tanstack/react-query")) {
            return "vendor-query";
          }
          // Supabase
          if (id.includes("@supabase")) {
            return "vendor-supabase";
          }
          // Date utilities
          if (id.includes("date-fns")) {
            return "vendor-date";
          }
        },
      },
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 800,
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Generate source maps only in development
    sourcemap: false,
  },
}));
