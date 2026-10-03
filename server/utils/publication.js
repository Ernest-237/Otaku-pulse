const { normalizeImageFields, bad } = require('./media')
const pick = (body, fields) =>
  Object.fromEntries(
    fields
      .filter((key) => body[key] !== undefined)
      .map((key) => [key, body[key]])
  )
function postPayload(body, existing = {}) {
  const out = normalizeImageFields(
    pick(body, [
      'title',
      'excerpt',
      'content',
      'category',
      'emoji',
      'imageUrl',
      'imageData',
      'imageMime',
      'isFeatured',
      'isPublished',
      'promoCode',
      'promoExpiry',
      'publishedAt',
      'eventDate',
      'eventCity',
      'eventVenue',
      'eventUrl',
      'eventPrice',
    ])
  )
  const value = { ...existing, ...out }
  if (
    typeof value.title !== 'string' ||
    value.title.trim().length < 2 ||
    value.title.length > 255
  )
    throw bad('Le titre doit contenir entre 2 et 255 caractères.')
  out.title = value.title.trim()
  if (!['blog', 'event', 'promo', 'partner'].includes(value.category || 'blog'))
    throw bad('Catégorie invalide.')
  if (value.isPublished && !value.content?.trim())
    throw bad('Ajoute du contenu avant de publier.')
  if (out.content === undefined && existing.content === undefined)
    out.content = ''
  if (
    value.category === 'event' &&
    value.isPublished &&
    (!value.eventDate || !value.eventCity?.trim())
  )
    throw bad(
      'Une annonce d’événement publiée doit préciser sa date et sa ville.'
    )
  for (const key of ['publishedAt', 'promoExpiry', 'eventDate'])
    if (out[key] === '') out[key] = null
  for (const key of ['publishedAt', 'promoExpiry', 'eventDate'])
    if (out[key] && !Number.isFinite(Date.parse(out[key])))
      throw bad('Date invalide.')
  if (value.isPublished && !value.publishedAt) out.publishedAt = new Date()
  if (
    value.eventPrice != null &&
    (!Number.isInteger(Number(value.eventPrice)) ||
      Number(value.eventPrice) < 0)
  )
    throw bad('Tarif invalide.')
  if (
    out.eventUrl &&
    !/^https?:\/\//i.test(out.eventUrl) &&
    !/^\/evenements(?:\?|$)/.test(out.eventUrl)
  )
    throw bad('Le lien événement doit commencer par https://.')
  return out
}
function eventPayload(body, existing = {}) {
  const out = normalizeImageFields(
    pick(body, [
      'titleF',
      'titleE',
      'descF',
      'descE',
      'date',
      'timeStart',
      'timeEnd',
      'venue',
      'city',
      'type',
      'capacity',
      'price',
      'isFree',
      'imageUrl',
      'imageData',
      'imageMime',
      'img',
      'status',
      'featured',
      'tags',
    ])
  )
  const value = { ...existing, ...out }
  if (!value.titleF?.trim() || value.titleF.length > 200)
    throw bad('Titre requis (200 caractères maximum).')
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value.date || '') ||
    !Number.isFinite(Date.parse(value.date)) ||
    new Date(value.date).toISOString().slice(0, 10) !== value.date
  )
    throw bad('Date de l’événement requise et valide.')
  if (!value.city?.trim()) throw bad('Ville requise.')
  for (const key of ['capacity', 'price'])
    if (
      value[key] != null &&
      (!Number.isInteger(Number(value[key])) ||
        Number(value[key]) < (key === 'capacity' ? 1 : 0))
    )
      throw bad(`${key === 'capacity' ? 'Capacité' : 'Prix'} invalide.`)
  if (Number(value.capacity) < Number(existing.registered || 0))
    throw bad(
      'La capacité ne peut pas être inférieure au nombre de places réservées.'
    )
  if (
    value.status &&
    !['draft', 'upcoming', 'ongoing', 'past', 'cancelled'].includes(
      value.status
    )
  )
    throw bad('Statut invalide.')
  if (value.isFree) out.price = 0
  return out
}
function pagination(query, defaultLimit = 20) {
  const limit = Math.max(
    1,
    Math.min(Number.parseInt(query.limit, 10) || defaultLimit, 100)
  )
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1)
  return { limit, page, offset: (page - 1) * limit }
}
function productPayload(body) {
  const out = normalizeImageFields(
    pick(body, [
      'slug',
      'category',
      'tags',
      'nameF',
      'nameE',
      'descF',
      'descE',
      'price',
      'oldPrice',
      'imageData',
      'imageMime',
      'imageUrl',
      'emoji',
      'badge',
      'stock',
      'isActive',
      'isFeatured',
      'supplierId',
      'isOwnProduct',
    ])
  )
  for (const key of ['price', 'stock', 'oldPrice'])
    if (
      out[key] != null &&
      (!Number.isSafeInteger(Number(out[key])) || Number(out[key]) < 0)
    )
      throw bad('Prix et stock doivent être des entiers positifs ou nuls.')
  if (
    out.nameF !== undefined &&
    (typeof out.nameF !== 'string' || !out.nameF.trim())
  )
    throw bad('Nom du produit requis.')
  if (out.slug !== undefined && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(out.slug))
    throw bad(
      'Slug invalide : utilise des lettres minuscules, chiffres et tirets.'
    )
  return out
}
module.exports = { postPayload, eventPayload, productPayload, pagination, pick }
