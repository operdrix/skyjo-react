# Idées de jeux pour olivgames.fr

Notes d'audit du 2026-10-14, à reprendre plus tard. Cadrage en cours : plateforme générique + Flip 7 (`docs/PRD-plateforme.md`).

## Précautions juridiques (à relire avant chaque nouveau jeu)

Je ne suis pas juriste : ces règles réduisent le risque sans l'annuler. Au moindre doute (projet payant, publicité, courrier d'un éditeur), consulter un avocat en propriété intellectuelle.

**Ce qui est libre**
- Les règles du jeu en tant que méthode (mécaniques, déroulement, calcul des scores, composition du paquet) : le droit d'auteur protège une expression, pas une idée ni une méthode.

**Ce qui est protégé, donc interdit sans accord de l'éditeur**
- **Le nom du jeu** : marque déposée (Flip 7, 6 qui prend, Trio, Skyjo, Uno…). Ne l'utiliser ni comme titre, ni en sous-domaine, ni dans les métadonnées (balises `<title>`, description, mots-clés).
- **Le texte des règles** : protégé par le droit d'auteur. Réécrire les règles avec ses propres mots et sa propre structure, ne jamais copier ni traduire le livret.
- **Les illustrations, le logo, la typographie, le design des cartes** : créer ses propres visuels, sans imiter l'habillage reconnaissable (couleurs signatures, mise en page des cartes).
- **Les noms de cartes spéciales trop typiques** : les renommer (par exemple une carte « Freeze » devient « Gel » ou « Stop »).

**Bonnes pratiques**
- Nom générique et original pour chaque jeu, vérifié sur la base des marques de l'INPI (data.inpi.fr) et de l'EUIPO (TMview) avant de l'adopter et avant d'acheter un sous-domaine.
- Ne pas écrire « version en ligne de X » ni « inspiré de X » dans le site ou la communication : cela rattache le jeu à la marque.
- Rester gratuit et sans publicité réduit l'intérêt d'une action, mais ne protège pas juridiquement.
- En cas de demande d'un éditeur : retirer ou renommer rapidement, puis discuter. Garder une trace des choix (ce fichier).
- Alternative propre : demander une licence ou une autorisation écrite à l'éditeur (certains acceptent pour un projet non commercial).

**À traiter pour l'existant** : « Skyjo » est une marque de Magilano, utilisée aujourd'hui comme nom du jeu et dans le sous-domaine `skyjo.olivgames.fr`. À renommer à terme (nom, sous-domaine, titres, visuels).

## Jeux candidats

Difficulté de 1 (facile) à 5 (dur), une fois la plateforme générique en place. Les noms ci-dessous sont des noms de travail : chaque jeu publié prend un nom générique.

| Jeu (nom de travail) | Mécanique | Diff. | Notes |
|---|---|---|---|
| **Flip 7** (2024) | Stop ou encore | 2 | Choisi en premier. Cartes action ciblées, modificateurs, doublon = manche perdue |
| **6 qui prend** | Coups simultanés | 3 | Ajoute au moteur le mode « tous jouent en secret, puis on résout ». Choisi en second |
| **Trio** (2021) | Mémoire, déduction | 2 | Gros succès en France, info cachée simple |
| **No Thanks! / Non merci** | Enchère au jeton | 1 | Ultra simple, 3 à 7 joueurs |
| **Skull** | Bluff | 2 | Phases pose, enchère, révélation |
| **Cabo** | Mémoire, pouvoirs | 2 | Cousin de Skyjo, cartes qui permettent de regarder ou d'échanger |
| **Sushi Go** | Draft simultané | 3 | Réutilise le mode simultané de 6 qui prend |
| **The Mind** (2018) | Coopératif, « temps réel » | 3 | Ordre croissant sans parler, la latence se sent |
| **Hanabi** | Coopératif | 3 | Masquage inversé : on voit les cartes des autres, pas les siennes |
| **Just One** (2018) | Coopératif, mots | 3 | Liste de mots, détection des doublons (pluriels, accents) |
| **Odin / Scout** | Défausse de combinaisons | 3 | Scout : main non réordonnable, UI délicate |
| **The Crew / Équipage** (2019) | Plis coopératifs | 4 | 50 missions à coder, communication limitée |
| **Coup** | Bluff, contestations | 4 | Les contestations interrompent le tour |

Écartés pour l'instant : les jeux de cartes classiques (Belote, Tarot, Président, 8 américain…), jugés moins amusants ; Dobble (temps réel à la milliseconde) ; Rummikub (UI de réarrangement trop lourde).

## Briques de moteur et jeux qu'elles débloquent

- Actions ciblant un joueur (Flip 7) : Cabo, Skull, Coup.
- Coups simultanés (6 qui prend) : Sushi Go.
- Mode coopératif, victoire commune (The Mind, Hanabi) : Just One, The Crew.

## Ordre envisagé

1. Plateforme générique + Flip 7.
2. 6 qui prend.
3. Trio ou Skull.
4. Un coopératif (The Mind ou Hanabi).
