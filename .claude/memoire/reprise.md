# Mémoire projet : état et reprise (maj 2026-10-04, en production)

Fichier versionné pour reprendre le travail sur n'importe quel PC. Chargé par `CLAUDE.md`. À tenir à jour en fin de session.

## Où on en est
- Socle posé et mergé (PR #22 `CLAUDE.md`/Makefile/skills/Mailpit, PR #23 flux de branches). `dev` est la branche par défaut, `main` la version stable.
- Décisions validées : voir `docs/PLAN.md` (jeu entre amis, base jetable, garde-fous légers, Drizzle + backend TS, dernières majeures, Vitest, TDD obligatoire, ordre : tests → dépendances → Drizzle+TS → garde-fous → ménage).
- **En production** depuis la v3.0.0 (2026-10-03) : https://skyjo.olivgames.fr (API https://api-skyjo.olivgames.fr). Phase 7 mergée (PR #31, release PR #32).
  - Livrer en prod : PR `dev → main` en **merge commit** (pas de squash), puis `make release VERSION=X.Y.Z` → `release.yml` (validation, images publiques `operdrix/skyjo-*`, webhooks Dokploy). Guide et secrets : `.github/README-CICD.md`.
  - Pièges vus au 1er déploiement : valeurs lues en `vars.*` créées par erreur en secrets (vides) ; webhook Dokploy à coller en URL complète (`curl: (6) Could not resolve host: ***` sinon).
  - Passage MySQL → MariaDB en local : `docker compose --env-file backend/.env --profile full down --remove-orphans`, `docker volume rm skyjo_mysql_data`, puis `make db-up` (service et volume renommés `db` / `skyjo_db_data`).
  - MariaDB refuse `LEFT JOIN LATERAL` : jamais d'API relationnelle Drizzle avec `with`.
- Phases 1 à 5 mergées (PR #24 à #28). **Phase 6 (ménage) terminée** sur `feat/menage` : le plan de remise en route est terminé.
  - Front : coups dans `src/game/moves.ts` (jamais de mutation de `game.gameData`), logique pure dans `src/game/`, routes paresseuses dans `main.tsx`.
  - Style : Prettier, `make format` ; `make lint` échoue si un fichier n'est pas formaté.
  - Auth : `backend/src/auth.ts` (Better Auth), routes `/api/auth/*` montées dans `app.ts`. Front : `frontend/src/lib/authClient.ts`, `UserContext` basé sur `authClient.useSession()`, garde `RequirePseudo`.
  - Tests : `createPlayer` inscrit via `/api/auth/sign-up/email` ; sockets avec `cookieHeader(player)`. Simuler un compte Google sans pseudo : `update users set username=null`.
  - Google testé de bout en bout le 2026-10-03 (prénom gardé, photo non stockée, email vérifié). Identifiants OAuth dans `backend/.env` local, à reporter dans Dokploy.
  - Tests des garde-fous : `backend/src/routes/games-auth.api.test.ts`, `backend/src/websockets/guards.api.test.ts`. Pour jouer un coup en test, passer d'abord la partie au tour du joueur en base (`currentPlayer`), sinon `play-move` est refusé.
  - Les tests d'API ont leur propre `BETTER_AUTH_SECRET` (`backend/vitest.config.ts`) ; le back refuse de démarrer sans.
  - Après un pull qui touche au schéma : `make db-reset` (base jetable). Le back applique les migrations au démarrage.
  - Dokploy : contexte de build `.` + Docker File `backend/Dockerfile` / `frontend/Dockerfile` (à régler au prochain déploiement).
  - Contrôleur parties : `loadGame` renvoie le format API (`players[].game_players`, `creatorPlayer`) ; les coups passent par `applyMove` (transaction + `FOR UPDATE`).
  - Node local ≥ 22.22 requis par react-router 8 (Docker/CI en Node 24).
  - Tests websocket : `backend/src/websockets/*.api.test.ts` (`socket.io-client` en devDependency du back, `app.listen({ port: 0 })`).
  - Règles pures : `backend/src/game/rules.js` (+ `rules.test.js`). `controllers/games.js` ne garde que l'accès base.
  - `backend/src/app.js` exporte `buildApp()` ; `server.js` = connexion, sync, listen.
  - Tests back : projets Vitest `unit` (sans base) et `api` (`*.api.test.js`, base `skyjo_test` créée par `test/global-setup.js` avec le compte root, **MySQL et Mailpit requis** : `make db-up`). Helpers dans `backend/test/helpers.js` (`createPlayer`, `findSensitiveFields`).
  - Front : Vitest 2 + Testing Library (`frontend/vitest.config.ts`), à monter avec Vite en phase 2.

## Reprendre sur un autre PC
1. `git checkout dev && git pull`, puis `make install && make dev` (Docker requis ; `make env` crée les `.env` depuis les `.env.example`).
2. Back http://localhost:3000 (Swagger `/api/documentation`), front http://localhost:5173, phpMyAdmin :8080, Mailpit :8025.
3. Les `.env` ne sont pas versionnés. Si un ancien projet Docker nommé `backend` existe : `docker compose -p backend down -v`.
4. Lire `docs/PLAN.md` puis ce fichier, et enchaîner sur la phase suivante en TDD (`/tdd`, `/verifie` avant livraison, `/branche` + `/livre`).

## Test complet à 2 joueurs dans Chrome (2026-10-03)
Validé : inscription email, connexion/déconnexion (mauvais mot de passe compris), salon public/privé, liste publique, invitation par lien, réglage du nombre de joueurs, lancement, révélation, tours, reconnexion en pleine manche, fin de manche, doublement du score, manche suivante, fin de partie (≥ 100), rejouer, historique et filtre par adversaire, suppression de partie, mot de passe oublié via Mailpit.
Bugs trouvés et corrigés (branche `fix/test-navigateur`) : CORS sans PATCH/DELETE (cause aussi du bug n°6), DELETE refusé (Content-Type JSON sans body), ErrorMessage qui plantait l'historique.

## Résultat du test manuel complet (2026-09-29, Chrome + bot Node)
Fonctionne : inscription, vérification par lien, connexion, création de partie, salle d'attente en temps réel, une manche à 2 joueurs jusqu'au modal de fin de manche, scores corrects (vérifiés à la main et en base).
Non testé : fin de partie (score ≥ 100), manche suivante, reconnexion, doublement du score du joueur qui termine sans avoir le plus bas.

## Bugs et failles
Corrigés en phase 1 (tests de non-régression) : fuite `password`/`email`/jetons dans les réponses de partie, mails via `SMTP_HOST` (Mailpit), partie corrompue par un départ pendant le démarrage (transaction + verrou dans `updateGame`), crash `PlayerSet` sans cartes, gagnant mal désigné quand un joueur a 0 point au total.
Restent :
1. (corrigé) `GET /api/users` n'expose plus l'email.
2. `PATCH /api/game/join/:id` renvoie la partie lue avant l'ajout du joueur (liste de joueurs périmée).
3. (corrigé) Plus de case de confidentialité : mention sous le formulaire.
4. (corrigé) Le front n'envoie plus `userId`.
5. (testé le 2026-10-03) Fin de partie, manche suivante, reconnexion : OK.
6. (corrigé) Retour dans la salle d'attente : la cause était le CORS qui bloquait le PATCH de `join`.
7. `restartGame` ajoute toujours le créateur à la nouvelle partie, même s'il n'a pas demandé à rejouer (comportement d'origine conservé).
8. Le contenu du `gameData` de `play-move` reste de confiance (choix assumé) : seuls l'appartenance et le tour sont vérifiés.

## Astuces de test manuel
- Comparer avant/après un changement visuel : `git worktree add <scratch>/old dev`, `npm ci`, Vite ancien sur :4173 et nouveau sur un autre port, avec `FRONTEND_HOST=http://localhost:5173,http://localhost:4173` pour le back. Les cookies `localhost` sont partagés entre ports : une connexion sert aux deux.
- Deux joueurs dans le même Chrome : joueur 1 sur `localhost:5173`, joueur 2 sur un 2e Vite `VITE_BACKEND_HOST=http://127.0.0.1:3000 VITE_BACKEND_WS=http://127.0.0.1:3000 npx vite --host 127.0.0.1 --port 5174`, back lancé avec `FRONTEND_HOST=http://localhost:5173,http://127.0.0.1:5174` (cookies séparés par hôte). Chrome in Chrome : sur `127.0.0.1`, les actions groupées (`browser_batch`) sont refusées, faire des appels unitaires.
- Alternative pour un 2e joueur : utiliser un script Node avec `socket.io-client` (dans `frontend/node_modules`) et le cookie de session `better-auth.session_token` obtenu via `POST /api/auth/sign-in/email` (`curl -c`, en-tête `Origin: http://localhost:5173`). Les coups à envoyer (`play-move`) sont ceux de `frontend/src/game/moves.ts`. Après `navigate` dans Chrome, le premier clic peut tomber avant le chargement de la page : recliquer.
- Événements socket : `player-joined-game`, `start-game`, `initial-turn-card {room, playerId, cardId}`, `play-move {room, gameData}`. Pendant `initialReveal`, `currentPlayer` vaut `null` : chaque joueur révèle 2 cartes sans attendre son tour.
- Tester l'image de prod en local : `make full` (front :8081, back :3000), puis `docker compose --env-file backend/.env --profile full rm -sf backend frontend` pour libérer :3000.
- Routes front : `/auth/register`, `/auth/login`, `/create`, `/join/:id` (salle d'attente), `/game/:id`.
- Dans un shell, ne pas faire `pkill -f nom` avec le nom visible dans la commande elle-même (le shell se tue). Utiliser `pkill -f "motif[x]"`.
- Ne jamais écrire de mots de passe de test dans le dépôt.
- `pkill -f "src/server[.]js"` tue aussi le back de `make dev` : pour un 2e serveur, utiliser `PORT=3001` et un motif distinct.
