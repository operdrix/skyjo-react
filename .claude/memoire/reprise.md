# Mémoire projet : état et reprise (maj 2026-10-01)

Fichier versionné pour reprendre le travail sur n'importe quel PC. Chargé par `CLAUDE.md`. À tenir à jour en fin de session.

## Où on en est
- Socle posé et mergé (PR #22 `CLAUDE.md`/Makefile/skills/Mailpit, PR #23 flux de branches). `dev` est la branche par défaut, `main` la version stable.
- Décisions validées : voir `docs/PLAN.md` (jeu entre amis, base jetable, garde-fous légers, Drizzle + backend TS, dernières majeures, Vitest, TDD obligatoire, ordre : tests → dépendances → Drizzle+TS → garde-fous → ménage).
- **Phase 1 en cours** : la validation manuelle de l'appli est faite (voir ci-dessous). Reste : Vitest côté backend, module de règles pur extrait de `controllers/games.js`, tests d'API. Aucune branche `feat/tests-base` poussée à ce jour : la recréer depuis `dev` avec `/branche feat/tests-base`.

## Reprendre sur un autre PC
1. `git checkout dev && git pull`, puis `make install && make dev` (Docker requis ; `make env` crée les `.env` depuis les `.env.example`).
2. Back http://localhost:3000 (Swagger `/api/documentation`), front http://localhost:5173, phpMyAdmin :8080, Mailpit :8025.
3. Les `.env` ne sont pas versionnés. Si un ancien projet Docker nommé `backend` existe : `docker compose -p backend down -v`.
4. Lire `docs/PLAN.md` puis ce fichier, et enchaîner sur la phase 1 en TDD (`/tdd`, `/verifie` avant livraison, `/branche` + `/livre`).

## Résultat du test manuel complet (2026-09-29, Chrome + bot Node)
Fonctionne : inscription, vérification par lien, connexion, création de partie, salle d'attente en temps réel, une manche à 2 joueurs jusqu'au modal de fin de manche, scores corrects (vérifiés à la main et en base).
Non testé : fin de partie (score ≥ 100), manche suivante, reconnexion, doublement du score du joueur qui termine sans avoir le plus bas.

## Bugs et failles trouvés (à couvrir par des tests rouges, dans cet ordre)
1. **Fuite de données (grave)** : `PATCH /api/game/join/:id` renvoie les joueurs avec `password` (hash), `email`, `verifiedtoken`, `resetPasswordToken`. Probablement vrai pour d'autres routes de partie (`GET /api/game/:id`, `PATCH`, événements socket qui émettent l'objet `game`). `getGame`/`updateGame` incluent le modèle User complet sans restreindre les attributs. Correctif : `attributes: ["id","username"]` partout et test « aucun champ sensible dans les réponses ».
2. **Mails** : `createTransporter` (`controllers/users.js:13`) est en dur sur Gmail, échoue (`535`) en dev. Doit lire `SMTP_HOST`/`SMTP_PORT` (Mailpit). Vérifier ensuite via `GET :8025/api/v1/messages`.
3. **Partie corrompue** : un joueur qui se déconnecte pendant l'attente est retiré (`removePlayer` dans `updateGame` action `leave`, état `pending`) même si `start-game` vient de distribuer les cartes. Résultat : `playersCards` contient un joueur absent de `players`, et le front plante (`PlayerSet.tsx:28`, `playersCards[playerId]` indéfini). Correctifs : démarrer la partie de façon atomique côté serveur, ne pas retirer un joueur d'une partie qui passe en `playing`, et rendre `PlayerSet` tolérant.
4. **Formulaire d'inscription** : le bouton reste grisé tant que la case de confidentialité (état React `acceptedPrivacy`) n'est pas cliquée ; un remplissage programmatique du DOM ne suffit pas. Mineur, mais à connaître pour tout test navigateur.
5. Déjà connus : le serveur fait confiance au `gameData` client (`play-move`), `userId` pris dans le body au lieu du JWT, `sync({alter:true})`, secrets par défaut codés en dur, blacklist de tokens en tableau qui grossit.

## Astuces de test manuel
- Un navigateur partage ses cookies : pour un 2e joueur, utiliser un script Node avec `socket.io-client` (dans `frontend/node_modules`) et les cookies `accessToken`/`refreshToken` obtenus via `POST /api/login` (`curl -c`). Le protocole du client React est dans `frontend/src/components/game/PlayerSet.tsx`, `Deck.tsx`, `Discard.tsx`.
- Événements socket : `player-joined-game`, `start-game`, `initial-turn-card {room, playerId, cardId}`, `play-move {room, gameData}`. Pendant `initialReveal`, `currentPlayer` vaut `null` : chaque joueur révèle 2 cartes sans attendre son tour.
- Vérifier un compte sans mail (tant que le point 2 n'est pas corrigé) : `docker exec skyjo-mysql-dev mysql -uolivier -polivier skyjo -e "update users set verified=1 where username='…'"`.
- Routes front : `/auth/register`, `/auth/login`, `/create`, `/join/:id` (salle d'attente), `/game/:id`.
- Dans un shell, ne pas faire `pkill -f nom` avec le nom visible dans la commande elle-même (le shell se tue). Utiliser `pkill -f "motif[x]"`.
- Ne jamais écrire de mots de passe de test dans le dépôt.
