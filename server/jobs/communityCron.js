const cron = require('node-cron')
const { syncCommunity } = require('../services/communitySync')

function startCommunityCron() {
  if (
    process.env.FANDOM_BOT_ENABLED === 'false' &&
    process.env.ANIME_THEMES_ENABLED === 'false'
  )
    return
  const run = () =>
    syncCommunity()
      .then((result) => console.log('🌿 Bot communauté', result))
      .catch((error) => console.error('Bot communauté:', error.message))
  cron.schedule('20 */6 * * *', run, {
    timezone: process.env.CRON_TZ || 'Africa/Douala',
  })
  setTimeout(run, 60000).unref()
}
module.exports = { startCommunityCron }
