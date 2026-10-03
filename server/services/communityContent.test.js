const { test } = require('node:test')
const assert = require('node:assert/strict')
const {
  contentId,
  buildQuestions,
  weeklyActivities,
  normalizeThemes,
  validateAnswers,
} = require('./communityContent')
const catalogue = ['Bones', 'MAPPA', 'Madhouse', 'Toei', 'Wit'].map(
  (studio, i) => ({ id: `anime-${i}`, titleF: `Série ${i}`, studio })
)

test('quiz bot: correct answers reflect source data, distinct options and stable keys', () => {
  const questions = buildQuestions(catalogue)
  assert.equal(questions.length, 5)
  for (const [i, q] of questions.entries()) {
    assert.equal(q.options[q.correctIndex], catalogue[i].studio)
    assert.equal(new Set(q.options).size, 4)
    assert.match(
      q.id,
      /^[a-f0-9]{8}-[a-f0-9]{4}-5[a-f0-9]{3}-a[a-f0-9]{3}-[a-f0-9]{12}$/
    )
  }
  assert.deepEqual(
    buildQuestions([...catalogue].reverse()).sort((a, b) =>
      a.id.localeCompare(b.id)
    ),
    questions.sort((a, b) => a.id.localeCompare(b.id))
  )
  assert.deepEqual(buildQuestions(catalogue.slice(0, 3)), [])
})

test('weekly activities rotate on Monday UTC and remain stable within the week', () => {
  const first = weeklyActivities(catalogue, new Date('2026-10-02T12:00:00Z'))
  assert.deepEqual(
    first,
    weeklyActivities(catalogue, new Date('2026-10-04T23:59:59Z'))
  )
  const next = weeklyActivities(catalogue, new Date('2026-10-05T00:00:00Z'))
  assert.notEqual(first[1].titleF, next[1].titleF)
  assert.deepEqual(weeklyActivities([]), [])
  assert.equal(first[0].expiresAt, '2026-10-05T00:00:00.000Z')
})

test('theme import keeps openings and endings separate, encodes search links, rejects malformed provider data', () => {
  const result = normalizeThemes(
    { openings: ['Song & Artist'], endings: ['Ending'] },
    { id: 'a', titleF: 'Anime', malId: 10 }
  )
  assert.deepEqual(
    result.map((t) => t.kind),
    ['OP', 'ED']
  )
  assert.match(result[0].url, /Song%20%26%20Artist/)
  assert.equal(result[0].source, 'https://myanimelist.net/anime/10')
  assert.throws(() => normalizeThemes({}, {}))
  assert.deepEqual(normalizeThemes({ openings: [], endings: [] }, {}), [])
})

test('score validation rejects duplicated questions, oversized submissions and invalid indices', () => {
  const answer = { questionId: contentId('q'), answerIndex: 0 }
  assert.equal(validateAnswers([answer]), true)
  for (const input of [
    [],
    null,
    [null],
    [answer, answer],
    [{ ...answer, answerIndex: -1 }],
    [{ ...answer, answerIndex: 4 }],
    [{ ...answer, answerIndex: '0' }],
    Array.from({ length: 11 }, (_, i) => ({
      questionId: contentId(i.toString()),
      answerIndex: 1,
    })),
  ]) {
    assert.equal(validateAnswers(input), false)
  }
})
