import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8')) as { version: string };

export default defineConfig({
  base: '/app/',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'WhatMedia',
        short_name: 'WhatMedia',
        description: 'Prépare tes vidéos et tes photos pour WhatsApp sans perte inutile de netteté',
        lang: 'fr',
        id: '/app/',
        categories: ['photo', 'utilities', 'productivity'],
        screenshots: [
          { src: '/shots/fr-analysis.webp', sizes: '780x1688', type: 'image/webp', form_factor: 'narrow', label: 'Analyse et découpage' },
          { src: '/shots/fr-processing.webp', sizes: '780x1688', type: 'image/webp', form_factor: 'narrow', label: 'Optimisation sur le téléphone' },
          { src: '/shots/fr-results.webp', sizes: '780x1688', type: 'image/webp', form_factor: 'narrow', label: 'Parties prêtes à partager' },
        ],
        theme_color: '#0B0F1A',
        background_color: '#0B0F1A',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/app/',
        start_url: '/app/',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
      },
    }),
  ],
});
