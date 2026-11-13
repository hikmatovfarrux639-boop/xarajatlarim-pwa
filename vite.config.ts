import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
      },
      devOptions: {
        enabled: true,
      },
      includeAssets: ['wallet.svg', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'Spendo — Kunlik Xarajatlar va Eslatmalar',
        short_name: 'Spendo',
        description: 'Kunlik nima olayotganingiz, qancha xarajat qilayotganingiz va to\'lov vaqtlarini hisoblab boruvchi ilova',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        start_url: '/',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
  server: {
    host: true,
    port: 5173,
  },
});
