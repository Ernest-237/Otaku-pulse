// server/utils/seedManga.js — Seed démo Manga (optionnel, à exécuter 1x)
require('dotenv').config()
const { sequelize, User, Manga, Chapter } = require('../models/index')

// Génère une page placeholder en SVG → base64
function generatePlaceholderPage(mangaTitle, chapterNum, pageNum, totalPages) {
  const colors = ['#16a34a','#22c55e','#86efac','#15803d','#0a0a0a','#171717']
  const bg = colors[pageNum % colors.length]
  const fg = bg === '#0a0a0a' || bg === '#171717' ? '#33ff33' : '#0a0a0a'

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1200" width="800" height="1200">
    <rect width="800" height="1200" fill="${bg}"/>
    <rect x="40" y="40" width="720" height="1120" fill="none" stroke="${fg}" stroke-width="3" opacity=".3"/>
    <text x="400" y="200" font-family="Impact, sans-serif" font-size="48" fill="${fg}" text-anchor="middle" letter-spacing="4">${mangaTitle.toUpperCase()}</text>
    <text x="400" y="260" font-family="Arial, sans-serif" font-size="24" fill="${fg}" text-anchor="middle" opacity=".7">CHAPITRE ${chapterNum}</text>
    <line x1="200" y1="320" x2="600" y2="320" stroke="${fg}" stroke-width="2" opacity=".4"/>
    <text x="400" y="600" font-family="Impact, sans-serif" font-size="120" fill="${fg}" text-anchor="middle" opacity=".15">${pageNum + 1}</text>
    <text x="400" y="900" font-family="Arial, sans-serif" font-size="20" fill="${fg}" text-anchor="middle" opacity=".5">Page ${pageNum + 1} / ${totalPages}</text>
    <text x="400" y="1140" font-family="Arial, sans-serif" font-size="14" fill="${fg}" text-anchor="middle" opacity=".4" letter-spacing="2">⚡ OTAKU PULSE</text>
  </svg>`

  return Buffer.from(svg).toString('base64')
}

// Génère une cover placeholder en SVG → base64
function generateCover(title, color = '#16a34a') {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600" width="400" height="600">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${color}" stop-opacity="0.9"/>
        <stop offset="100%" stop-color="#0a0a0a" stop-opacity="0.95"/>
      </linearGradient>
    </defs>
    <rect width="400" height="600" fill="url(#bg)"/>
    <circle cx="200" cy="240" r="80" fill="#33ff33" opacity="0.15"/>
    <text x="200" y="310" font-family="Impact, sans-serif" font-size="36" fill="#fff" text-anchor="middle" letter-spacing="3">${title.toUpperCase().substring(0,12)}</text>
    <text x="200" y="350" font-family="Arial, sans-serif" font-size="14" fill="#33ff33" text-anchor="middle" opacity=".8" letter-spacing="2">⚡ OTAKU PULSE</text>
    <line x1="80" y1="540" x2="320" y2="540" stroke="#33ff33" stroke-width="2" opacity=".3"/>
    <text x="200" y="570" font-family="Arial, sans-serif" font-size="11" fill="#fff" text-anchor="middle" opacity=".5" letter-spacing="3">VIVEZ L'EXPÉRIENCE</text>
  </svg>`
  return Buffer.from(svg).toString('base64')
}

const MANGAS = [
  {
    titleF: "Lions de Mvog-Ada",
    titleE: "Lions of Mvog-Ada",
    synopsisF: "Dans les rues bouillonnantes de Yaoundé, une jeune lycéenne découvre qu'elle peut canaliser l'esprit ancestral des lions. Mais quand un mal ancien refait surface, elle devra rallier d'autres jeunes gardiens pour sauver sa ville.",
    synopsisE: "In the bustling streets of Yaoundé, a young high schooler discovers she can channel the ancestral spirit of lions. But when an ancient evil resurfaces, she must rally other young guardians to save her city.",
    genres: ['action','aventure','fantasy','shonen'],
    tags: ['cameroun','urbain','spirituel'],
    language: 'fr',
    status: 'ongoing',
    accessTier: 'premium',
    ageRating: '13+',
    color: '#16a34a',
    isFeatured: true,
    chapters: 4,
  },
  {
    titleF: "Echoes of Tokyo",
    titleE: "Echoes of Tokyo",
    synopsisF: "Yuna, étudiante en échange à Tokyo, se réveille un matin dans un Tokyo parallèle où la ville résonne d'échos du passé. Pour rentrer chez elle, elle devra écouter ce que les murs lui racontent.",
    synopsisE: "Yuna, an exchange student in Tokyo, wakes up one morning in a parallel Tokyo where the city echoes with the past. To return home, she must listen to what the walls tell her.",
    genres: ['mystery','seinen','surnaturel','romance'],
    tags: ['japon','voyage','dimension'],
    language: 'fr',
    status: 'ongoing',
    accessTier: 'premium',
    ageRating: '16+',
    color: '#6d28d9',
    isFeatured: true,
    chapters: 3,
  },
  {
    titleF: "Le Tisseur d'Ombres",
    titleE: "The Shadow Weaver",
    synopsisF: "Dans un royaume où la lumière a disparu, un jeune tisseur découvre qu'il peut sculpter les ombres elles-mêmes. Mais chaque création a un prix, et l'obscurité commence à le réclamer.",
    synopsisE: "In a kingdom where light has vanished, a young weaver discovers he can sculpt shadows themselves. But every creation has a price, and darkness begins to claim him.",
    genres: ['dark fantasy','aventure','seinen'],
    tags: ['magie','medieval','sombre'],
    language: 'fr',
    status: 'ongoing',
    accessTier: 'free',
    ageRating: '13+',
    color: '#1a2e1a',
    chapters: 5,
  },
  {
    titleF: "Code Otaku",
    titleE: "Code Otaku",
    synopsisF: "Kenji, hacker prodige, découvre que les jeux qu'il pirate sont en réalité des prisons numériques. Pour libérer les âmes piégées, il devra entrer dans le code lui-même et survivre à ses créations.",
    synopsisE: "Kenji, a prodigy hacker, discovers that the games he hacks are actually digital prisons. To free the trapped souls, he must enter the code itself and survive his creations.",
    genres: ['sci-fi','action','cyberpunk','shonen'],
    tags: ['hacker','virtuel','futur'],
    language: 'fr',
    status: 'ongoing',
    accessTier: 'premium',
    ageRating: '16+',
    color: '#00aaff',
    chapters: 3,
  },
  {
    titleF: "Le Café des Oubliés",
    titleE: "The Forgotten Café",
    synopsisF: "Un petit café à Douala accueille ceux que le monde a oubliés. Sora, la nouvelle serveuse, va découvrir que chaque client a une histoire — et que certaines ne se terminent jamais.",
    synopsisE: "A small café in Douala welcomes those the world has forgotten. Sora, the new waitress, will discover that every customer has a story — and some never end.",
    genres: ['slice of life','drame','surnaturel'],
    tags: ['cameroun','emotion','quotidien'],
    language: 'fr',
    status: 'ongoing',
    accessTier: 'free',
    ageRating: 'all',
    color: '#eab308',
    chapters: 4,
  },
  {
    titleF: "Sang de Dragon",
    titleE: "Dragon Blood",
    synopsisF: "Quand le dernier dragon de l'Afrique mystique choisit Adama comme héritier, le destin du continent bascule. Entre légendes ancestrales et menaces modernes, il devra apprendre à dompter sa puissance.",
    synopsisE: "When the last dragon of mystical Africa chooses Adama as his heir, the continent's fate changes. Between ancestral legends and modern threats, he must learn to master his power.",
    genres: ['action','fantasy','aventure','shonen'],
    tags: ['afrique','dragons','mystique'],
    language: 'fr',
    status: 'ongoing',
    accessTier: 'premium',
    ageRating: '13+',
    color: '#dc2626',
    isFeatured: true,
    chapters: 4,
  },
]

const slugify = (str) => str.toLowerCase().trim()
  .replace(/[àáâãäå]/g,'a').replace(/[èéêë]/g,'e').replace(/[ìíîï]/g,'i')
  .replace(/[òóôõö]/g,'o').replace(/[ùúûü]/g,'u').replace(/[^a-z0-9]+/g,'-')
  .replace(/^-+|-+$/g,'').substring(0,100)

async function seedManga() {
  console.log('🌱 Démarrage du seed Manga...')

  // Trouver l'admin existant
  let author = await User.findOne({ where: { role: 'superadmin' } })
  if (!author) {
    console.error('❌ Aucun superadmin trouvé. Crée d\'abord un compte admin.')
    process.exit(1)
  }

  // Promouvoir admin en publisher (sans casser son rôle)
  if (!author.isPublisher) {
    await author.update({
      isPublisher: true,
      publisherInfo: {
        bio: 'Compte officiel Otaku Pulse — éditeur principal et curateur des mangas démo.',
        portfolioLinks: ['https://otaku-pulse.com'],
        validatedAt: new Date().toISOString(),
      },
    })
    console.log('✅ Admin promu publisher')
  }

  let createdMangas = 0
  let createdChapters = 0

  for (const m of MANGAS) {
    let slug = slugify(m.titleF)
    let counter = 1
    const baseSlug = slug
    while (await Manga.findOne({ where: { slug } })) {
      slug = `${baseSlug}-${counter++}`
    }

    const cover = generateCover(m.titleF, m.color)

    const manga = await Manga.create({
      slug,
      titleF: m.titleF,
      titleE: m.titleE,
      synopsisF: m.synopsisF,
      synopsisE: m.synopsisE,
      authorId: author.id,
      authorName: author.pseudo,
      coverImageData: cover,
      coverImageMime: 'image/svg+xml',
      bannerImageData: cover,  // même image pour démo
      bannerImageMime: 'image/svg+xml',
      genres: m.genres,
      tags: m.tags,
      language: m.language,
      status: m.status,
      ageRating: m.ageRating,
      accessTier: m.accessTier,
      moderationStatus: 'approved',
      isFeatured: m.isFeatured || false,
      publishedAt: new Date(),
      totalChapters: m.chapters,
      // Stats simulées
      viewCount: Math.floor(Math.random() * 5000) + 500,
      readCount: Math.floor(Math.random() * 1500) + 100,
      likeCount: Math.floor(Math.random() * 300) + 50,
      averageRating: parseFloat((Math.random() * 1.5 + 3.5).toFixed(1)),
      ratingCount: Math.floor(Math.random() * 80) + 10,
    })
    createdMangas++

    // Créer les chapitres
    for (let i = 1; i <= m.chapters; i++) {
      const pagesCount = Math.floor(Math.random() * 8) + 8 // 8-15 pages
      const pages = []
      for (let p = 0; p < pagesCount; p++) {
        pages.push({
          data: generatePlaceholderPage(m.titleF, i, p, pagesCount),
          mime: 'image/svg+xml',
          order: p,
        })
      }

      // Premier chapitre toujours free, autres selon le manga
      const isFreeChapter = i === 1 ? true : (m.accessTier === 'free')

      await Chapter.create({
        mangaId: manga.id,
        chapterNumber: i,
        title: `Chapitre ${i}`,
        pages,
        pageCount: pagesCount,
        accessTier: isFreeChapter ? 'free' : 'premium',
        isPublished: true,
        publishedAt: new Date(Date.now() - (m.chapters - i) * 7 * 24 * 60 * 60 * 1000), // 1 chap/semaine
        viewCount: Math.floor(Math.random() * 1000) + 100,
      })
      createdChapters++
    }

    console.log(`  ✅ "${m.titleF}" → ${m.chapters} chapitres`)
  }

  console.log(`\n🎉 Seed Manga terminé !`)
  console.log(`   ${createdMangas} mangas créés`)
  console.log(`   ${createdChapters} chapitres créés`)
  console.log(`   Auteur : ${author.pseudo} (${author.email})\n`)

  process.exit(0)
}

seedManga().catch(err => {
  console.error('❌ Seed error:', err)
  process.exit(1)
})