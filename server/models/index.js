// server/models/index.js — OTAKU PULSE v2 PostgreSQL
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
  avatar:              { type: DataTypes.STRING(500), defaultValue:'' },
  lang:                { type: DataTypes.ENUM('fr','en'), defaultValue:'fr' },
  role:                { type: DataTypes.ENUM('user','admin','superadmin'), defaultValue:'user' },
  isVerified:          { type: DataTypes.BOOLEAN, defaultValue: false },
  isBanned:            { type: DataTypes.BOOLEAN, defaultValue: false },
  refreshToken:        { type: DataTypes.TEXT },
  lastLogin:           { type: DataTypes.DATE },
  loginCount:          { type: DataTypes.INTEGER, defaultValue: 0 },
  newsletterSubscribed:{ type: DataTypes.BOOLEAN, defaultValue: false },
}, {
  tableName: 'users', timestamps: true,
  hooks: { beforeSave: async (u) => { if (u.changed('password') && u.password) u.password = await bcrypt.hash(u.password, 12) } },
})
User.prototype.comparePassword = async function(c) { return bcrypt.compare(c, this.password) }
User.prototype.toJSON = function() {
  const o = { ...this.get() }
  ;['password','refreshToken'].forEach(k => delete o[k])
  return o
}

// ══ SUPPLIER (Fournisseur) ════════════════════════════
const Supplier = sequelize.define('Supplier', {
  id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name:        { type: DataTypes.STRING(150), allowNull: false },
  email:       { type: DataTypes.STRING(255) },
  phone:       { type: DataTypes.STRING(20) },
  whatsapp:    { type: DataTypes.STRING(20) },
  city:        { type: DataTypes.STRING(100) },
  address:     { type: DataTypes.TEXT },
  logoData:    { type: DataTypes.TEXT },        // base64 du logo
  logoMime:    { type: DataTypes.STRING(50) },
  description: { type: DataTypes.TEXT },
  commission:  { type: DataTypes.FLOAT, defaultValue: 0.25 }, // % commission Otaku Pulse
  bankName:    { type: DataTypes.STRING(100) },
  bankAccount: { type: DataTypes.STRING(100) },
  isActive:    { type: DataTypes.BOOLEAN, defaultValue: true },
  notes:       { type: DataTypes.TEXT },
}, { tableName: 'suppliers', timestamps: true })

// ══ PRODUCT ═══════════════════════════════════════════
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
  // Image stockée en base64 dans la BD
  imageData:  { type: DataTypes.TEXT },         // base64 de l'image principale
  imageMime:  { type: DataTypes.STRING(50) },   // 'image/jpeg', 'image/png'
  imageUrl:   { type: DataTypes.STRING(500) },  // URL externe si pas de base64
  images:     { type: DataTypes.JSONB, defaultValue: [] }, // URLs supplémentaires
  emoji:      { type: DataTypes.STRING(10), defaultValue: '🎁' },
  badge:      { type: DataTypes.STRING(50) },
  stock:      { type: DataTypes.INTEGER, defaultValue: 0, validate:{min:0} },
  sold:       { type: DataTypes.INTEGER, defaultValue: 0 },
  isActive:   { type: DataTypes.BOOLEAN, defaultValue: true },
  isFeatured: { type: DataTypes.BOOLEAN, defaultValue: false },
  supplierId: { type: DataTypes.UUID },          // null = produit Otaku Pulse propre
  isOwnProduct:{ type: DataTypes.BOOLEAN, defaultValue: true }, // false = fournisseur
}, { tableName: 'products', timestamps: true })

// ══ ORDER ═════════════════════════════════════════════
const Order = sequelize.define('Order', {
  id:            { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  orderNumber:   { type: DataTypes.STRING(30), unique: true },
  userId:        { type: DataTypes.UUID, allowNull: false },
  items:         { type: DataTypes.JSONB, defaultValue: [] },
  subtotal:      { type: DataTypes.INTEGER, allowNull: false },
  shipping:      { type: DataTypes.INTEGER, defaultValue: 0 },
  total:         { type: DataTypes.INTEGER, allowNull: false },
  currency:      { type: DataTypes.STRING(10), defaultValue: 'FCFA' },
  // Livraison
  whatsappNumber:{ type: DataTypes.STRING(20) },
  quartier:      { type: DataTypes.STRING(150) },
  city:          { type: DataTypes.STRING(100) },
  fullAddress:   { type: DataTypes.TEXT },
  // Statut
  status: {
    type: DataTypes.ENUM('pending','confirmed','preparing','shipped','delivered','cancelled','refunded'),
    defaultValue: 'pending'
  },
  paymentMethod: { type: DataTypes.ENUM('mtn_money','orange_money','cash','card'), defaultValue:'mtn_money' },
  paymentStatus: { type: DataTypes.ENUM('pending','paid','failed','refunded'), defaultValue:'pending' },
  // Historique statuts (pour suivi client)
  statusHistory: { type: DataTypes.JSONB, defaultValue: [] },
  adminNotes:    { type: DataTypes.TEXT },
  // Email confirmation envoyé ?
  confirmationSent: { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
  tableName: 'orders', timestamps: true,
  hooks: {
    beforeCreate: async (o) => {
      if (!o.orderNumber) {
        const rand = Math.floor(10000 + Math.random() * 90000)
        o.orderNumber = `OP-${new Date().getFullYear()}-${rand}`
      }
      // Ajouter premier statut dans l'historique
      o.statusHistory = [{ status:'pending', date: new Date().toISOString(), note:'Commande reçue' }]
    }
  }
})

// ══ EVENT ═════════════════════════════════════════════
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

// ══ EVENT_REGISTRATION ════════════════════════════════
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

// ══ HERO CONFIG ═══════════════════════════════════════
// Permet de changer le hero depuis l'admin
const HeroConfig = sequelize.define('HeroConfig', {
  id:           { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  // Textes
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
  // Thème anime / couleurs
  animeName:    { type: DataTypes.STRING(100), defaultValue:'Naruto' },
  primaryColor: { type: DataTypes.STRING(20),  defaultValue:'#22c55e' },
  secondColor:  { type: DataTypes.STRING(20),  defaultValue:'#86efac' },
  glowColor:    { type: DataTypes.STRING(20),  defaultValue:'rgba(34,197,94,0.4)' },
  // Image de fond (base64 ou URL)
  bgImageData:  { type: DataTypes.TEXT },
  bgImageMime:  { type: DataTypes.STRING(50) },
  bgImageUrl:   { type: DataTypes.STRING(500), defaultValue:'/img/deku.jpg' },
  // CTA Buttons
  ctaPrimaryF:  { type: DataTypes.STRING(100), defaultValue:'⚡ Réserver mon événement' },
  ctaPrimaryE:  { type: DataTypes.STRING(100), defaultValue:'⚡ Book my event' },
  ctaSecondaryF:{ type: DataTypes.STRING(100), defaultValue:'🎌 Voir les événements' },
  ctaSecondaryE:{ type: DataTypes.STRING(100), defaultValue:'🎌 See events' },
  // Launch date
  launchDate:   { type: DataTypes.DATEONLY, defaultValue:'2026-06-30' },
  // Stats
  statsJson:    { type: DataTypes.JSONB, defaultValue:[
    { valueFr:'50+', valueEn:'50+', labelFr:'Thèmes Anime', labelEn:'Anime Themes' },
    { valueFr:'100+', valueEn:'100+', labelFr:'Événements', labelEn:'Events' },
    { valueFr:'3',   valueEn:'3',   labelFr:'Villes',       labelEn:'Cities' },
    { valueFr:'4.9', valueEn:'4.9', labelFr:'Note Moyenne', labelEn:'Avg Rating' },
  ]},
  isActive:     { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'hero_configs', timestamps: true })

// ══ CONTACT ═══════════════════════════════════════════
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

// ══ WISHLIST ══════════════════════════════════════════
const Wishlist = sequelize.define('Wishlist', {
  id:        { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId:    { type: DataTypes.UUID, allowNull: false },
  productId: { type: DataTypes.UUID, allowNull: false },
}, { tableName: 'wishlists', timestamps: true, indexes:[{ unique:true, fields:['userId','productId'] }] })

// ══ NEWSLETTER ════════════════════════════════════════
const Newsletter = sequelize.define('Newsletter', {
  id:       { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  email:    { type: DataTypes.STRING(255), allowNull: false, unique: true, validate:{isEmail:true},
              set(v){ this.setDataValue('email', v.toLowerCase().trim()) } },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  source:   { type: DataTypes.STRING(50) },
  lang:     { type: DataTypes.ENUM('fr','en'), defaultValue: 'fr' },
}, { tableName: 'newsletter', timestamps: true })

// ══ ASSOCIATIONS ══════════════════════════════════════
User.hasMany(Order,    { foreignKey:'userId', as:'orders' })
Order.belongsTo(User,  { foreignKey:'userId', as:'user' })

User.belongsToMany(Product, { through:Wishlist, foreignKey:'userId',    as:'wishlist' })
Product.belongsToMany(User, { through:Wishlist, foreignKey:'productId', as:'wishedBy' })

Event.hasMany(EventRegistration,   { foreignKey:'eventId', as:'registrations' })
EventRegistration.belongsTo(Event, { foreignKey:'eventId' })
EventRegistration.belongsTo(User,  { foreignKey:'userId', as:'user' })
User.hasMany(EventRegistration,    { foreignKey:'userId', as:'eventRegistrations' })

Supplier.hasMany(Product,    { foreignKey:'supplierId', as:'products' })
Product.belongsTo(Supplier,  { foreignKey:'supplierId', as:'supplier' })

// ══ SYNC ══════════════════════════════════════════════
const syncDatabase = async (force = false) => {
  await sequelize.sync({ force, alter: !force })
  console.log(`✅ Tables PostgreSQL ${force ? 'réinitialisées' : 'synchronisées'}`)
}

module.exports = {
  sequelize, syncDatabase,
  User, Product, Order, Event, EventRegistration,
  Contact, Wishlist, Newsletter, Supplier, HeroConfig,
}