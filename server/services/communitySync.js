const { Op } = require('sequelize')
const { Anime, QuizQuestion } = require('../models')
const { buildQuestions, normalizeThemes } = require('./communityContent')
let running = false

async function syncCommunity() {
  if (running) return { skipped: true }
  running = true
  const result = { questions: 0, themes: 0, errors: [] }
  try {
    const animes = await Anime.findAll({
      where: { isActive: true, status: ['airing', 'upcoming'] },
      attributes: { exclude: ['coverImageData'] },
      limit: 100,
      order: [['popularity', 'DESC']],
    })
    if (process.env.FANDOM_BOT_ENABLED !== 'false') {
      // Existing questions, including admin edits or disabled questions, are preserved.
      for (const question of buildQuestions(animes)) {
        const [, created] = await QuizQuestion.findOrCreate({
          where: { id: question.id },
          defaults: question,
        })
        if (created) result.questions++
      }
    }
    if (process.env.ANIME_THEMES_ENABLED !== 'false') {
      const cutoff = new Date(Date.now() - 7 * 86400000)
      const pending = await Anime.findAll({
        where: {
          isActive: true,
          source: 'auto',
          isLocked: false,
          malId: { [Op.ne]: null },
          [Op.and]: [
            {
              [Op.or]: [
                { themesSyncedAt: null },
                { themesSyncedAt: { [Op.lt]: cutoff } },
              ],
            },
            {
              [Op.or]: [
                { themesAttemptedAt: null },
                {
                  themesAttemptedAt: {
                    [Op.lt]: new Date(Date.now() - 6 * 3600000),
                  },
                },
              ],
            },
          ],
        },
        attributes: { exclude: ['coverImageData'] },
        order: [
          ['themesAttemptedAt', 'ASC NULLS FIRST'],
          ['popularity', 'DESC'],
        ],
        limit: 20,
      })
      for (const anime of pending) {
        await Anime.update(
          { themesAttemptedAt: new Date() },
          { where: { id: anime.id, source: 'auto', isLocked: false } }
        )
        try {
          const res = await fetch(
            `https://api.jikan.moe/v4/anime/${anime.malId}/themes`,
            { signal: AbortSignal.timeout(12000) }
          )
          if (!res.ok) throw new Error(`Jikan ${res.status}`)
          const body = await res.json()
          const themes = normalizeThemes(body.data, anime)
          // Conditional write also protects an admin lock taken during the request.
          await Anime.update(
            { themes, themesSyncedAt: new Date() },
            { where: { id: anime.id, source: 'auto', isLocked: false } }
          )
          result.themes++
        } catch (error) {
          result.errors.push(`${anime.id}: ${error.message}`)
          // Preserve the last good catalogue; retry at the next scheduled run.
          if (/429/.test(error.message)) break
        }
        await new Promise((resolve) => setTimeout(resolve, 1100))
      }
    }
    return result
  } finally {
    running = false
  }
}

module.exports = { syncCommunity }
