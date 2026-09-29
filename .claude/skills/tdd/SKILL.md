---
name: tdd
description: Impose le cycle TDD rouge → vert → refactor sur ce projet. Utilise avant d'écrire ou modifier du code de production (feature, bug, refactor de règles du jeu, route API, événement socket), sur /tdd, ou quand l'utilisateur dit "en TDD", "écris le test d'abord".
---

# /tdd — TDD obligatoire

Aucun code de production sans test rouge préalable. Seules exceptions : config, docs, style, renommages purs couverts par des tests existants.

## Cycle
1. **Rouge** : écris le plus petit test qui décrit le comportement voulu (Vitest, fichier `*.test.ts` à côté du code). Lance-le (`cd backend && npx vitest run <fichier>`) et **constate l'échec pour la bonne raison** (assertion, pas erreur d'import). Montre la sortie.
2. **Vert** : écris le code minimal qui le fait passer. Rien de plus. Relance : il passe.
3. **Refactor** : nettoie sans changer le comportement, tests toujours verts.
4. Répète, un comportement à la fois.

## Bug
Reproduis-le d'abord par un test rouge, puis corrige. Le test reste comme non-régression.

## Où tester
- Règles du jeu (deck, tours, scores, fin de manche) : tests unitaires sur le module pur, sans base ni socket.
- API Fastify : `app.inject()` sur une instance de test, base de test isolée.
- Frontend : Vitest + Testing Library pour la logique et les composants non triviaux.

## Fin
Lance `make check` (ou `/verifie`). Ne déclare rien terminé avec un test rouge ou ignoré (`skip`, `only`).

Si tu ne peux pas écrire le test avant (code existant non testable), dis-le, extrais d'abord la logique pure dans un module testable, puis reviens au cycle.
