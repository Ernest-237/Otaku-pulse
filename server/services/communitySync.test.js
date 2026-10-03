const { test } = require('node:test')
const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const vm = require('node:vm')
const { Op } = require('sequelize')

function fixture(fetch) {
  const writes = [],
    queries = []
  const anime = { id: 'auto-anime', titleF: 'Example', malId: 1 }
  const module = { exports: {} }
  vm.runInNewContext(readFileSync(require.resolve('./communitySync'), 'utf8'), {
    module,
    fetch,
    AbortSignal,
    Date,
    console,
    process: { env: { FANDOM_BOT_ENABLED: 'false' } },
    setTimeout: (resolve) => resolve(),
    require: (name) => {
      if (name === 'sequelize') return { Op }
      if (name === './communityContent') return require('./communityContent')
      if (name === '../models')
        return {
          Anime: {
            findAll: async (query) => {
              queries.push(query)
              return query.where.source
                ? [anime, { ...anime, id: 'second' }]
                : []
            },
            update: async (values, query) => {
              writes.push({ values, query })
            },
          },
        }
      throw new Error(`Unexpected dependency ${name}`)
    },
  })
  return { run: module.exports.syncCommunity, writes, queries }
}

test('sync keeps last-good themes on upstream failure and records attempts to avoid starvation', async () => {
  const f = fixture(async () => ({ ok: false, status: 504 }))
  const result = await f.run()
  assert.equal(result.errors.length, 2)
  assert.equal(result.themes, 0)
  assert.equal(f.writes.length, 2)
  assert.ok(
    f.writes.every((w) => w.values.themesAttemptedAt && !('themes' in w.values))
  )
})

test('sync stops on provider rate limit and guards reads and writes against manual/locked edits', async () => {
  const f = fixture(async () => ({ ok: false, status: 429 }))
  const result = await f.run()
  assert.equal(result.errors.length, 1)
  assert.equal(f.writes.length, 1)
  assert.equal(f.queries[1].where.source, 'auto')
  assert.equal(f.queries[1].where.isLocked, false)
  assert.equal(f.writes[0].query.where.isLocked, false)
})

test('successful sync stores both OP/ED and overlapping runs are skipped', async () => {
  let release
  const wait = new Promise((resolve) => {
    release = resolve
  })
  const f = fixture(async () => {
    await wait
    return {
      ok: true,
      json: async () => ({
        data: { openings: ['Opening'], endings: ['Ending'] },
      }),
    }
  })
  const first = f.run()
  assert.equal((await f.run()).skipped, true)
  release()
  assert.equal((await first).themes, 2)
  const updates = f.writes.filter((w) => w.values.themes)
  assert.equal(updates.length, 2)
  assert.deepEqual(
    updates[0].values.themes.map((t) => t.kind),
    ['OP', 'ED']
  )
  assert.ok(
    updates.every(
      (w) => w.query.where.source === 'auto' && w.query.where.isLocked === false
    )
  )
})
