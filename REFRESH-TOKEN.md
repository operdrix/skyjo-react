# Système de Refresh Token

## 📋 Vue d'ensemble

Le système d'authentification utilise maintenant un double système de tokens pour améliorer la sécurité :

- **Access Token** : Token de courte durée (15 minutes) utilisé pour l'authentification des requêtes
- **Refresh Token** : Token de longue durée (14 jours) utilisé uniquement pour renouveler l'access token

## 🔒 Avantages de sécurité

1. **Durée de vie limitée** : L'access token expire après 15 minutes, limitant la fenêtre d'exploitation en cas de vol
2. **Refresh automatique** : Le frontend renouvelle automatiquement l'access token de manière transparente
3. **Isolation des tokens** : Le refresh token n'est jamais envoyé sauf pour renouveler l'access token
4. **Cookies httpOnly** : Les deux tokens sont stockés dans des cookies httpOnly (inaccessibles au JavaScript)

## 🏗️ Architecture

### Backend

#### Cookies créés au login
```javascript
// Access Token (15 minutes)
accessToken: {
  httpOnly: true,
  secure: production,
  sameSite: "strict",
  maxAge: 900 // 15 minutes
}

// Refresh Token (14 jours)
refreshToken: {
  httpOnly: true,
  secure: production,
  sameSite: "strict",
  maxAge: 1209600 // 14 jours
}
```

#### Routes

**POST /api/login**
- Crée un access token (15 min) et un refresh token (14 jours)
- Définit les deux cookies httpOnly
- Retourne les informations utilisateur

**POST /api/auth/refresh**
- Vérifie le refresh token depuis le cookie
- Crée un nouvel access token (15 min)
- Met à jour le cookie accessToken
- Utilisée automatiquement par le frontend

**POST /api/logout**
- Ajoute les deux tokens à la blacklist
- Supprime les deux cookies
- Déconnecte complètement l'utilisateur

#### Middleware authenticate
- Lit l'access token depuis le cookie `accessToken`
- Vérifie la validité et l'expiration
- Rejette avec 401 si invalide/expiré

### Frontend

#### Intercepteur automatique (apiService.ts)

Le service API gère automatiquement le refresh des tokens :

1. **Détection du 401** : Lorsqu'une requête reçoit un 401
2. **Appel du refresh** : Appelle `/api/auth/refresh` avec le refresh token
3. **Retry automatique** : Si le refresh réussit, relance la requête originale
4. **Gestion des concurrences** : Si plusieurs requêtes échouent simultanément, un seul refresh est effectué

```typescript
// Exemple de flux
1. GET /api/users → 401 (access token expiré)
2. POST /api/auth/refresh → 200 (nouveau access token)
3. GET /api/users → 200 (retry avec nouveau token)
```

#### File d'attente des requêtes

Si plusieurs requêtes reçoivent un 401 pendant un refresh en cours :
- Elles sont mises en file d'attente
- Une fois le refresh terminé, elles sont toutes rejouées
- Évite les appels de refresh multiples simultanés

## 🔄 Flux complet

### Connexion utilisateur
```
1. POST /api/login (email + password)
   ↓
2. Backend crée accessToken (15min) + refreshToken (14j)
   ↓
3. Backend définit 2 cookies httpOnly
   ↓
4. Frontend reçoit les infos utilisateur
```

### Requête authentifiée (token valide)
```
1. GET /api/users (avec cookie accessToken)
   ↓
2. Middleware vérifie l'access token
   ↓
3. Retourne les données
```

### Requête authentifiée (token expiré)
```
1. GET /api/users (access token expiré)
   ↓
2. Backend retourne 401
   ↓
3. Frontend détecte 401 → appelle /api/auth/refresh
   ↓
4. Backend vérifie refresh token → crée nouvel access token
   ↓
5. Frontend reçoit nouveau cookie accessToken
   ↓
6. Frontend relance GET /api/users (avec nouveau token)
   ↓
7. Succès
```

### Déconnexion
```
1. POST /api/logout
   ↓
2. Backend ajoute les 2 tokens à la blacklist
   ↓
3. Backend supprime les 2 cookies
   ↓
4. Frontend redirige vers /login
```

## 🧪 Tester le système

### Test 1 : Connexion normale
```bash
# Se connecter
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  -c cookies.txt

# Vérifier qu'on a bien 2 cookies
cat cookies.txt
# Devrait contenir accessToken et refreshToken
```

### Test 2 : Requête authentifiée
```bash
# Faire une requête avec les cookies
curl http://localhost:3000/api/users \
  -b cookies.txt
```

### Test 3 : Refresh automatique (simuler expiration)
1. Attendre 15+ minutes après connexion
2. Faire une requête via l'application frontend
3. Observer dans les DevTools (Network) :
   - Requête originale → 401
   - Appel automatique à `/api/auth/refresh` → 200
   - Retry de la requête originale → 200

### Test 4 : Expiration du refresh token
1. Modifier temporairement `expiresIn: "14d"` → `"10s"` dans login
2. Se connecter
3. Attendre 10+ secondes
4. Faire une requête → 401 définitif + déconnexion automatique

## 🔧 Configuration

### Variables d'environnement

#### Backend (.env)
```bash
JWT_SECRET=votre-secret-jwt-super-secret
COOKIE_SECRET=votre-secret-cookie-super-secret
NODE_ENV=production # Pour activer secure: true sur les cookies
```

### Ajuster les durées de vie

#### Backend (src/routes/users.js)
```javascript
// Modifier l'expiration de l'access token
{ expiresIn: "15m" } // 15 minutes (recommandé: 5-30 min)

// Modifier l'expiration du refresh token
{ expiresIn: "14d" } // 14 jours (recommandé: 7-30 jours)
```

## 🚨 Gestion des erreurs

### Frontend
- **401 sur auth/verify** : Normal si pas connecté, ne déclenche pas de logout
- **401 sur autre route** : Tente un refresh → logout si échec
- **Refresh échoué** : Logout automatique + message "Session expirée"

### Backend
- **Token manquant** : 401 "Access token manquant"
- **Token expiré** : 401 "Access token invalide ou expiré"
- **Token blacklisté** : 401 "Access token invalide"
- **Refresh token invalide** : 401 "Refresh token invalide ou expiré"

## 📊 Monitoring

### Logs à surveiller en production

```javascript
// Ajouter des logs dans le refresh endpoint (optionnel)
console.log(`[REFRESH] User ${decoded.id} refreshed access token`);

// Compteur de refresh par utilisateur
// Utile pour détecter des comportements anormaux
```

### Nettoyage de la blacklist

⚠️ **Important** : La blacklist en mémoire (`blacklistedTokens[]`) sera vidée au redémarrage du serveur.

**Pour la production**, il est recommandé de :
1. Utiliser Redis pour stocker la blacklist
2. Définir un TTL = durée de vie du refresh token (14 jours)
3. Nettoyer automatiquement les tokens expirés

```javascript
// Exemple avec Redis (à implémenter)
await redis.setex(`blacklist:${token}`, 14 * 24 * 60 * 60, '1');
const isBlacklisted = await redis.exists(`blacklist:${token}`);
```

## ✅ Checklist de déploiement

- [ ] JWT_SECRET configuré en production (minimum 32 caractères)
- [ ] COOKIE_SECRET configuré en production (minimum 32 caractères)
- [ ] NODE_ENV=production pour activer les cookies secure
- [ ] HTTPS activé (obligatoire pour secure cookies)
- [ ] Durées de vie des tokens adaptées aux besoins
- [ ] Blacklist en production (Redis recommandé)
- [ ] Monitoring des refresh mis en place
- [ ] Tests de bout en bout effectués

## 📝 Notes de migration

Si vous migrez depuis l'ancien système (cookie `authToken` unique) :

1. Les anciennes sessions seront invalidées (tokens incompatibles)
2. Les utilisateurs devront se reconnecter
3. Communiquer aux utilisateurs : "Pour des raisons de sécurité, veuillez vous reconnecter"

## 🔗 Ressources

- [RFC 6749 - OAuth 2.0 (Refresh Tokens)](https://datatracker.ietf.org/doc/html/rfc6749#section-1.5)
- [OWASP - Token Storage](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
- [Fastify JWT Plugin](https://github.com/fastify/fastify-jwt)
