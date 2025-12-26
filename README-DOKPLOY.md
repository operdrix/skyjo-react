# 🚀 Déploiement Skyjo avec Dokploy

Ce document explique comment déployer l'application Skyjo sur Dokploy avec build automatique depuis GitHub.

## 📋 Prérequis

- Un compte Dokploy configuré avec accès à votre serveur
- Un repository GitHub avec l'application Skyjo
- Dokploy configuré pour accéder à votre repository GitHub

## 🏗️ Architecture

L'application est composée de 3 services qui seront buildés directement par Dokploy :

1. **Database (MySQL)** : Service MySQL géré par Dokploy
2. **Backend (API Node.js)** : Build depuis GitHub (branche `main`, context `./backend`)
3. **Frontend (React + Nginx)** : Build depuis GitHub (branche `main`, context `./frontend`)

## 📦 Configuration des services dans Dokploy

### 1️⃣ Service Database (MySQL)

Dans Dokploy, créez un service MySQL :

**Type de service** : Database → MySQL

**Configuration** :
- **Nom** : `skyjo-db` (gardez bien ce nom pour la connexion)
- **Version** : `8.4` ou version stable
- **Database Name** : `skyjo`
- **Username** : `skyjo_user`
- **Password** : Générer un mot de passe sécurisé
- **Root Password** : Générer un mot de passe sécurisé

**✅ Important** : Notez le nom du service (`skyjo-db`), vous en aurez besoin pour le backend.

---

### 2️⃣ Service Backend

**Type de service** : Application → GitHub

**Configuration Git** :
- **Repository** : Votre repository GitHub (ex: `olivierperdrix/skyjo-react`)
- **Branch** : `main`
- **Build Path** : `./backend`

**Configuration Docker** :
- **Dockerfile Path** : `./backend/Dockerfile`
- **Port** : `3000`

#### Variables d'environnement (Environment)

Dans l'onglet **Environment** du service backend, ajoutez :

```bash
# Database
DB_HOST=skyjo-db
DB_USER=skyjo_user
DB_PASSWORD=votre_mot_de_passe_mysql
DB_NAME=skyjo
DB_PORT=3306

# JWT
JWT_SECRET=votre_secret_jwt_tres_secure_minimum_32_caracteres

# Application
APP_URL=https://votre-domaine.com
PORT=3000
NODE_ENV=production

# Email (SMTP)
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=votre@email.com
EMAIL_PASS=votre_mot_de_passe_smtp
EMAIL_FROM=noreply@votre-domaine.com

# Frontend (pour CORS)
FRONTEND_HOST=https://votre-domaine.com
```

**⚠️ Notes importantes** :
- `DB_HOST` doit correspondre au nom du service MySQL dans Dokploy
- `JWT_SECRET` minimum 32 caractères aléatoires
- `APP_URL` et `FRONTEND_HOST` doivent pointer vers votre domaine frontend

#### Dépendances
- Ajouter une dépendance vers le service `skyjo-db`

#### Domaine (optionnel)
- Si vous voulez un domaine pour l'API : `api.votre-domaine.com`

---

### 3️⃣ Service Frontend

**Type de service** : Application → GitHub

**Configuration Git** :
- **Repository** : Votre repository GitHub (ex: `olivierperdrix/skyjo-react`)
- **Branch** : `main`
- **Build Path** : `./frontend`

**Configuration Docker** :
- **Dockerfile Path** : `./frontend/Dockerfile`
- **Port** : `80`

#### Variables de build (Build Args)

**⚠️ CRITIQUE** : Les variables `VITE_*` doivent être définies comme **Build Arguments** (pas Environment Variables).

Dans l'onglet **Build Args** du service frontend, ajoutez :

```bash
VITE_BACKEND_HOST=https://api.votre-domaine.com
VITE_BACKEND_WS=wss://api.votre-domaine.com
```

**Explications** :
- `VITE_BACKEND_HOST` : URL publique de votre API backend
- `VITE_BACKEND_WS` : URL WebSocket (même URL avec `wss://`)
- Ces variables sont compilées dans le JavaScript au moment du build
- Si vous les changez, vous devez rebuild le frontend

#### Domaine
- Configurez votre domaine principal : `votre-domaine.com`
- Activez SSL automatique via Let's Encrypt

#### Dépendances
- Ajouter une dépendance vers le service `skyjo-backend`

---

## 🔄 Workflow de déploiement

### 1. Déploiement initial

1. **Créez le service Database** dans Dokploy et démarrez-le
2. **Créez le service Backend** :
   - Configurez le repository GitHub
   - Ajoutez toutes les variables d'environnement
   - Lancez le build (Dokploy clone le repo et build via Dockerfile)
3. **Créez le service Frontend** :
   - Configurez le repository GitHub
   - Ajoutez les Build Args `VITE_*`
   - Configurez le domaine
   - Lancez le build

### 2. Déploiements automatiques

**Dokploy peut surveiller votre branche `main` et redéployer automatiquement** :

1. Dans chaque service (backend/frontend), activez **Auto Deploy**
2. Configurez le **webhook GitHub** si nécessaire
3. À chaque push sur `main`, Dokploy rebuildera automatiquement

### 3. Déploiements manuels

Pour déployer manuellement après un push :

1. Allez dans le service (backend ou frontend)
2. Cliquez sur **Redeploy**
3. Dokploy pull le dernier code et rebuild

---

## 📝 Résumé des variables

### Backend - Variables d'environnement (Environment)

| Variable | Description | Exemple |
|----------|-------------|---------|
| `DB_HOST` | Nom du service MySQL | `skyjo-db` |
| `DB_USER` | Utilisateur MySQL | `skyjo_user` |
| `DB_PASSWORD` | Mot de passe MySQL | `xxx` |
| `DB_NAME` | Nom de la BDD | `skyjo` |
| `DB_PORT` | Port MySQL | `3306` |
| `JWT_SECRET` | Clé JWT (32+ chars) | `xxx` |
| `APP_URL` | URL publique app | `https://skyjo.com` |
| `PORT` | Port backend | `3000` |
| `NODE_ENV` | Environnement | `production` |
| `EMAIL_HOST` | Serveur SMTP | `smtp.gmail.com` |
| `EMAIL_PORT` | Port SMTP | `587` |
| `EMAIL_USER` | User SMTP | `user@gmail.com` |
| `EMAIL_PASS` | Pass SMTP | `xxx` |
| `EMAIL_FROM` | Email expéditeur | `noreply@skyjo.com` |
| `FRONTEND_HOST` | URL frontend (CORS) | `https://skyjo.com` |

### Frontend - Build Arguments (Build Args)

| Variable | Description | Exemple |
|----------|-------------|---------|
| `VITE_BACKEND_HOST` | URL API backend | `https://api.skyjo.com` |
| `VITE_BACKEND_WS` | URL WebSocket | `wss://api.skyjo.com` |

**⚠️ Important** : Les variables `VITE_*` sont compilées au build. Si vous les changez, vous devez rebuild le frontend.

---

## 🔐 Sécurité

### Génération de secrets sécurisés

```bash
# Générer un JWT_SECRET (32+ caractères)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Ou avec OpenSSL
openssl rand -hex 32
```

### Bonnes pratiques

1. **Mots de passe** : Utilisez des mots de passe forts et uniques
2. **JWT_SECRET** : Minimum 32 caractères aléatoires
3. **SSL** : Toujours activer HTTPS en production
4. **Variables sensibles** : Ne jamais les committer dans Git
5. **Backup** : Configurer des sauvegardes automatiques de MySQL dans Dokploy
6. **Logs** : Surveiller les logs des services régulièrement

---

## 🐛 Dépannage

### Le backend ne démarre pas

**Symptômes** : Service en erreur, logs montrent "Cannot connect to database"

**Solutions** :
1. Vérifiez que le service MySQL est bien démarré
2. Vérifiez `DB_HOST` = nom exact du service MySQL dans Dokploy
3. Vérifiez les credentials (DB_USER, DB_PASSWORD)
4. Consultez les logs du backend dans Dokploy

### Le frontend ne communique pas avec le backend

**Symptômes** : Erreurs réseau dans la console du navigateur, CORS errors

**Solutions** :
1. Vérifiez que `VITE_BACKEND_HOST` pointe vers l'URL publique du backend
2. Vérifiez que `FRONTEND_HOST` dans le backend correspond à l'URL du frontend
3. Vérifiez que les services sont déployés et running
4. Testez l'API directement : `curl https://api.votre-domaine.com`

### Le build frontend échoue

**Symptômes** : Build failed dans Dokploy

**Solutions** :
1. Vérifiez que les Build Args `VITE_*` sont bien définis
2. Consultez les logs de build dans Dokploy
3. Vérifiez que le Dockerfile est correct
4. Testez le build localement : `docker build --build-arg VITE_BACKEND_HOST=xxx ./frontend`

### Les emails ne fonctionnent pas

**Symptômes** : Pas d'emails reçus (confirmation, reset password)

**Solutions** :
1. Vérifiez les credentials SMTP (EMAIL_USER, EMAIL_PASS)
2. Vérifiez le port SMTP (587 pour TLS, 465 pour SSL)
3. Vérifiez que votre provider SMTP autorise les connexions
4. Consultez les logs du backend pour les erreurs SMTP

### Changement de variables VITE_*

**Symptômes** : Vous avez changé l'URL du backend mais le frontend utilise toujours l'ancienne

**Solution** :
1. Les variables `VITE_*` sont compilées au build
2. Modifiez les Build Args dans Dokploy
3. **Rebuild** le service frontend (pas juste redéployer)

---

## 📚 Ressources

- [Documentation Dokploy](https://docs.dokploy.com)
- [Documentation Docker](https://docs.docker.com)
- [Documentation Vite](https://vitejs.dev/guide/env-and-mode.html)
- [Fichier docker-compose.yml de référence](deploy/docker-compose.yml)

---

## 🎯 Checklist de déploiement

Avant de déployer en production, vérifiez :

- [ ] Service MySQL créé et démarré
- [ ] Credentials MySQL notés et sécurisés
- [ ] JWT_SECRET généré (32+ caractères)
- [ ] Credentials SMTP configurés et testés
- [ ] Domaine(s) configuré(s) et DNS pointant vers le serveur
- [ ] SSL activé sur les domaines
- [ ] Variables d'environnement backend toutes définies
- [ ] Build Args frontend (`VITE_*`) définis
- [ ] Auto Deploy activé (optionnel)
- [ ] Sauvegarde MySQL configurée
- [ ] Tests de l'application effectués

---

## 📞 Support

Pour toute question :
1. Consultez les logs dans Dokploy (onglet Logs de chaque service)
2. Vérifiez la configuration des variables
3. Testez les connexions (DB, SMTP, API)
4. Consultez la documentation Dokploy

Bon déploiement ! 🚀
