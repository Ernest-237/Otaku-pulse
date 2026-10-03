import { test } from 'node:test'
import assert from 'node:assert/strict'
import { resolveMediaPath, validateImageFile } from './media.js'
import { sanitizeCart, addCartItem } from './cart.js'
import { queryString } from './query.js'
test('API filters omit absent values instead of sending the word undefined', () => {
  assert.equal(queryString({ status: undefined, search: '', page: 2, hidden: false }), 'page=2&hidden=false')
})
test('media URL resolution preserves local assets and already absolute URLs', () => {
  assert.equal(resolveMediaPath('/img/cat.png', 'https://api.example'), '/img/cat.png')
  assert.equal(resolveMediaPath('/api/events/1/image', 'https://api.example/'), 'https://api.example/api/events/1/image')
  assert.equal(resolveMediaPath('https://api.example/api/img', 'https://api.example'), 'https://api.example/api/img')
  assert.equal(resolveMediaPath('javascript:alert(1)'), '')
  assert.equal(resolveMediaPath(null), '')
})
test('image input rejects incompatible, empty and oversized files', () => {
  assert.doesNotThrow(() => validateImageFile({ type: 'image/png', size: 1200 }))
  for (const file of [{ type: 'image/svg+xml', size: 100 }, { type: 'image/png', size: 0 }, { type: 'image/jpeg', size: 21 * 1048576 }]) assert.throws(() => validateImageFile(file))
})
test('cart recovers malformed storage and keeps a bounded quantity', () => {
  assert.deepEqual(sanitizeCart({ hello: 'world' }), [])
  assert.deepEqual(sanitizeCart([null, { id: 'x', price: -1, qty: 1 }]), [])
  assert.equal(sanitizeCart([{ id: 'x', price: 100, qty: 999 }])[0].qty, 99)
})
test('cart keeps product artwork and respects available stock on add', () => {
  const product = { id: 'x', nameF: 'Carnet', price: 500, stock: 2, imageUrl: '/api/product/image' }
  let items = addCartItem([], product)
  items = addCartItem(items, product); items = addCartItem(items, product)
  assert.equal(items[0].qty, 2); assert.equal(items[0].imageUrl, product.imageUrl)
  assert.deepEqual(addCartItem([], { ...product, stock: 0 }), [])
})
