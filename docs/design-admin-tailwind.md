# Refonte du panneau d'administration (Tailwind)

## Pourquoi les couleurs « clashaient »

L'ancienne identité posait un noir verdâtre `#0a0e0a` et un vert néon `#33ff33`
— deux couleurs à contraste maximal — puis les appliquait **partout en même
temps** : bordures, titres, icônes, boutons, halos, fonds dégradés.

Trois effets s'additionnaient :

1. **36 occurrences** de `rgba(51,255,51,…)` codées en dur dans `Admin.module.css`
2. **14 effets de halo** (`text-shadow`, `box-shadow` néon) sur les titres, cartes et boutons
3. Un **émoji différent par entrée de menu**, chacun avec sa propre palette

Rien ne ressortait, parce que tout criait en même temps.

## La nouvelle règle

Une échelle de gris bleutés porte **95 % de l'interface**. L'accent émeraude
n'apparaît que sur l'action en cours ou la donnée importante. Les couleurs
sémantiques restent réservées aux statuts.

| Rôle | Ancien | Nouveau |
|---|---|---|
| Fond de page | `#0a0e0a` | `#0b0f14` |
| Barre latérale / en-tête | `#0f140f` | `#111720` |
| Cartes | `#121a12` | `#161d27` |
| Bordures | `rgba(51,255,51,.12)` | `#222c39` |
| Accent | `#33ff33` | `#10b981` |
| Texte | `#e8ffe8` | `#e6ebf2` |

Les émojis du menu sont remplacés par des icônes vectorielles monochromes, qui
prennent la couleur du texte au lieu d'en imposer une.

## Installation de Tailwind

```
npm i -D tailwindcss @tailwindcss/vite
```

Tailwind v4 s'active par son plugin Vite : **ni `tailwind.config.js`, ni
`postcss.config.js`**. Le thème est déclaré en CSS dans `src/styles/admin.css`.

## ⚠️ Trois pièges rencontrés — à ne pas réintroduire

### 1. `@layer` annulait toutes les marges Tailwind

`src/styles/main.css` contient, en CSS **non-layered** :

```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
```

Une règle non-layered l'emporte sur **toute** règle placée dans un `@layer`,
quelle que soit sa spécificité. Tant que les utilitaires étaient dans
`@layer utilities`, ce reset les annulait un par un : `lg:pl-60` ne s'appliquait
pas — le contenu passait **sous** la barre latérale — et `px-4`, `mb-4`, ainsi
que le `padding` des primitives `.adm-*`, étaient morts.

**Correctif** : aucun `@layer` dans `admin.css`. Tout est importé sans couche,
et la spécificité normale s'applique : `.lg\:pl-60` (0,1,0) bat `*` (0,0,0).

> Ne jamais remettre `layer(utilities)` sur ces imports tant que `main.css`
> garde son reset universel.

### 2. Les boutons gardaient le style natif du navigateur

Sans preflight, un `<button>` conserve son fond gris clair et sa bordure en
relief. Les entrées de menu stylées uniquement en classes Tailwind
s'affichaient donc en **pastilles blanches** sur la barre sombre.

**Correctif** : un reset local, scopé au panneau et de spécificité nulle :

```css
:where(.adm-root) :where(button) { background: transparent; border: 0; … }
```

`:where()` vaut **zéro** en spécificité : le reset neutralise le style natif
mais perd contre n'importe quelle classe — y compris `.adm-input` et les
modules CSS des sections. Un `.adm-root input { … }` classique (0,1,1) aurait
au contraire écrasé `.adm-input` (0,1,0) et cassé tous les champs.

### 3. La palette du site clair rendait le texte invisible

Les sections utilisent encore les variables du site public, conçues pour un
fond **clair** :

| Variable | Valeur | Usages | Effet sur fond sombre |
|---|---|---|---|
| `--text` | `#171717` | 17 | Texte **invisible** |
| `--muted` | `#525252` | 53 | À peine lisible |
| `--border` | `#e7e5e4` | 10 | Filets blancs éblouissants |
| `--green` | `#15803d` | 17 | Contraste insuffisant |

**Correctif** : ces variables sont redéfinies **uniquement dans `.adm-root`**.
Le site public garde sa palette claire, et les 13 sections deviennent lisibles
sans qu'une seule de leurs lignes soit modifiée.

### Preflight volontairement désactivé

```css
@layer theme, base, components, utilities;
@import 'tailwindcss/theme.css'     layer(theme);
@import 'tailwindcss/utilities.css' layer(utilities);
```

Le reset de base de Tailwind neutralise les styles par défaut des titres,
listes, boutons et champs sur **toute** la page. Le site public repose sur 36
fichiers CSS écrits sans lui : l'activer casserait la boutique, le lecteur manga
et la page d'accueil.

En n'important que le thème et les utilitaires, Tailwind devient purement
additif. L'ordre des couches est déclaré explicitement pour que les utilitaires
l'emportent sur les modules CSS existants.

**Coût réel : +3,6 Ko gzip** au chargement initial (97,4 → 101,0 Ko), le panneau
d'administration étant dans un chunk chargé à la demande.

## Ce qui a été réécrit

### Entièrement en Tailwind

`src/pages/Admin/index.jsx` — la coquille : barre latérale, en-tête, mise en page.

- Navigation **groupée par domaine** (Commerce · Communauté · Contenu · Manga)
  au lieu d'une liste plate de 19 entrées
- L'écran actif est le **seul** élément coloré du menu, donc immédiatement repérable
- Vrai **tiroir mobile** avec voile, à la place de l'ancienne barre horizontale
  à défilement latéral
- En-tête collant avec le titre de l'écran courant

### Via la feuille partagée

Les 13 sections (Commandes, Produits, Coins, Manga, Fandom…) consomment toutes
les mêmes classes de `Admin.module.css` : `.card`, `.table`, `.btnPrimary`,
`.statCard`, `.filterBtn`, `.modalBox`…

**Réécrire cette feuille unique les restyle toutes d'un coup**, sans toucher à
leur logique. C'est ce qui a été fait :

- Les 36 valeurs néon en dur converties en émeraude, avec les opacités fortes
  divisées par deux
- Les 14 effets de halo neutralisés, seule l'ombre portée neutre est conservée
- Les dégradés verts de fond de page retirés

### Le pont de variables

⚠️ Point technique important : les sections lisent des variables `--ad-*` qui
étaient déclarées **sur la classe `.layout`** de l'ancienne coquille. Celle-ci
étant maintenant en Tailwind, ces variables seraient devenues indéfinies et
toutes les cartes auraient perdu leur fond.

Elles sont donc redéclarées dans `:root` au bas de `src/styles/admin.css`, avec
les nouvelles valeurs. Une seule déclaration alimente à la fois les utilitaires
Tailwind et les modules CSS existants.

## Primitives disponibles

Déclarées dans `@layer components` de `src/styles/admin.css`, utilisables
directement dans n'importe quelle section :

| Classe | Usage |
|---|---|
| `adm-card` | Conteneur de contenu |
| `adm-input` | Champ, zone de texte, menu déroulant |
| `adm-label` | Libellé de champ |
| `adm-btn` + `adm-btn-primary` / `-ghost` / `-danger` | Boutons |
| `adm-chip` | Badge de statut |
| `adm-table-wrap` + `adm-table` | Tableau qui défile dans sa propre boîte |

Couleurs Tailwind du thème : `ink-950` `ink-900` `ink-850` `ink-800` `ink-700`,
`line` `line-soft`, `fg` `fg-muted` `fg-faint`, `brand` `brand-hi` `brand-deep`,
`warn` `danger` `info` `violet`.

Exemple : `<div className="adm-card border-line text-fg-muted">`

## Migrer une section vers Tailwind

Les 13 sections ont déjà la nouvelle apparence via la feuille partagée. Les
convertir en classes Tailwind est un travail mécanique, à faire au fil de l'eau
plutôt qu'en un bloc :

```jsx
// Avant
<div className={styles.card}>
  <button className={styles.btnPrimary}>Valider</button>
</div>

// Après
<div className="adm-card">
  <button className="adm-btn adm-btn-primary">Valider</button>
</div>
```

Aucune urgence : le rendu est déjà unifié.
