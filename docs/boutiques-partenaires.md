# Boutiques partenaires et vitrines publiques

Chaque utilisateur peut ouvrir sa boutique après validation d'un admin. Depuis
cette mise à jour, chaque boutique validée dispose d'une **vitrine publique avec
son propre lien partageable**, et ses produits sont attribués et cliquables
depuis la boutique générale.

## Le parcours

```
1. L'utilisateur candidate          POST /api/suppliers/apply      → status: pending
2. L'admin valide                   PATCH /api/suppliers/:id/review → status: approved
                                                                     User.role = 'partner'
3. Un slug est généré automatiquement depuis le nom de la boutique
4. La vitrine est en ligne          https://otaku-pulse.com/boutique/<slug>
5. Le partenaire partage son lien   WhatsApp · Instagram · bio
```

## Le lien personnalisé

Format : `/boutique/<slug>` — par exemple `/boutique/sakura-goodies-yaounde`.

Le slug est **généré à la création** depuis le nom de la boutique
(« Sakura Goodies Yaoundé » → `sakura-goodies-yaounde`), puis **modifiable** par
le partenaire dans *Espace Partenaire → Paramètres boutique*.

Trois garanties, dans `server/utils/slugify.js` :

| Garantie | Pourquoi |
|---|---|
| **Unicité en base** (contrainte `UNIQUE`) | Deux boutiques créées au même instant ne peuvent pas réclamer la même URL. Une vérification applicative seule laisserait passer la course. |
| **ASCII uniquement** | Un slug accentué serait réencodé en `%C3%A9` et deviendrait illisible une fois collé dans WhatsApp. |
| **Segments réservés refusés** | `/boutique/partenaire` est déjà une route statique. React Router lui donnerait la priorité, et une boutique portant ce slug serait définitivement inaccessible. |

Liste complète des mots réservés : `RESERVED` dans `server/utils/slugify.js`.

> ⚠️ **Changer son slug casse les liens déjà partagés.** Aucune redirection
> n'est mise en place depuis l'ancien. L'interface affiche un avertissement
> explicite avant enregistrement, mais le choix reste au partenaire — c'est son
> identité.

### Boutiques créées avant cette mise à jour

Elles n'ont pas de slug. Un **rattrapage automatique** tourne dans
`syncDatabase()` au démarrage du serveur : il génère un slug pour chaque
boutique qui n'en a pas et journalise le résultat
(`✅ Slug boutique généré : Sakura Goodies → /boutique/sakura-goodies`).

Le tableau de bord partenaire affiche un message d'attente tant que le
rattrapage n'a pas tourné, plutôt qu'un lien cassé.

## Attribution dans la boutique générale

Sur chaque carte produit de `/boutique`, le nom de la boutique d'origine est
affiché et **cliquable** — il mène à la vitrine du partenaire. C'est la
passerelle qui donne de la visibilité aux partenaires depuis le catalogue commun.

Deux règles côté serveur (`server/routes/products.js`) :

- L'attribution n'apparaît que si la boutique est **`status: 'approved'`**. Une
  boutique en attente, rejetée ou suspendue est masquée du public.
- Sans slug (cas d'un fournisseur interne créé directement par l'admin),
  l'attribution reste du texte non cliquable.

## La vitrine

`src/pages/Boutique/shop/` — page publique, **sans authentification** : le lien
doit s'ouvrir pour n'importe qui, y compris quelqu'un sans compte.

Elle contient un bandeau (bannière ou dégradé), le logo, le nom avec un badge
« Vérifiée », l'accroche, la ville, le nombre de produits et de vues, une
recherche, des filtres par catégorie, et la grille de produits avec ajout au
panier direct.

### Personnalisation

Dans *Paramètres boutique*, le partenaire règle :

| Champ | Effet |
|---|---|
| `slug` | Son lien public, avec vérification de disponibilité en direct |
| `tagline` | L'accroche affichée sous le nom |
| `accent` | La couleur de sa vitrine (sélecteur de couleur) |
| `bannerData` | L'image de couverture — format paysage, 1200×400 recommandé |

La couleur est injectée en variable CSS (`--accent`) depuis le composant : toute
la feuille de style s'y adapte sans dupliquer la moindre règle. Sans bannière,
un dégradé construit à partir de cette couleur sert de repli.

> Le dégradé utilise `color-mix()`, absent des navigateurs Android anciens. Une
> déclaration de repli en dégradé simple est posée **avant**, sinon le bandeau
> se retrouverait sans fond et le texte blanc deviendrait illisible.

## Partage

Trois voies, dans cet ordre :

1. **Partage natif** (`navigator.share`) sur mobile en HTTPS — ouvre le sélecteur
   d'applications du téléphone.
2. **WhatsApp** via `wa.me`, qui est le canal réel au Cameroun.
3. **Copie du lien** dans le presse-papiers, avec repli sur un `prompt`
   sélectionnable quand l'API n'est pas disponible (HTTP non sécurisé,
   navigateur ancien).

Le bouton de partage est présent sur la vitrine elle-même **et** en tête du
tableau de bord partenaire, avant les statistiques — c'est l'action la plus
importante pour un partenaire qui démarre.

## API

| Route | Auth | Rôle |
|---|---|---|
| `GET /api/suppliers/shop/:slug` | ❌ publique | Vitrine + produits + catégories |
| `GET /api/suppliers/:id/banner` | ❌ publique | Image de couverture |
| `GET /api/suppliers/:id/logo` | ❌ publique | Logo |
| `GET /api/suppliers/slug-check/:slug` | ✅ | Disponibilité d'un lien |
| `PATCH /api/suppliers/me` | ✅ partenaire | Édition, slug validé à part |

`GET /shop/:slug` exclut les coordonnées bancaires, la commission, les notes
internes, le motif de rejet et l'email privé du partenaire. Les images base64 ne
transitent jamais dans cette réponse : elles ont leurs propres routes.

Le compteur de vues est incrémenté sans bloquer la réponse — une erreur
d'écriture ne doit jamais empêcher l'affichage de la vitrine.

## Correctif de performance inclus

`GET /api/products` exécutait **un `COUNT` par produit** pour savoir si son image
était en base, soit 51 requêtes SQL pour 50 produits. Remplacé par une requête
unique sur l'ensemble des identifiants. Même résultat, 2 requêtes au lieu de 51 —
directement visible au chargement de la boutique sur Render.

## Tests

```bash
cd server && npm test     # 14 cas sur les slugs
```

Couvre la translittération des accents, les tirets orphelins après troncature,
les segments réservés, les collisions, les noms sans caractère latin
exploitable, et la garantie que **toute** entrée produit un slug valide.

## Fichiers

| Fichier | Rôle |
|---|---|
| `server/utils/slugify.js` | Génération, validation, mots réservés |
| `server/utils/slugify.test.js` | 14 tests |
| `server/models/index.js` | Champs vitrine sur `Supplier`, hook, rattrapage |
| `server/routes/suppliers.js` | Vitrine publique, bannière, validation du slug |
| `server/routes/products.js` | Attribution + correctif N+1 |
| `src/pages/Boutique/shop/` | La vitrine publique |
| `src/pages/Boutique/partner/` | Lien partageable et personnalisation |
| `src/pages/Boutique/index.jsx` | Attribution cliquable sur les cartes |
