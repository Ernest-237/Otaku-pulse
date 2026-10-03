import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  sanitizeProgress,
  canEnterRoom,
  discoverRoom,
  collectSeal,
} from './world.js'

test('verse: malformed progress cannot create unknown rooms or duplicated seals', () => {
  assert.deepEqual(sanitizeProgress(null), {
    seals: [],
    visited: ['threshold'],
  })
  const safe = sanitizeProgress({
    seals: ['lanterns', 'lanterns', 'fake'],
    visited: ['heart', 'fake', 'stairs', 'stairs'],
  })
  assert.deepEqual(safe, {
    seals: ['lanterns'],
    visited: ['threshold', 'stairs'],
  })
  assert.equal(canEnterRoom('fake', safe), false)
  assert.equal(canEnterRoom('heart', safe), false)
})

test('verse: three distinct visited rooms unlock the heart, repeated interactions keep one seal', () => {
  let progress = sanitizeProgress(null)
  assert.deepEqual(collectSeal(progress, 'biwa'), progress)
  assert.deepEqual(discoverRoom(progress, 'heart'), progress)
  for (const room of ['lanterns', 'stairs', 'biwa']) {
    progress = discoverRoom(progress, room)
    progress = collectSeal(collectSeal(progress, room), room)
  }
  assert.equal(progress.seals.length, 3)
  assert.equal(canEnterRoom('heart', progress), true)
  assert.equal(discoverRoom(progress, 'heart').visited.length, 5)
})
