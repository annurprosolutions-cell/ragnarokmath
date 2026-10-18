/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 900,
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png', 'icons/*.svg', 'portraits/*.webp'],
      manifest: {
        name: 'Kembara Matematik',
        short_name: 'Kembara Math',
        description: 'RPG 3D Matematik dari Tahun 1 hingga Tingkatan 5. Mula sebagai Novice, kembara, jawab soalan dan naik level!',
        lang: 'ms',
        start_url: '/',
        scope: '/',
        display: 'fullscreen',
        orientation: 'any',
        background_color: '#1d2440',
        theme_color: '#2b4c9b',
        categories: ['education', 'games'],
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,webp,woff2}'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
    }),
  ],
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
