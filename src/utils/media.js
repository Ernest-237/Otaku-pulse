export function resolveMediaPath(value, apiBase = '') {
  if (typeof value !== 'string' || !value.trim()) return ''
  const url = value.trim()
  if (/^(https?:\/\/|blob:|data:image\/(png|jpeg|webp|gif);base64,)/i.test(url))
    return url
  if (url.startsWith('//')) return `https:${url}`
  if (url.startsWith('/api/')) return `${apiBase.replace(/\/$/, '')}${url}`
  if (url.startsWith('/') && !url.includes('\\')) return url
  return ''
}

export function validateImageFile(file, maxSizeMB = 20) {
  if (
    !file ||
    !['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)
  )
    throw new Error('Choisis une image JPG, PNG, WebP ou GIF.')
  if (!file.size || file.size > maxSizeMB * 1024 * 1024)
    throw new Error(`Le fichier doit peser moins de ${maxSizeMB} Mo.`)
}

export async function prepareImage(file, { page = false, maxSizeMB = 5 } = {}) {
  validateImageFile(file)
  if (file.type === 'image/gif') {
    validateImageFile(file, maxSizeMB)
    return readImage(file)
  }
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.src = url
    await img.decode().catch(() => {
      throw new Error(
        'Cette image est illisible. Essaie de la réexporter en JPG ou PNG.'
      )
    })
    if (img.naturalWidth * img.naturalHeight > 60000000)
      throw new Error('Image trop grande : limite de 60 mégapixels.')
    const scale = Math.min(
      1,
      (page ? 1800 : 1920) / img.naturalWidth,
      (page ? 24000 : 1920) / img.naturalHeight
    )
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale))
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale))
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
    const compressed = await new Promise((resolve) =>
      canvas.toBlob(resolve, 'image/webp', page ? 0.92 : 0.86)
    )
    const output = compressed && compressed.size < file.size ? compressed : file
    if (output.size > maxSizeMB * 1024 * 1024)
      throw new Error(
        `Image encore trop lourde après optimisation (maximum ${maxSizeMB} Mo).`
      )
    return {
      ...(await readImage(output)),
      width: output === file ? img.naturalWidth : canvas.width,
      height: output === file ? img.naturalHeight : canvas.height,
    }
  } finally {
    URL.revokeObjectURL(url)
  }
}

export function readImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () =>
      resolve({
        data: String(reader.result).split(',')[1],
        mime: file.type,
        bytes: file.size,
      })
    reader.onerror = () => reject(new Error('Lecture du fichier impossible.'))
    reader.readAsDataURL(file)
  })
}
