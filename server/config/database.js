// server/config/database.js
// ═══════════════════════════════════════════════════════
// OTAKU PULSE — Connexion MySQL via Sequelize
// Compatible Hostinger (hPanel MySQL)
// ═══════════════════════════════════════════════════════
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME     || 'otakupulse',
  process.env.DB_USER     || 'root',
  process.env.DB_PASSWORD || '',
  {
    host:    process.env.DB_HOST || 'localhost',
    port:    parseInt(process.env.DB_PORT) || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development'
      ? (sql) => console.log(`\x1b[36m[SQL]\x1b[0m ${sql}`)
      : false,
    pool: {
      max: 10, min: 0,
      acquire: 30000,
      idle:    10000,
    },
    define: {
      charset: 'utf8mb4',           // support emojis
      collate: 'utf8mb4_unicode_ci',
      underscored: false,
      timestamps: true,
    },
    dialectOptions: {
      charset: 'utf8mb4',
      // Nécessaire sur certains serveurs Hostinger
      connectTimeout: 20000,
    },
  }
);

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL connecté :', process.env.DB_HOST, '/', process.env.DB_NAME);
  } catch (err) {
    console.error('❌ MySQL connexion échouée :', err.message);
    process.exit(1);
  }
};

module.exports = { sequelize, testConnection };