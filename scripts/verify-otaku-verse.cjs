// Run: node scripts/verify-otaku-verse.cjs <path-to-playwright-package>
// API calls are intercepted. These checks never write to a real backend.
const { chromium } = require(process.argv[2] || 'playwright')
const assert = require('node:assert/strict')
const fs = require('node:fs')

const base = process.env.VERSE_PREVIEW_URL || 'http://127.0.0.1:5173'
const output = '.preview.local'
const mobileOnly = process.argv.includes('--mobile-only')
const roomNames = {
  threshold: /Le seuil de l’infini$/,
  lanterns: /Galerie des lanternes$/,
  stairs: /Escaliers suspendus$/,
  biwa: /Chambre du biwa$/,
  heart: /Le cœur du château$/,
}
const sealActions = {
  lanterns: 'Éveiller les lanternes',
  stairs: 'Sceller le passage',
  biwa: 'Faire résonner le biwa',
}
const empty = {
  animes: [], themes: [], activities: [], events: [], posts: [], partners: [],
  products: [], mangas: [], popup: null, total: 0,
}

async function mockApi(context, requests) {
  await context.route('**/api/**', route => {
    requests.push({ method: route.request().method(), url: route.request().url() })
    return route.fulfill({ json: empty })
  })
}

async function settleLayout(page) {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
}

async function checkViewport(page, name) {
  await settleLayout(page)
  const dimensions = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }))
  assert.ok(dimensions.scroll <= dimensions.width + 1, `${name}: horizontal overflow ${JSON.stringify(dimensions)}`)
  const exit = page.getByRole('button', { name: 'Quitter le château', exact: true })
  if (await exit.count()) {
    const bounds = await exit.boundingBox()
    const viewport = page.viewportSize()
    assert.ok(bounds && bounds.x >= 0 && bounds.y >= 0 && bounds.x + bounds.width <= viewport.width + 1 && bounds.y + bounds.height <= viewport.height + 1, `${name}: exit must stay visible`)
  }
}

async function enter(page) {
  await page.getByRole('button', { name: 'Entrer dans le château', exact: true }).click()
  await page.getByRole('button', { name: 'Quitter le château', exact: true }).waitFor()
  await page.getByTestId('verse-room').waitFor()
}

async function travel(page, room) {
  await page.getByRole('button', { name: 'Carte du château', exact: true }).click()
  const map = page.getByRole('dialog', { name: 'Carte du château', exact: true })
  await map.waitFor()
  await map.getByRole('button', { name: roomNames[room] }).click()
  await map.waitFor({ state: 'hidden' })
  await page.waitForFunction(id => document.querySelector('[data-testid="verse-room"]')?.dataset.room === id, room)
  await page.waitForTimeout(500) // Let the room transition finish before visual checks.
}

async function desktop(context, errors) {
  const page = await context.newPage()
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(`${base}/otaku-verse`)
  await page.getByRole('heading', { name: /Le Château de l’Infini/i }).waitFor()
  await page.getByRole('link', { name: 'Otaku-verse', exact: true }).first().waitFor()
  await checkViewport(page, 'desktop landing')
  await page.screenshot({ path: `${output}/verse-landing-desktop.png`, fullPage: true })
  await enter(page)
  assert.equal(await page.getByTestId('verse-room').getAttribute('data-room'), 'threshold')
  await page.getByTestId('verse-progress').getByText(/0\s*\/\s*3/).waitFor()
  await checkViewport(page, 'desktop visit')
  const canvas = page.getByTestId('verse-canvas')
  await canvas.waitFor()
  await canvas.focus()
  const startPosition = await canvas.getAttribute('data-position')
  await page.keyboard.down('w')
  await page.waitForTimeout(250)
  await page.keyboard.up('w')
  await page.waitForFunction(position => document.querySelector('[data-testid="verse-canvas"]')?.dataset.position !== position, startPosition)
  const startOrientation = await canvas.getAttribute('data-orientation')
  const canvasBox = await canvas.boundingBox()
  await page.mouse.move(canvasBox.x + canvasBox.width * .6, canvasBox.y + canvasBox.height * .4)
  await page.mouse.down()
  await page.mouse.move(canvasBox.x + canvasBox.width * .7, canvasBox.y + canvasBox.height * .4, { steps: 5 })
  await page.mouse.up()
  await page.waitForFunction(orientation => document.querySelector('[data-testid="verse-canvas"]')?.dataset.orientation !== orientation, startOrientation)
  await page.getByRole('button', { name: 'Activer le son', exact: true }).click()
  await page.getByRole('button', { name: 'Couper le son', exact: true }).click()
  await page.getByRole('button', { name: 'Activer le son', exact: true }).waitFor()
  await page.getByRole('button', { name: 'Carte du château', exact: true }).click()
  const map = page.getByRole('dialog', { name: 'Carte du château', exact: true })
  assert.equal(await map.getByRole('button', { name: roomNames.heart }).isDisabled(), true, 'heart requires three seals')
  await page.keyboard.press('Escape')
  await map.waitFor({ state: 'hidden' })
  // Escape dismisses the current panel; a second Escape pauses the visit.
  await page.keyboard.press('Escape')
  await page.getByRole('dialog', { name: 'La visite est en pause', exact: true }).waitFor()
  await page.waitForFunction(() => document.querySelector('[data-testid="verse-canvas"]')?.dataset.paused === 'true')
  const pausedPosition = await canvas.getAttribute('data-position')
  await page.keyboard.down('w')
  await page.waitForTimeout(200)
  await page.keyboard.up('w')
  assert.equal(await canvas.getAttribute('data-position'), pausedPosition, 'pause stops camera movement')
  await page.getByRole('button', { name: 'Reprendre la visite', exact: true }).click()
  await page.getByRole('button', { name: 'Aide', exact: true }).click()
  await page.getByRole('dialog').waitFor()
  await page.keyboard.press('Escape')
  await page.getByRole('dialog').waitFor({ state: 'hidden' })
  let count = 0
  for (const room of ['lanterns', 'stairs', 'biwa']) {
    await travel(page, room)
    await page.getByRole('button', { name: sealActions[room], exact: true }).click()
    count++
    await page.getByTestId('verse-progress').getByText(new RegExp(`${count}\\s*\\/\\s*3`)).waitFor()
    await checkViewport(page, `desktop ${room}`)
    await page.screenshot({ path: `${output}/verse-${room}-desktop.png` })
  }
  await travel(page, 'heart')
  await page.screenshot({ path: `${output}/verse-heart-desktop.png` })
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('op_otaku_verse_v1')))
  assert.deepEqual([...stored.seals].sort(), ['biwa', 'lanterns', 'stairs'])
  assert.ok(stored.visited.includes('heart'))
  await page.getByRole('button', { name: 'Quitter le château', exact: true }).click()
  await page.getByRole('button', { name: 'Entrer dans le château', exact: true }).waitFor()
  await page.reload()
  await enter(page)
  await page.getByTestId('verse-progress').getByText(/3\s*\/\s*3/).waitFor()
  await page.getByRole('button', { name: 'Activer le son', exact: true }).waitFor()
  await travel(page, 'heart')
  await page.keyboard.press('Escape')
  await page.getByRole('dialog', { name: 'La visite est en pause', exact: true }).getByRole('button', { name: 'Quitter le château', exact: true }).click()
  await page.getByRole('button', { name: 'Entrer dans le château', exact: true }).waitFor()
  assert.notEqual(await page.evaluate(() => getComputedStyle(document.body).overflow), 'hidden', 'exit from pause restores scrolling')
  await page.goto(`${base}/blog`)
  assert.equal(await page.getByTestId('verse-scene').count(), 0, 'scene unmounts after leaving route')
  assert.notEqual(await page.evaluate(() => getComputedStyle(document.body).overflow), 'hidden', 'page scrolling restored')
  await page.close()
}

async function mobile(browser, errors, requests) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' })
  await mockApi(context, requests)
  const page = await context.newPage()
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(`${base}/otaku-verse`)
  await page.getByRole('button', { name: 'Entrer dans le château', exact: true }).waitFor()
  await checkViewport(page, 'mobile landing')
  await page.getByRole('button', { name: 'Menu', exact: true }).tap()
  await page.getByRole('link', { name: 'Otaku-verse', exact: true }).tap()
  assert.equal(await page.getByRole('button', { name: 'Menu', exact: true }).getAttribute('aria-expanded'), 'false', 'mobile navigation closes after following link')
  await page.screenshot({ path: `${output}/verse-landing-mobile.png`, fullPage: true })
  await enter(page)
  await checkViewport(page, 'mobile visit')
  await page.getByRole('button', { name: 'Mode calme', exact: true }).waitFor()
  assert.equal(await page.getByRole('button', { name: 'Mode calme', exact: true }).getAttribute('aria-pressed'), 'true', 'reduced motion enables calm mode')
  const canvas = page.getByTestId('verse-canvas')
  await canvas.waitFor()
  const cdp = await context.newCDPSession(page)
  const forward = await page.getByRole('button', { name: 'Avancer', exact: true }).boundingBox()
  const startPosition = await canvas.getAttribute('data-position')
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: forward.x + forward.width / 2, y: forward.y + forward.height / 2 }] })
  await page.waitForTimeout(250)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await page.waitForFunction(position => document.querySelector('[data-testid="verse-canvas"]')?.dataset.position !== position, startPosition)
  const startOrientation = await canvas.getAttribute('data-orientation')
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 150, y: 340 }] })
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 215, y: 350 }] })
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await page.waitForFunction(orientation => document.querySelector('[data-testid="verse-canvas"]')?.dataset.orientation !== orientation, startOrientation)
  await cdp.detach()
  await travel(page, 'lanterns')
  await page.getByRole('button', { name: sealActions.lanterns, exact: true }).tap()
  await page.getByTestId('verse-progress').getByText(/1\s*\/\s*3/).waitFor()
  await checkViewport(page, 'mobile lanterns')
  await page.screenshot({ path: `${output}/verse-visit-mobile.png` })
  await page.setViewportSize({ width: 320, height: 740 })
  await checkViewport(page, 'small mobile visit')
  await page.screenshot({ path: `${output}/verse-visit-small.png` })
  await page.setViewportSize({ width: 844, height: 390 })
  await checkViewport(page, 'landscape visit')
  for (const name of [sealActions.lanterns, 'Carte du château', 'Avancer']) {
    const bounds = await page.getByRole('button', { name, exact: true }).boundingBox()
    assert.ok(bounds && bounds.x >= 0 && bounds.y >= 0 && bounds.x + bounds.width <= 845 && bounds.y + bounds.height <= 391, `landscape: ${name} stays in viewport`)
  }
  await page.screenshot({ path: `${output}/verse-visit-landscape.png` })
  await page.getByRole('button', { name: 'Carte du château', exact: true }).tap()
  await page.getByRole('dialog', { name: 'Carte du château', exact: true }).waitFor()
  await checkViewport(page, 'landscape map')
  await page.keyboard.press('Escape')
  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole('button', { name: 'Aide', exact: true }).tap()
  await checkViewport(page, 'mobile help')
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Quitter le château', exact: true }).tap()
  await page.getByRole('button', { name: 'Entrer dans le château', exact: true }).waitFor()
  await context.close()
}

async function fallback(browser, errors, requests) {
  const context = await browser.newContext({ viewport: { width: 1024, height: 768 }, reducedMotion: 'reduce' })
  await mockApi(context, requests)
  await context.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (kind, ...args) {
      return /webgl/i.test(kind) ? null : original.call(this, kind, ...args)
    }
    localStorage.setItem('op_otaku_verse_v1', '{malformed')
  })
  const page = await context.newPage()
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(`${base}/otaku-verse`)
  await enter(page)
  await page.getByTestId('verse-progress').getByText(/0\s*\/\s*3/).waitFor()
  await travel(page, 'lanterns')
  await page.getByRole('button', { name: sealActions.lanterns, exact: true }).click()
  await page.getByTestId('verse-progress').getByText(/1\s*\/\s*3/).waitFor()
  await checkViewport(page, 'WebGL unavailable')
  await page.screenshot({ path: `${output}/verse-fallback.png` })
  await page.getByRole('button', { name: 'Quitter le château', exact: true }).click()
  await page.getByRole('button', { name: 'Entrer dans le château', exact: true }).waitFor()
  await context.close()
}

async function main() {
  fs.mkdirSync(output, { recursive: true })
  const errors = [], requests = []
  const browser = await chromium.launch({ channel: 'msedge', headless: true })
  try {
    if (!mobileOnly) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
      await mockApi(context, requests)
      await desktop(context, errors)
      await context.close()
    }
    await mobile(browser, errors, requests)
    if (!mobileOnly) await fallback(browser, errors, requests)
    assert.deepEqual(errors, [], 'no browser runtime errors')
    assert.deepEqual(requests.filter(request => !['GET', 'HEAD', 'OPTIONS'].includes(request.method)), [], 'exploration must not write to a backend')
    console.log(mobileOnly
      ? 'Otaku-verse verified: mobile navigation, portrait/landscape, real touch walking/looking, reduced motion, map, interaction, help and exit.'
      : 'Otaku-verse verified: desktop, mobile portrait/landscape, keyboard/mouse/touch, 3 seals, locked/unlocked heart, audio controls, pause/help, persistence, safe malformed save, WebGL fallback, exit and route cleanup.')
  } catch (error) {
    for (const [index, context] of browser.contexts().entries()) {
      for (const [pageIndex, page] of context.pages().entries()) {
        await page.screenshot({ path: `${output}/verse-failure-${index}-${pageIndex}.png`, fullPage: true }).catch(() => {})
        console.error('Failure page:', page.url(), await page.locator('body').innerText().catch(() => 'unavailable'))
        console.error('Stored progress:', await page.evaluate(() => localStorage.getItem('op_otaku_verse_v1')).catch(() => 'unavailable'))
      }
    }
    console.error('Runtime errors:', errors)
    throw error
  } finally {
    await browser.close()
  }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
