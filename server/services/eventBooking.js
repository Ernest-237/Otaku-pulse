const { randomUUID } = require('node:crypto')
const { bad } = require('../utils/media')
const cameroonToday = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Douala',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
async function registerEvent(models, user, body) {
  const { sequelize, Event, EventRegistration } = models
  const guests = body.guests ?? 1
  if (!Number.isInteger(guests) || guests < 1 || guests > 10)
    throw bad('Choisis entre 1 et 10 places.')
  return sequelize.transaction(async (transaction) => {
    const event = await Event.findByPk(body.eventId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    })
    if (
      !event ||
      !['upcoming', 'ongoing'].includes(event.status) ||
      event.date < cameroonToday()
    )
      throw bad('Les inscriptions sont fermées pour cet événement.')
    const existing = await EventRegistration.findOne({
      where: { eventId: event.id, userId: user.id },
      transaction,
    })
    if (existing && existing.status !== 'cancelled')
      return {
        status: existing.status,
        message: 'Ton inscription est déjà enregistrée.',
      }
    if (existing?.paymentStatus === 'paid')
      throw bad('Contacte l’équipe pour réactiver ton billet déjà payé.')
    if (existing) await existing.destroy({ transaction })
    const status =
      Number(event.registered) + guests > Number(event.capacity)
        ? 'waitlist'
        : 'confirmed'
    const free = event.isFree || Number(event.price) === 0
    await EventRegistration.create(
      {
        eventId: event.id,
        userId: user.id,
        name: [user.firstName, user.lastName || user.pseudo]
          .filter(Boolean)
          .join(' '),
        email: user.email,
        phone: body.whatsapp || user.phone,
        guests,
        status,
        ticketCode: `OP-${randomUUID().slice(0, 12).toUpperCase()}`,
        paymentStatus: free && status === 'confirmed' ? 'paid' : 'unpaid',
        ticketIssuedAt: free && status === 'confirmed' ? new Date() : null,
      },
      { transaction }
    )
    if (status === 'confirmed')
      await event.increment('registered', { by: guests, transaction })
    return {
      status,
      message:
        status === 'waitlist'
          ? 'Ajouté à la liste d’attente : ton groupe dépasse les places restantes.'
          : 'Inscription enregistrée. Retrouve-la dans Mes billets.',
    }
  })
}
module.exports = { registerEvent, cameroonToday }
