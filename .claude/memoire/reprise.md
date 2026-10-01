# Mémoire projet : état et reprise (maj 2026-10-01, fin phase 1)

Fichier versionné pour reprendre le travail sur n'importe quel PC. Chargé par `CLAUDE.md`. À tenir à jour en fin de session.

## Où on en est
- Socle posé et mergé (PR #22 `CLAUDE.md`/Makefile/skills/Mailpit, PR #23 flux de branches). `dev` est la branche par défaut, `main` la version stable.
- Décisions validées : voir `docs/PLAN.md` (jeu entre amis, base jetable, garde-fous légers, Drizzle + backend TS, dernières majeures, Vitest, TDD obligatoire, ordre : tests → dépendances → Drizzle+TS → garde-fous → ménage).
- **Phase 1 terminée** sur `feat/tests-base` (PR vers `dev` à ouvrir si pas encore fait). Prochaine : phase 2 (dépendances).
  - Règles pures : `backend/src/game/rules.js` (+ `rules.test.js`). `controllers/games.js` ne garde que l'accès base.
  - `backend/src/app.js` exporte `buildApp()` ; `server.js` = connexion, sync, listen.
  - Tests back : projets Vitest `unit` (sans base) et `api` (`*.api.test.js`, base `skyjo_test` créée par `test/global-setup.js` avec le compte root, **MySQL et Mailpit requis** : `make db-up`). Helpers dans `backend/test/helpers.js` (`createPlayer`, `findSensitiveFields`).
  - Front : Vitest 2 + Testing Library (`frontend/vitest.config.ts`), à monter avec Vite en phase 2.

## Reprendre sur un autre PC
1. `git checkout dev && git pull`, puis `make install && make dev` (Docker requis ; `make env` crée les `.env` depuis les `.env.example`).
2. Back http://localhost:3000 (Swagger `/api/documentation`), front http://localhost:5173, phpMyAdmin :8080, Mailpit :8025.
3. Les `.env` ne sont pas versionnés. Si un ancien projet Docker nommé `backend` existe : `docker compose -p backend down -v`.
4. Lire `docs/PLAN.md` puis ce fichier, et enchaîner sur la phase suivante en TDD (`/tdd`, `/verifie` avant livraison, `/branche` + `/livre`).

## Résultat du test manuel complet (2026-09-29, Chrome + bot Node)
Fonctionne : inscription, vérification par lien, connexion, création de partie, salle d'attente en temps réel, une manche à 2 joueurs jusqu'au modal de fin de manche, scores corrects (vérifiés à la main et en base).
Non testé : fin de partie (score ≥ 100), manche suivante, reconnexion, doublement du score du joueur qui termine sans avoir le plus bas.

## Bugs et failles
Corrigés en phase 1 (tests de non-régression) : fuite `password`/`email`/jetons dans les réponses de partie, mails via `SMTP_HOST` (Mailpit), partie corrompue par un départ pendant le démarrage (transaction + verrou dans `updateGame`), crash `PlayerSet` sans cartes, gagnant mal désigné quand un joueur a 0 point au total.
Restent :
1. `GET /api/users` renvoie l'email de tous les comptes à tout utilisateur connecté.
2. `PATCH /api/game/join/:id` renvoie la partie lue avant l'ajout du joueur (liste de joueurs périmée).
3. Formulaire d'inscription : bouton grisé tant que la case confidentialité (état React) n'est pas cliquée ; remplissage DOM programmatique insuffisant pour tester.
4. Phase 4 : `gameData` client de confiance (`play-move`), `userId` pris dans le body, secrets par défaut codés en dur, blacklist en tableau qui grossit. Phase 3 : `sync({alter:true})`.
5. Non testé à la main : fin de partie (≥ 100), manche suivante, reconnexion.

## Astuces de test manuel
- Un navigateur partage ses cookies : pour un 2e joueur, utiliser un script Node avec `socket.io-client` (dans `frontend/node_modules`) et les cookies `accessToken`/`refreshToken` obtenus via `POST /api/login` (`curl -c`). Le protocole du client React est dans `frontend/src/components/game/PlayerSet.tsx`, `Deck.tsx`, `Discard.tsx`.
- Événements socket : `player-joined-game`, `start-game`, `initial-turn-card {room, playerId, cardId}`, `play-move {room, gameData}`. Pendant `initialReveal`, `currentPlayer` vaut `null` : chaque joueur révèle 2 cartes sans attendre son tour.
- Vérifier un compte sans passer par le mail : `docker exec skyjo-mysql-dev mysql -uolivier -polivier skyjo -e "update users set verified=1 where username='…'"`.
- Routes front : `/auth/register`, `/auth/login`, `/create`, `/join/:id` (salle d'attente), `/game/:id`.
- Dans un shell, ne pas faire `pkill -f nom` avec le nom visible dans la commande elle-même (le shell se tue). Utiliser `pkill -f "motif[x]"`.
- Ne jamais écrire de mots de passe de test dans le dépôt.
- `pkill -f "src/server[.]js"` tue aussi le back de `make dev` : pour un 2e serveur, utiliser `PORT=3001` et un motif distinct.
