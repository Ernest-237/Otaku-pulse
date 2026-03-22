// server/utils/seed.js — Seed mis à jour v2
require('dotenv').config()
const { sequelize, syncDatabase, User, Product, Event, HeroConfig, Supplier } = require('../models/index')

async function seed() {
  console.log('🌱 Démarrage du seed Otaku Pulse v2...')

  await syncDatabase(true) // Force reset des tables

  // ── 1. Admin ──────────────────────────────────────────
  const admin = await User.create({
    pseudo:    'OtakuAdmin',
    email:     process.env.ADMIN_EMAIL    || 'admin@otaku-pulse.com',
    password:  process.env.ADMIN_PASSWORD || 'OtakuAdmin@237!',
    firstName: 'Admin',
    lastName:  'Otaku Pulse',
    phone:     '+237 600 000 000',
    whatsapp:  '+237 600 000 000',
    city:      'Yaoundé',
    quartier:  'Bastos',
    role:      'superadmin',
    isVerified:true,
    newsletterSubscribed: true,
  })
  console.log('✅ Admin créé :', admin.email)

  // ── 2. Config Hero par défaut ─────────────────────────
  await HeroConfig.create({
    taglineF:     'LANCEMENT · 30 JUIN 2026 · CAMEROUN',
    taglineE:     'LAUNCH · JUNE 30, 2026 · CAMEROON',
    line1F:       "VIVEZ L'EXPÉRIENCE",
    line1E:       'LIVE THE EXPERIENCE',
    line2F:       'AU-DELÀ DE',
    line2E:       'BEYOND THE',
    accentF:      "L'ÉCRAN",
    accentE:      'THE SCREEN',
    subtitleF:    "Premier service de livraison de goodies Otaku au Cameroun. Articles manga, posters, accessoires anime livrés chez toi.",
    subtitleE:    'First Otaku goods delivery service in Cameroon. Manga items, posters, anime accessories delivered to you.',
    animeName:    'Naruto',
    primaryColor: '#22c55e',
    secondColor:  '#86efac',
    glowColor:    'rgba(34,197,94,0.4)',
    bgImageUrl:   '/img/deku.jpg',
    ctaPrimaryF:  '⚡ Commander maintenant',
    ctaPrimaryE:  '⚡ Order now',
    ctaSecondaryF:'🎌 Voir les événements',
    ctaSecondaryE:'🎌 See events',
    launchDate:   '2026-06-30',
    statsJson: [
      { valueFr:'50+',  valueEn:'50+',  labelFr:'Thèmes Anime',  labelEn:'Anime Themes'  },
      { valueFr:'200+', valueEn:'200+', labelFr:'Clients satisfaits', labelEn:'Happy clients' },
      { valueFr:'3',    valueEn:'3',    labelFr:'Villes',         labelEn:'Cities'        },
      { valueFr:'4.9',  valueEn:'4.9',  labelFr:'Note Moyenne',   labelEn:'Avg Rating'    },
    ],
    isActive: true,
  })
  console.log('✅ HeroConfig créée')

  // ── 3. Fournisseurs ───────────────────────────────────
  const supplier1 = await Supplier.create({
    name:       'MangaWorld Cameroun',
    email:      'contact@mangaworld.cm',
    phone:      '+237 691 000 001',
    whatsapp:   '+237 691 000 001',
    city:       'Douala',
    description:'Distributeur officiel de mangas et goodies anime au Cameroun',
    commission: 25, // 25% → Otaku Pulse récupère 0.25 * vente
    isActive:   true,
  })
  const supplier2 = await Supplier.create({
    name:       'ArtOtaku Studio',
    email:      'art@otakustudio.cm',
    phone:      '+237 699 000 002',
    whatsapp:   '+237 699 000 002',
    city:       'Yaoundé',
    description:'Créations artistiques inspirées du manga, posters et illustrations',
    commission: 25,
    isActive:   true,
  })
  console.log('✅ 2 fournisseurs créés')

  // ── 4. Produits ───────────────────────────────────────
  const products = [
    // Posters
    { slug:'poster-naruto-ramen', category:'posters', nameF:'Poster Naruto Ramen', nameE:'Naruto Ramen Poster', descF:'Poster haute qualité 50x70cm. Naruto mangeant son ramen préféré.', price:5000, oldPrice:7000, emoji:'🍜', badge:'PROMO', stock:15, isFeatured:true },
    { slug:'poster-one-piece-crew', category:'posters', nameF:'Poster Équipage Chapeau de Paille', nameE:'Straw Hat Crew Poster', descF:'Tout l\'équipage réuni dans un poster épique 60x80cm.', price:6500, emoji:'⚓', stock:10 },
    { slug:'poster-jjk-trio', category:'posters', nameF:'Poster JJK Trio', nameE:'JJK Trio Poster', descF:'Yuji, Megumi, Nobara en style illustration.', price:5500, emoji:'💀', badge:'NEW', stock:20 },
    // Stickers
    { slug:'stickers-naruto-pack', category:'stickers', nameF:'Pack Stickers Naruto ×20', nameE:'Naruto Sticker Pack ×20', descF:'20 stickers vinyle imperméables. Personnages Naruto.', price:2500, emoji:'⚡', stock:50, supplierId: supplier1.id, isOwnProduct: false },
    { slug:'stickers-anime-mix', category:'stickers', nameF:'Mix Stickers Anime ×30', nameE:'Anime Mix Stickers ×30', descF:'30 stickers de différents anime populaires.', price:3500, emoji:'🎭', badge:'BESTSELLER', stock:35 },
    // Accessoires
    { slug:'porte-cle-demon-slayer', category:'accessoires', nameF:'Porte-clé Tanjiro Kamado', nameE:'Tanjiro Kamado Keychain', descF:'Porte-clé métal haute qualité. Finition premium.', price:3000, emoji:'🗡️', stock:25 },
    { slug:'mug-dragon-ball', category:'accessoires', nameF:'Mug Dragon Ball ⚡', nameE:'Dragon Ball Mug ⚡', descF:'Mug 350ml. Change de couleur au contact du chaud !', price:7500, emoji:'🐉', badge:'HOT', stock:12 },
    // Manga
    { slug:'manga-one-piece-tome-1', category:'manga', nameF:'One Piece Tome 1', nameE:'One Piece Vol.1', descF:'Manga One Piece tome 1 VF. Le début de l\'aventure de Luffy.', price:4000, emoji:'📚', stock:8, supplierId: supplier1.id, isOwnProduct: false },
    { slug:'manga-naruto-tome-1', category:'manga', nameF:'Naruto Tome 1', nameE:'Naruto Vol.1', descF:'Le début de la saga Naruto en VF.', price:3500, emoji:'📖', stock:12, supplierId: supplier1.id, isOwnProduct: false },
    // Dessin / Art
    { slug:'kit-dessin-manga', category:'dessin', nameF:'Kit Dessin Manga Débutant', nameE:'Manga Drawing Kit Beginner', descF:'12 marqueurs Copic + guide dessin manga inclus.', price:18000, emoji:'🎨', badge:'NOUVEAU', stock:7, supplierId: supplier2.id, isOwnProduct: false },
  ]

  for (const p of products) {
    await Product.create(p)
  }
  console.log(`✅ ${products.length} produits créés`)

  // ── 5. Événement ──────────────────────────────────────
  await Event.create({
    titleF:    'Soirée Otaku Pulse — Grand Lancement',
    titleE:    'Otaku Pulse Night — Grand Launch',
    descF:     'La première soirée officielle Otaku Pulse à Yaoundé ! Au programme : cosplay, gaming, goodies, musique anime.',
    descE:     'The first official Otaku Pulse night in Yaoundé! Cosplay, gaming, goodies, anime music.',
    date:      '2026-06-29',
    timeStart: '18:00',
    timeEnd:   '23:00',
    venue:     'Salle Prestige — Bastos',
    city:      'Yaoundé',
    type:      'hokage',
    capacity:  80,
    registered:47,
    price:     5000,
    isFree:    false,
    img:       '🎌',
    status:    'upcoming',
    featured:  true,
    tags:      ['cosplay','gaming','goodies','anime'],
  })
  console.log('✅ 1 événement créé')

  console.log('\n🎉 SEED TERMINÉ !')
  console.log(`
  ╔═══════════════════════════════════════╗
  ║   OTAKU PULSE v2 — Seed terminé      ║
  ╠═══════════════════════════════════════╣
  ║  Admin : admin@otaku-pulse.com        ║
  ║  Pass  : OtakuAdmin@237!             ║
  ║  URL   : /admin                       ║
  ╚═══════════════════════════════════════╝
  `)

  process.exit(0)
}

seed().catch(err => { console.error('❌ Seed error:', err); process.exit(1) })