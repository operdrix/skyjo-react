# CI/CD Skyjo : GitHub Actions → Docker Hub → Dokploy

Production :
- Front : https://skyjo.games.labodolivier.com
- Back : https://api-skyjo.games.labodolivier.com (Swagger : `/api/documentation`)

Les deux domaines partagent le même domaine racine : les cookies de session Better Auth passent entre le front et le back. Garder cette règle si les domaines changent.

## Flux

```
feat/* ou fix/*  →  PR vers dev  →  PR de release dev → main  →  make release VERSION=X.Y.Z
                                                                        │
                                       GitHub Release vX.Y.Z publiée ◄──┘
                                                   │
                    .github/workflows/release.yml  ▼
   guard (tag vX.Y.Z sur main) → validate (lint, tests MariaDB, build)
     → images : <user>/skyjo-backend et <user>/skyjo-frontend, tags X.Y.Z, X.Y, latest
     → deploy : webhook Dokploy backend, puis frontend
                                                   │
                                     Dokploy pull :latest et redémarre
```

- `validate.yml` tourne aussi sur chaque push (hors `main`) et chaque PR vers `dev` ou `main`. Rien n'est déployé sans release.
- Une release marquée « pre-release » ne déploie pas.
- La version s'affiche dans le footer (`vX.Y.Z`, `dev` en local) et dans les logs du back au démarrage (`🚀 Serveur démarré sur … (version X.Y.Z)`).

## Publier une release

1. Merger la PR `dev → main`.
2. `make release VERSION=3.0.0` (sans le `v`). Équivalent : GitHub → Releases → Draft a new release, tag `v3.0.0`, cible `main`, « Generate release notes », Publish.
3. Suivre le run : `gh run watch` (ou onglet Actions), puis les logs de déploiement dans Dokploy.

Numérotation : majeur pour une rupture (base à recréer, changement de domaine…), mineur pour une fonctionnalité, correctif pour un bug. Les tags `v2.0.x` sont ceux de l'ancienne version de l'appli.

## Revenir à une version précédente

Dans Dokploy, app concernée → General → Provider Docker : remplacer `:latest` par le tag voulu (ex. `:3.0.0`), Save, Deploy. Remettre `:latest` ensuite, sinon les prochaines releases ne seront pas prises (le webhook redéploie le tag configuré). Attention : les migrations de base ne sont pas annulées.

## Secrets GitHub

GitHub → Settings → Environments → **New environment** `production`, puis :

| Nom | Type | Valeur |
|---|---|---|
| `DOCKERHUB_USERNAME` | Variable | Nom du compte Docker Hub |
| `DOCKERHUB_TOKEN` | Secret | Docker Hub → Account settings → Personal access tokens, permission **Read & Write** |
| `DOKPLOY_WEBHOOK_BACKEND` | Secret | URL du webhook de l'app backend (voir Dokploy ci-dessous) |
| `DOKPLOY_WEBHOOK_FRONTEND` | Secret | URL du webhook de l'app frontend |
| `VITE_BACKEND_HOST` | Variable | `https://api-skyjo.games.labodolivier.com` |
| `VITE_BACKEND_WS` | Variable | `https://api-skyjo.games.labodolivier.com` |

Les `VITE_*` sont figées dans le bundle du front au build : les changer impose une nouvelle release.

## Docker Hub

Créer à la main deux dépôts **privés** avant la première release (sinon le premier push les crée avec la visibilité par défaut du compte) : `skyjo-backend` et `skyjo-frontend`.

## Dokploy

### Registry
Settings → Registry → Add registry : Docker Hub, URL `docker.io`, user Docker Hub, mot de passe = un 2e token Docker Hub en **Read-only**.

### Base (déjà créée)
Service MariaDB du projet. Noter son **Internal Host** (nom de service), le nom de base, l'utilisateur et son mot de passe. Les tables sont créées par le back au démarrage (migrations Drizzle).

### App `backend`
- Provider : **Docker**, image `<user>/skyjo-backend:latest`, registry Docker Hub ci-dessus.
- Domaine : `api-skyjo.games.labodolivier.com`, port conteneur **3000**, HTTPS (Let's Encrypt).
- **Auto Deploy activé** (sans lui, le webhook est refusé). Deployments → copier la **Webhook URL** dans `DOKPLOY_WEBHOOK_BACKEND`.
- Environment :

| Variable | Valeur |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| `APP_URL` | `https://api-skyjo.games.labodolivier.com` |
| `FRONTEND_HOST` | `https://skyjo.games.labodolivier.com` |
| `DB_HOST` | Internal Host du service MariaDB |
| `DB_PORT` | `3306` |
| `DB_NAME` | nom de la base |
| `DB_USER` | utilisateur de la base |
| `DB_PASSWORD` | mot de passe de cet utilisateur |
| `BETTER_AUTH_SECRET` | `openssl rand -base64 32` (32 caractères min., le back refuse de démarrer sinon). Le changer déconnecte tout le monde |
| `GOOGLE_CLIENT_ID` | ID client OAuth Google |
| `GOOGLE_CLIENT_SECRET` | secret client OAuth Google |
| `SMTP_HOST` | vide (vide = envoi par Gmail) |
| `GMAIL_APP_EMAIL` | adresse Gmail d'envoi |
| `GMAIL_APP_PASSWORD` | mot de passe d'application Gmail (https://myaccount.google.com/apppasswords) |

### App `frontend`
- Provider : **Docker**, image `<user>/skyjo-frontend:latest`, registry Docker Hub.
- Domaine : `skyjo.games.labodolivier.com`, port conteneur **80**, HTTPS.
- **Auto Deploy activé**, Webhook URL dans `DOKPLOY_WEBHOOK_FRONTEND`.
- Aucune variable d'environnement (tout est figé au build).

### Google Cloud Console
ID client OAuth (application Web) :
- Origine JavaScript autorisée : `https://skyjo.games.labodolivier.com`
- URI de redirection autorisée : `https://api-skyjo.games.labodolivier.com/api/auth/callback/google`

## Premier déploiement

Les webhooks n'existent qu'une fois les apps créées, et les apps ont besoin d'une image : la toute première release peut donc échouer à l'étape `deploy` si les secrets webhook ne sont pas encore renseignés.
1. Secrets GitHub (sauf webhooks), dépôts Docker Hub, registry Dokploy.
2. `make release VERSION=3.0.0` : les images sont poussées, l'étape `deploy` échoue (webhooks absents).
3. Créer les apps Dokploy (ci-dessus), Deploy à la main, vérifier les logs du back (connexion MariaDB, migrations, version).
4. Renseigner les secrets webhook. Les releases suivantes déploient seules (ou relancer le job `deploy` du run de la 3.0.0 : Re-run failed jobs).
