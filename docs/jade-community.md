# Refonte jade et automatisations

L’accueil utilise la palette jade/sauge/ivoire de `src/styles/jade.css`. La découverte affiche les séries en cours et à venir, indépendamment de leur mois de lancement, avec recherche, filtres, pagination et fiches accessibles au clavier. Les animations respectent la préférence de mouvement réduit.

## Mise en service

Déployer le frontend et le backend ensemble. Au démarrage normal, le mécanisme Sequelize existant ajoute à `animes` les colonnes `malId`, `themes` (JSONB), `themesSyncedAt` et `themesAttemptedAt`. Aucun reset ni nouveau secret n’est nécessaire. Le serveur doit rester actif pour exécuter les tâches planifiées : un hébergement mis en veille ne garantit pas leurs horaires.

- `ANIME_SYNC_ENABLED=true` : import AniList existant à 04h et toutes les six heures, désormais enrichi avec l’identifiant MyAnimeList et les personnages.
- `FANDOM_BOT_ENABLED=true` : création idempotente de questions sur les studios connus du catalogue. Il faut au moins quatre studios distincts. Les questions existantes, modifiées ou désactivées par l’admin restent intactes. La sélection « saison » utilise la catégorie `saison`. Les suggestions d’activités sont calculées à la lecture et changent le lundi à 00h UTC ; elles ne publient pas de cosplays et ne simulent aucun vote.
- `ANIME_THEMES_ENABLED=true` : import des titres d’openings et d’endings via Jikan, après la synchronisation anime, au démarrage et à la minute 20 toutes les six heures. Chaque passage traite au plus 20 fiches ; les fiches déjà traitées attendent sept jours. La première mise à niveau complète peut donc prendre plusieurs passages.
- `CRON_TZ=Africa/Douala` : fuseau des tâches cron, conservé du projet.

Les fiches manuelles ou verrouillées sont exclues de l’import musical. Une erreur réseau conserve le dernier catalogue. Les appels ont un délai maximal et sont espacés de 1,1 seconde ; un HTTP 429 arrête le lot. Les titres sont des métadonnées, avec des liens de **recherche vidéo YouTube** : ce n’est pas un service de streaming automatique et aucune URL audio non fournie par la source n’est inventée. La musique locale reste facultative, déclenchée uniquement au clic.

Les tentatives sont horodatées séparément des réussites : une fiche en échec ne bloque pas les suivantes. Le bouton de synchronisation Anime de l’administration lance l’enrichissement communautaire en arrière-plan. Les paramètres de texte et d’image du hero restent pris en compte.

Les portraits des citations sont obtenus par identifiant AniList, avec cache serveur de 24h et repli sur les initiales. Le portrait et la citation changent ensemble. La bulle démarre repliée, propose une autre citation et peut être masquée pour la session.

## Vérification

`npm.cmd run build` et `npm.cmd test` à la racine ; `npm.cmd test` dans `server`. Les tests du bot couvrent les réponses dérivées des studios, les identifiants stables, les changements de semaine, le traitement des OP/ED et la validation des soumissions. Pour une vérification intégrée, lancer le backend avec une base de développement, déclencher la synchronisation dans l’administration Anime puis consulter `/api/anime/themes`, `/api/fandom/activities` et le quiz « saison ». Ne pas lancer le serveur local avec les identifiants de la base de production pour un simple aperçu.

Sources des intégrations : [AniList Media](https://docs.anilist.co/reference/object/media), [AniList Query](https://docs.anilist.co/reference/query), [Jikan API v4](https://docs.api.jikan.moe/).

La vérification navigateur reproductible est dans `scripts/verify-jade.cjs` (Playwright + Edge). Elle intercepte toutes les requêtes `/api/`, vérifie les vues 1440px et 390px, les filtres, les dialogues, le changement de personnage, le quiz et la reprise après erreur. Elle écrit les captures dans `.preview.local/`, ignoré par Git. Les appels réels AniList ont confirmé les trois portraits ; les appels réels Jikan renvoyaient HTTP 504 lors de la vérification. Le fonctionnement avec une base PostgreSQL et le premier import musical doivent être vérifiés au déploiement, avec la source Jikan disponible.
