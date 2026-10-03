const allowed = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const bad = (message) => Object.assign(new Error(message), { status: 400 })
function validateImage(data, mime, maxMB = 5) {
  if (typeof data !== 'string' || !allowed.has(mime))
    throw bad('Image JPG, PNG, WebP ou GIF requise.')
  if (
    !data.length ||
    data.length > Math.ceil((maxMB * 1024 * 1024 * 4) / 3) + 4 ||
    !/^[A-Za-z0-9+/]*={0,2}$/.test(data) ||
    data.length % 4 !== 0
  )
    throw bad(`Image invalide ou supérieure à ${maxMB} Mo.`)
  const bytes = Buffer.from(data, 'base64')
  const signature =
    mime === 'image/jpeg'
      ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
      : mime === 'image/png'
        ? bytes
            .subarray(0, 8)
            .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
        : mime === 'image/gif'
          ? /^GIF8[79]a/.test(bytes.subarray(0, 6).toString())
          : bytes.subarray(0, 4).toString() === 'RIFF' &&
            bytes.subarray(8, 12).toString() === 'WEBP'
  if (!signature || bytes.length > maxMB * 1024 * 1024)
    throw bad('Le contenu du fichier ne correspond pas à son format image.')
  return bytes.length
}
function normalizeImageFields(body) {
  const out = { ...body }
  if (typeof out.imageUrl === 'string' && out.imageUrl.startsWith('data:')) {
    const match = out.imageUrl.match(/^data:(image\/[a-z]+);base64,(.+)$/s)
    if (!match) throw bad('Image encodée invalide.')
    out.imageMime = match[1]
    out.imageData = match[2]
    out.imageUrl = null
  }
  if (out.imageData) {
    validateImage(out.imageData, out.imageMime)
    out.imageUrl = null
  } else if (
    typeof out.imageUrl === 'string' &&
    out.imageUrl &&
    !out.imageUrl.startsWith('/api/')
  ) {
    if (
      !/^https?:\/\//i.test(out.imageUrl) &&
      !/^\/(assets|img)\//.test(out.imageUrl)
    )
      throw bad('Adresse image invalide.')
    out.imageData = null
    out.imageMime = null
  } else if (out.imageUrl?.startsWith('/api/')) delete out.imageUrl
  return out
}
function versionedImage(path, updatedAt) {
  return `${path}?v=${new Date(updatedAt || 0).getTime() || 0}`
}
module.exports = { validateImage, normalizeImageFields, versionedImage, bad }
