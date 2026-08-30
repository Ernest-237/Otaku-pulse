// server/utils/userRole.js — diagnostiquer et corriger le rôle d'un compte
//
// Diagnostic (aucune écriture) :
//   node utils/userRole.js ton@email.com
//
// Correction :
//   node utils/userRole.js ton@email.com superadmin
//
// À lancer depuis le dossier `server/`, avec un .env pointant la base voulue.
// Sur Render : Dashboard → le service → Shell.
require('dotenv').config()
const { sequelize, User, Supplier } = require('../models/index')

const ROLES = ['user', 'publisher', 'partner', 'admin', 'superadmin']

async function main() {
  const [email, wantedRole] = process.argv.slice(2)

  if (!email) {
    console.error('\nUsage :')
    console.error('  node utils/userRole.js <email>                 → diagnostic')
    console.error('  node utils/userRole.js <email> <role>          → correction')
    console.error(`\nRôles possibles : ${ROLES.join(', ')}\n`)
    process.exit(1)
  }
  if (wantedRole && !ROLES.includes(wantedRole)) {
    console.error(`\n❌ Rôle inconnu : « ${wantedRole} ». Attendu : ${ROLES.join(', ')}\n`)
    process.exit(1)
  }

  await sequelize.authenticate()
  console.log('✅ Connexion à la base OK\n')

  const user = await User.findOne({ where: { email: email.toLowerCase().trim() } })
  if (!user) {
    console.error(`❌ Aucun compte avec l'email « ${email} »\n`)
    // Aide au diagnostic : lister les comptes à privilèges existants.
    const staff = await User.findAll({
      where: { role: ['admin', 'superadmin'] },
      attributes: ['email', 'pseudo', 'role'],
    })
    if (staff.length) {
      console.log('Comptes à privilèges existants :')
      for (const s of staff) console.log(`  · ${s.email} (${s.pseudo}) — ${s.role}`)
    } else {
      console.log('⚠️  Aucun compte admin ou superadmin dans cette base.')
    }
    console.log()
    process.exit(1)
  }

  console.log('─'.repeat(52))
  console.log(`  Pseudo       : ${user.pseudo}`)
  console.log(`  Email        : ${user.email}`)
  console.log(`  Rôle         : ${user.role}`)
  console.log(`  isBanned     : ${user.isBanned}`)
  console.log(`  isPublisher  : ${user.isPublisher}`)
  console.log(`  isPartner    : ${user.isPartner}`)
  console.log(`  authProvider : ${user.authProvider || 'local'}`)
  console.log('─'.repeat(52))

  // `restrictTo('admin','superadmin')` renvoie 403 pour tout autre rôle : c'est
  // exactement l'erreur observée quand un admin s'est fait rétrograder.
  const canAdmin = ['admin', 'superadmin'].includes(user.role)
  console.log(canAdmin
    ? '\n✅ Ce compte a accès au panneau d\'administration.'
    : `\n🔴 Ce compte N'A PAS accès à l'administration (rôle « ${user.role} »).`
      + '\n   Toutes les routes /api/admin/* lui répondront 403.')

  if (user.isBanned) console.log('🔴 Compte suspendu (isBanned) : même `protect` le refuse.')

  // Une boutique validée est la cause la plus fréquente de rétrogradation.
  const shop = await Supplier.findOne({ where: { userId: user.id }, attributes: ['name', 'status', 'slug'] })
  if (shop) {
    console.log(`\n🏪 Boutique liée : « ${shop.name} » (${shop.status})`
      + (shop.slug ? ` → /boutique/${shop.slug}` : ''))
    if (shop.status === 'approved' && user.role === 'partner') {
      console.log('   ⚠️  C\'est très probablement la validation de cette boutique')
      console.log('       qui a écrasé le rôle admin en « partner ».')
    }
  }

  if (!wantedRole) {
    console.log(`\nPour corriger :\n  node utils/userRole.js ${user.email} superadmin\n`)
    process.exit(0)
  }

  // ── Correction ──
  await user.update({
    role: wantedRole,
    // Un compte suspendu est refusé par `protect` avant même `restrictTo` :
    // inutile de corriger le rôle sans lever la suspension.
    isBanned: false,
    // Les capacités fonctionnelles sont portées par des booléens dédiés et
    // n'ont plus besoin d'écraser le rôle (voir server/utils/roles.js).
    isPublisher: user.isPublisher || ['publisher', 'admin', 'superadmin'].includes(wantedRole),
  })

  console.log(`\n✅ Rôle mis à jour : ${user.role} → ${wantedRole}`)
  console.log('\n⚠️  Déconnecte-toi puis reconnecte-toi sur le site :')
  console.log('   le rôle est mis en cache dans localStorage (op_user) et')
  console.log('   ne se rafraîchit qu\'à la connexion.\n')
  process.exit(0)
}

main().catch(err => {
  console.error('\n❌ Erreur :', err.message)
  if (err.original) console.error('   Détails :', err.original.message)
  process.exit(1)
})
