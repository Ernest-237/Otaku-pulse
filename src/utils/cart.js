export function sanitizeCart(value) {
  if (!Array.isArray(value)) return []
  const items = new Map()
  for (const item of value.slice(0, 100)) {
    if (
      !item ||
      typeof item.id !== 'string' ||
      !item.id ||
      !Number.isFinite(Number(item.price)) ||
      Number(item.price) < 0
    )
      continue
    const qty = Math.min(99, Math.max(0, Math.floor(Number(item.qty) || 0)))
    if (!qty) continue
    const stock =
      item.stock == null
        ? null
        : Math.max(0, Math.floor(Number(item.stock) || 0))
    items.set(item.id, {
      id: item.id,
      name: String(item.name || item.nameF || 'Article'),
      price: Number(item.price),
      qty,
      stock,
      emoji: item.emoji || '🍡',
      imageUrl: typeof item.imageUrl === 'string' ? item.imageUrl : '',
    })
  }
  return [...items.values()]
}
export function addCartItem(items, product) {
  if (product.isActive === false || Number(product.stock) === 0) return items
  const exists = items.find((item) => item.id === product.id)
  const limit = product.stock == null ? 99 : Math.min(99, Number(product.stock))
  const item = {
    ...product,
    name: product.nameF || product.name,
    qty: Math.min(limit, (exists?.qty || 0) + 1),
  }
  return sanitizeCart(
    exists
      ? items.map((i) => (i.id === product.id ? item : i))
      : [...items, item]
  )
}
