// server/config/database.js — PostgreSQL / Render
const { Sequelize } = require('sequelize')

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false, // nécessaire sur Render
    },
  },
  logging: process.env.NODE_ENV === 'development'
    ? (sql) => console.log(`\x1b[36m[SQL]\x1b[0m ${sql}`)
    : false,
  pool: { max:5, min:0, acquire:30000, idle:10000 },
})

const testConnection = async () => {
  try {
    await sequelize.authenticate()
    console.log('✅ PostgreSQL connecté (Render)')
  } catch (err) {
    console.error('❌ PostgreSQL connexion échouée :', err.message)
    process.exit(1)
  }
}

module.exports = { sequelize, testConnection }