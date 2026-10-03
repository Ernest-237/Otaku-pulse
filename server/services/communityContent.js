const { createHash } = require('node:crypto')

// Stable keys make repeated and concurrent bot runs idempotent.
function contentId(key) {
  const h = createHash('sha256').update(`otaku-pulse:${key}`).digest('hex')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`
}

function buildQuestions(animes) {
  const studios = [
    ...new Set(animes.map((a) => a.studio).filter(Boolean)),
  ].sort()
  if (studios.length < 4) return []
  return animes
    .filter((a) => a.studio && a.titleF)
    .map((a) => {
      const options = studios.filter((s) => s !== a.studio).slice(0, 3)
      const correctIndex = parseInt(contentId(a.id).slice(0, 2), 16) % 4
      options.splice(correctIndex, 0, a.studio)
      return {
        id: contentId(`studio:${a.id}:${a.studio}`),
        question: `Quel studio principal a animé « ${a.titleF} » ?`,
        options,
        correctIndex,
        category: 'saison',
        difficulty: 'moyen',
        points: 10,
      }
    })
}

function weeklyActivities(animes, now = new Date()) {
  if (!animes.length) return []
  const week = Math.floor((now.getTime() - Date.UTC(2024, 0, 1)) / 604800000)
  const anime = [...animes].sort((a, b) =>
    String(a.id).localeCompare(String(b.id))
  )[((week % animes.length) + animes.length) % animes.length]
  const until = new Date(
    Date.UTC(2024, 0, 1) + (week + 1) * 604800000
  ).toISOString()
  return [
    {
      id: `bot-quiz-${week}`,
      titleF: 'Le défi de la semaine',
      titleE: 'The weekly challenge',
      descF: 'Teste tes connaissances sur les studios des animés de la saison.',
      descE: 'Test your knowledge of this season’s anime studios.',
      icon: '🌿',
      linkTab: 'quizz',
    },
    {
      id: `bot-cosplay-${week}`,
      titleF: `Inspiration : ${anime.titleF}`,
      titleE: `Inspiration: ${anime.titleE || anime.titleF}`,
      descF: 'Partage ton interprétation d’un personnage de cet univers.',
      descE: 'Share your take on a character from this universe.',
      icon: '🎭',
      linkTab: 'cosplay',
    },
    {
      id: `bot-ranking-${week}`,
      titleF: 'À toi de briller',
      titleE: 'Your time to shine',
      descF: 'Découvre les cosplays et les scores de la communauté.',
      descE: 'Explore community cosplays and quiz scores.',
      icon: '🏆',
      linkTab: 'classement',
    },
  ].map((a) => ({ ...a, source: 'auto', expiresAt: until }))
}

function normalizeThemes(data, anime) {
  if (!data || !Array.isArray(data.openings) || !Array.isArray(data.endings))
    throw new Error('Réponse thèmes invalide')
  return ['openings', 'endings'].flatMap((key) =>
    data[key]
      .filter((s) => typeof s === 'string' && s.trim())
      .slice(0, 20)
      .map((title, index) => ({
        id: `${anime.id}-${key}-${index}`,
        kind: key === 'openings' ? 'OP' : 'ED',
        title: title.slice(0, 350),
        animeTitle: anime.titleF,
        // This is explicitly a search link, never advertised as a playable audio URL.
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${anime.titleF} ${title} official`)}`,
        source: `https://myanimelist.net/anime/${anime.malId}`,
      }))
  )
}

function validateAnswers(answers) {
  return (
    Array.isArray(answers) &&
    answers.length > 0 &&
    answers.length <= 10 &&
    new Set(answers.map((a) => a?.questionId)).size === answers.length &&
    answers.every(
      (a) =>
        a &&
        typeof a.questionId === 'string' &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          a.questionId
        ) &&
        Number.isInteger(a.answerIndex) &&
        a.answerIndex >= 0 &&
        a.answerIndex < 4
    )
  )
}

module.exports = {
  contentId,
  buildQuestions,
  weeklyActivities,
  normalizeThemes,
  validateAnswers,
}
