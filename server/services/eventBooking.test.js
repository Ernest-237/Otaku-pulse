const { test } = require('node:test')
const assert = require('node:assert/strict')
const { registerEvent } = require('./eventBooking')
function fixture(overrides = {}) {
  let registrations = []
  const event = { id: 'event', titleF: 'Fest', status: 'upcoming', date: '2099-01-01', capacity: 5, registered: 3, isFree: true, price: 0, ...overrides, increment: async (key, { by }) => { event[key] += by } }
  const transaction = { LOCK: { UPDATE: 'UPDATE' } }
  const models = { sequelize: { transaction: fn => fn(transaction) }, Event: { findByPk: async (_, opts) => { assert.equal(opts.lock, 'UPDATE'); return event } }, EventRegistration: { findOne: async ({ where }) => registrations.find(r => r.userId === where.userId), create: async (data, opts) => { assert.equal(opts.transaction, transaction); registrations.push(data) } } }
  return { models, event, registrations }
}
test('event booking counts the whole group, issues free tickets and is idempotent', async () => {
  const f = fixture(), body = { eventId: 'event', guests: 2 }
  assert.equal((await registerEvent(f.models, { id: 'user' }, body)).status, 'confirmed')
  await registerEvent(f.models, { id: 'user' }, body)
  assert.equal(f.event.registered, 5); assert.equal(f.registrations.length, 1)
  assert.equal(f.registrations[0].paymentStatus, 'paid'); assert.ok(f.registrations[0].ticketIssuedAt)
})
test('event booking waitlists groups exceeding remaining seats without overbooking', async () => {
  const f = fixture()
  assert.equal((await registerEvent(f.models, { id: 'user' }, { guests: 3 })).status, 'waitlist')
  assert.equal(f.event.registered, 3); assert.equal(f.registrations[0].paymentStatus, 'unpaid')
})
test('event booking rejects invalid group sizes, drafts, cancellations and past dates', async () => {
  for (const guests of [0,-1,1.5,11]) await assert.rejects(registerEvent(fixture().models, {}, { guests }))
  for (const overrides of [{ status: 'draft' }, { status: 'cancelled' }, { date: '2000-01-01' }]) await assert.rejects(registerEvent(fixture(overrides).models, {}, { guests: 1 }), /fermées/)
})
test('paid event tickets wait for payment confirmation', async () => {
  const f = fixture({ price: 1000, isFree: false })
  await registerEvent(f.models, { id: 'user' }, { guests: 1 })
  assert.equal(f.registrations[0].paymentStatus, 'unpaid'); assert.equal(f.registrations[0].ticketIssuedAt, null)
})
