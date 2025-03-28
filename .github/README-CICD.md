# Configuration CI/CD pour Skyjo

Ce document explique comment fonctionne la CI/CD mise en place pour le projet Skyjo.

## Workflows GitHub Actions

Deux workflows ont été configurés :

1. **Docker Publish** (`docker-publish.yml`) : Construit et publie les images Docker sur DockerHub à chaque push sur la branche main
2. **Deploy to Production** (`deploy.yml`) : Déploie l'application sur le serveur de production lors de la création d'un tag

## Secrets GitHub Actions nécessaires

Les workflows nécessitent que vous configuriez les secrets suivants dans votre dépôt GitHub :

### Pour la publication Docker
- `DOCKERHUB_USERNAME` : Votre nom d'utilisateur Docker Hub
- `DOCKERHUB_TOKEN` : Un token d'accès Docker Hub (pas votre mot de passe)

### Pour le déploiement SSH
- `SSH_HOST` : L'adresse IP ou le nom d'hôte de votre serveur
- `SSH_PORT` : Le port SSH (généralement 22)
- `SSH_USERNAME` : Le nom d'utilisateur pour la connexion SSH
- `SSH_PRIVATE_KEY` : La clé privée SSH pour l'authentification

### Pour la configuration de l'application
- `DB_USER` : Nom d'utilisateur de la base de données
- `DB_PASSWORD` : Mot de passe de la base de données
- `MYSQL_ROOT_PASSWORD` : Mot de passe root MySQL
- `JWT_SECRET` : Clé secrète pour la génération des tokens JWT
- `APP_URL` : URL de l'application
- `EMAIL_HOST` : Serveur SMTP pour l'envoi d'emails
- `EMAIL_PORT` : Port du serveur SMTP
- `EMAIL_USER` : Nom d'utilisateur SMTP
- `EMAIL_PASS` : Mot de passe SMTP
- `EMAIL_FROM` : Adresse d'expédition des emails

## Comment utiliser cette CI/CD

### Publication d'images Docker

Chaque push sur la branche main déclenchera automatiquement la construction et la publication des images Docker sur Docker Hub avec le tag `latest`.

### Déploiement en production

Pour déployer en production :

1. Créez un tag sur la branche main :
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. GitHub Actions va automatiquement :
   - Tagger les images Docker avec le numéro de version
   - Publier ces images sur Docker Hub
   - Déployer l'application sur votre serveur

## Gestion des environnements

Les variables d'environnement sont gérées différemment selon le contexte :

1. **Variables de build** : Définies lors de la construction des images Docker
2. **Variables d'exécution** : Définies dans le fichier `.env` déployé sur le serveur

## Structure sur le serveur

L'application est déployée dans le répertoire `/opt/skyjo` sur le serveur avec les fichiers suivants :
- `docker-compose.yml` : Configuration des services
- `.env` : Variables d'environnement
- `deploy.sh` : Script de déploiement

## Sauvegarde de la base de données

Les données MySQL sont persistées dans un volume Docker nommé `mysql_data`.

Il est recommandé de configurer des sauvegardes régulières de ce volume sur le serveur de production. 