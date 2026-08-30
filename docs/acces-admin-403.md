# « Accès refusé » (403) sur toutes les routes admin

## Le symptôme

Le panneau d'administration s'affiche normalement — sidebar, badge ADMIN, menus —
mais **chaque appel API répond 403** :

```
GET /api/admin/dashboard        403 (Forbidden)
GET /api/admin/invoices/config  403 (Forbidden)
GET /api/admin/invoices/stats   403 (Forbidden)
```

## La cause

Un **403** (et non un 401) signifie que le jeton est valide — `protect` est passé —
mais que `restrictTo('admin','superadmin')` a refusé : le rôle du compte **en base**
n'est plus `admin` ni `superadmin`.

Le panneau continue de s'afficher parce que le rôle est mis en cache dans
`localStorage.op_user`, une photo prise au moment de la connexion.

### Pourquoi le rôle a changé

Quatre routes écrasaient `User.role` sans condition :

| Fichier | Écrivait | Déclencheur |
|---|---|---|
| `routes/suppliers.js` | `role: 'partner'` | Validation d'une boutique partenaire |
| `routes/publishers.js` | `role: 'publisher'` | Validation d'une candidature éditeur |
| `routes/adminManga.js` | `role: 'publisher'` | Octroi du statut éditeur |
| `routes/adminManga.js` | `role: 'user'` | Révocation du statut éditeur |

Valider sa propre boutique en tant qu'admin suffisait donc à se rétrograder en
`partner` et à perdre l'accès à l'administration.

## Réparer un compte

Depuis le dossier `server/`, avec un `.env` pointant la bonne base
(sur Render : Dashboard → le service → **Shell**) :

```bash
# Diagnostic — n'écrit rien
node utils/userRole.js ton@email.com

# Correction
node utils/userRole.js ton@email.com superadmin
```

Le diagnostic affiche le rôle, `isBanned`, les booléens de capacité, et signale
explicitement si une boutique validée est à l'origine de la rétrogradation.

> **Après la correction, déconnecte-toi et reconnecte-toi.** Le rôle est mis en
> cache côté navigateur et n'est rafraîchi qu'à la connexion — ou par la
> revalidation automatique décrite plus bas.

Si tu ne connais plus l'email du compte admin, lance la commande avec n'importe
quelle adresse : le script liste les comptes à privilèges existants.

## Le correctif de fond

### 1. Le rôle d'un compte du staff n'est plus jamais écrasé

`server/utils/roles.js` introduit `grantRole()` et `revokeRole()`.

La cause profonde était une confusion de modélisation : la colonne `role` porte
**deux concepts** — un niveau de privilège plateforme (`user` → `admin` →
`superadmin`) et une capacité fonctionnelle (`publisher`, `partner`). Écrire l'un
écrasait l'autre.

Or les booléens `isPublisher` et `isPartner` existaient déjà et portaient
exactement cette capacité. La règle est donc :

```js
grantRole('user',       'partner')   // → 'partner'
grantRole('admin',      'partner')   // → 'admin'   (jamais rétrogradé)
revokeRole('publisher')              // → 'user'
revokeRole('superadmin')             // → 'superadmin'
```

**Un admin peut désormais avoir une boutique sans cesser d'être admin.**

### 2. Le navigateur revalide le profil au démarrage

`src/contexts/AuthContext.jsx` restaure la session depuis `localStorage`
(affichage instantané), puis interroge `/api/auth/me` en arrière-plan et corrige
le profil si le serveur dit autre chose.

Sans ça, un rôle périmé produit exactement le symptôme du début : un panneau qui
s'affiche et un mur de 403 derrière.

## Si le 403 persiste

Vérifie dans l'ordre :

1. `node utils/userRole.js ton@email.com` — le rôle est-il bien `superadmin` ?
2. `isBanned` est-il à `false` ? Un compte suspendu est refusé par `protect`
   avec un 403 également, mais avec le message « Compte suspendu ».
3. Le `.env` du Shell Render pointe-t-il bien la **même** base que l'API ?
4. Es-tu bien déconnecté puis reconnecté après la correction ?

Le corps de la réponse distingue les deux cas :
`{"error":"Accès refusé."}` = rôle insuffisant,
`{"error":"Compte suspendu."}` = `isBanned`.
