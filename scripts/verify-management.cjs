// Local browser verification. All API calls are intercepted; no production writes.
const { chromium } = require(process.argv[2] || 'playwright')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const output = '.preview.local'
const base = 'http://127.0.0.1:5173'
const user = { id: '11111111-1111-4111-8111-111111111111', pseudo: 'Nakama', email: 'test@example.com', role: 'superadmin', isPublisher: true, hasAcceptedPolicy: true, policyAcceptedAt: '2026-01-01', policyVersion: '2026-01', city: 'Yaoundé', quartier: 'Bastos', whatsapp: '+237670000000' }
const product = { id: '22222222-2222-4222-8222-222222222222', nameF: 'Carnet Maomao', price: 5000, stock: 3, isActive: true, category: 'accessoires', imageUrl: '/broken-image.jpg' }
let posts = [], events = [], requests = [], errors = []
let accessAllowed = true
const failures = new Set()
const manga = { id: '33333333-3333-4333-8333-333333333333', slug: 'manga-cameroun', titleF: 'Les gardiens du Wouri', authorId: user.id, authorName: 'Nakama', moderationStatus: 'approved', accessTier: 'premium', genres: [], coverUrl: '/assets/image-placeholder.svg', totalChapters: 2, viewCount: 10, status: 'ongoing', createdAt: new Date().toISOString() }
let chapters = [{ id: '44444444-4444-4444-8444-444444444444', mangaId: manga.id, chapterNumber: '1.00', title: 'Au bord du fleuve', pageCount: 1, accessTier: 'premium', coinCost: 5, isPublished: true, pages: [{ url: '/img/kaisen.jpg' }] }]
const empty = { stats: {}, dashboard: {}, chart: [], users: [], products: [], suppliers: [], orders: [], invoices: [], contacts: [], events: [], posts: [], partners: [], registrations: [], applications: [], mangas: [], chapters: [], subscriptions: [], comments: [], requests: [], purchases: [], members: [], plans: [], animes: [], activities: [], transactions: [], polls: [], leaderboard: [], questions: [], draws: [], scores: [], items: [], total: 0 }
async function main() {
  fs.mkdirSync(output, { recursive: true })
  const browser = await chromium.launch({ channel: 'msedge', headless: true })
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' })
    await context.addInitScript(({ user, product }) => { localStorage.setItem('op_user', JSON.stringify(user)); localStorage.setItem('op_token', 'fixture'); localStorage.setItem('op_cart', JSON.stringify([{ ...product, name: product.nameF, qty: 1 }])) }, { user, product })
    const page = await context.newPage()
    page.on('pageerror', error => errors.push(error.message))
    await context.route('**/api/**', async route => {
      const req = route.request(), url = new URL(req.url()), path = url.pathname, method = req.method()
      requests.push({ path, method, body: req.postData() ? JSON.parse(req.postData()) : null })
      if (failures.has(path)) return route.fulfill({ status: 503, json: { error: 'Serveur indisponible pour cet essai' } })
      let data = { ...empty }
      if (path === '/api/auth/me') data = { user }
      if (path === '/api/hero') data = { hero: { taglineF: 'Le rendez-vous des nakama', line1F: 'Un peu d’anime', accentF: 'passion', bgImageUrl: '/img/kaisen.jpg' } }
      if (path === '/api/fandom/config') data = { config: { titleF: 'Fandom', subtitleF: 'La communauté' } }
      if (path === '/api/admin/dashboard') data = { stats: { users: { total: 12, month: 3 }, orders: { total: 2, pending: 1 }, revenue: { total: 15000, month: 5000 }, products: { total: 1, lowStock: 1 }, contacts: { total: 0, newMonth: 0 }, events: { upcoming: 1 } } }
      if (path === '/api/auth/accept-policy') data = { user: { ...user, policyAcceptedAt: new Date().toISOString() } }
      if (path === '/api/blog/admin/posts' || path === '/api/blog') {
        if (method === 'POST') { const p = { ...req.postDataJSON(), id: 'post-1', createdAt: new Date().toISOString() }; posts.push(p); data = { post: p } }
        else { const list = path.includes('admin') ? posts : posts.filter(p => p.isPublished); data = { posts: list, total: list.length } }
      }
      if (path === '/api/blog/post-1') { if (method === 'PATCH') posts[0] = { ...posts[0], ...req.postDataJSON() }; data = { post: posts[0] } }
      if (path === '/api/blog/popup') data = { popup: null }
      if (path === '/api/events' || path === '/api/events/admin/list') {
        if (method === 'POST') { const event = { ...req.postDataJSON(), id: 'event-1', registered: 0 }; events.push(event); data = { event } }
        else data = { events, total: events.length }
      }
      if (path === '/api/events/event-1') data = { event: events[0] }
      if (path === '/api/events/register') data = { status: 'confirmed', message: 'Inscription enregistrée. Retrouve-la dans Mes billets.' }
      if (path === '/api/products' || path === '/api/products/admin/list') data = { products: [product], total: 1 }
      if (path === '/api/orders/quote') data = { items: [{ ...product, name: product.nameF, qty: 1, price: 5500 }] }
      if (path === '/api/orders' && method === 'POST') data = { order: { id: 'order-1', orderNumber: 'OP-TEST' } }
      if (path === '/api/publishers/dashboard') data = { stats: {}, mangas: [manga], topMangas: [] }
      if (path === '/api/manga/manga-cameroun') data = { manga, chapters }
      if (path === `/api/chapters/by-manga/${manga.id}`) data = { chapters }
      if (path === '/api/chapters' && method === 'POST') { const chapter = { ...req.postDataJSON(), id: 'chapter-new', pageCount: req.postDataJSON().pages.length }; chapters.push(chapter); data = { chapter } }
      if (path === `/api/chapters/${chapters[0].id}`) data = { chapter: { ...chapters[0], pages: accessAllowed ? chapters[0].pages : [], manga, accessGranted: accessAllowed }, access: { allowed: accessAllowed, reason: accessAllowed ? 'owner' : 'unlock_required' } }
      if (path === `/api/coins/unlock/${chapters[0].id}`) { accessAllowed = true; data = { success: true, newBalance: 25 } }
      if (path === '/api/coins/wallet') data = { wallet: { balance: 30 } }
      await route.fulfill({ json: data })
    })
    const sections = ['dashboard','orders','invoices','products','suppliers','events','contacts','fandom','anime','users','membership','blog','hero','manga','publishers','subs','mangaComm','coins']
    for (const section of sections) {
      await page.goto(`${base}/admin?section=${section}`)
      await page.waitForTimeout(450)
      if (await page.getByRole('button', { name: /accepte et je continue/ }).count()) await page.getByRole('button', { name: /accepte et je continue/ }).click()
      try { await page.locator('main').waitFor({ timeout: 15000 }) } catch (err) { await page.screenshot({ path: `${output}/failure-${section}.png` }); console.log('Page failure:', errors, await page.locator('body').innerText()); throw err }
      await page.screenshot({ path: `${output}/admin-${section}.png`, fullPage: true })
      await page.setViewportSize({ width: 390, height: 844 })
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
      if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)) {
        await page.screenshot({ path: `${output}/overflow-${section}.png`, fullPage: true })
        console.log('Overflow elements:', await page.evaluate(() => [...document.querySelectorAll('main *')].filter(el => el.getBoundingClientRect().right > innerWidth + 1).slice(0, 12).map(el => ({ tag: el.tagName, class: el.className, width: el.getBoundingClientRect().width, text: el.textContent.slice(0, 70) }))))
      }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `Admin mobile overflow: ${section}`)
      await page.setViewportSize({ width: 1440, height: 1000 })
    }
    console.log('Admin sections visited:', sections.length, 'runtime errors:', errors)
    assert.deepEqual(errors, [])
    await page.goto(`${base}/admin?section=blog`)
    await page.getByRole('button', { name: 'Écrire un article', exact: false }).click()
    await page.getByLabel('Titre *', { exact: true }).fill('Convention otaku à Douala')
    await page.getByLabel('Catégorie').selectOption('event')
    await page.getByLabel('Article *').fill('Cosplay et rencontre des créateurs camerounais.')
    await page.getByLabel('Date *', { exact: true }).fill('2027-06-15')
    await page.getByLabel('Ville *', { exact: true }).fill('Douala')
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jL1kAAAAASUVORK5CYII=', 'base64')
    await page.locator('[role="dialog"] input[type=file]').setInputFiles({ name: 'broken.png', mimeType: 'image/png', buffer: Buffer.from('not an image') })
    await page.getByText('Cette image est illisible.', { exact: false }).waitFor()
    await page.locator('[role="dialog"] input[type=file]').setInputFiles({ name: 'affiche.png', mimeType: 'image/png', buffer: png })
    await page.getByText('Image prête.', { exact: false }).waitFor()
    await page.getByRole('button', { name: 'Enregistrer', exact: true }).click()
    await page.getByRole('dialog').waitFor({ state: 'hidden' })
    assert.equal(posts[0].isPublished, false)
    assert.match(posts[0].imageUrl, /^data:image\//)
    await page.getByRole('button', { name: 'Modifier', exact: true }).click()
    await page.getByLabel('Rendre public').check()
    await page.getByRole('button', { name: 'Enregistrer', exact: true }).click()
    await page.getByRole('dialog').waitFor({ state: 'hidden' })
    assert.equal(posts[0].isPublished, true)
    await page.goto(`${base}/blog?article=post-1`)
    await page.getByRole('dialog').getByText('Cosplay et rencontre', { exact: false }).waitFor()
    await page.screenshot({ path: `${output}/blog-detail.png`, fullPage: true })
    await page.keyboard.press('Escape')
    await page.getByRole('dialog').waitFor({ state: 'hidden' })
    await page.goto(`${base}/admin?section=events`)
    await page.getByRole('button', { name: 'Créer un événement', exact: false }).click()
    await page.getByLabel('Titre *', { exact: true }).fill('Nakama Fest')
    await page.getByLabel('Date *', { exact: true }).fill('2027-06-15')
    await page.getByLabel('Lieu précis / adresse').fill('Maison de la culture')
    await page.getByLabel('Visibilité / état').selectOption('upcoming')
    await page.getByRole('button', { name: 'Enregistrer', exact: true }).click()
    await page.getByRole('dialog').waitFor({ state: 'hidden' })
    await page.goto(`${base}/evenements?event=event-1`)
    await page.getByRole('button', { name: 'Réserver mes places' }).click()
    await page.getByText('Inscription enregistrée.', { exact: false }).waitFor()
    await page.goto(`${base}/panier`)
    await page.getByRole('button', { name: "Finaliser l'achat" }).click()
    await page.getByRole('dialog').getByText('5', { exact: false }).first().waitFor()
    await page.getByRole('button', { name: 'Confirmer la commande' }).click()
    await page.getByText('OP-TEST', { exact: true }).waitFor()
    const checkout = requests.find(r => r.path === '/api/orders' && r.method === 'POST')
    assert.equal(checkout.body.expectedSubtotal, 5500)
    assert.ok(checkout.body.checkoutKey)
    await page.goto(`${base}/manga/publisher`)
    await page.getByRole('button', { name: /Mes Mangas/i }).click()
    await page.getByRole('button', { name: /chapitre/i }).first().click()
    await page.getByRole('dialog').waitFor()
    await page.locator('[role="dialog"] input[type=file]').setInputFiles([{ name: 'page10.png', mimeType: 'image/png', buffer: png }, { name: 'page2.png', mimeType: 'image/png', buffer: png }])
    await page.getByRole('button', { name: 'Enregistrer le brouillon' }).click()
    await page.getByRole('dialog').waitFor({ state: 'hidden' })
    const chapter = requests.find(r => r.path === '/api/chapters' && r.method === 'POST').body
    assert.equal(chapter.isPublished, false)
    assert.equal(chapter.pages.length, 2)
    assert.equal(chapter.chapterNumber, 2)
    await page.goto(`${base}/manga/manga-cameroun/chapter/1`)
    await page.locator('img[src*="kaisen"]').waitFor()
    accessAllowed = false
    await page.reload()
    await page.getByRole('button', { name: /Débloquer/ }).click()
    await page.locator('img[src*="kaisen"]').waitFor()
    assert.equal(requests.filter(r => r.path.startsWith('/api/coins/unlock/')).length, 1)
    for (const path of ['/admin?section=blog','/evenements','/blog','/panier','/profil?tab=profil']) {
      await page.setViewportSize({ width: 390, height: 844 })
      await page.goto(base + path)
      await page.waitForTimeout(500)
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)
      assert.equal(overflow, false, `Horizontal overflow: ${path}`)
      await page.screenshot({ path: `${output}/mobile-${path.split('?')[0].slice(1)}.png`, fullPage: true })
    }
    failures.add('/api/blog/admin/posts')
    await page.goto(`${base}/admin?section=blog`)
    await page.getByRole('alert').getByText('Serveur indisponible', { exact: false }).waitFor()
    failures.delete('/api/blog/admin/posts')
    await page.getByRole('button', { name: 'Réessayer', exact: true }).click()
    await page.getByRole('heading', { name: 'Convention otaku à Douala' }).waitFor()
    posts = []
    await page.goto(`${base}/blog`)
    await page.getByRole('heading', { name: 'Le journal se prépare' }).waitFor()
    assert.equal(await page.getByText('Grand Lancement — 30 Juin 2026').count(), 0)
    await page.evaluate(() => { localStorage.removeItem('op_token'); localStorage.removeItem('op_user') })
    await page.getByRole('button', { name: 'Mon panier' }).click()
    // Client routing retains auth until reload; verify the guest route in a fresh context.
    const guest = await browser.newContext({ viewport: { width: 390, height: 844 } })
    await guest.route('**/api/**', route => route.fulfill({ json: empty }))
    const guestPage = await guest.newPage()
    await guestPage.goto(`${base}/panier`)
    await guestPage.getByText('Ton panier est vide', { exact: true }).waitFor()
    assert.equal(await guestPage.getByRole('dialog').count(), 0)
    await guestPage.evaluate(product => localStorage.setItem('op_cart', JSON.stringify([{ ...product, name: product.nameF, qty: 1 }])), product)
    await guestPage.reload()
    await guestPage.getByRole('button', { name: "Se connecter / S'inscrire", exact: true }).click()
    await guestPage.getByRole('dialog').waitFor()
    assert.equal(new URL(guestPage.url()).pathname, '/panier')
    await guest.close()
    assert.deepEqual(errors, [])
    fs.writeFileSync(`${output}/management-requests.json`, JSON.stringify(requests.map(r => ({ ...r, body: r.body && Object.keys(r.body) })), null, 2))
    console.log('Verified: 18 admin sections, article image upload/draft/publish, event booking, updated checkout, manga draft upload, premium owner reading and mobile layouts.')
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
