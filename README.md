# Skyjo d'Olivier

Le jeu de cartes Skyjo en ligne, pour jouer entre amis ou en famille : on crée une partie, on partage le lien, et on joue en temps réel de 2 à 4 joueurs.

Connexion en un clic avec Google, ou par email et mot de passe. On ne conserve que le pseudo et l'email.

## Démarrer en local

Prérequis : Docker et Node.js 24 (au minimum 22.22).

```sh
make install   # dépendances back et front
make dev       # crée les .env manquants, lance MySQL, Mailpit, le back (:3000) et le front (:5173)
```

| Service | Adresse |
| --- | --- |
| Front | http://localhost:5173 |
| API et documentation Swagger | http://localhost:3000/api/documentation |
| Mailpit (mails de dev) | http://localhost:8025 |
| phpMyAdmin | http://localhost:8080 |

La connexion Google demande `GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET` dans `backend/.env` (voir `backend/.env.example`). Sans eux, l'inscription par email fonctionne normalement.

## Commandes

Tout passe par `make` (`make help` pour la liste) :

- `make check` : lint (ESLint + Prettier), tests et build du back et du front. À lancer avant chaque commit.
- `make test`, `make lint`, `make build`, `make format`
- `make db-reset` : vide la base de dev et applique les migrations ; `make db-generate` : crée une migration après une modification de `backend/src/db/schema.ts`
- `make full` : tout en images Docker (front sur :8081)

Les tests d'API du back ont besoin de MySQL et Mailpit (`make db-up`).

## Organisation

- `backend/` : Fastify 5 et Socket.io en TypeScript (exécuté directement par Node), Drizzle + MySQL, Better Auth pour la connexion. Les règles du jeu sont dans `src/game/rules.ts`, sans accès à la base.
- `frontend/` : React, Vite, Tailwind + DaisyUI. Les coups des joueurs sont calculés par `src/game/moves.ts`, sans modifier l'état React.
- `shared/types.ts` : types de partie communs au back et au front.
- `docs/PLAN.md` : historique des phases de remise en route et décisions.

## Déroulé d'un tour

- **initialReveal** : au début de la manche, chaque joueur révèle 2 de ses cartes.
- **draw** : le joueur prend la carte de la pioche ou celle de la défausse.
  - Carte de la défausse : **replace-discard**, il l'échange avec une de ses cartes.
  - Carte de la pioche : **decide-deck**, il la garde (échange avec une de ses cartes) ou la défausse, puis **flip-deck**, il retourne une de ses cartes cachées.
- **endTurn** : fin du tour, au joueur suivant.
- **endGame** : fin de la manche, affichage des scores. La partie s'arrête quand un joueur atteint 100 points.

## Déploiement

Images Docker construites par Dokploy depuis la branche `main` : voir [.github/README-CICD.md](.github/README-CICD.md). Chaque push et chaque PR passent par la validation GitHub Actions (lint, tests, build).
