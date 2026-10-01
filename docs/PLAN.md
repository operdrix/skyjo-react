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
- `Makefile` à la racine : `install`, `db-up` / `db-down` (`docker-compose.yml` racine, projet `skyjo` : MySQL, Redis, phpMyAdmin, Mailpit ; profil `full` avec back et front en images, `make full`), `env` (copie les `.env.example` s'ils manquent), `dev` (db + back + front), `back`, `front`, `test`, `lint`, `build`, `check` (lint + test + build), `clean`.

## Phases
TDD obligatoire à partir de la phase 1 : chaque comportement est d'abord couvert par un test rouge.

1. **Filet de sécurité** (branche `feat/tests-base`) : **fait**
   - Lancer l'infra via `make db-up` (`docker-compose.yml`), démarrer back et front, jouer une partie à la main pour valider l'état initial.
   - Extraire de `backend/src/controllers/games.js` (`checkGame`, `saveScore`, `checkMaximumScore`, `dealCards`) un module de règles pur, sans accès base.
   - Tests Vitest sur ces règles et 2-3 tests d'API (register/login, création et join de partie).
   - Test rouge prioritaire : aucune réponse de route de partie ne doit contenir `password`, `email` ni tokens (fuite constatée sur `PATCH /api/game/join/:id`).
   - Test rouge : une déconnexion pendant l'attente ne doit pas corrompre une partie qui démarre (voir `.claude/memoire/reprise.md`).
   - En TDD : transport mail piloté par `SMTP_HOST` (test rouge d'abord), puis vérifier l'inscription bout en bout via l'API Mailpit (`GET :8025/api/v1/messages`).
2. **Dépendances** : tout monter à la dernière majeure, backend puis frontend. Remplacer l'import `Op` de `sequelize` v6 (`controllers/users.js:5`) le temps de la transition. Le front doit repasser `tsc -b`, le build et le lint. Tailwind 4/DaisyUI 5 : vérifier visuellement les pages.
3. **Drizzle + TypeScript** : schéma `users`, `games`, `game_players` (colonnes JSON typées avec `GameData`), migration initiale, réécriture des contrôleurs, `bdd.ts`, conversion des fichiers `.js`. Corriger le typo `bestScrore`. Retirer `sequelize`, `@sequelize/*`. Dockerfile : étape de build TS. Types `GameData`/`GameType` à partager avec le front.
4. **Garde-fous d'autorisation**
   - `userId` pris dans le JWT (`request.user`) et non dans le body de `POST/PATCH /api/game`.
   - Sur `play-move` (`websockets.js:273`) : l'émetteur est membre de la partie et `currentPlayer` est bien lui ; idem pour `player-play-again`, `start-game`, `update-game-params` (créateur seulement).
   - Secrets sans valeur par défaut codée en dur ; une seule blacklist de tokens (Redis, sinon Map avec expiration) à la place du tableau qui grossit.
5. **Ménage** : retirer les `console.log`, unifier le style (indentation, Prettier), découper `Game.tsx`, `WaitingRoom.tsx`, `Dashboard.tsx`, README racine + `CLAUDE.md`, CI stricte (lint, build, tests bloquants), CORS sans `localhost:4173` en dur.

## Vérification
- Chaque phase : `npm run lint`, `npm test`, `npm run build` (front et back) verts.
- Manuel : docker-compose MySQL, inscription, création de partie, 2 navigateurs (un privé) qui jouent une manche complète jusqu'au score.
- Phase 4 : test d'API montrant qu'un joueur ne peut pas jouer hors de son tour ni agir avec le `userId` d'un autre.

## Points de vigilance
- La montée majeure de Tailwind 4/DaisyUI 5 est le risque visuel principal (pas de test E2E).
- `@fastify/jwt`, `fastify-socket.io` et `fastify-bcrypt` : vérifier la compatibilité avec fastify 5 récent, remplacer si abandonnés.
