// Run with a Vite server on :5173 and a local Playwright package path.
// APIs and media playback are mocked; this does not contact a live backend.
const assert = require('node:assert/strict')
const { chromium } = require(process.argv[2] || 'playwright')

async function main() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true })
  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      reducedMotion: 'reduce',
    })
    await context.route('**/api/**', (route) =>
      route.fulfill({ json: { posts: [], partners: [], total: 0, popup: null } })
    )
    await context.addInitScript(() => {
      window.__ambiencePlays = 0
      Object.defineProperty(HTMLMediaElement.prototype, 'paused', {
        configurable: true,
        get() { return this.__paused !== false },
      })
      HTMLMediaElement.prototype.play = function () {
        this.__paused = false
        window.__ambiencePlays++
        this.dispatchEvent(new Event('play'))
        return Promise.resolve()
      }
      HTMLMediaElement.prototype.pause = function () {
        this.__paused = true
        this.dispatchEvent(new Event('pause'))
      }
    })
    const page = await context.newPage()
    await page.goto('http://127.0.0.1:5173/blog')
    const nav = page.getByRole('navigation', { name: 'Navigation principale' })
    await nav.waitFor()
    await page.evaluate(() => document.fonts.ready)
    for (const width of [1440, 1280, 1241, 1240, 1024, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 900 })
      await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))))
      const overflowing = await nav.evaluate((root) =>
        Array.from(root.querySelectorAll('a,button')).filter((el) => {
          const bounds = el.getBoundingClientRect()
          return bounds.width > 0 && (bounds.left < -1 || bounds.right > innerWidth + 1)
        }).map((el) => el.textContent || el.getAttribute('aria-label'))
      )
      assert.deepEqual(overflowing, [], `Navigation overflows at ${width}px`)
      if (width > 1240) {
        assert(await nav.getByRole('link', { name: 'Otaku-verse', exact: true }).isVisible())
        const overlap = await nav.evaluate((root) => {
          const links = root.querySelector('ul').getBoundingClientRect()
          const lastLink = root.querySelector('ul li:last-child').getBoundingClientRect()
          return lastLink.right > links.right + 1
        })
        assert(!overlap, `Desktop links overlap account controls at ${width}px`)
      } else {
        await nav.getByRole('button', { name: 'Menu', exact: true }).click()
        assert(await nav.getByRole('link', { name: 'Otaku-verse', exact: true }).isVisible())
        await page.keyboard.press('Escape')
        assert.equal(await nav.getByRole('button', { name: 'Menu', exact: true }).getAttribute('aria-expanded'), 'false')
      }
    }
    await page.setViewportSize({ width: 1440, height: 1000 })
    await page.getByRole('button', { name: 'Écouter l’ambiance musicale', exact: true }).click()
    assert.equal(await page.evaluate(() => window.__ambiencePlays), 1)
    await nav.getByRole('link', { name: 'Otaku-verse', exact: true }).click()
    await page.waitForURL('**/otaku-verse')
    await page.waitForFunction(() => document.querySelector('audio').paused)
    assert.equal(await page.getByRole('button', { name: /ambiance musicale|ambiance en pause/ }).count(), 0)
    await page.goBack()
    await page.waitForURL('**/blog')
    assert(await page.getByRole('button', { name: 'Écouter l’ambiance musicale', exact: true }).isVisible())
    assert.equal(await page.evaluate(() => window.__ambiencePlays), 1, 'Returning must not restart music')
    assert(await page.evaluate(() => document.querySelector('audio').paused))

    await page.setViewportSize({ width: 390, height: 844 })
    await nav.getByRole('button', { name: 'Menu', exact: true }).click()
    await nav.getByRole('link', { name: 'Otaku-verse', exact: true }).click()
    await page.waitForURL('**/otaku-verse')
    await page.reload()
    await page.waitForFunction(() => Boolean(document.querySelector('audio')))
    assert(await page.evaluate(() => document.querySelector('audio').paused))
    assert.equal(await page.getByRole('button', { name: /ambiance musicale|ambiance en pause/ }).count(), 0)
    console.log('PASS: Otaku-verse navigation at eight widths, desktop/mobile routing, direct loading, pause on entry and no music restart on return.')
  } finally {
    await browser.close()
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
