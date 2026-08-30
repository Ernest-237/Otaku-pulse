// server/utils/slugify.test.js — tests des slugs de boutiques
//
//   cd server && npm test
//
// Ces slugs deviennent des URLs publiques permanentes partagées par les
// partenaires : une erreur ici casse des liens déjà diffusés sur WhatsApp.
const { test } = require('node:test')
const assert = require('node:assert/strict')
const { slugify, isValidSlug, generateUniqueSlug, RESERVED } = require('./slugify')

test('slugify — cas courants de noms de boutiques', () => {
  assert.equal(slugify('Otaku Store'), 'otaku-store')
  assert.equal(slugify('Sakura Goodies Yaoundé'), 'sakura-goodies-yaounde')
  assert.equal(slugify('Élégance & Co.'), 'elegance-co')
  assert.equal(slugify('Mon Shop !!!'), 'mon-shop')
})

test('slugify — les accents sont translittérés, jamais encodés', () => {
  // Un slug non-ASCII serait réencodé en %C3%A9 dans l'URL et deviendrait
  // illisible une fois collé dans WhatsApp.
  const out = slugify('Boutique Créôle Ñandú')
  assert.equal(out, 'boutique-creole-nandu')
  assert.match(out, /^[a-z0-9-]+$/, 'uniquement de l\'ASCII')
})

test('slugify — jamais de tiret en trop', () => {
  assert.equal(slugify('  Boutique   de   Jean  '), 'boutique-de-jean')
  assert.equal(slugify('--Otaku--Store--'), 'otaku-store')
  assert.equal(slugify('A / B \\ C'), 'a-b-c')
})

test('slugify — la troncature ne laisse pas de tiret orphelin', () => {
  // 50 caractères pile, avec un tiret juste après la coupure.
  const long = 'a'.repeat(48) + ' bcdef'
  const out = slugify(long)
  assert.ok(out.length <= 50)
  assert.ok(!out.endsWith('-'), `« ${out} » se termine par un tiret`)
})

test('slugify — entrées vides ou non textuelles', () => {
  for (const v of ['', null, undefined, '   ', '日本のお店', '!!!']) {
    assert.equal(slugify(v), '', `« ${v} » devrait donner une chaîne vide`)
  }
})

test('isValidSlug — accepte les formes correctes', () => {
  for (const ok of ['otaku-store', 'abc', 'boutique123', 'a-b-c-d', 'x'.repeat(50)]) {
    assert.equal(isValidSlug(ok), true, `« ${ok} » devrait être valide`)
  }
})

test('isValidSlug — refuse les formes incorrectes', () => {
  const bad = [
    'ab',                 // trop court
    'x'.repeat(51),       // trop long
    'Otaku',              // majuscule
    'otaku store',        // espace
    'otaku--store',       // double tiret
    '-otaku',             // tiret au début
    'otaku-',             // tiret à la fin
    'otaku_store',        // souligné
    'otaké',              // accent
    123, null, undefined, // non-chaînes
  ]
  for (const v of bad) assert.equal(isValidSlug(v), false, `« ${v} » devrait être refusé`)
})

test('isValidSlug — les segments réservés sont refusés', () => {
  // `partenaire` est une route statique existante (/boutique/partenaire) :
  // une boutique portant ce slug serait définitivement inaccessible.
  assert.equal(isValidSlug('partenaire'), false)
  assert.equal(isValidSlug('admin'), false)
  assert.equal(isValidSlug('manga'), false)
  assert.ok(RESERVED.has('partenaire'))
})

test('generateUniqueSlug — renvoie la base quand elle est libre', async () => {
  const slug = await generateUniqueSlug('Otaku Store', async () => false)
  assert.equal(slug, 'otaku-store')
})

test('generateUniqueSlug — suffixe numérique en cas de collision', async () => {
  const taken = new Set(['otaku-store', 'otaku-store-2', 'otaku-store-3'])
  const slug = await generateUniqueSlug('Otaku Store', async (s) => taken.has(s))
  assert.equal(slug, 'otaku-store-4')
})

test('generateUniqueSlug — nom sans caractère latin exploitable', async () => {
  // Le nom ne produit aucun slug : on retombe sur la base de repli plutôt que
  // de générer une chaîne vide, qui donnerait l'URL /boutique/ .
  const slug = await generateUniqueSlug('日本のお店', async () => false)
  assert.ok(isValidSlug(slug), `« ${slug} » doit rester un slug valide`)
  assert.ok(slug.length >= 3)
})

test('generateUniqueSlug — un nom réservé ne peut pas être réclamé', async () => {
  const slug = await generateUniqueSlug('Partenaire', async () => false)
  assert.notEqual(slug, 'partenaire')
  assert.equal(RESERVED.has(slug), false)
  assert.ok(isValidSlug(slug))
})

test('generateUniqueSlug — le résultat est toujours un slug valide', async () => {
  const noms = [
    'A', 'Ab', '!!!', '   ', 'Élégance & Co.', 'x'.repeat(120),
    'Boutique -- de -- Jean', '日本', 'admin', 'api',
  ]
  for (const n of noms) {
    const slug = await generateUniqueSlug(n, async () => false)
    assert.equal(isValidSlug(slug), true, `« ${n} » a produit « ${slug} », invalide`)
  }
})

test('generateUniqueSlug — repli temporel si tout est pris', async () => {
  // Toutes les variantes numériques sont occupées : on doit quand même
  // obtenir un slug utilisable plutôt que de boucler indéfiniment.
  const slug = await generateUniqueSlug('Otaku Store', async () => true)
  assert.equal(isValidSlug(slug), true, `« ${slug} » doit rester valide`)
})
