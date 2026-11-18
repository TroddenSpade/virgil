import { test, expect } from '@playwright/test'
import { libraryStats } from '../../src/data/library-stats.generated.js'

// The page copy must show the generated counts, not a number typed into JSX.
// Reading the same module the pages read keeps the test correct as data grows
// while still failing loudly on any stale hardcoded value.
const WORDS = libraryStats.words.toLocaleString('en-US')
const LEMMAS = libraryStats.lemmas.toLocaleString('en-US')

test.describe('Virgil smoke', () => {
  test('home shows generated counts and the running build', async ({
    page,
    request,
  }) => {
    await page.goto('/home')

    await expect(page.locator('.hero__title')).toContainText('Learn Latin')
    await expect(
      page.locator('.approach-tool', { hasText: 'The Lexicon' }),
    ).toContainText(`${WORDS} words from ${LEMMAS} lemmas`)
    await expect(page.locator('body')).not.toContainText('30,000')

    // The deployed description and the bundle's footer stamp must be the same
    // build. version.json is emitted next to index.html, not precached.
    const response = await request.get('/version.json')
    expect(response.ok()).toBe(true)
    const version = await response.json()
    expect(version.shortCommit).toMatch(/^([0-9a-f]{7,40}|dev)$/)
    expect(Number.isNaN(Date.parse(version.builtAt))).toBe(false)

    const stamp = page.locator('.site-footer__build')
    await expect(stamp).toContainText(`Build ${version.shortCommit}`)
    await expect(stamp).toContainText(
      new Date(version.builtAt).getFullYear().toString(),
    )
  })

  test('reads a chapter, adds it to the wordlist and reviews a word', async ({
    page,
  }) => {
    await page.goto('/library')
    await expect(page.locator('.library-meta')).toContainText(
      `${WORDS} dictionary words`,
    )

    await page.locator('a[href="/library/familia-romana"]').first().click()
    await expect(page).toHaveURL(/\/library\/familia-romana$/)
    await expect(page.locator('.book-hero__title')).toContainText(
      'Familia Romana',
    )

    await page
      .locator('a[href="/library/familia-romana/imperium-romanum"]')
      .first()
      .click()
    await expect(page).toHaveURL(
      /\/library\/familia-romana\/imperium-romanum$/,
    )
    await expect(page.locator('.lesson__latin-title')).toContainText(
      'IMPERIVM ROMANVM',
    )

    await page.getByRole('button', { name: 'Mark as learned' }).click()
    await expect(
      page.getByRole('button', { name: /Marked as learned/ }),
    ).toBeVisible()

    // Marking the chapter adds its vocabulary to the personal wordlist.
    await page.goto('/wordlist/review?mode=new')
    await expect(page.locator('.review-setup')).toBeVisible()
    const begin = page.getByRole('button', { name: /^Begin new session/ })
    await expect(begin).toBeEnabled()
    await begin.click()

    await expect(page.locator('.review-card')).toBeVisible()
    await page.getByRole('button', { name: 'Reveal answer' }).click()
    await expect(page.locator('.review-card__back')).toBeVisible()
    await page.locator('.review-rate', { hasText: 'Good' }).click()

    // The session advances to the next card, or finishes if only one word
    // was in the queue.
    await expect(
      page.locator('.review-card, .review-done').first(),
    ).toBeVisible()
  })

  test('searches the dictionary and opens a paradigm', async ({ page }) => {
    // The dictionary index and dictionary chunks are deliberately large and
    // load on demand, so this test gets more room than the reading flow.
    test.setTimeout(150_000)

    await page.goto('/dictionary?q=ripa')
    await expect(page.locator('.dict-entry').first()).toBeVisible({
      timeout: 90_000,
    })
    await expect(page.locator('.dictionary-count')).toContainText(
      'matching “ripa”',
    )

    const entry = page
      .locator('.dict-entry')
      .filter({
        has: page.locator('.dict-entry__latin', { hasText: /^rīpa$/ }),
      })
      .first()
    await expect(entry).toBeVisible()
    await entry.click()

    await expect(page).toHaveURL(/\/dictionary\//)
    await expect(page.locator('.lexicon__latin')).toContainText('rīpa')

    const paradigm = page.getByRole('link', { name: /Full paradigm/ })
    await expect(paradigm).toBeVisible()
    await paradigm.click()

    await expect(page).toHaveURL(/\/paradigm$/)
    await expect(page.locator('.paradigm-head .lexicon__latin')).toContainText(
      'rīpa',
    )
    await expect(page.locator('.paradigm-group').first()).toBeVisible()
  })

  test('serves the app shell offline after the worker installs', async ({
    page,
    context,
  }) => {
    await page.goto('/home')
    await expect(page.locator('.hero__title')).toContainText('Learn Latin')

    // Wait until the newly installed worker controls this page; clientsClaim
    // and skipWaiting make that happen without a second reload.
    await page.evaluate(() => navigator.serviceWorker.ready)
    await expect
      .poll(
        () =>
          page.evaluate(() => Boolean(navigator.serviceWorker.controller)),
        { timeout: 30_000 },
      )
      .toBe(true)

    await context.setOffline(true)
    try {
      await page.goto('/home')
      await expect(page.locator('.hero__title')).toContainText('Learn Latin')
      await expect(page.locator('.site-footer__build')).toBeVisible()
    } finally {
      await context.setOffline(false)
    }
  })
})
