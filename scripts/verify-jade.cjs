// Run: node scripts/verify-jade.cjs <path-to-playwright-package>
// All API requests are intercepted. This never writes to a real backend.
const { chromium } = require(process.argv[2] || 'playwright')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const output = '.preview.local'
const animes = Array.from({ length: 16 }, (_, i) => ({
  id: `anime-${i}`,
  titleF:
    [
      'Les Carnets de l’Apothicaire',
      'Jujutsu Kaisen',
      'My Hero Academia',
      'One Piece',
    ][i % 4] + (i > 3 ? ` ${i}` : ''),
  status: i % 3 === 0 ? 'upcoming' : 'airing',
  coverUrl: `http://127.0.0.1:5173/${i % 2 ? 'img/kaisen.jpg' : 'img/deku.jpg'}`,
  studio: ['TOHO', 'MAPPA', 'Bones', 'Toei'][i % 4],
  score: 87,
  synopsisF: 'Un univers à découvrir, avec des personnages inoubliables.',
  genres: ['Adventure', 'Fantasy'],
  syncedAt: '2026-10-02T12:00:00Z',
}))
const questions = Array.from({ length: 3 }, (_, i) => ({
  id: `question-${i}`,
  question: `Quel studio a animé la série ${i + 1} ?`,
  options: ['Bones', 'MAPPA', 'Wit', 'Toei'],
  points: 10,
  difficulty: 'moyen',
}))
let submissions = 0
let failSubmission = true
let catalogueError = false
async function main() {
  fs.mkdirSync(output, { recursive: true })
  const browser = await chromium.launch({ channel: 'msedge', headless: true })
  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      reducedMotion: 'reduce',
    })
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.route('**/api/**', async (route) => {
      const path = new URL(route.request().url()).pathname
      let data = {}
      if (path === '/api/anime') {
        if (catalogueError)
          return route.fulfill({
            status: 503,
            json: { error: 'Offline fixture' },
          })
        data = { animes }
      }
      if (path === '/api/anime/themes')
        data = {
          themes: [
            {
              id: 'op',
              kind: 'OP',
              title: 'Hana ni Natte',
              animeTitle: 'Les Carnets de l’Apothicaire',
              url: 'https://www.youtube.com/results?search_query=Hana',
            },
            {
              id: 'ed',
              kind: 'ED',
              title: 'Aikotoba',
              animeTitle: 'Les Carnets de l’Apothicaire',
              url: 'https://www.youtube.com/results?search_query=Aikotoba',
            },
          ],
        }
      if (path === '/api/fandom/activities')
        data = {
          activities: [
            {
              id: 'bot',
              source: 'auto',
              titleF: 'Le défi de la semaine',
              descF: 'Teste tes connaissances.',
              icon: '🌿',
              linkTab: 'quizz',
            },
          ],
        }
      if (path === '/api/fandom/quiz/questions') data = { questions }
      if (path === '/api/fandom/quiz/submit') {
        submissions++
        const answers = route.request().postDataJSON().answers
        assert.equal(answers.length, 3)
        assert.equal(new Set(answers.map((a) => a.questionId)).size, 3)
        if (failSubmission)
          return route.fulfill({
            status: 503,
            json: { error: 'Réessaie dans un instant.' },
          })
        data = {
          total: 3,
          correct: 3,
          score: 30,
          bestScore: 30,
          details: answers.map((a) => ({
            questionId: a.questionId,
            correct: true,
            correctIndex: 0,
          })),
        }
      }
      await route.fulfill({ json: data })
    })
    await page.goto('http://127.0.0.1:5173/')
    await page.locator('#anime-schedule h3').first().waitFor()
    assert.equal(await page.locator('#anime-schedule h3').count(), 12)
    await page.screenshot({
      path: `${output}/home-desktop.png`,
      fullPage: true,
    })
    await page.getByRole('button', { name: 'Voir plus d’animés' }).click()
    assert.equal(await page.locator('#anime-schedule h3').count(), 16)
    await page
      .getByRole('button', { name: 'En diffusion', exact: true })
      .click()
    assert.equal(await page.locator('#anime-schedule h3').count(), 10)
    await page
      .getByRole('textbox', { name: 'Rechercher un animé', exact: true })
      .fill('Jujutsu')
    assert.equal(await page.locator('#anime-schedule h3').count(), 3)
    await page.locator('#anime-schedule h3').first().click()
    assert.equal(await page.getByRole('dialog').count(), 1)
    await page.keyboard.press('Escape')
    assert.equal(await page.getByRole('dialog').count(), 0)
    await page.getByRole('button', { name: 'Endings', exact: true }).click()
    await page.getByRole('link', { name: /Aikotoba/ }).waitFor()
    assert.equal(await page.locator('audio').evaluate((el) => el.paused), true)
    await page.getByRole('button', { name: /Lire la citation/ }).click()
    const firstAuthor = await page.locator('#quote-bubble strong').textContent()
    await page.getByRole('button', { name: 'Autre personnage' }).click()
    assert.notEqual(
      await page.locator('#quote-bubble strong').textContent(),
      firstAuthor
    )
    await page.getByRole('button', { name: /Réduire la citation/ }).click()
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('http://127.0.0.1:5173/')
    await page.locator('#anime-schedule h3').first().waitFor()
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      ),
      true
    )
    await page.screenshot({ path: `${output}/home-mobile.png`, fullPage: true })
    await page.evaluate(() => {
      localStorage.setItem(
        'op_user',
        JSON.stringify({ id: 'test', pseudo: 'Test', hasAcceptedPolicy: true })
      )
      localStorage.setItem('op_token', 'test-only')
    })
    await page.goto('http://127.0.0.1:5173/fandom?tab=cosplay')
    await page.getByRole('button', { name: /Le défi de la semaine/ }).click()
    await page.getByRole('button', { name: 'Commencer le quiz' }).waitFor()
    await page.screenshot({ path: `${output}/quiz-mobile.png`, fullPage: true })
    await page.getByRole('button', { name: 'Commencer le quiz' }).click()
    for (let i = 0; i < 3; i++) {
      await page.getByRole('heading', { name: questions[i].question }).waitFor()
      const confirm = page.getByRole('button', {
        name: i === 2 ? 'Voir mon résultat' : 'Confirmer',
        exact: true,
      })
      assert.equal(await confirm.isDisabled(), true)
      await page.getByRole('button', { name: 'A Bones', exact: true }).click()
      await confirm.click()
    }
    await page
      .getByText('Tes réponses sont conservées.', { exact: false })
      .waitFor()
    failSubmission = false
    await page.getByRole('button', { name: 'Réessayer', exact: true }).click()
    await page.getByText('DÉFI TERMINÉ').waitFor()
    assert.equal(submissions, 2)
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      ),
      true
    )
    catalogueError = true
    await page.goto('http://127.0.0.1:5173/')
    await page
      .getByText('La sélection est momentanément indisponible.')
      .waitFor()
    catalogueError = false
    await page
      .locator('#anime-schedule')
      .getByRole('button', { name: 'Réessayer' })
      .click()
    await page.locator('#anime-schedule h3').first().waitFor()
    assert.deepEqual(errors, [])
    console.log(
      'Verified desktop/mobile layouts, filters/search, pagination, dialog, OP/ED, quote identity, quiet audio, fandom routing, complete quiz, submission retry and catalogue retry. No browser exceptions.'
    )
  } finally {
    await browser.close()
  }
}
main().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
