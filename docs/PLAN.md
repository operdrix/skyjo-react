# Plan : remise en route de Skyjo

## Contexte
Vieux projet de cours (Fastify + Sequelize v7 alpha + Socket.io / React 18 + Vite), fonctionnel mais mal structuré, sans test, avec ~64 vulnérabilités `npm audit` côté backend (1 critique) et 27 côté front. Usage visé : **jeu entre amis / famille**. L'appli est arrêtée et la **base est jetable** (pas de compat descendante).

## Décisions validées
- Anti-triche : **garde-fous légers**, pas de serveur autoritaire complet. Le client continue d'envoyer `gameData`.
- ORM : **Drizzle** (MySQL conservé), schéma neuf + migrations drizzle-kit à la place de `sync({alter:true})`.
- Backend migré en **TypeScript** en même temps.
- Dépendances : **dernières majeures** partout (React 19, Vite 7, Tailwind 4, DaisyUI 5, react-router 7, ESLint 10, fastify plugins, nodemailer, nanoid…).
- Tests : **Vitest** (règles du jeu + quelques tests d'API Fastify), sans Playwright.
- Mails : **Mailpit** en dev et recette (service docker-compose local, service dédié dans Dokploy pour la recette), Gmail uniquement en production. `createTransporter` (`controllers/users.js:13`, aujourd'hui Gmail en dur) choisira le transport via `SMTP_HOST`/`SMTP_PORT`.
- Une branche/PR par phase (`/branche`, `/livre`), chaque phase livrable seule.

## Phase 0 : socle projet (avant tout code)
Branche `feat/socle-projet`. Aucun changement de code applicatif.
- `CLAUDE.md` à la racine : stack, commandes (`make …`), conventions (français, commits conventionnels, style), règle **TDD obligatoire**, décisions ci-dessus, pièges connus (état client de confiance, sync alter à supprimer).
- `docs/PLAN.md` : ce plan (phases, décisions, vérification), tenu à jour au fil des phases.
- `.claude/` (versionné) :
  - `settings.json` : permissions utiles (npm, make, docker compose, git en lecture).
  - `skills/tdd/SKILL.md` : cycle rouge → vert → refactor imposé. Test qui échoue d'abord, code minimal, refactor ; interdit d'écrire du code de production sans test rouge préalable. Vitest, `make test`.
  - `skills/verifie/SKILL.md` : porte de sortie avant commit/PR, lance `make check` (lint + tests + build back et front) et rapporte les échecs.
  - `skills/demarre/SKILL.md` : lance/relance la pile locale (`make dev`), vérifie MySQL puis back (:3000) et front (:5173).
  - Les skills existants `/branche` et `/livre` restent le circuit de livraison.
- `Makefile` à la racine : `install`, `db-up` / `db-down` (`docker-compose.yml` racine, projet `skyjo` : MySQL, phpMyAdmin, Mailpit (Redis retiré en phase 5) ; profil `full` avec back et front en images, `make full`), `env` (copie les `.env.example` s'ils manquent), `dev` (db + back + front), `back`, `front`, `test`, `lint`, `build`, `check` (lint + test + build), `clean`.

## Phases
TDD obligatoire à partir de la phase 1 : chaque comportement est d'abord couvert par un test rouge.

1. **Filet de sécurité** (branche `feat/tests-base`) : **fait**
   - Lancer l'infra via `make db-up` (`docker-compose.yml`), démarrer back et front, jouer une partie à la main pour valider l'état initial.
   - Extraire de `backend/src/controllers/games.js` (`checkGame`, `saveScore`, `checkMaximumScore`, `dealCards`) un module de règles pur, sans accès base.
   - Tests Vitest sur ces règles et 2-3 tests d'API (register/login, création et join de partie).
   - Test rouge prioritaire : aucune réponse de route de partie ne doit contenir `password`, `email` ni tokens (fuite constatée sur `PATCH /api/game/join/:id`).
   - Test rouge : une déconnexion pendant l'attente ne doit pas corrompre une partie qui démarre (voir `.claude/memoire/reprise.md`).
   - En TDD : transport mail piloté par `SMTP_HOST` (test rouge d'abord), puis vérifier l'inscription bout en bout via l'API Mailpit (`GET :8025/api/v1/messages`).
2. **Dépendances** (branche `feat/dependances`) : **fait**
   - Back : fastify 5.12 et plugins à jour, `fastify-bcrypt` → `bcryptjs`, `fastify-socket.io` → socket.io branché sur `app.server`, mjml 5 (rendu asynchrone), `Op` depuis `@sequelize/core`, 0 vulnérabilité.
   - Front : React 19, react-router 8 (`react-router` + `react-router/dom`), Vite 8, Tailwind 4 (`@tailwindcss/vite`, config en CSS), DaisyUI 5 (thèmes ajustés pour garder le rendu v4), ESLint 10, vitest 5, 0 vulnérabilité.
   - TypeScript reste en 6.0 : `typescript-eslint` ne supporte pas encore TS 7.
   - Node 24 dans les Dockerfiles et la CI (react-router 8 exige Node ≥ 22.22).
   - Vérification visuelle ancien/nouveau front côte à côte : accueil, inscription, salle d'attente, partie, dashboard, thèmes clair et sombre.
3. **Drizzle + TypeScript** (branche `feat/drizzle-ts`) : **fait**
   - Tests de caractérisation écrits sur Sequelize avant la réécriture (forme des réponses, cycle de vie, déroulé websocket), restés verts après.
   - Schéma Drizzle `users`, `games`, `game_players` (colonnes JSON typées), migration initiale `backend/drizzle/0000_init.sql` appliquée au démarrage ; `sync({alter:true})` supprimé. `make db-reset` (base jetable) et `make db-generate`.
   - Backend entièrement en TypeScript. Pas d'émission JS : Node 24 exécute le `.ts` (type stripping), `tsx watch` en dev, `tsc` en typecheck (`npm run build`, build Docker).
   - Types partagés dans `shared/types.ts` (back et front) ; contextes Docker passés à la racine du dépôt (compose et Dokploy).
   - Correctifs : `bestScore`, id texte sur `/api/users/:id`, `/api/verify/:token` sans hash ni jeton, deux révélations initiales simultanées ne s'écrasent plus (lecture sous verrou).
4. **Garde-fous d'autorisation** (branche `feat/garde-fous`) : **fait**
   - `userId` pris dans le JWT (`request.user`) : un `userId` envoyé dans le body de `POST/PATCH /api/game` est ignoré. `start`/`finish` et `PATCH /api/game/:id` (paramètres) réservés au créateur (403).
   - Websockets : `play-move` accepté seulement d'un membre dont c'est le tour (`currentPlayer` lu en base, sous verrou) ; `initial-turn-card` ne révèle que les cartes de l'émetteur ; `player-play-again` ajoute l'émetteur s'il est membre (la liste du client est ignorée) ; `start-game`, `update-game-params`, `restart-game` réservés au créateur. Refus : événement `error` à l'émetteur.
   - Correctif : le front émettait `play-again` au lieu de `player-play-again` (rejouer ne marchait pas).
   - `buildApp()` refuse de démarrer sans `JWT_SECRET`/`COOKIE_SECRET`. Une seule blacklist (`redis.ts` : Redis, repli en mémoire avec expiration, y compris si Redis échoue).
5. **Inscription rapide** (branche `feat/inscription-rapide`) : **fait**
   - But : jouer le plus vite possible, données personnelles minimales (pseudo + email, plus de nom/prénom ni de vérification d'email).
   - Better Auth remplace le système maison (JWT, refresh, blacklist, bcrypt, Redis) : sessions en base (`sessions`, `accounts`, `verifications`), cookie httpOnly, `BETTER_AUTH_SECRET` obligatoire.
   - Connexion Google en premier (« Continuer avec Google »), email + mot de passe en option. Nouveau joueur Google : écran de pseudo pré-rempli avec son prénom. Compte email existant avec la même adresse : relié automatiquement. Photo Google non conservée.
   - Pseudo obligatoire (3 à 30 caractères, accents autorisés, unique sans tenir compte de la casse). Tant qu'il manque : 403 sur l'API de jeu, socket refusé, redirection front vers `/auth/pseudo`.
   - Mot de passe oublié conservé (mail via Mailpit / Gmail). Emails plus jamais exposés par `/api/users`.
   - Migration initiale régénérée (base jetable) : `make db-reset` après pull.
   - Google à configurer : `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` (voir `backend/.env.example`) ; sans eux le bouton affiche un message et l'email reste disponible.
6. **Ménage** : corriger les avertissements React Compiler (`react-hooks/immutability` : mutations directes de `game.gameData` dans `Deck`, `Discard`, `PlayerSet` ; `react-hooks/set-state-in-effect`) puis les repasser en erreur, découper le bundle (> 500 kB), retirer les `console.log`, unifier le style (indentation, Prettier), découper `Game.tsx`, `WaitingRoom.tsx`, `Dashboard.tsx`, README racine + `CLAUDE.md`, CI stricte (lint, build, tests bloquants), CORS sans `localhost:4173` en dur.

## Vérification
- Chaque phase : `npm run lint`, `npm test`, `npm run build` (front et back) verts.
- Manuel : docker-compose MySQL, inscription, création de partie, 2 navigateurs (un privé) qui jouent une manche complète jusqu'au score.
- Phase 4 : test d'API montrant qu'un joueur ne peut pas jouer hors de son tour ni agir avec le `userId` d'un autre.

## Points de vigilance
- La montée majeure de Tailwind 4/DaisyUI 5 est le risque visuel principal (pas de test E2E).
- `@fastify/jwt`, `fastify-socket.io` et `fastify-bcrypt` : vérifier la compatibilité avec fastify 5 récent, remplacer si abandonnés.
