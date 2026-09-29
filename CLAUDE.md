# Skyjo

Jeu de cartes Skyjo en ligne, pour jouer entre amis / famille. Projet ancien en cours de remise en route : voir `docs/PLAN.md` (phases, décisions, vérification).

## Stack
- `backend/` : Fastify 5, Socket.io, JWT en cookies httpOnly, Redis optionnel (blacklist de tokens), MySQL. Migration en cours vers **TypeScript + Drizzle** (remplace Sequelize).
- `frontend/` : React, Vite, TypeScript, Tailwind + DaisyUI, Formik + Yup, react-router.
- Déploiement : Dockerfiles + Dokploy (`.github/README-CICD.md`). L'appli est arrêtée, la base est jetable.

## Commandes (toujours passer par `make`)
- `make install` / `make dev` (MySQL + Mailpit + back :3000 + front :5173) / `make db-down`
- Mails : Mailpit en dev et recette (UI http://localhost:8025, SMTP :1025), Gmail uniquement en production. Le transport se choisit via `SMTP_HOST`.
- `make test`, `make lint`, `make build`, **`make check`** (lint + test + build) avant tout commit.

## Règles de travail
- **TDD obligatoire** : test rouge d'abord, code minimal, refactor. Voir le skill `/tdd`. Pas de code de production sans test qui échoue au préalable (hors config/doc/style).
- Tests avec Vitest. Les règles du jeu vivent dans un module pur (sans accès base ni socket) pour rester testables.
- Livraison : `/branche` puis `/livre`, une PR par phase du plan. Ne jamais travailler directement sur `main`.
- Commits conventionnels en français (`feat(scope): …`, `fix(scope): …`). Code, commentaires et messages utilisateur en français.
- `/verifie` avant de déclarer une tâche terminée.
- Pas de `console.log` : utiliser `backend/src/utils/logger`.

## Pièges connus
- Le serveur fait confiance au `gameData` envoyé par le client (`play-move`). Choix assumé : garde-fous légers (membre de la room, tour du joueur), pas de serveur autoritaire complet.
- `userId` ne doit jamais venir du body : le prendre dans le JWT (`request.user`).
- `sequelize.sync({ alter: true })` est à supprimer au profit de migrations Drizzle.
- Pas de valeur par défaut codée en dur pour `JWT_SECRET` / `COOKIE_SECRET`.
