import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// What the built app may load (a Content Security Policy, a meta tag in index.html; not on the dev server, whose
// hot reload needs more): its own scripts only (no inline ones, no eval; WebAssembly for the PDF viewer's image
// decoders), data only to itself and GitHub's API, no forms sent anywhere, no plugins or frames. Images may come from any
// https site (a note's images, link favicons) or be data: / blob: (the repo's images, PDF pages). Inline styles stay
// allowed: the app sets element styles. No referrer is sent with any request, so the sites a note's images and links
// point to don't learn the app's address.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'wasm-unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: blob:",
  "connect-src 'self' https://api.github.com",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "object-src 'none'",
  "frame-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
].join('; ')
const securityHeaders = {
  name: 'folio-security-headers',
  apply: 'build',
  transformIndexHtml: () => [
    { tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP }, injectTo: 'head-prepend' },
    { tag: 'meta', attrs: { name: 'referrer', content: 'no-referrer' }, injectTo: 'head-prepend' },
  ],
}

export default defineConfig(({ command }) => ({
  plugins: [
    securityHeaders,
    tailwindcss(),
    react(),
    // Service worker (src/sw.js) caches the app itself so it opens offline,
    // but loads the page from the network first. Notes are cached separately
    // in IndexedDB (src/lib/cache.js). Updates are applied by
    // src/lib/updates.js, which waits until you're not typing.
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'prompt',
      injectRegister: false,
      manifest: false,
      injectManifest: {
        globPatterns: ['**/*.{js,mjs,css,html,png,svg,json,woff2}'],
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
