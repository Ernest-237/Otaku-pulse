const { validateImage, bad } = require('./media')
const { pick } = require('./publication')
function chapterAccess({
  user,
  chapter,
  manga,
  unlocked = false,
  subscribed = false,
}) {
  const privileged =
    user &&
    (['admin', 'superadmin'].includes(user.role) || user.id === manga.authorId)
  if (privileged) return { allowed: true, reason: 'owner' }
  if (!chapter.isPublished || manga.moderationStatus !== 'approved')
    return { allowed: false, reason: 'not_found' }
  if (chapter.accessTier === 'free') return { allowed: true, reason: 'free' }
  if (!user) return { allowed: false, reason: 'login_required' }
  if (unlocked || subscribed)
    return { allowed: true, reason: unlocked ? 'unlocked' : 'subscription' }
  return { allowed: false, reason: 'unlock_required' }
}
function chapterPayload(body, existing = {}) {
  const out = pick(body, [
    'chapterNumber',
    'title',
    'pages',
    'accessTier',
    'coinCost',
    'isPublished',
  ])
  const value = { ...existing, ...out }
  if (
    !Number.isFinite(Number(value.chapterNumber)) ||
    Number(value.chapterNumber) < 0
  )
    throw bad('Numéro de chapitre invalide.')
  if (value.accessTier && !['free', 'premium'].includes(value.accessTier))
    throw bad('Accès invalide.')
  if (
    value.coinCost != null &&
    (!Number.isInteger(Number(value.coinCost)) ||
      Number(value.coinCost) < (value.accessTier === 'premium' ? 1 : 0) ||
      Number(value.coinCost) > 10000)
  )
    throw bad('Le coût premium doit être compris entre 1 et 10 000 coins.')
  if (out.pages !== undefined) {
    if (!Array.isArray(out.pages) || out.pages.length > 200)
      throw bad('Maximum 200 pages par chapitre.')
    let bytes = 0
    out.pages = out.pages.map((page, index) => {
      if (page?.url && existing.pages?.some((p) => p.url === page.url))
        return {
          ...existing.pages.find((p) => p.url === page.url),
          order: index,
        }
      if (!page || !page.data)
        throw bad(
          'Chaque page doit contenir une image chargée depuis ton appareil.'
        )
      bytes += validateImage(page.data, page.mime, 10)
      return {
        data: page.data,
        mime: page.mime,
        order: index,
        width: page.width,
        height: page.height,
      }
    })
    if (bytes > 40 * 1024 * 1024)
      throw bad(
        'Le chapitre dépasse 40 Mo. Optimise les images ou divise-le en plusieurs chapitres.'
      )
    out.pageCount = out.pages.length
  }
  if (value.isPublished && !(out.pages || existing.pages || []).length)
    throw bad('Ajoute au moins une page avant de publier.')
  if (value.isPublished && !existing.publishedAt) out.publishedAt = new Date()
  return out
}
module.exports = { chapterAccess, chapterPayload }
