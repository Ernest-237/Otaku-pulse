// server/routes/adminInvoices.test.js — tests du calcul des montants
//
// Aucun framework de test dans le dépôt : on utilise le runner intégré à Node.
//   node --test routes/adminInvoices.test.js
//
// Ces tests ne touchent pas la base : `computeTotals` est une fonction pure,
// et c'est précisément ce qui la rend testable. C'est aussi la fonction où une
// erreur coûterait de l'argent réel, donc celle qui mérite le plus d'attention.
require('dotenv').config()
const { test } = require('node:test')
const assert = require('node:assert/strict')
const { computeTotals } = require('./adminInvoices')

const L = (label, qty, unitPrice) => ({ label, qty, unitPrice })

test('sous-total = somme des lignes', () => {
  const r = computeTotals({ items: [L('T-shirt', 2, 8000), L('Bracelet', 3, 1500)] })
  assert.equal(r.subtotal, 20500)
  assert.equal(r.total, 20500)
  assert.equal(r.items[0].total, 16000)
  assert.equal(r.items[1].total, 4500)
})

test('TVA 19,25 % appliquée en points de base entiers', () => {
  // 10 000 x 1925 / 10000 = 1925 exactement
  const r = computeTotals({ items: [L('Article', 1, 10000)], taxRate: 1925 })
  assert.equal(r.taxAmount, 1925)
  assert.equal(r.total, 11925)
})

test('TVA arrondie au franc, jamais de décimale', () => {
  // 7 350 x 19,25 % = 1414,875 -> 1415
  const r = computeTotals({ items: [L('Article', 1, 7350)], taxRate: 1925 })
  assert.equal(r.taxAmount, 1415)
  assert.equal(Number.isInteger(r.taxAmount), true)
  assert.equal(Number.isInteger(r.total), true)
})

test('la TVA porte aussi sur la livraison, après remise', () => {
  // (20 000 - 5 000 + 2 000) = 17 000 ; 17 000 x 19,25 % = 3272,5 -> 3273
  const r = computeTotals({
    items: [L('Article', 1, 20000)], discount: 5000, shipping: 2000, taxRate: 1925,
  })
  assert.equal(r.subtotal, 20000)
  assert.equal(r.taxAmount, 3273)
  assert.equal(r.total, 17000 + 3273)
})

test('la remise ne peut pas dépasser le sous-total', () => {
  // Sans ce plafond, une remise saisie de travers produirait un total négatif,
  // c'est-à-dire une facture qui doit de l'argent au client.
  const r = computeTotals({ items: [L('Article', 1, 5000)], discount: 999999 })
  assert.equal(r.discount, 5000)
  assert.equal(r.total, 0)
  assert.ok(r.total >= 0)
})

test('les valeurs négatives sont ramenées à zéro', () => {
  const r = computeTotals({
    items: [L('Article', -3, -1000)], discount: -500, shipping: -200, taxRate: -100,
  })
  assert.equal(r.items[0].qty, 0)
  assert.equal(r.items[0].unitPrice, 0)
  assert.equal(r.discount, 0)
  assert.equal(r.shipping, 0)
  assert.equal(r.taxRate, 0)
  assert.equal(r.total, 0)
})

test('le taux de taxe est plafonné à 100 %', () => {
  const r = computeTotals({ items: [L('Article', 1, 1000)], taxRate: 999999 })
  assert.equal(r.taxRate, 10000)
  assert.equal(r.taxAmount, 1000)
  assert.equal(r.total, 2000)
})

test('les lignes sans désignation sont écartées', () => {
  // Le formulaire démarre avec une ligne vide : elle ne doit pas se retrouver
  // sur la facture ni fausser le sous-total.
  const r = computeTotals({
    items: [L('Vrai article', 1, 3000), L('', 5, 9999), L('   ', 2, 500)],
  })
  assert.equal(r.items.length, 1)
  assert.equal(r.subtotal, 3000)
})

test('les saisies non numériques valent zéro au lieu de produire NaN', () => {
  // Les champs du formulaire renvoient des chaînes ; un champ vidé donnerait
  // NaN et propagerait un total NaN jusqu'en base sans cette normalisation.
  const r = computeTotals({
    items: [{ label: 'Article', qty: '', unitPrice: 'abc' }],
    discount: null, shipping: undefined, taxRate: 'x',
  })
  assert.equal(r.subtotal, 0)
  assert.equal(r.total, 0)
  assert.ok(!Number.isNaN(r.total))
})

test('les chaînes numériques du formulaire sont acceptées', () => {
  const r = computeTotals({
    items: [{ label: 'Article', qty: '3', unitPrice: '2500' }],
    shipping: '1000', taxRate: '1925',
  })
  assert.equal(r.subtotal, 7500)
  assert.equal(r.shipping, 1000)
  assert.equal(r.taxAmount, Math.round(8500 * 1925 / 10000))
})

test('items absent ou non-tableau ne fait pas planter', () => {
  for (const items of [undefined, null, 'nope', 42, {}]) {
    const r = computeTotals({ items })
    assert.equal(r.subtotal, 0)
    assert.deepEqual(r.items, [])
  }
})

test('la désignation est tronquée à 200 caractères', () => {
  const r = computeTotals({ items: [L('x'.repeat(500), 1, 100)] })
  assert.equal(r.items[0].label.length, 200)
})

test('sans taxe, le total est strictement le sous-total net', () => {
  const r = computeTotals({
    items: [L('A', 2, 1000), L('B', 1, 500)], discount: 300, shipping: 700, taxRate: 0,
  })
  assert.equal(r.taxAmount, 0)
  assert.equal(r.total, 2500 - 300 + 700)
})
