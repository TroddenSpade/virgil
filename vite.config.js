import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// The site is served from the root of a GitHub Pages custom domain
// (https://virgil.parsasam.ir/), so the production build uses a base of "/".
// Set VITE_BASE to override (use "/Virgil/" for a project sub-path); local dev
// and preview default to "/".
const base = process.env.VITE_BASE || '/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      // 'prompt' instead of 'autoUpdate': a new service worker waits until the
      // user accepts the update, at which point we activate it and reload so the
      // page is served from the freshly fetched version.
      registerType: 'prompt',
      // Registration is handled explicitly by useRegisterSW in PwaUpdatePrompt,
      // so don't also inject the auto-register script into index.html.
      injectRegister: null,
      includeAssets: ['favicon.svg', 'icons/favicon-64.png', 'icons/apple-touch-icon.png', 'icons/icon-maskable-512.png'],
      manifest: {
        name: 'Virgil — Latin, from Familia Romana to the Aeneid',
        short_name: 'Virgil',
        description:
          'A Latin learning project. Begin with Lingua Latina: Familia Romana and read your way toward the works of Virgil.',
        lang: 'en',
        theme_color: '#1b3b30',
        background_color: '#ece3d0',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: base,
        start_url: base,
        categories: ['education', 'books'],
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // The authored course bundle and the dictionary index now exceed
        // Workbox's 2 MB default; keep them in the offline precache.
        maximumFileSizeToCacheInBytes: 20 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // The full 17 MB dictionary is only needed on word-detail and paradigm
        // pages. Keep it out of the install-time precache so the app starts
        // small; the runtime rule below caches it after the first such page.
        globIgnores: ['**/dictionary.generated-*.js'],
        runtimeCaching: [
          {
            urlPattern: /\/assets\/dictionary\.generated-[^/]+\.js$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'dictionary-full',
              expiration: { maxEntries: 4, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  server: {
    host: true,
    port: 5173,
  },
})
