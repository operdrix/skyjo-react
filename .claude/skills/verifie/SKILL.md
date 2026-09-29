---
name: verifie
description: Porte de sortie avant commit ou PR. Lance lint, tests et build du back et du front, puis rapporte fidèlement. Utilise sur /verifie, ou avant /livre, ou pour "vérifie que tout passe", "check".
---

# /verifie

1. Lance `make check` depuis la racine.
2. Si tout passe : dis-le en une ligne (lint, tests, build).
3. Si quelque chose échoue : cite la commande, l'erreur exacte et le fichier. Ne corrige pas sans rapport préalable, ne saute ni ne désactive aucun test ou règle de lint pour faire passer.
4. Vérifie aussi `git status` : pas de `.only`/`.skip` de test ni de `console.log` ajouté dans le diff (`git diff | grep -E "\.only|\.skip|console\.log"`).
