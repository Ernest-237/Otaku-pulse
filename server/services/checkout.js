const { randomUUID } = require('node:crypto')
const { bad } = require('../utils/media')
function normalizeOrderItems(items) {
  if (!Array.isArray(items) || !items.length || items.length > 100)
    throw bad('Le panier doit contenir entre 1 et 100 articles.')
  const grouped = new Map()
  for (const item of items) {
    const id = item?.productId || item?.id
    const quantity = item?.quantity ?? item?.qty ?? 1
    if (
      !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(id || '') ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > 99
    )
      throw bad('Produit ou quantité invalide dans le panier.')
    grouped.set(id, (grouped.get(id) || 0) + quantity)
    if (grouped.get(id) > 99) throw bad('Maximum 99 unités par article.')
  }
  return [...grouped]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, quantity]) => ({ id, quantity }))
}
async function createCheckout(models, user, body) {
  const { sequelize, Product, Supplier, Order, User } = models
  const items = normalizeOrderItems(body.items)
  if (
    !/^[+\d\s()-]{8,24}$/.test(body.whatsappNumber || '') ||
    !body.quartier?.trim()
  )
    throw bad('Numéro WhatsApp et quartier de livraison valides requis.')
  if (
    !['mtn_money', 'orange_money', 'cash', 'card'].includes(
      body.paymentMethod || 'mtn_money'
    )
  )
    throw bad('Mode de paiement invalide.')
  if (body.checkoutKey && !/^[a-zA-Z0-9-]{16,64}$/.test(body.checkoutKey))
    throw bad('Identifiant de commande invalide.')
  return sequelize.transaction(async (transaction) => {
    await User.findByPk(user.id, { transaction, lock: transaction.LOCK.UPDATE })
    if (body.checkoutKey) {
      const previous = await Order.findOne({
        where: { userId: user.id, checkoutKey: body.checkoutKey },
        transaction,
      })
      if (previous) return { order: previous, repeated: true }
    }
    const lines = []
    let subtotal = 0
    for (const item of items) {
      const product = await Product.findByPk(item.id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      })
      if (!product || !product.isActive)
        throw bad(
          'Un article de ton panier n’est plus disponible. Retire-le avant de commander.'
        )
      if (product.stock < item.quantity)
        throw bad(
          `Stock insuffisant pour ${product.nameF} : ${product.stock} disponible(s).`
        )
      const price = Number(product.price)
      if (!Number.isSafeInteger(price) || price < 0)
        throw bad('Le prix d’un article doit être vérifié par la boutique.')
      const supplier = product.supplierId
        ? await Supplier.findByPk(product.supplierId, { transaction })
        : null
      const lineTotal = price * item.quantity
      subtotal += lineTotal
      lines.push({
        productId: product.id,
        nameF: product.nameF,
        nameE: product.nameE || product.nameF,
        emoji: product.emoji,
        price,
        quantity: item.quantity,
        lineTotal,
        supplierId: product.supplierId,
        supplierName: supplier?.name,
        commission: supplier?.commission || 0,
        isOwnProduct: product.isOwnProduct,
        imageUrl: product.imageMime
          ? `/api/upload/product/${product.id}/image`
          : product.imageUrl,
      })
      await product.update(
        {
          stock: product.stock - item.quantity,
          sold: (product.sold || 0) + item.quantity,
        },
        { transaction }
      )
    }
    if (
      body.expectedSubtotal != null &&
      Number(body.expectedSubtotal) !== subtotal
    )
      throw bad(
        'Le prix du panier a changé. Actualise les articles avant de confirmer.'
      )
    const shipping = subtotal >= 15000 ? 0 : 2000
    const order = await Order.create(
      {
        orderNumber: `OP-${new Date().getFullYear()}-${randomUUID().replaceAll('-', '').slice(0, 12).toUpperCase()}`,
        checkoutKey: body.checkoutKey || null,
        userId: user.id,
        items: lines,
        subtotal,
        shipping,
        total: subtotal + shipping,
        paymentMethod: body.paymentMethod || 'mtn_money',
        whatsappNumber: body.whatsappNumber.trim(),
        quartier: body.quartier.trim(),
        city: body.city || user.city || 'Yaoundé',
        fullAddress: body.fullAddress || '',
        status: 'pending',
      },
      { transaction }
    )
    return { order, repeated: false }
  })
}
module.exports = { createCheckout, normalizeOrderItems }
