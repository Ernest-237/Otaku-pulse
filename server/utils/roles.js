// server/utils/roles.js — règles de changement de rôle
//
// POURQUOI CE FICHIER EXISTE
//
// La colonne `User.role` mélange deux concepts :
//   · un niveau de privilège plateforme  : user < admin < superadmin
//   · une capacité fonctionnelle          : publisher, partner
//
// Écrire l'un écrase donc l'autre. Concrètement, valider la boutique d'un
// admin exécutait `role: 'partner'` et le rétrogradait : toutes les routes
// /api/admin/* lui répondaient ensuite 403, alors que le panneau continuait
// de s'afficher (le rôle est mis en cache côté navigateur).
//
// La capacité fonctionnelle est déjà portée par des booléens dédiés
// (`isPublisher`, `isPartner`). On s'appuie dessus, et on ne touche plus au
// rôle d'un compte du staff.

const STAFF_ROLES = ['admin', 'superadmin']

/** Ce compte a-t-il un rôle de staff à préserver ? */
const isStaff = (role) => STAFF_ROLES.includes(role)

/**
 * Rôle à écrire pour accorder une capacité fonctionnelle.
 * Un admin reste admin ; un utilisateur ordinaire prend le rôle demandé.
 *
 *   grantRole('user',       'partner')   → 'partner'
 *   grantRole('admin',      'partner')   → 'admin'      (jamais rétrogradé)
 *   grantRole('superadmin', 'publisher') → 'superadmin'
 */
function grantRole(currentRole, functionalRole) {
  return isStaff(currentRole) ? currentRole : functionalRole
}

/**
 * Rôle à écrire pour RETIRER une capacité fonctionnelle.
 * Même principe : révoquer le statut d'éditeur d'un admin ne doit pas le
 * transformer en simple utilisateur.
 *
 *   revokeRole('publisher') → 'user'
 *   revokeRole('admin')     → 'admin'
 */
function revokeRole(currentRole) {
  return isStaff(currentRole) ? currentRole : 'user'
}

module.exports = { STAFF_ROLES, isStaff, grantRole, revokeRole }
