// src/utils/barcode.js — Encodeur Code 128 (jeu B) en SVG, sans dépendance.
//
// Pourquoi pas jsbarcode : le bundle frontend dépasse déjà 1,1 Mo, et tout ce
// dont on a besoin ici tient dans une table de motifs et une somme de contrôle.
// Le jeu B couvre l'ASCII 32-126, ce qui suffit largement pour un numéro de
// facture du type FA-2026-00042.
//
// Le rendu est un SVG : il s'imprime net à n'importe quelle résolution, alors
// qu'un <canvas> converti en PNG sortirait flou sur une imprimante 600 dpi et
// deviendrait illisible pour un lecteur de code-barres.

// Table officielle Code 128 : 107 motifs (0-106). Chaque chiffre est une largeur
// en modules, en alternant barre/espace en commençant par une barre. Tous les
// motifs totalisent 11 modules, sauf le motif d'arrêt qui en fait 13.
const PATTERNS = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312',
  '132212', '221213', '221312', '231212', '112232', '122132', '122231', '113222',
  '123122', '123221', '223211', '221132', '221231', '213212', '223112', '312131',
  '311222', '321122', '321221', '312212', '322112', '322211', '212123', '212321',
  '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121',
  '313121', '211331', '231131', '213113', '213311', '213131', '311123', '311321',
  '331121', '312113', '312311', '332111', '314111', '221411', '431111', '111224',
  '111422', '121124', '121421', '141122', '141221', '112214', '112412', '122114',
  '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112',
  '421211', '212141', '214121', '412121', '111143', '111341', '131141', '114113',
  '114311', '411113', '411311', '113141', '114131', '311141', '411131',
  '211412', // 103 — START A
  '211214', // 104 — START B
  '211232', // 105 — START C
  '2331112' // 106 — STOP
]

const START_B = 104
const STOP    = 106

/**
 * Convertit une chaîne en suite de largeurs de modules Code 128 B.
 * Renvoie null si la chaîne contient un caractère hors ASCII 32-126.
 */
export function encodeCode128B(text) {
  const s = String(text || '')
  if (!s.length) return null

  const values = []
  for (const ch of s) {
    const code = ch.charCodeAt(0)
    if (code < 32 || code > 126) return null   // hors du jeu B
    values.push(code - 32)
  }

  // Somme de contrôle : valeur de départ + somme pondérée par la position (1-indexée).
  let checksum = START_B
  values.forEach((v, i) => { checksum += v * (i + 1) })
  checksum %= 103

  const sequence = [START_B, ...values, checksum, STOP]

  // Aplatit les motifs en une suite de largeurs. L'alternance barre/espace est
  // implicite : indice pair = barre, indice impair = espace.
  const widths = []
  for (const idx of sequence) {
    for (const d of PATTERNS[idx]) widths.push(parseInt(d, 10))
  }
  return widths
}

/**
 * Produit le balisage SVG d'un code-barres Code 128 B.
 *
 * @param {string} text        contenu à encoder
 * @param {object} opts
 * @param {number} opts.height hauteur des barres en px (défaut 46)
 * @param {number} opts.module largeur d'un module en px (défaut 1.6)
 * @param {number} opts.quiet  zone de silence en modules (défaut 10, minimum
 *                             requis par la norme pour qu'un lecteur accroche)
 * @param {boolean} opts.showText affiche le texte sous les barres
 * @returns {string|null} le SVG, ou null si le texte n'est pas encodable
 */
export function code128Svg(text, opts = {}) {
  const { height = 46, module = 1.6, quiet = 10, showText = true } = opts
  const widths = encodeCode128B(text)
  if (!widths) return null

  const totalModules = widths.reduce((a, b) => a + b, 0)
  const width  = (totalModules + quiet * 2) * module
  const textH  = showText ? 13 : 0
  const svgH   = height + textH

  let x = quiet * module
  let rects = ''
  widths.forEach((w, i) => {
    const px = w * module
    if (i % 2 === 0) {                       // indices pairs = barres
      rects += `<rect x="${x.toFixed(2)}" y="0" width="${px.toFixed(2)}" height="${height}" fill="#000"/>`
    }
    x += px
  })

  const label = showText
    ? `<text x="${(width / 2).toFixed(2)}" y="${svgH - 2}" text-anchor="middle" ` +
      `font-family="monospace" font-size="10.5" letter-spacing="1.4" fill="#000">${escapeXml(text)}</text>`
    : ''

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width.toFixed(2)}" height="${svgH}" ` +
         `viewBox="0 0 ${width.toFixed(2)} ${svgH}" role="img" aria-label="Code-barres ${escapeXml(text)}">` +
         `<rect width="100%" height="100%" fill="#fff"/>${rects}${label}</svg>`
}

function escapeXml(s) {
  return String(s).replace(/[<>&"']/g, c => (
    { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c]
  ))
}
