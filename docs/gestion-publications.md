# Gestion jade : publications, événements et mangas

## Accès rapides

- `/admin?section=blog` : journal, annonces d’événements, partenaires et promotion.
- `/admin?section=events` : événements, inscriptions, liste d’attente et validation des paiements.
- `/manga/publisher` : studio éditeur, séries et chapitres.
- `/panier` : panier public, connexion nécessaire pour commander.
- `/profil?tab=orders`, `?tab=tickets`, `?tab=wishlist`, `?tab=profil` : commandes, billets, favoris, coordonnées.
- `/evenements?event=<id>` et `/blog?article=<id>` : liens partageables vers un détail.

## Publier un événement au Cameroun

Créer d’abord la rencontre dans **Événements** : affiche, date, heures du Cameroun, ville, lieu précis, capacité et prix par personne. Un nouvel événement commence en brouillon. Passer son état à **À venir** pour l’afficher dans l’agenda et sur l’accueil.

Une annonce plus longue peut être rédigée dans **Blog & actualités**, catégorie **Annonce événement**, avec un lien vers `/evenements?event=<id>`. Le journal demande une date et une ville avant publication. Il ne crée pas de réservation : l’agenda centralise les places et billets.

Les articles commencent en brouillon. Cocher **Rendre public**, puis choisir éventuellement une date future. Une date future reste masquée jusqu’à l’échéance, sans tâche planifiée supplémentaire. Les dates/heures de programmation utilisent le fuseau du navigateur de l’administrateur, affiché par son champ de date local.

L’inscription compte toutes les places du groupe, organisateur compris. Un groupe dépassant la capacité restante rejoint la liste d’attente. L’administration peut lui **Attribuer les places** lorsqu’elles sont disponibles. Un événement gratuit émet un billet confirmé ; un événement payant attend la validation manuelle du paiement. Annuler conserve l’historique et libère les places une seule fois. Le remboursement Mobile Money reste une opération de l’équipe.

## Mangas gratuits, freemium et premium

1. Créer la série et attendre son approbation dans l’administration.
2. Ajouter les images du chapitre. Les nouveaux fichiers sont triés naturellement par nom (`page2` avant `page10`) ; vérifier et ajuster l’ordre.
3. Choisir **Gratuit** ou **Premium**, puis le tarif de 1 à 10 000 coins pour un chapitre premium.
4. Enregistrer en brouillon ou publier. **Gérer les chapitres** permet de modifier les pages, le titre, l’accès et la visibilité.

Pour une offre freemium, laisser certains chapitres gratuits et rendre les autres premium. Le droit de lecture est déterminé par le chapitre : une série étiquetée gratuite ne contourne plus l’accès premium. Le classement de la série est recalculé lors de l’ajout, de la modification ou de la suppression de chapitres. Une série avec un chapitre premium publié est classée Premium.

L’auteur et les administrateurs peuvent lire leurs chapitres. Les lecteurs accèdent à un chapitre premium par un achat en coins ou un abonnement actif. Les brouillons et les séries non approuvées restent inaccessibles aux lecteurs. Un achat ne contourne pas une suspension ou un retrait ultérieur. Les réponses refusées ne contiennent aucune page premium.

## Images et connexions mobiles

- Formats : JPG, PNG, WebP et GIF. Les SVG téléversés sont refusés.
- Composant partagé : jusqu’à 20 Mo avant optimisation, 5 Mo après optimisation pour les couvertures et affiches. Les GIF restent animés et doivent respecter la limite sans conversion.
- Pages de chapitre : 10 Mo maximum par page après optimisation, 40 Mo et 200 pages maximum par chapitre. Le serveur autorise des requêtes JSON jusqu’à 60 Mo ; le proxy d’hébergement doit accepter cette taille également.
- Réduction des dimensions et conversion WebP lorsque cela réduit le poids ; largeur des pages conservée jusqu’à 1 800 px. Vérifier la lisibilité des petits textes avant publication et garder les originaux.
- Les liens locaux et les images servies par l’API sont résolus séparément. Une image inaccessible est remplacée par une illustration de secours.
- Les URL d’images stockées portent une version pour éviter qu’une ancienne affiche reste dans le cache après remplacement. L’image d’accueil est servie séparément du JSON.
- Les envois volumineux disposent de deux minutes pour recevoir une réponse. Les écritures ne sont pas répétées automatiquement après une coupure réseau.

Le stockage existant en base64 dans PostgreSQL est conservé. Pour un catalogue beaucoup plus volumineux, un stockage d’objets avec CDN et des envois séparés par page restent une évolution à prévoir ; cette livraison n’intègre pas de nouveau service d’hébergement.

## Panier et compte

Les images, prix et stocks connus sont conservés dans le panier local. À la validation, une requête actualise les prix et disponibilités. Le serveur recalcule les montants et rejette un prix changé après cette vérification. Stock et commande sont enregistrés dans une transaction ; un article indisponible fait échouer le panier entier. Un identifiant de commande permet de retrouver la même commande après une nouvelle tentative.

Les favoris des visiteurs sont transférés au compte lors du chargement de la boutique ou des favoris après connexion. Les coordonnées WhatsApp et quartier sont maintenant persistées avec le profil.

## Mise en service et vérifications

Déployer le backend et le frontend ensemble. Le schéma ajoute `orders.checkoutKey` et les champs `publishedAt`, `eventDate`, `eventCity`, `eventVenue`, `eventUrl`, `eventPrice` aux articles. Le projet utilise déjà `syncDatabase(false)` au démarrage pour synchroniser les modèles. Le fichier SQL fourni est une alternative additive explicite pour ces nouveaux champs ; il n’a pas été exécuté sur la base de production.

- `npm test` : utilitaires du frontend.
- `cd server` puis `npm test` : règles, services et routes HTTP isolées de PostgreSQL.
- `npm run build` : compilation de production.
- `node scripts/verify-management.cjs <chemin-vers-playwright>` avec Vite sur `127.0.0.1:5173` et Microsoft Edge : 18 rubriques admin, image valide/corrompue, brouillon/publication, inscription, commande, chapitre, lecture/déblocage et affichage mobile. Toutes les API y sont simulées.

Les tests ne déclenchent aucun paiement réel, email réel ni écriture dans la base hébergée. La concurrence transactionnelle sur PostgreSQL réel et la configuration du proxy d’hébergement doivent être vérifiées sur une base de préproduction lors du déploiement.

Vérification locale du 2 octobre 2026 : **85 tests serveur et 15 tests frontend réussis**, compilation de production réussie. Les deux scripts navigateur `verify-management.cjs` et `verify-jade.cjs` passent : 18 rubriques admin sur ordinateur et mobile, publication, images, réservation, panier, connexion sur place, chapitre premium, accueil et quiz. Les contrôles de routes et de services utilisent des données simulées ; ils ne remplacent pas une recette sur PostgreSQL et Mobile Money réels. Vite conserve un avertissement de taille sur le module admin, qui inclut les graphiques.
