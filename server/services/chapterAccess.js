const { Op } = require('sequelize')
const { ChapterUnlock, Subscription } = require('../models')
const { chapterAccess } = require('../utils/chapterPolicy')
async function getChapterAccess(user, chapter, manga, transaction) {
  const preliminary = chapterAccess({ user, chapter, manga })
  if (preliminary.allowed || preliminary.reason !== 'unlock_required')
    return preliminary
  const [unlock, subscription] = await Promise.all([
    ChapterUnlock.findOne({
      where: { userId: user.id, chapterId: chapter.id },
      transaction,
    }),
    Subscription.findOne({
      where: {
        userId: user.id,
        status: 'active',
        expiresAt: { [Op.gt]: new Date() },
        [Op.or]: [{ startsAt: null }, { startsAt: { [Op.lte]: new Date() } }],
      },
      transaction,
    }),
  ])
  return chapterAccess({
    user,
    chapter,
    manga,
    unlocked: !!unlock,
    subscribed: !!subscription,
  })
}
module.exports = { getChapterAccess }
