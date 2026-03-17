// server/utils/seed.js — MySQL/Sequelize
require('dotenv').config();
const { testConnection } = require('../config/database');
const { syncDatabase, User, Product, Event } = require('../models/index');

async function seed() {
  try {
    await testConnection();
    const force = process.argv.includes('--reset');
    await syncDatabase(force);

    // ── ADMIN ────────────────────────────────────────
    const [admin, created] = await User.findOrCreate({
      where: { email: process.env.ADMIN_EMAIL || 'admin@otaku-pulse.com' },
      defaults: {
        pseudo:'OtakuAdmin', firstName:'Admin', lastName:'Otaku Pulse',
        email: process.env.ADMIN_EMAIL || 'admin@otaku-pulse.com',
        password: process.env.ADMIN_PASSWORD || 'Admin2026!',
        role:'superadmin', isVerified:1, city:'Yaoundé',
      },
    });
    console.log(created ? '👤 Admin créé' : '👤 Admin existant');

    // ── PRODUITS ─────────────────────────────────────
    const count = await Product.count();
    if (count === 0) {
      const products = [
        { slug:'poster-naruto-ramen',     category:'posters',     tags:JSON.stringify(['naruto','bestseller']),
          nameF:'Poster Naruto — Ichiraku Ramen', nameE:'Naruto Poster — Ichiraku Ramen',
          descF:'Impression HD 50×70cm sur papier photo. Finition brillante.',
          descE:'HD print 50×70cm on photo paper. Glossy finish.',
          price:4500, oldPrice:6000, emoji:'🍜', color:'#f97316',
          badge:'PROMO', badgeColor:'#dc2626', stock:12, rating:4.8, reviews:24 },

        { slug:'poster-jjk-territory',    category:'posters',     tags:JSON.stringify(['jujutsu kaisen','new']),
          nameF:'Poster JJK — Extension du Territoire', nameE:'JJK Poster — Unlimited Void',
          descF:'Impression HD 50×70cm. Geto Suguru et Gojo Satoru.',
          descE:'HD print 50×70cm. Geto and Gojo.',
          price:5500, emoji:'🌌', color:'#8b5cf6',
          badge:'NOUVEAU', badgeColor:'#22c55e', stock:8, rating:4.9, reviews:11 },

        { slug:'poster-onepiece-straw-hat', category:'posters',   tags:JSON.stringify(['one piece']),
          nameF:"Poster One Piece — Equipage Chapeau de Paille", nameE:'One Piece Poster — Straw Hat Crew',
          descF:'Impression HD 70x100cm. Les 10 membres reunis.',
          descE:'HD print 70x100cm. All 10 crew members.',
          price:7500, emoji:'☠️', color:'#dc2626', stock:5, rating:4.7, reviews:18 },

        { slug:'sticker-pack-naruto',     category:'stickers',    tags:JSON.stringify(['naruto','bestseller']),
          nameF:'Pack Stickers Naruto — 20 pieces', nameE:'Naruto Sticker Pack — 20pcs',
          descF:"Stickers premium decoupes au laser. Resistants a l'eau.",
          descE:'Premium laser-cut stickers. Water resistant.',
          price:2500, oldPrice:3500, emoji:'🥷', color:'#f97316',
          badge:'PROMO', badgeColor:'#dc2626', stock:30, rating:4.6, reviews:42 },

        { slug:'sticker-pack-demon-slayer', category:'stickers',  tags:JSON.stringify(['demon slayer','new']),
          nameF:'Pack Stickers Demon Slayer — 15 pieces', nameE:'Demon Slayer Sticker Pack — 15pcs',
          descF:'Tanjiro, Nezuko, Inosuke et Zenitsu en stickers HD.',
          descE:'Tanjiro, Nezuko, Inosuke and Zenitsu HD stickers.',
          price:2000, emoji:'🗡️', color:'#3b82f6',
          badge:'NOUVEAU', badgeColor:'#22c55e', stock:20, rating:4.8, reviews:15 },

        { slug:'gobelet-thematique',      category:'accessoires', tags:JSON.stringify(['goodies','bestseller']),
          nameF:'Gobelet Thematique Otaku Pulse', nameE:'Otaku Pulse Thematic Cup',
          descF:'Gobelet reutilisable 40cl avec visuel anime.',
          descE:'40cl reusable cup with anime visuals.',
          price:3000, emoji:'🥤', color:'#22c55e', stock:50, rating:4.5, reviews:8 },

        { slug:'badge-membre-otaku',      category:'accessoires', tags:JSON.stringify(['goodies','new']),
          nameF:'Badge Membre Otaku Pulse', nameE:'Otaku Pulse Member Badge',
          descF:'Badge metallique emaille. Edition limitee lancement.',
          descE:'Enamel metal badge. Limited launch edition.',
          price:1500, emoji:'📛', color:'#22c55e',
          badge:'EDITION LIMITEE', badgeColor:'#f59e0b', stock:3, rating:5.0, reviews:6 },

        { slug:'tote-bag-otaku',          category:'accessoires', tags:JSON.stringify(['goodies']),
          nameF:'Tote Bag Otaku Pulse', nameE:'Otaku Pulse Tote Bag',
          descF:'Sac en coton bio avec logo Otaku Pulse. 38x42cm.',
          descE:'Organic cotton bag with Otaku Pulse logo. 38x42cm.',
          price:5000, oldPrice:6500, emoji:'👜', color:'#22c55e',
          badge:'PROMO', badgeColor:'#dc2626', stock:15, rating:4.4, reviews:9 },

        { slug:'kit-deco-naruto',         category:'kits',        tags:JSON.stringify(['naruto','bestseller']),
          nameF:'Kit Deco Mini — Univers Naruto', nameE:'Mini Deco Kit — Naruto Universe',
          descF:'Confettis shurikens + 5 stickers + 1 poster A3.',
          descE:'Shuriken confetti + 5 stickers + 1 A3 poster.',
          price:8500, oldPrice:11000, emoji:'🎋', color:'#f97316',
          badge:'PROMO', badgeColor:'#dc2626', stock:7, rating:4.7, reviews:13 },

        { slug:'kit-deco-aot',            category:'kits',        tags:JSON.stringify(['attack on titan','new']),
          nameF:'Kit Deco Mini — Attack on Titan', nameE:'Mini Deco Kit — Attack on Titan',
          descF:'Confettis + 5 stickers Survey Corps + 1 poster A3.',
          descE:'Confetti + 5 Survey Corps stickers + 1 A3 poster.',
          price:8500, emoji:'⚔️', color:'#6b7280',
          badge:'NOUVEAU', badgeColor:'#22c55e', stock:9, rating:4.6, reviews:7 },
      ];
      await Product.bulkCreate(products);
      console.log('📦 10 produits inseres');
    } else {
      console.log(`📦 ${count} produits existants`);
    }

    // ── EVENEMENT ────────────────────────────────────
    const evCount = await Event.count();
    if (evCount === 0) {
      await Event.create({
        status:'upcoming', featured:1, type:'hokage',
        typeColor:'#dc2626', emoji:'👑',
        titleF:'Soiree Otaku Pulse — Grand Lancement',
        titleE:'Otaku Pulse Night — Grand Launch',
        descF:'Le tout premier evenement officiel Otaku Pulse a Yaounde.',
        descE:'The very first official Otaku Pulse event in Yaounde.',
        date:'2026-06-30', timeStart:'18:00', timeEnd:'23:59',
        location:'Yaounde, Cameroun', venue:'Salle Prestige — Bastos', city:'Yaoundé',
        capacity:80, registered:47, price:0,
        priceLabel:'Sur invitation', priceLabelE:'By invitation', isFree:1,
        themes: JSON.stringify(['All Anime Universe']),
        tags:   JSON.stringify(['Lancement','VIP','Gratuit']),
        tagsE:  JSON.stringify(['Launch','VIP','Free']),
        img:'🎌',
      });
      console.log('🎌 Evenement cree');
    }

    console.log('\n⚡ SEED TERMINE — Otaku Pulse MySQL pret !\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
}

seed();