# Skyjo

Jeu de cartes Skyjo en ligne, pour jouer entre amis / famille. Vue d'ensemble : `README.md`. Historique de la remise en route et décisions : `docs/PLAN.md`.

## Mémoire et reprise
État d'avancement, bugs trouvés et astuces de test : @.claude/memoire/reprise.md (à mettre à jour en fin de session).

## Stack
- `backend/` : TypeScript exécuté par Node 24 (pas de build), Fastify 5, Socket.io, Drizzle + MySQL (schéma `src/db/schema.ts`, migrations `drizzle/`), Better Auth (`src/auth.ts` : email + mot de passe ou Google, sessions en base, cookie httpOnly, plugin `username` pour le pseudo).
- `shared/types.ts` : types de partie communs au back et au front (contextes Docker à la racine du dépôt).
- `frontend/` : React, Vite, TypeScript, Tailwind + DaisyUI, Formik + Yup, react-router (routes chargées à la demande). Logique pure dans `src/game/` (coups, places, stats), contextes `*Context.ts` séparés des `*Provider.tsx`.
- Déploiement : Dockerfiles + Dokploy (`.github/README-CICD.md`). L'appli est arrêtée, la base est jetable.

## Commandes (toujours passer par `make`)
- `make install` / `make dev` (MySQL, Mailpit + back :3000 + front :5173) / `make full` (tout en images Docker, front :8081) / `make db-down`
- Base : modifier `backend/src/db/schema.ts` puis `make db-generate` (migration versionnée) ; `make db-reset` vide la base de dev et la migre. Les migrations sont appliquées au démarrage du back.
- Mails : Mailpit en dev et recette (UI http://localhost:8025, SMTP :1025), Gmail uniquement en production. Le transport se choisit via `SMTP_HOST`.
- `make test`, `make lint` (ESLint + Prettier), `make format`, `make build`, **`make check`** (lint + test + build) avant tout commit. La CI (`.github/workflows/validate.yml`) lance les mêmes vérifications, bloquantes.

## Règles de travail
- **TDD obligatoire** : test rouge d'abord, code minimal, refactor. Voir le skill `/tdd`. Pas de code de production sans test qui échoue au préalable (hors config/doc/style).
- Tests avec Vitest. Les règles du jeu vivent dans un module pur (sans accès base ni socket) pour rester testables.
- Branches : `dev` (défaut) intègre les nouveautés, `main` est la version stable déployée. Flux : `feat/*`/`fix/*` → PR vers `dev` → PR de release `dev` → `main`. Ne jamais travailler directement sur `dev` ni `main`.
- Livraison : `/branche` puis `/livre` (ils ciblent la branche par défaut, donc `dev`), une PR par phase du plan.
- Commits conventionnels en français (`feat(scope): …`, `fix(scope): …`). Code, commentaires et messages utilisateur en français.
- `/verifie` avant de déclarer une tâche terminée.
- Pas de `console.*` (règle `no-console` en erreur) : utiliser `backend/src/utils/logger` côté back.
- Front : ne jamais muter l'état React (`game.gameData` compris) ; passer par une copie (`src/game/moves.ts`). Règles React Compiler en erreur.

## Pièges connus
- Le serveur fait confiance au `gameData` envoyé par le client (`play-move`). Choix assumé : garde-fous légers (membre de la room, tour du joueur), pas de serveur autoritaire complet.
- `userId` ne doit jamais venir du body : le prendre dans la session (`request.user`, rempli par `app.authenticate`).
- Pas de valeur par défaut codée en dur pour `BETTER_AUTH_SECRET`.
- Données personnelles minimales : pseudo et email seulement (pas de nom, prénom ni photo, pas de vérification d'email).
