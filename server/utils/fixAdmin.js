// server/utils/fixAdmin.js — Crée ou réinitialise l'admin
// Usage : node utils/fixAdmin.js
require('dotenv').config()
const { sequelize, User } = require('../models/index')

const ADMIN_EMAIL    = 'admin@otaku-pulse.com'
const ADMIN_PASSWORD = 'OtakuAdmin@237!'
const ADMIN_PSEUDO   = 'OtakuAdmin'

async function fixAdmin() {
  console.log('\n🔧 Réparation du compte admin Otaku Pulse...\n')

  try {
    await sequelize.authenticate()
    console.log('✅ Connexion BDD OK')

    // Cherche un admin existant par email OU pseudo
    let admin = await User.findOne({ where: { email: ADMIN_EMAIL } })

    if (!admin) {
      // Vérifier si le pseudo est déjà pris par un autre user
      const pseudoTaken = await User.findOne({ where: { pseudo: ADMIN_PSEUDO } })
      if (pseudoTaken) {
        console.log(`⚠️  Pseudo "${ADMIN_PSEUDO}" déjà utilisé par un autre compte.`)
        console.log(`   Utilisateur concerné: ${pseudoTaken.email}`)
        console.log(`   → Soit tu changes son pseudo, soit tu le promeus en admin.`)
        process.exit(1)
      }

      console.log('📝 Aucun admin trouvé. Création du compte...')
      admin = await User.create({
        pseudo:    ADMIN_PSEUDO,
        email:     ADMIN_EMAIL,
        password:  ADMIN_PASSWORD,        // hash auto via beforeSave hook
        firstName: 'Admin',
        lastName:  'Otaku Pulse',
        phone:     '+237 675 712 739',
        whatsapp:  '+237 675 712 739',
        city:      'Yaoundé',
        quartier:  'Bastos',
        role:      'superadmin',
        isVerified: true,
        isBanned:   false,
        isPublisher: true,
        publisherInfo: {
          bio: 'Compte officiel Otaku Pulse — éditeur principal et curateur.',
          portfolioLinks: ['https://otaku-pulse.com'],
          validatedAt: new Date().toISOString(),
        },
        newsletterSubscribed: true,
      })
      console.log('✅ Admin créé avec succès')
    } else {
      console.log('🔍 Admin trouvé en BDD. Mise à jour...')
      console.log(`   Pseudo actuel : ${admin.pseudo}`)
      console.log(`   Rôle actuel   : ${admin.role}`)
      console.log(`   isBanned      : ${admin.isBanned}`)

      // Mise à jour : reset password + s'assurer que le compte est actif
      admin.password = ADMIN_PASSWORD   // hash auto via hook
      admin.role = 'superadmin'
      admin.isBanned = false
      admin.isVerified = true
      admin.isPublisher = true
      if (!admin.publisherInfo) {
        admin.publisherInfo = {
          bio: 'Compte officiel Otaku Pulse — éditeur principal et curateur.',
          portfolioLinks: ['https://otaku-pulse.com'],
          validatedAt: new Date().toISOString(),
        }
      }
      // Reset eventual lock fields
      admin.refreshToken = null
      admin.passwordResetToken = null
      admin.passwordResetExpiry = null

      await admin.save()
      console.log('✅ Admin mis à jour avec succès')
    }

    // Test du mot de passe
    const passwordOk = await admin.comparePassword(ADMIN_PASSWORD)
    console.log(`\n🔐 Test du mot de passe : ${passwordOk ? '✅ OK' : '❌ ÉCHEC'}\n`)

    if (!passwordOk) {
      console.error('⚠️  Le hash du mot de passe ne correspond pas. Problème de bcrypt ?')
      process.exit(1)
    }

    console.log(`╔════════════════════════════════════════════╗`)
    console.log(`║  ✅ ADMIN OTAKU PULSE PRÊT                  ║`)
    console.log(`╠════════════════════════════════════════════╣`)
    console.log(`║  Email    : ${ADMIN_EMAIL.padEnd(30)} ║`)
    console.log(`║  Password : ${ADMIN_PASSWORD.padEnd(30)} ║`)
    console.log(`║  Role     : superadmin                      ║`)
    console.log(`║  ID       : ${admin.id.padEnd(30)} ║`)
    console.log(`╚════════════════════════════════════════════╝\n`)

    console.log('🌐 Connexion : https://otaku-pulse.com (modal Login)')
    console.log('   Puis va dans /admin pour accéder au dashboard.\n')

    process.exit(0)
  } catch (err) {
    console.error('\n❌ Erreur :', err.message)
    if (err.original) console.error('   Détails :', err.original.message)
    process.exit(1)
  }
}

fixAdmin()