import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { applyMacraOverrides, overrideBooks } from './scripts/macra-overrides.mjs'

// The site is served from the root of a GitHub Pages custom domain
// (https://virgil.parsasam.ir/), so the production build uses a base of "/".
// Set VITE_BASE to override (use "/Virgil/" for a project sub-path); local dev
// and preview default to "/".
const base = process.env.VITE_BASE || '/'

// Large generated data files get a chunk each so they can be left out of the
// install-time precache and fetched (then cached) on demand. Sources is small
// and stays in the app shell; everything here is only needed on a few pages.
const DATA_CHUNKS = new Map([
  ['dictionary.generated.js', 'dictionary'],
  ['dictionary-index.generated.js', 'dictionary-index'],
  ['reading-vocabulary.generated.js', 'reading-vocabulary'],
  ['printed-vocabulary.generated.js', 'printed-vocabulary'],
  ['chapter-keywords.generated.js', 'chapter-keywords'],
  ['learning-path.generated.js', 'learning-path'],
  ['paradigm-rules.generated.js', 'paradigm-rules'],
])

function manualChunks(id) {
  const file = id.replace(/\\/g, '/').split('/').pop()
  const name = DATA_CHUNKS.get(file)
  return name ? `data-${name}` : undefined
}

// Book text lives under src/data/<book>/index.js. Put those chunks in their
// own folder so the service worker can runtime-cache them and keep the app
// shell precache small.
function chunkFileNames(chunkInfo) {
  const id = (chunkInfo.facadeModuleId || '').replace(/\\/g, '/')
  if (id.includes('/src/data/') && id.endsWith('/index.js')) {
    const folder = id.split('/src/data/')[1].split('/')[0]
    return `assets/books/${folder}-[hash].js`
  }
  if (String(chunkInfo.name || '').startsWith('data-')) {
    return 'assets/data/[name]-[hash].js'
  }
  return 'assets/[name]-[hash].js'
}

// Apply the reviewed macra corrections while the book modules are loaded.
// The source files stay exactly as the macronizer produced them; the build
// (and the dev server) sees the reviewed text, and the same manifest is used
// by the dictionary builder and the review script.
function macraOverrides() {
  const books = overrideBooks()

  return {
    name: 'virgil-macra-overrides',
    enforce: 'pre',
    transform(code, id) {
      if (!books.size) return null
      const file = id.replace(/\\/g, '/')
      const match = file.match(/\/src\/data\/([^/]+)\//)
      if (!match || !books.has(match[1])) return null

      const next = applyMacraOverrides(match[1], code)
      return next === code ? null : { code: next, map: null }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  base,
  build: {
    rollupOptions: {
      output: {
        manualChunks,
        chunkFileNames,
      },
    },
  },
  plugins: [
    macraOverrides(),
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
        // The install precache is the app shell only: route chunks, CSS, fonts
        // and images. Book text and the large generated indexes are fetched on
        // first use and kept by the runtime rules below.
        cleanupOutdatedCaches: true,
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        globIgnores: ['**/books/**', '**/data/**'],
        runtimeCaching: [
          {
            urlPattern: /\/assets\/books\/.*\.js$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'virgil-book-texts',
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /\/assets\/data\/.*\.js$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'virgil-data',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Reference-edition chapters are static JSON in public/sources/.
            urlPattern: /\/sources\/.*\.json$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'virgil-source-texts',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 365 },
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
