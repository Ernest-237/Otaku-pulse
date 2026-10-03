const { test } = require('node:test')
const assert = require('node:assert/strict')
const { postPayload, eventPayload, productPayload, pagination } = require('./publication')
const { chapterAccess, chapterPayload } = require('./chapterPolicy')
const { validateImage, normalizeImageFields, versionedImage } = require('./media')
const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jL1kAAAAASUVORK5CYII='
test('images: reject non-image payloads, invalid encodings and mismatched formats', () => {
  assert.ok(validateImage(png, 'image/png') > 0)
  for (const [data,mime] of [[png,'image/jpeg'],['<svg/>','image/svg+xml'],['AAAA','image/png'],[png + '?','image/png']]) assert.throws(() => validateImage(data,mime))
})
test('images: data URLs become binary fields; changing a link clears the previous binary', () => {
  const converted = normalizeImageFields({ imageUrl: `data:image/png;base64,${png}` })
  assert.equal(converted.imageData, png); assert.equal(converted.imageUrl, null)
  assert.equal(normalizeImageFields({ imageUrl: 'https://example.com/new.png' }).imageData, null)
  assert.deepEqual(normalizeImageFields({ imageUrl: '/api/blog/id/image?v=12' }), {})
  assert.notEqual(versionedImage('/image', '2026-01-01'), versionedImage('/image', '2026-01-02'))
})
test('posts: drafts allow incomplete text but published articles require content', () => {
  assert.equal(postPayload({ title: '  Brouillon  ', isPublished: false }).title, 'Brouillon')
  assert.throws(() => postPayload({ title: 'Article', isPublished: true, content: '' }))
  assert.throws(() => postPayload({ isPublished: true }, { title: 'Article', content: '' }))
})
test('posts: event announcements require practical details before publication', () => {
  assert.throws(() => postPayload({ title: 'Festival', content: 'Cosplay', category: 'event', isPublished: true }))
  const post = postPayload({ title: 'Festival', content: 'Cosplay', category: 'event', isPublished: true, eventDate: '2027-06-15', eventCity: 'Douala', eventPrice: 0 })
  assert.ok(post.publishedAt instanceof Date)
  assert.throws(() => postPayload({ ...post, eventPrice: -1 }))
})
test('posts: scheduling and updates preserve server-owned fields', () => {
  const post = postPayload({ title: 'Journal', content: 'Contenu', isPublished: true, publishedAt: '2027-01-01T10:00:00Z', id: 'evil', views: 999, authorId: 'evil' })
  assert.equal(post.publishedAt, '2027-01-01T10:00:00Z')
  assert.equal(post.authorId, undefined); assert.equal(post.views, undefined); assert.equal(post.id, undefined)
  assert.throws(() => postPayload({ ...post, eventUrl: 'javascript:alert(1)' }))
})
test('events: capacity cannot erase occupied places and free means zero price', () => {
  const event = { titleF: 'Festival', date: '2027-01-01', city: 'Douala', capacity: 10, price: 500 }
  assert.throws(() => eventPayload({ capacity: 2 }, { ...event, registered: 5 }))
  assert.throws(() => eventPayload({ ...event, capacity: -5 }))
  assert.equal(eventPayload({ ...event, isFree: true }).price, 0)
  assert.equal(eventPayload({ ...event, registered: 999 }).registered, undefined)
})
test('pagination: malformed and excessive values stay bounded', () => {
  assert.deepEqual(pagination({ page: -1, limit: -10 }), { page: 1, limit: 1, offset: 0 })
  assert.equal(pagination({ limit: 9999 }).limit, 100)
})
test('product updates reject negative stock and cannot forge sold counters', () => {
  assert.throws(() => productPayload({ stock: -1 }))
  assert.throws(() => productPayload({ price: 1.5 }))
  assert.equal(productPayload({ stock: 4, price: 500, sold: 999, id: 'evil' }).sold, undefined)
  assert.throws(() => eventPayload({ titleF: 'Festival', date: '2027-02-31', city: 'Douala' }))
})
const manga = { authorId: 'author', moderationStatus: 'approved', accessTier: 'free' }
const premium = { id: 'chapter', isPublished: true, accessTier: 'premium', chapterNumber: 1 }
test('chapter access: premium is protected even in a free series or first chapter', () => {
  assert.equal(chapterAccess({ manga, chapter: premium }).reason, 'login_required')
  assert.equal(chapterAccess({ manga, chapter: premium, user: { id: 'reader' } }).allowed, false)
})
test('chapter access: purchased chapters, subscriptions, authors and admins can read', () => {
  for (const extra of [{ user: { id: 'reader' }, unlocked: true }, { user: { id: 'reader' }, subscribed: true }, { user: { id: 'author' } }, { user: { role: 'admin' } }]) assert.equal(chapterAccess({ manga, chapter: premium, ...extra }).allowed, true)
})
test('chapter access: free pages are public but drafts and suspended series are private', () => {
  assert.equal(chapterAccess({ manga, chapter: { ...premium, accessTier: 'free' } }).allowed, true)
  assert.equal(chapterAccess({ manga, chapter: { ...premium, isPublished: false }, user: { id: 'reader' }, unlocked: true }).reason, 'not_found')
  assert.equal(chapterAccess({ manga: { ...manga, moderationStatus: 'suspended' }, chapter: premium, user: { id: 'reader' }, subscribed: true }).allowed, false)
})
test('chapter updates cannot change ownership; premium prices and pages are validated', () => {
  const body = { chapterNumber: 1, title: 'Nouveau', mangaId: 'evil', isPublished: true, pages: [{ data: png, mime: 'image/png', order: 7 }] }
  const output = chapterPayload(body)
  assert.equal(output.mangaId, undefined); assert.equal(output.pageCount, 1); assert.equal(output.pages[0].order, 0)
  assert.throws(() => chapterPayload({ ...body, accessTier: 'premium', coinCost: 0 }))
  assert.doesNotThrow(() => chapterPayload({ ...body, accessTier: 'free', coinCost: 0 }))
  assert.throws(() => chapterPayload({ ...body, pages: [] }))
  assert.throws(() => chapterPayload({ ...body, pages: [{ url: 'https://unknown.example/page' }] }))
})
