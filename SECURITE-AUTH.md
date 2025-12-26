# 🔒 Améliorations de Sécurité - Authentification

## 📋 Résumé des Changements

Refonte complète du système d'authentification pour corriger les vulnérabilités de sécurité identifiées lors de l'audit.

---

## 🔴 Problèmes Corrigés (CRITIQUE)

### 1. Token JWT dans localStorage → Cookies httpOnly

**Avant** ❌
- Token JWT stocké dans `localStorage`
- Vulnérable aux attaques XSS (Cross-Site Scripting)
- Token accessible via JavaScript malveillant

**Après** ✅
- Token JWT stocké dans un cookie `httpOnly`
- Inaccessible depuis JavaScript
- Cookie `secure` en production (HTTPS uniquement)
- Cookie `sameSite=strict` (protection CSRF)
- Durée de vie : 14 jours

### 2. Gestion Automatique des Erreurs 401

**Avant** ❌
- Pas de déconnexion automatique sur expiration token
- Utilisateur reste "connecté" côté client avec token invalide
- Gestion manuelle des 401 dans chaque composant

**Après** ✅
- Intercepteur global dans `apiService.ts`
- Déconnexion automatique sur erreur 401
- Redirection vers login avec message approprié

### 3. console.log Sensibles Supprimés

**Avant** ❌
- Logs de tokens, userId, passwords dans la console
- Fuite d'informations en production

**Après** ✅
- Tous les `console.log` sensibles supprimés
- Uniquement les erreurs critiques loggées

### 4. Décodage JWT Côté Client

**Avant** ❌
- Utilisation de `jwtDecode` pour extraire userId/username
- Données stockées en clair dans localStorage

**Après** ✅
- Backend renvoie directement les infos utilisateur lors du login
- Plus besoin de décoder le token côté client
- Fichier `getUserIdFromToken.ts` devenu obsolète

---

## 🔧 Changements Backend

### Nouveaux Packages
```bash
npm install @fastify/cookie
```

### Fichiers Modifiés

#### 1. `backend/src/server.js`
- Import et enregistrement de `@fastify/cookie`
- Configuration du secret cookie via `COOKIE_SECRET`
- Middleware `authenticate` modifié pour lire le token depuis :
  1. Cookie `authToken` (priorité)
  2. Header `Authorization` (fallback pour compatibilité)

#### 2. `backend/src/routes/users.js`
- **Route `/api/login`** :
  - Définit un cookie `authToken` avec les options sécurisées
  - Renvoie uniquement les infos utilisateur (pas le token)
  - Cookie valide 14 jours
  
- **Route `/api/logout`** :
  - Supprime le cookie `authToken`
  - Ajoute le token à la blacklist
  - Gère à la fois cookie et header Authorization

#### 3. `backend/src/controllers/users.js`
- `loginUser()` renvoie maintenant les infos complètes de l'utilisateur :
  - `id`, `username`, `firstname`, `lastname`, `email`, `avatar`
  - Plus besoin de décoder le JWT côté client

#### 4. `backend/.env.example`
- Ajout de `COOKIE_SECRET` avec documentation

---

## 🎨 Changements Frontend

### Nouveaux Fichiers Créés

#### 1. `frontend/src/services/apiService.ts`
Service API centralisé avec :
- Fonction `apiCall()` pour tous les appels API
- Configuration automatique de `credentials: 'include'` (cookies)
- Intercepteur 401 avec déconnexion automatique
- Méthodes raccourcies : `api.get()`, `api.post()`, `api.patch()`, `api.delete()`
- Callback de logout enregistré via `setLogoutCallback()`

### Fichiers Modifiés

#### 1. `frontend/src/context/UserContext.tsx`
**Changements majeurs** :
- ✅ Suppression complète de `localStorage` pour le token
- ✅ Ajout des nouveaux champs utilisateur : `userFirstName`, `userLastName`, `userEmail`, `userAvatar`
- ✅ Fonction `setUserData()` pour mettre à jour les infos utilisateur
- ✅ Vérification de l'authentification via `verifyAuth()` au chargement
- ✅ Logout amélioré avec gestion d'erreur
- ✅ Enregistrement du callback logout pour l'intercepteur 401

**Propriétés supprimées** :
- `token` (plus stocké localement)
- `setToken` (géré par les cookies)
- `setIsAuthentified` (mis à jour automatiquement)

**Nouvelles propriétés** :
- `userFirstName`, `userLastName`, `userEmail`, `userAvatar`
- `setUserData(userData)` : fonction pour mettre à jour les données utilisateur

#### 2. `frontend/src/services/authService.ts`
Refonte complète avec utilisation de `apiService` :
- `verifyAuth()` : Vérifie si l'utilisateur est authentifié
- `login(email, password)` : Connexion utilisateur
- `logout()` : Déconnexion utilisateur
- `register(userData)` : Inscription utilisateur

#### 3. Pages Authentification
Toutes les pages ont été migrées vers `apiService` :
- ✅ `Login.tsx` : Utilise `login()` du authService
- ✅ `Register.tsx` : Utilise `register()` du authService
- ✅ `RequestResetPassword.tsx` : Utilise `api.post()`
- ✅ `ResetPassword.tsx` : Utilise `api.post()`
- ✅ `VerifyEmail.tsx` : Utilise `api.get()`

**Suppressions** :
- Tous les `console.log` sensibles
- Tous les appels `fetch()` directs
- Import de `buildApiUrl` (géré par apiService)
- Gestion manuelle des erreurs 401

#### 4. Autres Pages
- ✅ `App.tsx` : Migration vers `api.post()`
- ✅ `Dashboard.tsx` : Migration vers `api.get()` et `api.delete()`
- ✅ `GameLayout.tsx` : Suppression des logs

---

## 🚀 Migration pour le Déploiement

### Variables d'Environnement Backend

Ajouter dans Dokploy (service backend) :
```env
COOKIE_SECRET=<générer un secret aléatoire de 32+ caractères>
```

**Générer un secret sécurisé** :
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Configuration CORS

Le backend autorise automatiquement :
- `process.env.FRONTEND_HOST` (production)
- `http://localhost:5173` (dev Vite)
- `http://localhost:4173` (preview Vite)

Avec `credentials: true` pour permettre l'envoi des cookies.

### Cookies en Production

Les cookies sont configurés avec :
- `httpOnly: true` → Inaccessible via JavaScript
- `secure: true` en production → HTTPS uniquement
- `sameSite: 'strict'` → Protection CSRF
- `maxAge: 14 jours`

---

## ✅ Checklist de Sécurité (Mise à Jour)

| ✅ | Token JWT en `httpOnly` cookie |
| ✅ | Auto-logout sur expiration token |
| ✅ | Intercepteur 401 global |
| ✅ | HTTPS activé en production |
| ✅ | Suppression des `console.log` sensibles |
| ✅ | CORS configuré correctement avec credentials |
| ✅ | Validation des formulaires (Yup) |
| ✅ | Service API centralisé |
| ✅ | Gestion d'erreur cohérente |

---

## 📝 Notes Techniques

### Compatibilité

Le middleware `authenticate` supporte toujours les tokens via header `Authorization` pour compatibilité avec :
- Tests Swagger UI
- Appels API externes
- WebSocket (Socket.io utilise les headers)

### WebSocket

Les WebSocket utilisent toujours le token via headers (pas de cookies dans WebSocket).
Le token est toujours disponible via le cookie lors de l'upgrade HTTP → WS.

### Logout

Le logout fait maintenant 2 choses :
1. Supprime le cookie `authToken`
2. Ajoute le token à la blacklist backend

Même si l'appel API échoue, l'utilisateur est déconnecté localement (le cookie est supprimé).

---

## 🔮 Améliorations Futures

### À Considérer

1. **Refresh Token** : Implémenter un système de refresh token pour prolonger les sessions sans redemander le mot de passe
2. **Rate Limiting** : Limiter les tentatives de connexion (protection brute-force)
3. **2FA (Two-Factor Authentication)** : Ajouter une authentification à deux facteurs
4. **CSP Headers** : Configurer Content-Security-Policy dans Nginx
5. **Audit Logs** : Logger les connexions/déconnexions pour traçabilité

---

## 🧪 Tests Recommandés

### Tests Manuels

1. **Login Flow** :
   - ✅ Connexion avec credentials valides
   - ✅ Cookie `authToken` défini dans les DevTools
   - ✅ Redirection vers la page demandée
   - ✅ Infos utilisateur affichées dans le header

2. **Logout Flow** :
   - ✅ Déconnexion via le bouton
   - ✅ Cookie supprimé
   - ✅ Redirection vers la page d'accueil

3. **Session Expirée** :
   - ✅ Supprimer manuellement le cookie
   - ✅ Naviguer vers une page protégée
   - ✅ Déconnexion automatique + message
   - ✅ Redirection vers login

4. **Register Flow** :
   - ✅ Inscription avec tous les champs
   - ✅ Email de vérification reçu
   - ✅ Vérification d'email fonctionnelle
   - ✅ Connexion après vérification

### Tests de Sécurité

1. **XSS** : Vérifier que le token n'est pas accessible via `document.cookie`
2. **CSRF** : Tester avec `sameSite=strict`
3. **Token Blacklist** : Se déconnecter et vérifier qu'on ne peut plus utiliser l'ancien token
4. **401 Auto-Logout** : Forcer une erreur 401 et vérifier la déconnexion automatique

---

## 👤 Auteur

Refactoring effectué le 26 décembre 2025
Audit et corrections : GitHub Copilot
