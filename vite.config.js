import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig(({ command }) => ({
  plugins: [
    tailwindcss(),
    react(),
    // Service worker caches the app itself so it opens offline. Notes are
    // cached separately in IndexedDB (src/lib/cache.js). Updates are applied
    // by src/lib/updates.js, which waits until you're not typing.
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,mjs,css,html,png,svg,json,woff2}'],
        navigateFallback: 'index.html',
      },
    }),
  ],
  base: command === 'serve' ? '/' : '/folio/',
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    environment: 'node',
  },
}))
