// server/models/index.js — OTAKU PULSE v2 PostgreSQL + Manga Platform
const { DataTypes } = require('sequelize')
const bcrypt        = require('bcryptjs')
const { sequelize } = require('../config/database')

// ══ USER ══════════════════════════════════════════════
const User = sequelize.define('User', {
  id:                  { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  pseudo:              { type: DataTypes.STRING(20), allowNull: false, unique: true,
                         validate: { len:{args:[3,20]}, is:{args:/^[a-zA-Z0-9_-]+$/} } },
  email:               { type: DataTypes.STRING(255), allowNull: false, unique: true,
                         validate:{isEmail:true}, set(v){ this.setDataValue('email', v.toLowerCase().trim()) } },
  password:            { type: DataTypes.STRING(255) },
  firstName:           { type: DataTypes.STRING(50) },
  lastName:            { type: DataTypes.STRING(50) },
  phone:               { type: DataTypes.STRING(20) },
  whatsapp:            { type: DataTypes.STRING(20) },
  city:                { type: DataTypes.ENUM('Yaoundé','Douala','Bafoussam','Autre'), defaultValue:'Yaoundé' },
  quartier:            { type: DataTypes.STRING(100) },
  avatar:              { type: DataTypes.TEXT, defaultValue:'' },
  bio:                 { type: DataTypes.STRING(280), defaultValue:'' },
  membershipPlan:      { type: DataTypes.ENUM('basic','plus','elite'), allowNull: true },
  membershipStatus:    { type: DataTypes.STRING(20), allowNull: true },
  membershipExpiry:    { type: DataTypes.DATE, allowNull: true },
  membershipCardId:    { type: DataTypes.STRING(50), allowNull: true },
  lang:                { type: DataTypes.ENUM('fr','en'), defaultValue:'fr' },
  role:                { type: DataTypes.ENUM('user','publisher','admin','superadmin'), defaultValue:'user' },
  isVerified:          { type: DataTypes.BOOLEAN, defaultValue: false },
  isBanned:            { type: DataTypes.BOOLEAN, defaultValue: false },
  refreshToken:        { type: DataTypes.TEXT },
  passwordResetToken:  { type: DataTypes.STRING(255) },
  passwordResetExpiry: { type: DataTypes.DATE },
  lastLogin:           { type: DataTypes.DATE },
  loginCount:          { type: DataTypes.INTEGER, defaultValue: 0 },
  newsletterSubscribed:{ type: DataTypes.BOOLEAN, defaultValue: false },
  // ── MANGA PLATFORM ─────────────────────────────────
  isPublisher:         { type: DataTypes.BOOLEAN, defaultValue: false },
  publisherInfo:       { type: DataTypes.JSONB, defaultValue: null },
  // ex: { bio, banner, social: {twitter, instagram}, validatedAt, totalMangas }
}, {
  tableName: 'users', timestamps: true,
  hooks: { beforeSave: async (u) => { if (u.changed('password') && u.password) u.password = await bcrypt.hash(u.password, 12) } },
})
User.prototype.comparePassword = async function(c) { return bcrypt.compare(c, this.password) }
User.prototype.toJSON = function() {
  const o = { ...this.get() }
  ;['password','refreshToken','passwordResetToken','passwordResetExpiry'].forEach(k => delete o[k])
  return o
}

// ══ SUPPLIER (existant) ══════════════════════════════
const Supplier = sequelize.define('Supplier', {
  id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name:        { type: DataTypes.STRING(150), allowNull: false },
  email:       { type: DataTypes.STRING(255) },
  phone:       { type: DataTypes.STRING(20) },
  whatsapp:    { type: DataTypes.STRING(20) },
  city:        { type: DataTypes.STRING(100) },
  address:     { type: DataTypes.TEXT },
  logoData:    { type: DataTypes.TEXT },
  logoMime:    { type: DataTypes.STRING(50) },
  description: { type: DataTypes.TEXT },
  commission:  { type: DataTypes.FLOAT, defaultValue: 0.25 },
  bankName:    { type: DataTypes.STRING(100) },
  bankAccount: { type: DataTypes.STRING(100) },
  isActive:    { type: DataTypes.BOOLEAN, defaultValue: true },
  notes:       { type: DataTypes.TEXT },
}, { tableName: 'suppliers', timestamps: true })

// ══ PRODUCT (existant) ══════════════════════════════
const Product = sequelize.define('Product', {
  id:         { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  slug:       { type: DataTypes.STRING(100), unique: true, allowNull: false },
  category:   {
    type: DataTypes.ENUM('posters','stickers','accessoires','kits','manga','livre','dessin','nutrition','echange','jeux'),
    allowNull: false
  },
  tags:       { type: DataTypes.JSONB, defaultValue: [] },
  nameF:      { type: DataTypes.STRING(255), allowNull: false },
  nameE:      { type: DataTypes.STRING(255) },
  descF:      { type: DataTypes.TEXT },
  descE:      { type: DataTypes.TEXT },
  price:      { type: DataTypes.INTEGER, allowNull: false, validate:{min:0} },
  oldPrice:   { type: DataTypes.INTEGER },
  currency:   { type: DataTypes.STRING(10), defaultValue: 'FCFA' },
  imageData:  { type: DataTypes.TEXT },
  imageMime:  { type: DataTypes.STRING(50) },
  imageUrl:   { type: DataTypes.STRING(500) },
  images:     { type: DataTypes.JSONB, defaultValue: [] },
  emoji:      { type: DataTypes.STRING(10), defaultValue: '🎁' },
  badge:      { type: DataTypes.STRING(50) },
  stock:      { type: DataTypes.INTEGER, defaultValue: 0, validate:{min:0} },
  sold:       { type: DataTypes.INTEGER, defaultValue: 0 },
  isActive:   { type: DataTypes.BOOLEAN, defaultValue: true },
  isFeatured: { type: DataTypes.BOOLEAN, defaultValue: false },
  supplierId: { type: DataTypes.UUID },
  isOwnProduct:{ type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'products', timestamps: true })

// ══ ORDER (existant) ════════════════════════════════
const Order = sequelize.define('Order', {
  id:            { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  orderNumber:   { type: DataTypes.STRING(30), unique: true },
  userId:        { type: DataTypes.UUID, allowNull: false },
  items:         { type: DataTypes.JSONB, defaultValue: [] },
  subtotal:      { type: DataTypes.INTEGER, allowNull: false },
  shipping:      { type: DataTypes.INTEGER, defaultValue: 0 },
  total:         { type: DataTypes.INTEGER, allowNull: false },
  currency:      { type: DataTypes.STRING(10), defaultValue: 'FCFA' },
  whatsappNumber:{ type: DataTypes.STRING(20) },
  quartier:      { type: DataTypes.STRING(150) },
  city:          { type: DataTypes.STRING(100) },
  fullAddress:   { type: DataTypes.TEXT },
  status: {
    type: DataTypes.ENUM('pending','confirmed','preparing','shipped','delivered','cancelled','refunded'),
    defaultValue: 'pending'
  },
  paymentMethod: { type: DataTypes.ENUM('mtn_money','orange_money','cash','card'), defaultValue:'mtn_money' },
  paymentStatus: { type: DataTypes.ENUM('pending','paid','failed','refunded'), defaultValue:'pending' },
  statusHistory: { type: DataTypes.JSONB, defaultValue: [] },
  adminNotes:    { type: DataTypes.TEXT },
  confirmationSent: { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
  tableName: 'orders', timestamps: true,
  hooks: {
    beforeCreate: async (o) => {
      if (!o.orderNumber) {
        const rand = Math.floor(10000 + Math.random() * 90000)
        o.orderNumber = `OP-${new Date().getFullYear()}-${rand}`
      }
      o.statusHistory = [{ status:'pending', date: new Date().toISOString(), note:'Commande reçue' }]
    }
  }
})

// ══ EVENT (existant) ════════════════════════════════
const Event = sequelize.define('Event', {
  id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  titleF:      { type: DataTypes.STRING(200), allowNull: false },
  titleE:      { type: DataTypes.STRING(200) },
  descF:       { type: DataTypes.TEXT },
  descE:       { type: DataTypes.TEXT },
  date:        { type: DataTypes.DATEONLY, allowNull: false },
  timeStart:   { type: DataTypes.STRING(5) },
  timeEnd:     { type: DataTypes.STRING(5) },
  venue:       { type: DataTypes.STRING(200) },
  city:        { type: DataTypes.STRING(100), defaultValue:'Yaoundé' },
  type:        { type: DataTypes.ENUM('genin','chunin','hokage','custom'), defaultValue:'custom' },
  capacity:    { type: DataTypes.INTEGER, defaultValue: 50 },
  registered:  { type: DataTypes.INTEGER, defaultValue: 0 },
  price:       { type: DataTypes.INTEGER, defaultValue: 0 },
  isFree:      { type: DataTypes.BOOLEAN, defaultValue: false },
  imageData:   { type: DataTypes.TEXT },
  imageMime:   { type: DataTypes.STRING(50) },
  imageUrl:    { type: DataTypes.STRING(500) },
  img:         { type: DataTypes.STRING(10), defaultValue: '🎌' },
  status:      { type: DataTypes.ENUM('upcoming','ongoing','past','cancelled','draft'), defaultValue:'upcoming' },
  featured:    { type: DataTypes.BOOLEAN, defaultValue: false },
  tags:        { type: DataTypes.JSONB, defaultValue: [] },
}, { tableName: 'events', timestamps: true })

// ══ EVENT_REGISTRATION (existant) ═══════════════════
const EventRegistration = sequelize.define('EventRegistration', {
  id:      { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  eventId: { type: DataTypes.UUID, allowNull: false },
  userId:  { type: DataTypes.UUID },
  name:    { type: DataTypes.STRING(100) },
  email:   { type: DataTypes.STRING(255) },
  phone:   { type: DataTypes.STRING(20) },
  whatsapp:{ type: DataTypes.STRING(20) },
  guests:  { type: DataTypes.INTEGER, defaultValue: 1 },
  status:  { type: DataTypes.ENUM('pending','confirmed','waitlist','cancelled'), defaultValue:'pending' },
  notes:   { type: DataTypes.TEXT },
}, { tableName: 'event_registrations', timestamps: true })

// ══ HERO CONFIG (existant) ══════════════════════════
const HeroConfig = sequelize.define('HeroConfig', {
  id:           { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  taglineF:     { type: DataTypes.STRING(200), defaultValue:'LANCEMENT · 30 JUIN 2026 · CAMEROUN' },
  taglineE:     { type: DataTypes.STRING(200), defaultValue:'LAUNCH · JUNE 30, 2026 · CAMEROON' },
  line1F:       { type: DataTypes.STRING(200), defaultValue:"VIVEZ L'EXPÉRIENCE" },
  line1E:       { type: DataTypes.STRING(200), defaultValue:'LIVE THE EXPERIENCE' },
  line2F:       { type: DataTypes.STRING(200), defaultValue:'AU-DELÀ DE' },
  line2E:       { type: DataTypes.STRING(200), defaultValue:'BEYOND THE' },
  accentF:      { type: DataTypes.STRING(100), defaultValue:"L'ÉCRAN" },
  accentE:      { type: DataTypes.STRING(100), defaultValue:'THE SCREEN' },
  subtitleF:    { type: DataTypes.TEXT, defaultValue:"Premier service événementiel clé en main spécialisé dans l'immersion Otaku au Cameroun." },
  subtitleE:    { type: DataTypes.TEXT, defaultValue:'First all-inclusive Otaku event service in Cameroon.' },
  animeName:    { type: DataTypes.STRING(100), defaultValue:'Naruto' },
  primaryColor: { type: DataTypes.STRING(20),  defaultValue:'#22c55e' },
  secondColor:  { type: DataTypes.STRING(20),  defaultValue:'#86efac' },
  glowColor:    { type: DataTypes.STRING(20),  defaultValue:'rgba(34,197,94,0.4)' },
  bgImageData:  { type: DataTypes.TEXT },
  bgImageMime:  { type: DataTypes.STRING(50) },
  bgImageUrl:   { type: DataTypes.STRING(500), defaultValue:'/img/deku.jpg' },
  ctaPrimaryF:  { type: DataTypes.STRING(100), defaultValue:'⚡ Réserver mon événement' },
  ctaPrimaryE:  { type: DataTypes.STRING(100), defaultValue:'⚡ Book my event' },
  ctaSecondaryF:{ type: DataTypes.STRING(100), defaultValue:'🎌 Voir les événements' },
  ctaSecondaryE:{ type: DataTypes.STRING(100), defaultValue:'🎌 See events' },
  launchDate:   { type: DataTypes.DATEONLY, defaultValue:'2026-06-30' },
  statsJson:    { type: DataTypes.JSONB, defaultValue:[
    { valueFr:'50+', valueEn:'50+', labelFr:'Thèmes Anime', labelEn:'Anime Themes' },
    { valueFr:'100+', valueEn:'100+', labelFr:'Événements', labelEn:'Events' },
    { valueFr:'3',   valueEn:'3',   labelFr:'Villes',       labelEn:'Cities' },
    { valueFr:'4.9', valueEn:'4.9', labelFr:'Note Moyenne', labelEn:'Avg Rating' },
  ]},
  isActive:     { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'hero_configs', timestamps: true })

// ══ CONTACT (existant) ══════════════════════════════
const Contact = sequelize.define('Contact', {
  id:         { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  nom:        { type: DataTypes.STRING(100), allowNull: false },
  prenom:     { type: DataTypes.STRING(100), allowNull: false },
  email:      { type: DataTypes.STRING(255), allowNull: false },
  phone:      { type: DataTypes.STRING(20),  allowNull: false },
  whatsapp:   { type: DataTypes.STRING(20) },
  pack:       { type: DataTypes.STRING(50), defaultValue:'custom' },
  theme:      { type: DataTypes.STRING(100), allowNull: false },
  guests:     { type: DataTypes.INTEGER, allowNull: false },
  date:       { type: DataTypes.DATEONLY, allowNull: false },
  time:       { type: DataTypes.STRING(5) },
  ville:      { type: DataTypes.STRING(100) },
  quartier:   { type: DataTypes.STRING(150) },
  lieu:       { type: DataTypes.TEXT },
  message:    { type: DataTypes.TEXT },
  source:     { type: DataTypes.STRING(50) },
  lang:       { type: DataTypes.ENUM('fr','en'), defaultValue: 'fr' },
  status:     { type: DataTypes.ENUM('new','contacted','quoted','confirmed','cancelled','completed'), defaultValue:'new' },
  adminNotes: { type: DataTypes.TEXT },
}, { tableName: 'contacts', timestamps: true })

// ══ WISHLIST (existant) ═════════════════════════════
const Wishlist = sequelize.define('Wishlist', {
  id:        { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId:    { type: DataTypes.UUID, allowNull: false },
  productId: { type: DataTypes.UUID, allowNull: false },
}, { tableName: 'wishlists', timestamps: true, indexes:[{ unique:true, fields:['userId','productId'] }] })

// ══ NEWSLETTER (existant) ═══════════════════════════
const Newsletter = sequelize.define('Newsletter', {
  id:       { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  email:    { type: DataTypes.STRING(255), allowNull: false, unique: true, validate:{isEmail:true},
              set(v){ this.setDataValue('email', v.toLowerCase().trim()) } },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  source:   { type: DataTypes.STRING(50) },
  lang:     { type: DataTypes.ENUM('fr','en'), defaultValue: 'fr' },
}, { tableName: 'newsletter', timestamps: true })

// ══ MEMBERSHIP REQUESTS (existant) ══════════════════
const MembershipRequest = sequelize.define('MembershipRequest', {
  id:         { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId:     { type: DataTypes.UUID, allowNull: false },
  plan:       { type: DataTypes.ENUM('basic','plus','elite'), allowNull: false },
  nom:        { type: DataTypes.STRING(100), allowNull: false },
  email:      { type: DataTypes.STRING(255) },
  phone:      { type: DataTypes.STRING(30) },
  ville:      { type: DataTypes.STRING(50), defaultValue: 'Yaoundé' },
  message:    { type: DataTypes.TEXT },
  status:     { type: DataTypes.ENUM('pending','contacted','active','cancelled','expired'), defaultValue: 'pending' },
  adminNotes: { type: DataTypes.TEXT },
  cardId:     { type: DataTypes.STRING(50) },
  expiresAt:  { type: DataTypes.DATE },
}, { tableName: 'MembershipRequests', timestamps: true })

// ╔═══════════════════════════════════════════════════════════╗
// ║                  MANGA PLATFORM — NOUVEAU                  ║
// ╚═══════════════════════════════════════════════════════════╝

// ══ MANGA ═══════════════════════════════════════════
const Manga = sequelize.define('Manga', {
  id:               { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  slug:             { type: DataTypes.STRING(120), allowNull: false, unique: true },
  titleF:           { type: DataTypes.STRING(200), allowNull: false },
  titleE:           { type: DataTypes.STRING(200) },
  synopsisF:        { type: DataTypes.TEXT },
  synopsisE:        { type: DataTypes.TEXT },
  authorId:         { type: DataTypes.UUID, allowNull: false },     // FK User (publisher)
  authorName:       { type: DataTypes.STRING(120) },                // dénormalisé pour affichage rapide
  // Images base64 comme tes produits
  coverImageData:   { type: DataTypes.TEXT },
  coverImageMime:   { type: DataTypes.STRING(50) },
  bannerImageData:  { type: DataTypes.TEXT },
  bannerImageMime:  { type: DataTypes.STRING(50) },
  // Metadata
  genres:           { type: DataTypes.JSONB, defaultValue: [] },    // ['action','romance','shonen']
  tags:             { type: DataTypes.JSONB, defaultValue: [] },
  language:         { type: DataTypes.ENUM('fr','en'), defaultValue: 'fr' },
  status:           { type: DataTypes.ENUM('ongoing','completed','hiatus','cancelled'), defaultValue: 'ongoing' },
  ageRating:        { type: DataTypes.ENUM('all','13+','16+','18+'), defaultValue: 'all' },
  accessTier:       { type: DataTypes.ENUM('free','premium'), defaultValue: 'premium' },
  // Modération
  moderationStatus: { type: DataTypes.ENUM('pending','approved','rejected','suspended'), defaultValue: 'pending' },
  moderationNotes:  { type: DataTypes.TEXT },
  rejectedReason:   { type: DataTypes.TEXT },
  // Compteurs dénormalisés
  totalChapters:    { type: DataTypes.INTEGER, defaultValue: 0 },
  viewCount:        { type: DataTypes.INTEGER, defaultValue: 0 },
  readCount:        { type: DataTypes.INTEGER, defaultValue: 0 },
  likeCount:        { type: DataTypes.INTEGER, defaultValue: 0 },
  commentCount:     { type: DataTypes.INTEGER, defaultValue: 0 },
  averageRating:    { type: DataTypes.FLOAT, defaultValue: 0 },
  ratingCount:      { type: DataTypes.INTEGER, defaultValue: 0 },
  // Publication
  isFeatured:       { type: DataTypes.BOOLEAN, defaultValue: false },
  publishedAt:      { type: DataTypes.DATE },
}, {
  tableName: 'mangas', timestamps: true,
  indexes: [
    { fields: ['slug'], unique: true },
    { fields: ['authorId'] },
    { fields: ['moderationStatus','publishedAt'] },
    { fields: ['language','status'] },
  ]
})

// ══ CHAPTER ═════════════════════════════════════════
const Chapter = sequelize.define('Chapter', {
  id:            { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  mangaId:       { type: DataTypes.UUID, allowNull: false },
  chapterNumber: { type: DataTypes.DECIMAL(10,2), allowNull: false }, // 1, 1.5, 2…
  title:         { type: DataTypes.STRING(200) },
  // Pages : array de { data: base64, mime, order, width?, height? }
  pages:         { type: DataTypes.JSONB, defaultValue: [] },
  pageCount:     { type: DataTypes.INTEGER, defaultValue: 0 },
  // Override accès (peut être différent du manga, ex: chapitre 1 = free même si manga premium)
  accessTier:    { type: DataTypes.ENUM('free','premium'), defaultValue: 'premium' },
  isPublished:   { type: DataTypes.BOOLEAN, defaultValue: false },
  publishedAt:   { type: DataTypes.DATE },
  viewCount:     { type: DataTypes.INTEGER, defaultValue: 0 },
}, {
  tableName: 'chapters', timestamps: true,
  indexes: [
    { fields: ['mangaId','chapterNumber'], unique: true },
    { fields: ['mangaId','isPublished'] },
  ]
})

// ══ READING PROGRESS ════════════════════════════════
const ReadingProgress = sequelize.define('ReadingProgress', {
  id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId:      { type: DataTypes.UUID, allowNull: false },
  mangaId:     { type: DataTypes.UUID, allowNull: false },
  chapterId:   { type: DataTypes.UUID, allowNull: false },
  pageIndex:   { type: DataTypes.INTEGER, defaultValue: 0 },
  isCompleted: { type: DataTypes.BOOLEAN, defaultValue: false },
  readAt:      { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'reading_progress', timestamps: true,
  indexes: [
    { fields: ['userId','mangaId'], unique: true },
    { fields: ['userId','readAt'] },
  ]
})

// ══ LIBRARY ITEM ════════════════════════════════════
const LibraryItem = sequelize.define('LibraryItem', {
  id:        { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId:    { type: DataTypes.UUID, allowNull: false },
  mangaId:   { type: DataTypes.UUID, allowNull: false },
  status:    { type: DataTypes.ENUM('reading','completed','plan_to_read','dropped','on_hold'), defaultValue: 'reading' },
  rating:    { type: DataTypes.INTEGER, validate: { min: 1, max: 5 } },
  notesPrivate: { type: DataTypes.TEXT },
  addedAt:   { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'library_items', timestamps: true,
  indexes: [
    { fields: ['userId','mangaId'], unique: true },
    { fields: ['userId','status','addedAt'] },
  ]
})

// ══ CHAPTER VIEW (log brut anti-spam) ═══════════════
const ChapterView = sequelize.define('ChapterView', {
  id:        { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  chapterId: { type: DataTypes.UUID, allowNull: false },
  mangaId:   { type: DataTypes.UUID, allowNull: false },
  userId:    { type: DataTypes.UUID, allowNull: true },     // nullable pour anonyme
  ipHash:    { type: DataTypes.STRING(64) },                // hash IP pour anti-spam anonyme
  viewedAt:  { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'chapter_views', timestamps: false,
  indexes: [
    { fields: ['chapterId','viewedAt'] },
    { fields: ['userId','viewedAt'] },
    { fields: ['mangaId','viewedAt'] },
  ]
})

// ══ SUBSCRIPTION ════════════════════════════════════
const Subscription = sequelize.define('Subscription', {
  id:                { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId:            { type: DataTypes.UUID, allowNull: false },
  planType:          { type: DataTypes.ENUM('daily','weekly','monthly','yearly'), allowNull: false },
  status:            { type: DataTypes.ENUM('pending','active','expired','cancelled'), defaultValue: 'pending' },
  startsAt:          { type: DataTypes.DATE },
  expiresAt:         { type: DataTypes.DATE },
  amount:            { type: DataTypes.INTEGER, allowNull: false },
  currency:          { type: DataTypes.STRING(10), defaultValue: 'XAF' },
  paymentMethod:     { type: DataTypes.ENUM('mtn_money','orange_money','manual','cinetpay'), defaultValue: 'manual' },
  paymentReference:  { type: DataTypes.STRING(100) },
  whatsappNumber:    { type: DataTypes.STRING(20) },
  autoRenew:         { type: DataTypes.BOOLEAN, defaultValue: false },
  adminNotes:        { type: DataTypes.TEXT },
}, {
  tableName: 'subscriptions', timestamps: true,
  indexes: [
    { fields: ['userId','status','expiresAt'] },
    { fields: ['status','expiresAt'] },
  ]
})

// ══ PUBLISHER APPLICATION ═══════════════════════════
const PublisherApplication = sequelize.define('PublisherApplication', {
  id:             { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId:         { type: DataTypes.UUID, allowNull: false },
  pseudo:         { type: DataTypes.STRING(50) },
  realName:       { type: DataTypes.STRING(120) },
  email:          { type: DataTypes.STRING(255) },
  phone:          { type: DataTypes.STRING(30) },
  bio:            { type: DataTypes.TEXT },
  portfolioLinks: { type: DataTypes.JSONB, defaultValue: [] },
  sampleData:     { type: DataTypes.TEXT },          // base64 d'un échantillon
  sampleMime:     { type: DataTypes.STRING(50) },
  status:         { type: DataTypes.ENUM('pending','approved','rejected'), defaultValue: 'pending' },
  adminNotes:     { type: DataTypes.TEXT },
  reviewedAt:     { type: DataTypes.DATE },
  reviewedBy:     { type: DataTypes.UUID },
}, {
  tableName: 'publisher_applications', timestamps: true,
  indexes: [{ fields: ['userId'] }, { fields: ['status'] }]
})

// ══ MANGA COMMENT ═══════════════════════════════════
const MangaComment = sequelize.define('MangaComment', {
  id:        { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  mangaId:   { type: DataTypes.UUID, allowNull: false },
  chapterId: { type: DataTypes.UUID },                    // null = commentaire général sur le manga
  userId:    { type: DataTypes.UUID, allowNull: false },
  content:   { type: DataTypes.TEXT, allowNull: false, validate: { len: { args: [1, 1000] } } },
  pageIndex: { type: DataTypes.INTEGER },                 // null si pas attaché à une page précise
  parentId:  { type: DataTypes.UUID },                    // pour les réponses
  likeCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  isHidden:  { type: DataTypes.BOOLEAN, defaultValue: false },
  isFlagged: { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
  tableName: 'manga_comments', timestamps: true,
  indexes: [
    { fields: ['mangaId','createdAt'] },
    { fields: ['chapterId','createdAt'] },
    { fields: ['userId'] },
  ]
})

// ══ MANGA RATING ════════════════════════════════════
const MangaRating = sequelize.define('MangaRating', {
  id:      { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  mangaId: { type: DataTypes.UUID, allowNull: false },
  userId:  { type: DataTypes.UUID, allowNull: false },
  rating:  { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1, max: 5 } },
  review:  { type: DataTypes.TEXT },
}, {
  tableName: 'manga_ratings', timestamps: true,
  indexes: [{ fields: ['mangaId','userId'], unique: true }]
})

// ══ ASSOCIATIONS ═══════════════════════════════════════
// Existantes (préservées)
User.hasMany(Order,    { foreignKey:'userId', as:'orders' })
Order.belongsTo(User,  { foreignKey:'userId', as:'user' })

User.belongsToMany(Product, { through:Wishlist, foreignKey:'userId',    as:'wishlist' })
Product.belongsToMany(User, { through:Wishlist, foreignKey:'productId', as:'wishedBy' })

Event.hasMany(EventRegistration,   { foreignKey:'eventId', as:'registrations' })
EventRegistration.belongsTo(Event, { foreignKey:'eventId' })
EventRegistration.belongsTo(User,  { foreignKey:'userId', as:'user' })
User.hasMany(EventRegistration,    { foreignKey:'userId', as:'eventRegistrations' })

Supplier.hasMany(Product,    { foreignKey:'supplierId', as:'products' })
MembershipRequest.belongsTo(User, { as: 'user', foreignKey: 'userId' })
User.hasMany(MembershipRequest,   { as: 'membershipRequests', foreignKey: 'userId' })
Product.belongsTo(Supplier,  { foreignKey:'supplierId', as:'supplier' })

// ── MANGA ASSOCIATIONS ──────────────────────────────
User.hasMany(Manga,    { foreignKey: 'authorId', as: 'mangas' })
Manga.belongsTo(User,  { foreignKey: 'authorId', as: 'author' })

Manga.hasMany(Chapter,    { foreignKey: 'mangaId', as: 'chapters', onDelete: 'CASCADE' })
Chapter.belongsTo(Manga,  { foreignKey: 'mangaId', as: 'manga' })

User.hasMany(ReadingProgress,    { foreignKey: 'userId', as: 'readingProgress' })
ReadingProgress.belongsTo(User,  { foreignKey: 'userId', as: 'user' })
ReadingProgress.belongsTo(Manga, { foreignKey: 'mangaId', as: 'manga' })
ReadingProgress.belongsTo(Chapter, { foreignKey: 'chapterId', as: 'chapter' })
Manga.hasMany(ReadingProgress,   { foreignKey: 'mangaId', as: 'progressList' })

User.hasMany(LibraryItem,    { foreignKey: 'userId', as: 'library' })
LibraryItem.belongsTo(User,  { foreignKey: 'userId', as: 'user' })
LibraryItem.belongsTo(Manga, { foreignKey: 'mangaId', as: 'manga' })
Manga.hasMany(LibraryItem,   { foreignKey: 'mangaId', as: 'libraryEntries' })

ChapterView.belongsTo(Chapter, { foreignKey: 'chapterId', as: 'chapter' })
ChapterView.belongsTo(Manga,   { foreignKey: 'mangaId', as: 'manga' })
ChapterView.belongsTo(User,    { foreignKey: 'userId', as: 'user' })
Chapter.hasMany(ChapterView,   { foreignKey: 'chapterId', as: 'views' })

User.hasMany(Subscription,    { foreignKey: 'userId', as: 'subscriptions' })
Subscription.belongsTo(User,  { foreignKey: 'userId', as: 'user' })

User.hasMany(PublisherApplication,    { foreignKey: 'userId', as: 'publisherApplications' })
PublisherApplication.belongsTo(User,  { foreignKey: 'userId', as: 'user' })

Manga.hasMany(MangaComment,    { foreignKey: 'mangaId', as: 'comments' })
MangaComment.belongsTo(Manga,  { foreignKey: 'mangaId', as: 'manga' })
MangaComment.belongsTo(User,   { foreignKey: 'userId', as: 'user' })
MangaComment.belongsTo(Chapter,{ foreignKey: 'chapterId', as: 'chapter' })
User.hasMany(MangaComment,     { foreignKey: 'userId', as: 'mangaComments' })

Manga.hasMany(MangaRating,     { foreignKey: 'mangaId', as: 'ratings' })
MangaRating.belongsTo(Manga,   { foreignKey: 'mangaId', as: 'manga' })
MangaRating.belongsTo(User,    { foreignKey: 'userId', as: 'user' })
User.hasMany(MangaRating,      { foreignKey: 'userId', as: 'mangaRatings' })

// ══ SYNC ══════════════════════════════════════════════
const syncDatabase = async (force = false) => {
  await sequelize.sync({ force, alter: !force })
  console.log(`✅ Tables PostgreSQL ${force ? 'réinitialisées' : 'synchronisées'}`)
}

module.exports = {
  sequelize, syncDatabase,
  // Existants
  User, Product, Order, Event, EventRegistration,
  Contact, Wishlist, Newsletter, Supplier, HeroConfig, MembershipRequest,
  // Manga Platform
  Manga, Chapter, ReadingProgress, LibraryItem, ChapterView,
  Subscription, PublisherApplication, MangaComment, MangaRating,
}