const { test } = require('node:test')
const assert = require('node:assert/strict')
const { normalizeOrderItems, createCheckout } = require('./checkout')
const id = '11111111-1111-4111-8111-111111111111'
const other = '22222222-2222-4222-8222-222222222222'
const user = { id: 'user' }
const body = { items: [{ productId: id, quantity: 2 }], whatsappNumber: '+237670000000', quartier: 'Bastos', paymentMethod: 'mtn_money', checkoutKey: 'fixture-checkout-0001' }
function fixture() {
  let state = { products: [{ id, isActive: true, stock: 5, price: 3000, sold: 0, nameF: 'Carnet' }, { id: other, isActive: true, stock: 0, price: 1000, sold: 0, nameF: 'Poster' }], orders: [] }
  let commits = 0, rollbacks = 0, locks = 0
  const transaction = { LOCK: { UPDATE: 'UPDATE' } }
  const models = {
    sequelize: { transaction: async fn => { const before = structuredClone(state); try { const result = await fn(transaction); commits++; return result } catch (e) { state = before; rollbacks++; throw e } } },
    User: { findByPk: async (_, opts) => { assert.equal(opts.transaction, transaction); assert.equal(opts.lock, 'UPDATE'); locks++; return user } },
    Product: { findByPk: async (key, opts) => { assert.equal(opts.lock, 'UPDATE'); const p = state.products.find(p => p.id === key); return p && { ...p, update: async (values, options) => { assert.equal(options.transaction, transaction); Object.assign(p, values) } } } },
    Supplier: { findByPk: async () => null },
    Order: { findOne: async ({ where }) => state.orders.find(o => o.checkoutKey === where.checkoutKey && o.userId === where.userId), create: async (data, opts) => { assert.equal(opts.transaction, transaction); const order = { ...data, id: 'order-1' }; state.orders.push(order); return order } },
  }
  return { models, get state() { return state }, metrics: () => ({ commits, rollbacks, locks }) }
}
test('checkout rejects empty, negative, fractional and duplicate-overflow quantities', () => {
  for (const items of [[], [{ id, quantity: -1 }], [{ id, quantity: 1.5 }], [{ id, quantity: 70 }, { id, quantity: 60 }], [{ id: 'unknown' }]]) assert.throws(() => normalizeOrderItems(items))
  assert.deepEqual(normalizeOrderItems([{ id, quantity: 2 }, { id, quantity: 3 }]), [{ id, quantity: 5 }])
})
test('checkout uses server prices and commits stock, sold and order together', async () => {
  const f = fixture(), result = await createCheckout(f.models, user, { ...body, price: 1 })
  assert.equal(result.order.subtotal, 6000); assert.equal(result.order.total, 8000)
  assert.equal(f.state.products[0].stock, 3); assert.equal(f.state.products[0].sold, 2)
  assert.deepEqual(f.metrics(), { commits: 1, rollbacks: 0, locks: 1 })
})
test('checkout rolls back earlier stock changes when a later item is sold out', async () => {
  const f = fixture()
  await assert.rejects(createCheckout(f.models, user, { ...body, items: [...body.items, { productId: other, quantity: 1 }] }), /Stock insuffisant/)
  assert.equal(f.state.products[0].stock, 5); assert.equal(f.state.orders.length, 0); assert.equal(f.metrics().rollbacks, 1)
})
test('checkout price changes require a new review and roll back stock', async () => {
  const f = fixture()
  await assert.rejects(createCheckout(f.models, user, { ...body, expectedSubtotal: 5000 }), /prix du panier/)
  assert.equal(f.state.products[0].stock, 5)
})
test('checkout retry returns the original order without a second stock debit', async () => {
  const f = fixture()
  const first = await createCheckout(f.models, user, body), second = await createCheckout(f.models, user, body)
  assert.equal(second.repeated, true); assert.equal(first.order.id, second.order.id)
  assert.equal(f.state.orders.length, 1); assert.equal(f.state.products[0].stock, 3)
})
test('checkout unavailable products never silently disappear from an order', async () => {
  const f = fixture(); f.state.products[0].isActive = false
  await assert.rejects(createCheckout(f.models, user, body), /disponible/)
  assert.equal(f.state.orders.length, 0)
})
