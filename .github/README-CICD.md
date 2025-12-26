# Configuration CI/CD pour Skyjo

Ce document explique comment fonctionne la CI/CD mise en place pour le projet Skyjo avec Dokploy.

## Architecture

Le projet utilise une architecture CI/CD simple avec GitHub Actions pour le build et Dokploy pour le déploiement.

## Workflow GitHub Actions

**Docker Publish** (`docker-publish.yml`) : 
- Construit et publie les images Docker sur DockerHub à chaque push sur la branche `main`
- Tag les images avec la version lors de la création d'un tag (format `v*`)
- Tags générés automatiquement :
  - `latest` : dernière version sur main
  - `sha-<commit>` : identifiant de commit
  - `v1.0.0` : version sémantique (lors de création de tag)
  - `1.0` : version majeure.mineure (lors de création de tag)

## Secrets GitHub Actions nécessaires

Les workflows nécessitent que vous configuriez les secrets suivants dans votre dépôt GitHub (Settings → Secrets and variables → Actions) :

### Pour la publication Docker
- `DOCKERHUB_USERNAME` : Votre nom d'utilisateur Docker Hub
- `DOCKERHUB_TOKEN` : Un token d'accès Docker Hub (créez-le dans Account Settings → Security → New Access Token)

## Comment utiliser cette CI/CD

### Publication d'images Docker

Chaque push sur la branche main déclenchera automatiquement :
1. La construction des images Docker pour backend et frontend
2. La publication sur Docker Hub avec le tag `latest` et `sha-<commit>`

### Déploiement d'une nouvelle version

Pour déployer une nouvelle version :

1. Créez un tag sur la branche main :
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. GitHub Actions va automatiquement :
   - Construire les images Docker
   - Les publier sur Docker Hub avec les tags `v1.0.0` et `1.0`
   - Les images seront disponibles pour Dokploy

3. Dans Dokploy :
   - Le service détectera automatiquement la nouvelle image
   - Ou déployez manuellement via l'interface Dokploy

## Déploiement avec Dokploy

Le déploiement est géré par Dokploy. Consultez le fichier [README-DOKPLOY.md](../README-DOKPLOY.md) à la racine du projet pour :
- La configuration des services dans Dokploy
- Les variables d'environnement à définir
- La structure de déploiement

## Structure du projet

- **backend/** : API Node.js
- **frontend/** : Application React avec Vite
- **deploy/** : Fichiers de référence pour Dokploy (docker-compose.yml)
- **.github/workflows/** : Workflows GitHub Actions

## Images Docker

Les images sont publiées sur Docker Hub :
- `<username>/skyjo-backend:latest` : Backend
- `<username>/skyjo-frontend:latest` : Frontend

Remplacez `<username>` par votre nom d'utilisateur Docker Hub.
