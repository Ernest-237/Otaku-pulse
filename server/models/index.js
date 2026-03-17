// server/models/index.js
// ═══════════════════════════════════════════════════════
// OTAKU PULSE — Modèles Sequelize MySQL
// Compatible Hostinger / MySQL 5.7+ / MySQL 8+
// Tableaux stockés en JSON (TEXT parsé automatiquement)
// ═══════════════════════════════════════════════════════
const { DataTypes } = require('sequelize');
const bcrypt        = require('bcryptjs');
const { sequelize } = require('../config/database');

// ── Helper : champ JSON (array ou object) en TEXT MySQL ──
// MySQL 5.7.8+ supporte le type JSON natif,
// mais TEXT+getter/setter fonctionne partout
const jsonField = (defaultVal = null) => ({
  type: DataTypes.TEXT('long'),
  allowNull: true,
  get() {
    const raw = this.getDataValue(this.constructor.rawAttributes[
      Object.keys(this.constructor.rawAttributes).find(
        k => this.constructor.rawAttributes[k] === this.constructor.rawAttributes[k]
      )
    ]);
    // On récupère via _fieldName trick — Sequelize gère le fieldName dans get()
    return defaultVal;
  },
  set(val) {
    this.setDataValue(
      Object.keys(this.constructor.rawAttributes).find(
        k => this.constructor.rawAttributes[k].get === this.constructor.rawAttributes[k].get
      ),
      val !== undefined && val !== null ? JSON.stringify(val) : null
    );
  },
});

// Meilleure approche : définir le getter/setter directement par champ
const makeJsonField = (def = null) => ({
  type: DataTypes.TEXT('long'),
  allowNull: true,
  defaultValue: def !== null ? JSON.stringify(def) : null,
});

// Wrapper pour parse automatique — appelé dans afterFind hooks
function parseJsonFields(instance, fields) {
  if (!instance) return;
  const instances = Array.isArray(instance) ? instance : [instance];
  instances.forEach(inst => {
    if (!inst || !inst.dataValues) return;
    fields.forEach(f => {
      const raw = inst.dataValues[f];
      if (typeof raw === 'string') {
        try { inst.dataValues[f] = JSON.parse(raw); } catch { inst.dataValues[f] = null; }
      }
    });
  });
}


// ══════════════════════════════════════════════════════
// USER
// ══════════════════════════════════════════════════════
const User = sequelize.define('User', {
  id: { type: DataTypes.CHAR(36), defaultValue: DataTypes.UUIDV4, primaryKey: true },
  pseudo: {
    type: DataTypes.STRING(20), allowNull: false, unique: true,
    validate: {
      len: { args:[3,20], msg:'Pseudo : 3 à 20 caractères.' },
      is:  { args:/^[a-zA-Z0-9_-]+$/, msg:'Pseudo invalide.' },
    },
  },
  email: {
    type: DataTypes.STRING(255), allowNull: false, unique: true,
    validate: { isEmail: { msg:'Email invalide.' } },
    set(v) { this.setDataValue('email', v.toLowerCase().trim()); },
  },
  password:   { type: DataTypes.STRING(255), validate:{ len:{args:[8,255],msg:'Min 8 caractères.'} } },
  firstName:  { type: DataTypes.STRING(50) },
  lastName:   { type: DataTypes.STRING(50) },
  phone:      { type: DataTypes.STRING(20) },
  city:       { type: DataTypes.ENUM('Yaoundé','Douala','Bafoussam','Autre'), defaultValue:'Yaoundé' },
  avatar:     { type: DataTypes.STRING(500), defaultValue:'' },
  lang:       { type: DataTypes.ENUM('fr','en'), defaultValue:'fr' },
  role:       { type: DataTypes.ENUM('user','admin','superadmin'), defaultValue:'user' },
  isVerified: { type: DataTypes.TINYINT(1), defaultValue:0 },
  isBanned:   { type: DataTypes.TINYINT(1), defaultValue:0 },
  googleId:   { type: DataTypes.STRING(100) },
  authProvider: { type: DataTypes.ENUM('local','google'), defaultValue:'local' },
  emailVerifyToken:    { type: DataTypes.STRING(255) },
  passwordResetToken:  { type: DataTypes.STRING(255) },
  passwordResetExpiry: { type: DataTypes.DATE },
  refreshToken:        { type: DataTypes.TEXT },
  lastLogin:           { type: DataTypes.DATE },
  loginCount:          { type: DataTypes.INTEGER, defaultValue:0 },
  newsletterSubscribed:{ type: DataTypes.TINYINT(1), defaultValue:0 },
}, {
  tableName:'users', timestamps:true,
  charset:'utf8mb4', collate:'utf8mb4_unicode_ci',
  hooks:{
    beforeSave: async (u) => {
      if (u.changed('password') && u.password) u.password = await bcrypt.hash(u.password, 12);
    },
  },
});
User.prototype.comparePassword = async function(c) { return bcrypt.compare(c, this.password); };
User.prototype.toJSON = function() {
  const o = { ...this.get() };
  ['password','refreshToken','emailVerifyToken','passwordResetToken','googleId'].forEach(k => delete o[k]);
  return o;
};


// ══════════════════════════════════════════════════════
// PRODUCT
// ══════════════════════════════════════════════════════
const Product = sequelize.define('Product', {
  id:       { type:DataTypes.CHAR(36), defaultValue:DataTypes.UUIDV4, primaryKey:true },
  slug:     { type:DataTypes.STRING(100), unique:true, allowNull:false },
  category: { type:DataTypes.ENUM('posters','stickers','accessoires','kits'), allowNull:false },
  tags:     makeJsonField([]),   // JSON string
  nameF:    { type:DataTypes.STRING(255), allowNull:false },
  nameE:    { type:DataTypes.STRING(255), allowNull:false },
  descF:    { type:DataTypes.TEXT },
  descE:    { type:DataTypes.TEXT },
  price:    { type:DataTypes.INTEGER, allowNull:false, validate:{min:0} },
  oldPrice: { type:DataTypes.INTEGER },
  currency: { type:DataTypes.STRING(10), defaultValue:'FCFA' },
  images:   makeJsonField([]),   // JSON string
  emoji:    { type:DataTypes.STRING(10), defaultValue:'🎁' },
  color:    { type:DataTypes.STRING(20), defaultValue:'#22c55e' },
  badge:    { type:DataTypes.STRING(50) },
  badgeColor:{ type:DataTypes.STRING(20) },
  stock:    { type:DataTypes.INTEGER, defaultValue:0, validate:{min:0} },
  sold:     { type:DataTypes.INTEGER, defaultValue:0 },
  rating:   { type:DataTypes.FLOAT, defaultValue:0 },
  reviews:  { type:DataTypes.INTEGER, defaultValue:0 },
  isActive: { type:DataTypes.TINYINT(1), defaultValue:1 },
  isFeatured:{ type:DataTypes.TINYINT(1), defaultValue:0 },
}, {
  tableName:'products', timestamps:true,
  charset:'utf8mb4', collate:'utf8mb4_unicode_ci',
  hooks:{
    afterFind: (r) => parseJsonFields(r, ['tags','images']),
  },
});


// ══════════════════════════════════════════════════════
// ORDER
// ══════════════════════════════════════════════════════
const Order = sequelize.define('Order', {
  id:          { type:DataTypes.CHAR(36), defaultValue:DataTypes.UUIDV4, primaryKey:true },
  orderNumber: { type:DataTypes.STRING(30), unique:true },
  userId:      { type:DataTypes.CHAR(36), allowNull:false },
  items:         makeJsonField([]),
  subtotal:    { type:DataTypes.INTEGER, allowNull:false },
  shipping:    { type:DataTypes.INTEGER, defaultValue:0 },
  discount:    { type:DataTypes.INTEGER, defaultValue:0 },
  total:       { type:DataTypes.INTEGER, allowNull:false },
  currency:    { type:DataTypes.STRING(10), defaultValue:'FCFA' },
  promoCode:   { type:DataTypes.STRING(30) },
  status:      { type:DataTypes.ENUM('pending','confirmed','processing','shipped','delivered','cancelled','refunded'), defaultValue:'pending' },
  paymentMethod: { type:DataTypes.ENUM('mtn_money','orange_money','stripe','transfer','free'), defaultValue:'mtn_money' },
  paymentStatus: { type:DataTypes.ENUM('pending','paid','failed','refunded'), defaultValue:'pending' },
  paymentReference:{ type:DataTypes.STRING(100) },
  paidAt:      { type:DataTypes.DATE },
  deliveryCity:{ type:DataTypes.STRING(100) },
  deliveryAddress:{ type:DataTypes.TEXT },
  deliveryPhone:  { type:DataTypes.STRING(20) },
  deliveryNotes:  { type:DataTypes.TEXT },
  shippedAt:   { type:DataTypes.DATE },
  deliveredAt: { type:DataTypes.DATE },
  statusHistory: makeJsonField([]),
}, {
  tableName:'orders', timestamps:true,
  charset:'utf8mb4', collate:'utf8mb4_unicode_ci',
  hooks:{
    beforeCreate: async (o) => {
      const count = await Order.count();
      o.orderNumber = `OP-${new Date().getFullYear()}-${String(count+1).padStart(5,'0')}`;
    },
    afterFind: (r) => parseJsonFields(r, ['items','statusHistory']),
  },
});


// ══════════════════════════════════════════════════════
// EVENT
// ══════════════════════════════════════════════════════
const Event = sequelize.define('Event', {
  id:       { type:DataTypes.CHAR(36), defaultValue:DataTypes.UUIDV4, primaryKey:true },
  status:   { type:DataTypes.ENUM('draft','upcoming','ongoing','past','cancelled'), defaultValue:'draft' },
  featured: { type:DataTypes.TINYINT(1), defaultValue:0 },
  type:     { type:DataTypes.ENUM('genin','chunin','hokage','custom'), allowNull:false },
  typeColor:{ type:DataTypes.STRING(20) },
  emoji:    { type:DataTypes.STRING(10) },
  titleF:   { type:DataTypes.STRING(255), allowNull:false },
  titleE:   { type:DataTypes.STRING(255), allowNull:false },
  descF:    { type:DataTypes.TEXT },
  descE:    { type:DataTypes.TEXT },
  date:     { type:DataTypes.DATEONLY, allowNull:false },
  timeStart:{ type:DataTypes.STRING(5) },
  timeEnd:  { type:DataTypes.STRING(5) },
  location: { type:DataTypes.STRING(255) },
  venue:    { type:DataTypes.STRING(255) },
  city:     { type:DataTypes.ENUM('Yaoundé','Douala','Bafoussam','Autre'), defaultValue:'Yaoundé' },
  capacity: { type:DataTypes.INTEGER, allowNull:false },
  registered:{ type:DataTypes.INTEGER, defaultValue:0 },
  price:    { type:DataTypes.INTEGER, defaultValue:0 },
  priceLabel: { type:DataTypes.STRING(50) },
  priceLabelE:{ type:DataTypes.STRING(50) },
  isFree:   { type:DataTypes.TINYINT(1), defaultValue:0 },
  themes:   makeJsonField([]),
  tags:     makeJsonField([]),
  tagsE:    makeJsonField([]),
  img:      { type:DataTypes.STRING(10), defaultValue:'🎌' },
}, {
  tableName:'events', timestamps:true,
  charset:'utf8mb4', collate:'utf8mb4_unicode_ci',
  hooks:{ afterFind: (r) => parseJsonFields(r, ['themes','tags','tagsE']) },
});


// ══════════════════════════════════════════════════════
// EVENT_REGISTRATION
// ══════════════════════════════════════════════════════
const EventRegistration = sequelize.define('EventRegistration', {
  id:      { type:DataTypes.CHAR(36), defaultValue:DataTypes.UUIDV4, primaryKey:true },
  eventId: { type:DataTypes.CHAR(36), allowNull:false },
  userId:  { type:DataTypes.CHAR(36) },
  name:    { type:DataTypes.STRING(100) },
  email:   { type:DataTypes.STRING(255) },
  phone:   { type:DataTypes.STRING(20) },
  guests:  { type:DataTypes.INTEGER, defaultValue:1 },
  status:  { type:DataTypes.ENUM('pending','confirmed','waitlist','cancelled'), defaultValue:'pending' },
}, { tableName:'event_registrations', timestamps:true, charset:'utf8mb4', collate:'utf8mb4_unicode_ci' });


// ══════════════════════════════════════════════════════
// CONTACT
// ══════════════════════════════════════════════════════
const Contact = sequelize.define('Contact', {
  id:     { type:DataTypes.CHAR(36), defaultValue:DataTypes.UUIDV4, primaryKey:true },
  nom:    { type:DataTypes.STRING(100), allowNull:false },
  prenom: { type:DataTypes.STRING(100), allowNull:false },
  email:  { type:DataTypes.STRING(255), allowNull:false },
  phone:  { type:DataTypes.STRING(20),  allowNull:false },
  pack:   { type:DataTypes.ENUM('genin','chunin','hokage','custom'), allowNull:false },
  theme:  { type:DataTypes.STRING(100), allowNull:false },
  guests: { type:DataTypes.INTEGER, allowNull:false },
  date:   { type:DataTypes.DATEONLY, allowNull:false },
  time:   { type:DataTypes.STRING(5) },
  ville:  { type:DataTypes.STRING(100) },
  lieu:   { type:DataTypes.TEXT },
  message:{ type:DataTypes.TEXT },
  source: { type:DataTypes.STRING(50) },
  lang:   { type:DataTypes.ENUM('fr','en'), defaultValue:'fr' },
  packSelected: makeJsonField(null),
  status: { type:DataTypes.ENUM('new','contacted','quoted','confirmed','cancelled','completed'), defaultValue:'new' },
  adminNotes:       { type:DataTypes.TEXT },
  assignedTo:       { type:DataTypes.CHAR(36) },
  quoteSentAt:      { type:DataTypes.DATE },
  convertedToOrder: { type:DataTypes.TINYINT(1), defaultValue:0 },
}, {
  tableName:'contacts', timestamps:true,
  charset:'utf8mb4', collate:'utf8mb4_unicode_ci',
  hooks:{ afterFind: (r) => parseJsonFields(r, ['packSelected']) },
});


// ══════════════════════════════════════════════════════
// WISHLIST
// ══════════════════════════════════════════════════════
const Wishlist = sequelize.define('Wishlist', {
  id:        { type:DataTypes.CHAR(36), defaultValue:DataTypes.UUIDV4, primaryKey:true },
  userId:    { type:DataTypes.CHAR(36), allowNull:false },
  productId: { type:DataTypes.CHAR(36), allowNull:false },
}, {
  tableName:'wishlists', timestamps:true,
  indexes:[{ unique:true, fields:['userId','productId'] }],
});


// ══════════════════════════════════════════════════════
// NEWSLETTER
// ══════════════════════════════════════════════════════
const Newsletter = sequelize.define('Newsletter', {
  id:       { type:DataTypes.CHAR(36), defaultValue:DataTypes.UUIDV4, primaryKey:true },
  email:    { type:DataTypes.STRING(255), allowNull:false, unique:true, validate:{isEmail:true},
              set(v){ this.setDataValue('email', v.toLowerCase().trim()); } },
  isActive: { type:DataTypes.TINYINT(1), defaultValue:1 },
  source:   { type:DataTypes.STRING(50) },
  lang:     { type:DataTypes.ENUM('fr','en'), defaultValue:'fr' },
}, { tableName:'newsletter', timestamps:true, charset:'utf8mb4', collate:'utf8mb4_unicode_ci' });


// ══════════════════════════════════════════════════════
// ASSOCIATIONS
// ══════════════════════════════════════════════════════
User.hasMany(Order,    { foreignKey:'userId', as:'orders'  });
Order.belongsTo(User,  { foreignKey:'userId', as:'user'    });

User.belongsToMany(Product,  { through:Wishlist, foreignKey:'userId',    as:'wishlist'  });
Product.belongsToMany(User,  { through:Wishlist, foreignKey:'productId', as:'wishedBy'  });

Event.hasMany(EventRegistration,   { foreignKey:'eventId', as:'registrations' });
EventRegistration.belongsTo(Event, { foreignKey:'eventId' });
EventRegistration.belongsTo(User,  { foreignKey:'userId', as:'user' });
User.hasMany(EventRegistration,    { foreignKey:'userId', as:'eventRegistrations' });


// ══════════════════════════════════════════════════════
// SYNC
// ══════════════════════════════════════════════════════
const syncDatabase = async (force = false) => {
  await sequelize.sync({ force, alter: !force });
  console.log(`✅ Tables MySQL ${force ? 'réinitialisées' : 'synchronisées'}`);
};

module.exports = { sequelize, syncDatabase, User, Product, Order, Event, EventRegistration, Contact, Wishlist, Newsletter };