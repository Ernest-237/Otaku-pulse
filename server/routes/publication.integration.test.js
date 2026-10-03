const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const { createRequire } = require('node:module')
const express = require('express')
const { Op } = require('sequelize')
const auth = {
  protect(req, res, next) { req.user = req.headers['x-role'] ? { id: 'user', role: req.headers['x-role'] } : null; return req.user ? next() : res.status(401).json({ error: 'Connexion requise' }) },
  restrictTo: (...roles) => (req, res, next) => roles.includes(req.user?.role) ? next() : res.status(403).json({ error: 'Non autorisé' }),
  optionalAuth(req, res, next) { req.user = req.headers['x-role'] ? { id: 'user', role: req.headers['x-role'] } : null; next() },
}
function load(name, mocks) {
  const filename = require.resolve(name), localRequire = createRequire(filename), module = { exports: {} }
  vm.runInNewContext(fs.readFileSync(filename, 'utf8'), { module, exports: module.exports, Buffer, Date, console, process: { env: {} }, require: key => mocks[key] || (key === '../middleware/auth' ? auth : localRequire(key)) }, { filename })
  return module.exports
}
async function withRoute(t, route, fn) {
  const app = express(); app.use(express.json()); app.use(route); app.use((err, req, res, next) => res.status(err.status || 500).json({ error: err.message }))
  const server = app.listen(0, '127.0.0.1')
  await new Promise(resolve => server.once('listening', resolve))
  t.after(() => new Promise(resolve => server.close(resolve)))
  const request = async (path, { role, method = 'GET', body } = {}) => {
    const response = await fetch(`http://127.0.0.1:${server.address().port}${path}`, { method, headers: { 'content-type': 'application/json', ...(role ? { 'x-role': role } : {}) }, body: body && JSON.stringify(body) })
    return { status: response.status, data: await response.json() }
  }
  await fn(request)
}
function blogFixture() {
  const queries = [], writes = []
  const post = { id: 'post', title: 'Journal', content: '', isPublished: false, category: 'blog', publishedAt: null, updatedAt: new Date(), toJSON() { return { ...this, toJSON: undefined, update: undefined, increment: undefined } }, update: async function(p) { writes.push(p); Object.assign(this, p) }, increment: async () => {} }
  const Post = { findByPk: async () => post, findAndCountAll: async q => { queries.push(q); return { rows: [post], count: 1 } } }
  const PromoPopup = { update: async p => writes.push(p), create: async p => { writes.push(p); return p } }
  const route = load('./blog', { '../config/database': { sequelize: { models: { Post, Partner: {}, PromoPopup } } } })
  return { route, post, queries, writes }
}
test('blog HTTP: admin drafts are reachable and unavailable to anonymous users', async t => {
  const f = blogFixture()
  await withRoute(t, f.route, async request => {
    assert.equal((await request('/admin/posts')).status, 401)
    assert.equal((await request('/admin/posts', { role: 'user' })).status, 403)
    const response = await request('/admin/posts?state=draft', { role: 'admin' })
    assert.equal(response.status, 200); assert.equal(response.data.posts[0].title, 'Journal')
    assert.equal(f.queries[0].where.isPublished, false)
    assert.equal((await request('/post')).status, 404)
  })
})
test('blog HTTP: PATCH validates final publication and preserves ownership', async t => {
  const f = blogFixture()
  await withRoute(t, f.route, async request => {
    assert.equal((await request('/post', { role: 'admin', method: 'PATCH', body: { isPublished: true } })).status, 400)
    const saved = await request('/post', { role: 'admin', method: 'PATCH', body: { isPublished: true, content: 'Texte complet', authorId: 'evil', views: 500 } })
    assert.equal(saved.status, 200); assert.equal(f.writes[0].authorId, undefined); assert.equal(f.writes[0].views, undefined)
    f.post.publishedAt = new Date('2099-01-01')
    assert.equal((await request('/post')).status, 404)
  })
})
test('blog HTTP: disabling a promotion does not recreate an active popup', async t => {
  const f = blogFixture()
  await withRoute(t, f.route, async request => {
    const result = await request('/popup', { role: 'admin', method: 'POST', body: { isActive: false } })
    assert.equal(result.status, 200); assert.equal(result.data.popup, null)
    assert.equal(f.writes.length, 1); assert.equal(f.writes[0].isActive, false)
  })
})
test('events HTTP: public details contain no registrations, drafts are hidden and admin listing works', async t => {
  const queries = []
  const event = { id: 'event', status: 'draft', titleF: 'Festival', toJSON() { return { id: this.id, status: this.status, titleF: this.titleF } } }
  const Event = { findByPk: async (id, query) => { queries.push(query); return event }, findAndCountAll: async () => ({ rows: [event], count: 1 }) }
  const route = load('./events', { '../models/index': { Event, EventRegistration: {}, User: {} }, '../utils/mailer': {} })
  await withRoute(t, route, async request => {
    assert.equal((await request('/event')).status, 404)
    event.status = 'upcoming'
    const response = await request('/event')
    assert.equal(response.status, 200); assert.equal(response.data.event.registrations, undefined); assert.equal(queries[1].include, undefined)
    assert.equal((await request('/admin/list', { role: 'admin' })).status, 200)
  })
})
test('event payment HTTP: confirmation locks current records and repeat does not issue twice', async t => {
  const transaction = { LOCK: { UPDATE: 'UPDATE' } }, writes = [], locks = []
  const event = { id: 'event', status: 'upcoming' }
  const registration = { id: 'registration', eventId: 'event', userId: 'user', status: 'confirmed', paymentStatus: 'pending', update: async function(values, options) { assert.equal(options.transaction, transaction); writes.push(values); Object.assign(this, values) } }
  const route = load('./events', {
    '../models/index': {
      sequelize: { transaction: fn => fn(transaction) },
      Event: { findByPk: async (id, options) => { assert.equal(options.lock, 'UPDATE'); locks.push('event'); return event } },
      EventRegistration: { findByPk: async (id, options) => { if (options) { assert.equal(options.transaction, transaction); assert.equal(options.lock, 'UPDATE'); locks.push('registration') } return registration } },
      User: { findByPk: async () => ({ id: 'user' }) },
    },
    '../utils/mailer': { sendTicketConfirmed: async () => {} },
  })
  await withRoute(t, route, async request => {
    const confirm = () => request('/registrations/registration/confirm-payment', { role: 'admin', method: 'PATCH', body: {} })
    assert.equal((await confirm()).status, 200)
    assert.equal((await confirm()).data.message, 'Paiement déjà confirmé.')
    assert.equal(writes.length, 1)
    assert.deepEqual(locks, ['event', 'registration', 'event', 'registration'])
  })
})

test('event payment HTTP: a cancellation during confirmation prevents ticket issuance', async t => {
  const transaction = { LOCK: { UPDATE: 'UPDATE' } }
  const route = load('./events', {
    '../models/index': {
      sequelize: { transaction: fn => fn(transaction) },
      Event: { findByPk: async () => ({ status: 'upcoming' }) },
      EventRegistration: { findByPk: async (id, options) => ({ id, eventId: 'event', status: options ? 'cancelled' : 'confirmed', update: () => assert.fail('A cancelled ticket must not be paid') }) },
    },
    '../utils/mailer': {},
  })
  await withRoute(t, route, async request => {
    const response = await request('/registrations/registration/confirm-payment', { role: 'admin', method: 'PATCH', body: {} })
    assert.equal(response.status, 400)
  })
})

test('chapters HTTP: owner sees drafts; public sees only approved, published chapters', async t => {
  const queries = [], manga = { id: 'manga', authorId: 'user', moderationStatus: 'approved' }
  const route = load('./chapters', { '../models/index': { Manga: { findByPk: async () => manga }, Chapter: { findAll: async q => { queries.push(q); return [] } } }, '../services/chapterAccess': { getChapterAccess: async () => ({ allowed: false }) } })
  await withRoute(t, route, async request => {
    assert.equal((await request('/by-manga/manga', { role: 'publisher' })).status, 200)
    assert.equal(queries[0].where.isPublished, undefined)
    assert.equal((await request('/by-manga/manga')).status, 200)
    assert.equal(queries[1].where.isPublished, true)
    manga.moderationStatus = 'pending'
    assert.equal((await request('/by-manga/manga')).status, 404)
  })
})
test('chapters HTTP: unpaid response never includes premium image data', async t => {
  const chapter = { id: 'chapter', isPublished: true, manga: { authorId: 'author', coverImageData: 'private', bannerImageData: 'private', bgMusicData: 'private' }, toJSON() { const { toJSON, ...data } = this; return { ...data, manga: { ...this.manga }, pages: [{ data: 'premium-secret', mime: 'image/png' }] } } }
  const route = load('./chapters', { '../models/index': { Chapter: { findByPk: async () => chapter }, Manga: {} }, '../services/chapterAccess': { getChapterAccess: async () => ({ allowed: false, reason: 'unlock_required' }) } })
  await withRoute(t, route, async request => {
    const response = await request('/chapter', { role: 'user' })
    assert.equal(response.status, 200); assert.deepEqual(response.data.chapter.pages, [])
    assert.equal(response.data.chapter.manga.coverImageData, undefined)
    assert.equal(response.data.chapter.manga.bgMusicData, undefined)
  })
})
test('access service: purchases and active subscriptions both reach the access policy', async () => {
  const queries = [], chapter = { id: 'ch', isPublished: true, accessTier: 'premium' }, manga = { authorId: 'author', moderationStatus: 'approved' }
  let purchased = true, subscribed = false
  const service = load('../services/chapterAccess', { '../models': { ChapterUnlock: { findOne: async () => purchased ? {} : null }, Subscription: { findOne: async q => { queries.push(q); return subscribed ? {} : null } } } })
  assert.equal((await service.getChapterAccess({ id: 'user' }, chapter, manga)).reason, 'unlocked')
  purchased = false; subscribed = true
  assert.equal((await service.getChapterAccess({ id: 'user' }, chapter, manga)).reason, 'subscription')
  assert.ok(queries[0].where.expiresAt[Op.gt] instanceof Date)
  assert.equal(queries[0].where.status, 'active')
})
