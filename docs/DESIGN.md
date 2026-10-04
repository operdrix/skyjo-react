# Design System — Skyjo d'Olivier

## Product Context
- **Quoi** : jeu de cartes en ligne, gratuit et sans publicité. On crée un salon, on partage le lien, on joue en temps réel de 2 à 4 joueurs.
- **Pour qui** : amis et famille, tous âges, pas forcément à l'aise avec la technique. Du téléphone à l'ordinateur.
- **Espace** : jeux de société en ligne entre proches.
- **Type** : web app de jeu, avec une page d'accueil un peu vitrine.
- **Memorable thing** : « On s'y sent comme autour de la table du salon. »

## Aesthetic Direction
- **Direction** : Playful/Toy-like, déclinée en **3 thèmes au choix du joueur**.
- **Décoration** : intentionnelle (texture de fond, halos ou confettis selon le thème), jamais derrière du texte courant.
- **Mood** : chaleureux et ludique, moderne sans être austère.
- **Planches de référence** : générées le 2026-10-04 (A, B, C) ; preview interactif : `docs/design-preview.html`.

### Les thèmes

| Identifiant | Nom affiché | Modes | Signature |
|---|---|---|---|
| `tapis` (**défaut**) | Tapis de jeu | clair + sombre | Papier découpé : bordures encre 2,5 px, ombres pleines décalées, fond à points |
| `neon` | Soirée néon | sombre seul | Surfaces en verre dépoli, contours et halos lumineux |
| `confettis` | Confettis | clair + sombre | Aplats francs, formes géométriques, ombres douces |

Valeurs de `data-theme` sur `<html>` : `tapis`, `tapis-sombre`, `neon`, `confettis`, `confettis-sombre`. Un second attribut `data-style` (`tapis` / `neon` / `confettis`) porte les quelques règles propres à un thème, quel que soit le mode.

### Choix du thème
- **Stockage** : colonne `users.theme` (`tapis` | `neon` | `confettis`, défaut `tapis`) + copie locale (`localStorage`) pour appliquer le thème avant le rendu React (script inline dans `index.html`, pas de flash).
- **Mode clair/sombre/auto** : préférence locale à l'appareil (bouton existant), masqué quand le thème est `neon`.
- **Où le choisir** : formulaire d'inscription email, page `/auth/pseudo` (comptes Google), espace perso (à côté du changement de pseudo). Même composant partout : 3 vignettes cliquables (`role="radiogroup"`), Tapis de jeu présélectionné.
- **Visiteur non connecté** : thème de la copie locale, sinon `tapis`.
- **RGPD** : mentionner la préférence dans `/privacy` (donnée de compte) et `/cookies` (stockage local fonctionnel, sans consentement).

## Typography
| Thème | Display/Hero | Body |
|---|---|---|
| Tapis de jeu | Fredoka 500–700 | Nunito 400–800 |
| Soirée néon | Baloo 2 600–800 | Outfit 400–700 |
| Confettis | Bricolage Grotesque 600–800 | DM Sans 400–700 |

- **Data/Tables** : police body du thème avec `font-variant-numeric: tabular-nums` (scores, historique, tableau de fin de manche).
- **Code** : aucune.
- **Loading** : auto-hébergé (paquets `@fontsource`, sous-ensemble latin, woff2). Seules les polices du thème actif sont chargées. Pas d'appel à Google Fonts en production (transfert d'IP). Kalam et Courgette sont retirées.
- **Scale** : 14 / 16 / 20 / 28 / 40 / 56 / 88 px (titres fluides avec `clamp()`). Texte courant 16 px minimum, 18 px pour les intros.

## Color
- **Approche** : balanced (primaire + secondaire, 4 couleurs sémantiques). Contraste AA vérifié sur chaque paire texte/fond.
- **Jetons sémantiques** (seuls autorisés dans les composants) : `--bg`, `--surface`, `--surface-2`, `--ink`, `--muted`, `--line`, `--primary`, `--primary-ink`, `--secondary`, `--secondary-ink`, `--accent`, `--success`, `--warning`, `--error`, `--info`. Ils alimentent aussi les variables DaisyUI (`--color-primary`, `--color-base-100`, etc.).

| Jeton | Tapis | Tapis sombre | Néon | Confettis | Confettis sombre |
|---|---|---|---|---|---|
| `--bg` | `#FFF6E6` | `#1F1A33` | `#16122E` | `#F4F5FB` | `#12131F` |
| `--surface` | `#FFFFFF` | `#2A2445` | `#241E4A` | `#FFFFFF` | `#1C1E30` |
| `--surface-2` | `#FFEBC8` | `#352E57` | `#2E2760` | `#EEF0FF` | `#262945` |
| `--ink` | `#1F1A33` | `#FFF6E6` | `#ECE8FF` | `#16182B` | `#EEF0FF` |
| `--muted` | `#6B6380` | `#B8B0CF` | `#A49CCF` | `#62667F` | `#9CA0BD` |
| `--line` | `#1F1A33` | `#0E0B1C` | `#FFFFFF1F` | `#E2E4F0` | `#2E3150` |
| `--primary` | `#FF5A3C` | `#FF6A4D` | `#FF6B8B` | `#3D5AFE` | `#3D5AFE` |
| `--primary-ink` | `#1F1A33` | `#1F1A33` | `#1A1030` | `#FFFFFF` | `#FFFFFF` |
| `--secondary` | `#B9A7FF` | `#B9A7FF` | `#A88BFF` | `#FF9F1C` | `#FF9F1C` |
| `--accent` | `#FFC43D` | `#FFC43D` | `#5CE1FF` | `#FF4F9A` | `#FF4F9A` |
| `--success` | `#3CC6A4` | `#3CC6A4` | `#B6F25C` | `#12B886` | `#2BD49F` |
| `--warning` | `#FFC43D` | `#FFC43D` | `#FFC46B` | `#F59F00` | `#FFB224` |
| `--error` | `#D7263D` | `#FF5C6C` | `#FF4D4D` | `#E03131` | `#FF6B6B` |
| `--info` | `#4C9AFF` | `#7DB5FF` | `#5CE1FF` | `#228BE6` | `#4DABF7` |

- **Contrastes clés** : texte/fond ≥ 5:1 partout (`--muted` compris) ; bouton tomate Tapis en texte encre (5,4:1, le blanc ne passait qu'à 3,1:1) ; bleu Confettis + blanc 5,1:1.
- **Dark mode** : Tapis et Confettis ont une variante sombre dédiée (mêmes accents, surfaces sombres). Néon est sombre par nature.

### Cartes de jeu
Couleur **et** symbole par tranche de valeur (lisible en daltonisme), avec des teintes volontairement différentes du jeu original. Le dos des cartes porte un monogramme « S » sur un motif propre au thème.

| Tranche | Symbole | Tapis (bandeau) | Néon (contour) | Confettis (aplat / chiffre) |
|---|---|---|---|---|
| −2 à −1 | ◆ | `#2FB7A0` | `#7CFFB2` | `#12B886` / ardoise |
| 0 | ● | `#F4EAD6` | `#ECE8FF` | `#FFFFFF` / ardoise |
| 1 à 4 | ▲ | `#FFD45E` | `#5CE1FF` | `#3D5AFE` / blanc |
| 5 à 8 | ■ | `#FF8A3D` | `#A88BFF` | `#FF9F1C` / ardoise |
| 9 à 12 | ✱ | `#8C3B86` | `#FF5C93` | `#FF4F9A` / blanc |

- Jetons : `--c-neg`, `--c-zero`, `--c-low`, `--c-mid`, `--c-high` (+ `-ink`). Les variables actuelles `--color-card-*` sont remplacées.
- Tapis : face crème `#FFFDF8`, bandeau coloré en haut, chiffre encre. Néon : face `#1E1840`, chiffre et contour lumineux. Confettis : aplat + forme géométrique par tranche (rond, losange, triangle, goutte).
- Accessibilité : `aria-label` du type « carte 7 » ou « carte cachée » sur chaque carte.

## Spacing
- **Base** : 4 px
- **Densité** : confortable
- **Scale** : 2xs(2) xs(4) sm(8) md(16) lg(24) xl(32) 2xl(48) 3xl(64)
- **Cibles tactiles** : 44 px minimum ; boutons et champs à 48 px (38 px pour la taille `sm`).

## Layout
- **Approche** : hybride. Accueil en vitrine (accroche + éventail de cartes + 3 atouts), grille stricte pour le reste.
- **Grid** : 1 colonne < 768 px, 2 colonnes à partir de 768 px (accueil, inscription), 4 colonnes de statistiques à partir de 1024 px.
- **Max content width** : 1120 px ; pages légales et règles limitées à 68 caractères par ligne, avec une colonne de navigation entre pages légales.
- **Gouttière mobile** : 16 px, aucun défilement horizontal.
- **Border radius** :

| | sm | md | lg | full |
|---|---|---|---|---|
| Tapis | 6 px | 10 px | 14 px | 9999 px |
| Néon | 10 px | 16 px | 22 px | 9999 px |
| Confettis | 8 px | 12 px | 16 px | 9999 px |

- **Bordures et ombres** : Tapis `2.5px` + ombre pleine `4px 4px 0` (2 px sur les petits éléments) ; Néon `1px` translucide + ombre floue ; Confettis `1px` + ombre douce.
- **Pied de page** : léger, couleur du fond, liens légaux + version. Le gros bloc noir et le logo « # » disparaissent.

### Plateau de jeu (tous écrans)
- Grille du joueur 4 × 3 dont la largeur des cartes suit la place disponible (container queries) : `--card-w: min((100cqw - 3 × gap) / 4, (hauteur disponible / 3) × 5/7)`. Tailles de police des cartes proportionnelles à `--card-w`.
- Mobile : adversaires en miniatures en haut, pioche et défausse au centre, plateau du joueur, barre d'état en bas (« Au tour de Camille… »).
- Desktop : adversaires autour, cartes plafonnées pour rester lisibles sans dépasser l'écran.
- Joueur dont c'est le tour : contour `--success` (Tapis, Confettis) ou halo (Néon).

## Motion
- **Approche** : intentionnelle.
- **Easing** : enter(ease-out) exit(ease-in) move(ease-in-out) ; retournement `cubic-bezier(.2,.8,.2,1)`.
- **Duration** : micro(50-100ms) court(150-250ms) moyen(250-400ms) long(400-700ms).
- **Signatures** : bouton qui s'enfonce de 2 px (Tapis) ou se tasse à 97 % (Confettis) en 80 ms ; retournement de carte 420 ms ; halo pulsé du joueur actif (Néon) ; confettis de victoire (Confettis).
- `prefers-reduced-motion: reduce` : transitions et animations décoratives coupées.

## Règles d'implémentation
- Aucune couleur, ombre ou rayon codé en dur dans un composant : uniquement les jetons sémantiques.
- Les effets propres à un thème passent par `[data-style="…"]`, en nombre réduit.
- Chaque écran se vérifie dans les 5 combinaisons (Tapis clair/sombre, Néon, Confettis clair/sombre), sur mobile et desktop.

## Decisions Log
| Date | Décision | Rationale |
|------|----------|-----------|
| 2026-10-04 | Création initiale | /design — refonte d'un design fait « avec les moyens du bord » : typo manuscrite partout, couleurs sans système, identité éclatée |
| 2026-10-04 | 3 thèmes au choix, Tapis de jeu par défaut | Coup de cœur pour A et C ; le choix du joueur ajoute du plaisir, coût maîtrisé grâce aux jetons communs |
| 2026-10-04 | Thème stocké en base + copie locale | Le thème suit le compte d'un appareil à l'autre, sans flash au chargement |
| 2026-10-04 | Cartes couleur + symbole, teintes propres | Se distinguer du jeu original, lisibilité en daltonisme |
| 2026-10-04 | Nom « Skyjo d'Olivier » conservé | Choix du propriétaire ; mention de non-affiliation à Magilano maintenue dans les mentions légales |
| 2026-10-04 | Outfit au lieu d'Inter (Néon), bouton primaire en aplat | Éviter les choix trop génériques |
| 2026-10-04 | Polices auto-hébergées | Pas de transfert d'IP vers Google Fonts (RGPD) |
