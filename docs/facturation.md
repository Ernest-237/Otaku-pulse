# Facturation

Panneau d'administration → **🧾 Factures**.

## Les deux modes

| Mode | Point de départ | Usage |
|---|---|---|
| **Manuelle** | « Nouvelle facture » | Vente en main propre, prestation, sponsoring, partenariat |
| **Automatique** | « Depuis une commande » | Commande boutique existante, tout est prérempli |

Une commande ne donne **qu'une seule** facture : redemander une génération
renvoie celle qui existe déjà, au lieu d'en créer une seconde qui ferait double
emploi en comptabilité.

## Structure du document

De haut en bas :

| Zone | Contenu |
|---|---|
| **En-tête** | Coordonnées Otaku Pulse + **numéros de dépôt Mobile Money** · numéro de facture, code-barres, tampon d'état |
| **Lignes** | Désignation, quantité, prix unitaire, montant |
| **Règlement + totaux** | Moyen retenu, référence à mentionner · sous-total, remise, livraison, taxe, total |
| **Note** | Message libre visible par le client |
| **Informations client** | Bloc détaché : « Facturé à » + « Livraison » avec le plan de situation |
| **Pied de page** | Coordonnées Otaku Pulse, mention de TVA applicable ou non |

Deux choix de mise en page à connaître :

**Les numéros de dépôt sont en en-tête**, pas en bas. C'est l'information que le
client cherche en premier pour payer : il ne doit pas avoir à parcourir toute la
facture pour la trouver. Le bloc « Règlement » plus bas ne fait que rappeler le
moyen retenu et la référence à indiquer.

**Les informations client sont isolées en bas de page**, derrière un séparateur.
C'est le bloc que consulte le livreur, et il ne doit pas se mélanger visuellement
aux coordonnées d'Otaku Pulse imprimées juste en dessous.

Les numéros affichés par défaut :

| Opérateur | Numéro |
|---|---|
| MTN MoMo | `+237 670 63 36 70` |
| Orange Money | `+237 657 32 57 97` |

Ils sont également la source de vérité pour l'achat de coins
(`server/routes/coins.js`), pour que les deux flux ne divergent jamais.

## Impression et PDF

Le bouton **« Imprimer / PDF »** ouvre la boîte d'impression du navigateur ;
« Enregistrer au format PDF » y produit le fichier.

Il n'y a **pas de librairie PDF** dans le projet, et c'est délibéré : une
génération serveur imposerait Chromium (impossible sur Render en plan gratuit)
ou une librairie de mise en page à maintenir. Le document est du HTML avec des
règles `@media print` — il sort net sur une imprimante comme dans un PDF, reste
sélectionnable, et se met à jour avec le reste du site.

À l'impression, toute l'interface d'administration est masquée : seule la feuille
de facture apparaît sur le papier.

## Cycle de vie

```
  brouillon ──émettre──► à régler ──encaisser──► acquittée
      │                      │                       │
      └──────────────── annuler ─────────────────────┘
```

**Une facture émise est figée.** Ses lignes et ses montants ne sont plus
modifiables (le serveur renvoie une 409). C'est volontaire : le client détient un
exemplaire, et modifier le nôtre après coup le rendrait incohérent avec le sien.
Pour corriger, il faut annuler et créer une nouvelle facture.

« Archiver » ne supprime jamais : le modèle est `paranoid`, seul un `deletedAt`
est posé. Le numéro reste consommé, la séquence ne présente donc pas de trou
suspect pour un contrôle.

## Montants et taxes

Tout est en **entiers**. Le FCFA n'a pas de sous-unité : 500 FCFA se stocke
`500`, jamais `500.00`.

Le taux de taxe est stocké en **points de base entiers** : `1925` = 19,25 %.
Un flottant `0.1925` finirait par produire des factures fausses au franc près.

Trois presets, définis dans `server/routes/adminInvoices.js` :

| Preset | Taux | Quand |
|---|---|---|
| Aucune taxe | 0 | **Défaut.** Régime de l'impôt libératoire |
| TVA 19,25 % | 1925 | Taux camerounais courant (17,5 % + 10 % de CAC) |
| TVA 17,5 % | 1750 | TVA seule, hors centimes additionnels communaux |

> Le défaut est **aucune taxe**, parce que beaucoup de petites structures
> camerounaises relèvent de l'impôt libératoire et ne facturent pas de TVA.
> À toi de choisir selon ton régime réel — et à faire confirmer par un
> comptable avant d'émettre des factures avec TVA.

La base taxable est `sous-total − remise + livraison` : au Cameroun la TVA porte
aussi sur les frais de livraison facturés.

**Le serveur recalcule tous les montants** à partir des lignes reçues. Ce que le
formulaire affiche pendant la saisie n'est qu'un aperçu de confort ; aucun total
envoyé par le navigateur n'est jamais stocké.

Tests : `cd server && npm test` (13 cas — arrondis, remise plafonnée, valeurs
négatives, saisies non numériques).

## Plan de situation

La mini-carte est un **schéma vectoriel**, pas une carte à tuiles. Elle ne
demande aucun réseau à l'impression, sort net en noir et blanc, et n'exige
aucune clé d'API. Elle montre ce dont un livreur a réellement besoin : une
direction, une distance, un repère.

Elle affiche le centre-ville, la destination, la distance à vol d'oiseau,
l'orientation (« 2,4 km au nord du centre de Yaoundé »), les coordonnées et le
lien Google Maps imprimé en clair.

### Priorité des sources

1. **Coordonnées GPS saisies** dans le formulaire — priment toujours
2. **Quartier reconnu** dans la table `src/utils/cameroonGeo.js`
3. **Repli sur le centre-ville** si le quartier est inconnu

Le formulaire indique en direct laquelle des trois s'applique, pour que le cas
« quartier non reconnu » se découvre à la saisie et non à l'impression.

> ⚠️ **Les coordonnées de quartiers sont des centroïdes approximatifs.**
> Biyem-Assi s'étend sur plusieurs kilomètres — le point ne désigne pas une
> adresse. Pour une livraison précise, relever le point GPS réel (Google Maps,
> clic droit, copier les coordonnées) et le coller dans le formulaire.

Table actuelle : 29 quartiers à Yaoundé, 20 à Douala, 8 à Bafoussam. Pour en
ajouter ou en corriger un, éditer `QUARTIERS` dans `src/utils/cameroonGeo.js`.

## Code-barres

Code 128, jeu B, encodé à la main dans `src/utils/barcode.js` (~130 lignes) et
rendu en SVG — net à toute résolution, contrairement à un PNG qui sortirait flou
sur une imprimante 600 dpi et deviendrait illisible pour un lecteur.

Pas de dépendance : le bundle frontend est déjà un point de tension, et
`jsbarcode` ferait la même chose en pesant plus lourd.

Tests : `npm test` à la racine (10 cas, dont une vérification exhaustive des 95
motifs de la table — une coquille dans n'importe quelle ligne serait détectée).

Si le numéro contenait un caractère non encodable, l'encodeur renvoie `null` et
aucun code n'est affiché : un code-barres faux serait pire que pas de code du tout.

## Personnaliser l'en-tête et le pied de page

Variables d'environnement serveur (voir `server/.env.example`) :

```
COMPANY_NAME, COMPANY_TAGLINE, COMPANY_EMAIL, COMPANY_PHONE,
COMPANY_SITE, COMPANY_ADDRESS, COMPANY_RCCM, COMPANY_NIU,
COMPANY_MOMO_MTN, COMPANY_MOMO_ORANGE
```

> **`COMPANY_RCCM` et `COMPANY_NIU` sont vides par défaut et n'apparaissent
> alors pas sur la facture.** À renseigner dès l'enregistrement de la structure.
> Ne jamais y mettre un numéro inventé : une facture portant un identifiant
> fiscal faux pose bien plus de problèmes qu'une facture qui n'en porte aucun.

## Fichiers

| Fichier | Rôle |
|---|---|
| `server/models/index.js` | Modèle `Invoice` (`paranoid`) |
| `server/routes/adminInvoices.js` | API, calculs, numérotation, machine à états |
| `server/routes/adminInvoices.test.js` | 13 tests du calcul des montants |
| `src/pages/Admin/sections/InvoicesSection.jsx` | Liste, formulaire, détail |
| `src/components/InvoiceDocument.jsx` | Le document imprimable |
| `src/components/InvoiceDocument.module.css` | Mise en page A4 + `@media print` |
| `src/utils/barcode.js` | Encodeur Code 128 B → SVG |
| `src/utils/cameroonGeo.js` | Quartiers, distances, projection |
