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
      strategies: "generateSW",
      registerType: "autoUpdate",
      injectRegister: null,
      filename: "sw.js",
      // The existing public/manifest.webmanifest stays the single source of truth.
      manifest: false,
      injectManifest: undefined,
      devOptions: { enabled: false },
      workbox: {
        // App shell only: hashed build output + icons. No media/docs/sitemaps.
        globDirectory: "dist",
        globPatterns: ["**/*.{js,css,html}", "icons/*.png", "manifest.webmanifest"],
        globIgnores: ["**/*.map", "**/*.{mp3,mp4,wav,pdf,zip}", "**/sitemap*.xml"],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        // We handle navigations with an explicit NetworkFirst route instead:
        // no navigate fallback, and the precache must not answer "/" cache-first.
        navigateFallback: null,
        directoryIndex: null,
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // HTML navigations: always try the network first so users get
            // current NewtonAI content; cached shell is only an offline fallback.
            urlPattern: ({ request, url, sameOrigin }) =>
              request.mode === "navigate" &&
              sameOrigin &&
              !url.pathname.startsWith("/~oauth") &&
              !url.pathname.startsWith("/auth/callback") &&
              !url.pathname.startsWith("/.well-known"),
            handler: "NetworkFirst",
            options: {
              cacheName: "newtonai-html-v1",
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [200] },
            },
          },
          {
            // Same-origin hashed build assets only.
            urlPattern: ({ url, sameOrigin, request }) =>
              sameOrigin &&
              url.pathname.startsWith("/assets/") &&
              ["script", "style", "worker", "font", "image"].includes(request.destination),
            handler: "CacheFirst",
            options: {
              cacheName: "newtonai-assets-v1",
              expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [200] },
            },
          },
          {
            // Google Fonts stylesheets/files (public, safe).
            urlPattern: ({ url }) =>
              url.origin === "https://fonts.googleapis.com" ||
              url.origin === "https://fonts.gstatic.com",
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "newtonai-fonts-v1",
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
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
    target: "esnext",
    modulePreload: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-popover', '@radix-ui/react-tooltip', '@radix-ui/react-dropdown-menu', '@radix-ui/react-tabs', '@radix-ui/react-accordion'],
          'vendor-motion': ['framer-motion'],
          'vendor-markdown': ['react-markdown', 'remark-gfm', 'remark-math', 'rehype-katex', 'katex'],
          'vendor-pdf': ['pdfjs-dist', 'react-pdf', 'pdf-lib'],
          'vendor-charts': ['recharts'],
          'vendor-query': ['@tanstack/react-query'],
        },
      },
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      target: "esnext",
    },
  },
}));
