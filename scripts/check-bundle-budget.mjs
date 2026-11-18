#!/usr/bin/env node
/**
 * Fail the build when the initial JavaScript grows past its budget.
 *
 * The budget counts the entry chunk plus every module it preloads: exactly
 * what a first visit must download before the first page can render. Lazy
 * route chunks are not included.
 *
 * Run after `vite build`:
 *   node scripts/check-bundle-budget.mjs
 *
 * Override the budget (bytes) with BUNDLE_BUDGET_BYTES.
 */
import { readFile, stat } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DIST = join(ROOT, 'dist')
const LIMIT = Number(process.env.BUNDLE_BUDGET_BYTES || 1_000_000)

const html = await readFile(join(DIST, 'index.html'), 'utf8')

const urls = new Set()
for (const match of html.matchAll(/<script[^>]+src="([^"]+)"/g)) urls.add(match[1])
for (const match of html.matchAll(/<link[^>]+rel="modulepreload"[^>]+href="([^"]+)"/g)) {
  urls.add(match[1])
}

if (!urls.size) {
  console.error('Bundle budget: no entry scripts found in dist/index.html')
  process.exit(1)
}

const files = []
for (const url of urls) {
  const path = join(DIST, url.replace(/^\//, '').split('?')[0])
  try {
    files.push({ url, size: (await stat(path)).size })
  } catch {
    console.error(`Bundle budget: missing file for ${url}`)
    process.exit(1)
  }
}

files.sort((a, b) => b.size - a.size)
const total = files.reduce((sum, file) => sum + file.size, 0)
const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`

console.log('Initial JavaScript:')
for (const file of files) console.log(`  ${kb(file.size).padStart(9)}  ${file.url}`)
console.log(`  ${'—'.repeat(9)}`)
console.log(`  ${kb(total).padStart(9)}  total (budget ${kb(LIMIT)})`)

if (total > LIMIT) {
  console.error(
    `Bundle budget exceeded by ${kb(total - LIMIT)}. ` +
      'Split the new dependency into a lazy chunk or raise the budget deliberately.',
  )
  process.exit(1)
}
