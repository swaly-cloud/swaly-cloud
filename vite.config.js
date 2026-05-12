import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  build: {
    chunkSizeWarningLimit: 650,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          mediapipe: ['@mediapipe/tasks-vision'],
        },
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png', 'icons/*.svg'],
      manifest: {
        name: 'Azzabi Optic',
        short_name: 'Azzabi',
        description: 'Opticien tunisien depuis 2010 — La Marsa & Aïn Zaghouan',
        theme_color: '#0A0A0A',
        background_color: '#FFFFFF',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        lang: 'fr',
        categories: ['shopping', 'lifestyle'],
        icons: [
          { src: '/icons/azzabi-logo.svg', sizes: '192x192', type: 'image/svg+xml' },
          { src: '/icons/azzabi-logo.svg', sizes: '512x512', type: 'image/svg+xml' },
          { src: '/icons/azzabi-logo.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'maskable' },
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
        screenshots: [
          {
            src: '/icons/screenshot-mobile.png',
            sizes: '390x844',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Azzabi Optic — Accueil',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts-cache', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
          {
            urlPattern: /^https:\/\/pretavoir\.(us|co\.uk)\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'product-images', expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 } },
          },
          {
            urlPattern: /^http:\/\/localhost:3001\/api\/.*/i,
            handler: 'NetworkFirst',
            options: { cacheName: 'api-cache', expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 } },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
});
