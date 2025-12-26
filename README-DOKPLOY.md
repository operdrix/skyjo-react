# 🚀 Déploiement Skyjo avec Dokploy

Ce document explique comment déployer l'application Skyjo sur Dokploy.

## 📋 Prérequis

- Un compte Dokploy configuré
- Images Docker publiées sur Docker Hub via GitHub Actions
- Accès à la console Dokploy

## 🏗️ Architecture

L'application est composée de 3 services :

1. **Database (MySQL)** : Géré directement par Dokploy
2. **Backend (API Node.js)** : Conteneur Docker
3. **Frontend (React + Nginx)** : Conteneur Docker

## 📦 Configuration des services dans Dokploy

### 1️⃣ Service Database (MySQL)

Dans Dokploy, créez un service MySQL :

**Type de service** : Database → MySQL

**Configuration** :
- **Nom** : `skyjo-db` (ou votre choix)
- **Version** : `latest` ou version stable (8.0, 8.4, etc.)
- **Database Name** : `skyjo`
- **Username** : `skyjo_user`
- **Password** : Générer un mot de passe sécurisé
- **Root Password** : Générer un mot de passe sécurisé

**Important** : Notez le nom interne du service (ex: `skyjo-db`), vous en aurez besoin pour la configuration du backend.

---

### 2️⃣ Service Backend

**Type de service** : Application → Docker Image

**Configuration générale** :
- **Nom** : `skyjo-backend`
- **Image** : `<votre-username>/skyjo-backend:latest`
- **Port** : `3000`

#### Variables d'environnement (Environment)

Ajoutez ces variables dans l'onglet **Environment** du service backend :

```bash
# Database
DB_HOST=skyjo-db                    # Nom du service MySQL dans Dokploy
DB_USER=skyjo_user                  # Utilisateur créé dans le service MySQL
DB_PASSWORD=votre_mot_de_passe      # Mot de passe du service MySQL
DB_NAME=skyjo                       # Nom de la base de données
DB_PORT=3306                        # Port MySQL standard

# JWT
JWT_SECRET=votre_secret_jwt_tres_secure_min_32_chars

# Application
APP_URL=https://votre-domaine.com   # URL publique de votre application
PORT=3000                           # Port du backend
NODE_ENV=production                 # Environnement de production

# Email (SMTP)
EMAIL_HOST=smtp.example.com         # Serveur SMTP
EMAIL_PORT=587                      # Port SMTP (587 ou 465)
EMAIL_USER=votre@email.com          # Utilisateur SMTP
EMAIL_PASS=votre_mot_de_passe_smtp  # Mot de passe SMTP
EMAIL_FROM=noreply@votre-domaine.com # Adresse d'expédition

# Frontend (pour CORS)
FRONTEND_HOST=https://votre-domaine.com
```

**⚠️ Important** :
- `DB_HOST` doit correspondre au nom du service MySQL dans Dokploy
- `JWT_SECRET` doit être une chaîne sécurisée d'au moins 32 caractères
- `APP_URL` doit être l'URL publique de votre frontend

#### Dépendances
- Ajoutez une dépendance vers le service `skyjo-db`

---

### 3️⃣ Service Frontend

**Type de service** : Application → Docker Image

**Configuration générale** :
- **Nom** : `skyjo-frontend`
- **Image** : `<votre-username>/skyjo-frontend:latest`
- **Port** : `80`

#### Variables de build (Build Args)

**⚠️ ATTENTION** : Les variables pour le frontend doivent être configurées **au moment du build dans GitHub Actions**, pas dans Dokploy.

Dans votre workflow GitHub Actions, ajoutez ces arguments de build :

```yaml
- name: Build and push Frontend image
  uses: docker/build-push-action@v5
  with:
    context: ./frontend
    push: true
    build-args: |
      VITE_BACKEND_HOST=https://api.votre-domaine.com
      VITE_BACKEND_WS=wss://api.votre-domaine.com
    tags: ${{ steps.meta-frontend.outputs.tags }}
```

**Variables nécessaires** :
- `VITE_BACKEND_HOST` : URL de l'API backend (https://api.votre-domaine.com)
- `VITE_BACKEND_WS` : URL WebSocket (wss://api.votre-domaine.com)

**Note** : Ces variables sont "cuites" dans le build frontend et ne peuvent pas être changées après coup sans rebuild.

#### Domaine et SSL
- Configurez votre domaine dans l'onglet **Domains**
- Activez SSL automatique via Let's Encrypt

#### Dépendances
- Ajoutez une dépendance vers le service `skyjo-backend`

---

## 🔄 Processus de déploiement

### Déploiement initial

1. **Créez le service Database** dans Dokploy
2. **Créez le service Backend** avec toutes les variables d'environnement
3. **Créez le service Frontend** et configurez le domaine
4. **Déployez** chaque service dans l'ordre : DB → Backend → Frontend

### Mises à jour

Pour déployer une nouvelle version :

1. **Poussez votre code** sur la branche `main` de GitHub
2. **GitHub Actions** construit et publie automatiquement les nouvelles images sur Docker Hub
3. Dans **Dokploy**, pour chaque service (backend/frontend) :
   - Allez dans l'onglet **Deployments**
   - Cliquez sur **Redeploy** pour tirer la dernière image

Ou, si vous voulez déployer une version spécifique :

1. Créez un tag git : `git tag v1.0.0 && git push origin v1.0.0`
2. GitHub Actions publie l'image avec le tag `v1.0.0`
3. Dans Dokploy, modifiez l'image du service : `<username>/skyjo-backend:v1.0.0`
4. Redéployez le service

---

## 📝 Résumé des variables

### Variables BACKEND (Environment dans Dokploy)
Toutes les variables listées dans la section Backend ci-dessus doivent être configurées dans Dokploy.

### Variables FRONTEND (Build Args dans GitHub Actions)
- `VITE_BACKEND_HOST` : URL de l'API
- `VITE_BACKEND_WS` : URL WebSocket

**⚠️ Ces variables doivent être configurées dans le workflow GitHub Actions, pas dans Dokploy.**

---

## 🔐 Sécurité

### Bonnes pratiques

1. **Mots de passe** : Utilisez des mots de passe forts et uniques
2. **JWT_SECRET** : Générez une clé de 32+ caractères aléatoires
3. **SSL** : Activez toujours HTTPS pour la production
4. **Environnement** : Ne committez JAMAIS les variables sensibles dans Git
5. **Backup** : Configurez des sauvegardes automatiques de la base de données dans Dokploy

### Génération de secrets sécurisés

```bash
# Générer un JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Ou avec OpenSSL
openssl rand -hex 32
```

---

## 🐛 Dépannage

### Le backend ne se connecte pas à la base de données

- Vérifiez que `DB_HOST` correspond au nom du service MySQL dans Dokploy
- Vérifiez les credentials (DB_USER, DB_PASSWORD)
- Consultez les logs du service backend dans Dokploy

### Le frontend ne communique pas avec le backend

- Vérifiez que `VITE_BACKEND_HOST` pointe vers l'URL publique du backend
- Vérifiez la configuration CORS dans le backend (variable `FRONTEND_HOST`)
- Vérifiez que les services sont bien déployés et en cours d'exécution

### Problèmes d'email

- Vérifiez les credentials SMTP (EMAIL_USER, EMAIL_PASS)
- Testez la connexion SMTP depuis le container backend
- Consultez les logs du backend

---

## 📚 Ressources

- [Documentation Dokploy](https://docs.dokploy.com)
- [Docker Hub](https://hub.docker.com)
- [GitHub Actions](https://docs.github.com/actions)
- [README CI/CD](.github/README-CICD.md)

---

## 🔗 Liens utiles

- **Images Docker** : https://hub.docker.com/u/`<votre-username>`
- **Dokploy Console** : https://`<votre-dokploy>`
- **Repository GitHub** : https://github.com/`<votre-username>`/skyjo-react

---

## 📞 Support

Pour toute question ou problème :
1. Consultez les logs dans Dokploy
2. Vérifiez la configuration des variables d'environnement
3. Consultez la documentation CI/CD dans [.github/README-CICD.md](.github/README-CICD.md)
