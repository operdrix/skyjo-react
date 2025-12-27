# 🔍 Audit de l'application Skyjo - Décembre 2025

## 🔴 CRITIQUE - À corriger immédiatement

### ✅ 1. Fichiers .env dans Git (CORRIGÉ)
- ~~`deploy/.env` était tracké par Git~~
- **Correction** : Ajout d'un `.gitignore` complet + suppression de Git
- **Reste à faire** : `git commit` pour valider

### 2. Blacklist des tokens en mémoire
**Problème** : `blacklistedTokens = []` est réinitialisé à chaque restart du serveur

**Risque** : Un utilisateur déconnecté peut se reconnecter avec son ancien token après un redémarrage

**Solutions** :
- **Court terme** : Réduire la durée de vie des tokens (déjà fait : 15 min)
- **Long terme** : Redis pour persister la blacklist
  ```bash
  npm install redis
  ```
  ```javascript
  // Exemple
  await redis.setex(`blacklist:${token}`, expiresIn, '1');
  const isBlacklisted = await redis.exists(`blacklist:${token}`);
  ```

### 3. Secrets par défaut en production
**Fichiers concernés** : `backend/src/server.js`

```javascript
secret: process.env.COOKIE_SECRET || "mon-secret-de-cookie-super-secret"
secret: process.env.JWT_SECRET || "unanneaupourlesgouvernertous"
```

**Risque** : Si les variables d'environnement ne sont pas définies en production, les secrets par défaut sont utilisés

**Solution** : Refuser de démarrer si les secrets ne sont pas définis
```javascript
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.error('JWT_SECRET must be defined in production');
  process.exit(1);
}
```

## 🟡 IMPORTANT - À améliorer rapidement

### 4. Console.log en production
**Trouvés** : 50+ console.log/error dans le code

**Impact** : Performance, logs inutiles, exposition d'informations sensibles

**Solution** : Utiliser un système de logging structuré
```bash
npm install pino pino-pretty
```

### 5. Pas de rate limiting
**Routes exposées** :
- `/api/login` : Pas de protection contre le brute force
- `/api/register` : Spam possible
- `/api/auth/refresh` : Abus possible

**Solution** : Ajouter @fastify/rate-limit
```javascript
await app.register(import('@fastify/rate-limit'), {
  max: 5,
  timeWindow: '1 minute',
  cache: 10000
})

app.post('/api/login', {
  config: { rateLimit: { max: 5, timeWindow: '5 minutes' } }
  // ...
})
```

### 6. Validation des données insuffisante
**Exemple** : `createGame(userId, privateRoom)`
- `userId` peut être n'importe quelle string
- Pas de vérification que l'utilisateur existe

**Solution** : Valider que l'userId correspond à l'utilisateur authentifié
```javascript
if (request.user.id !== userId) {
  return reply.status(403).send({ error: 'Unauthorized' });
}
```

### 7. WebSocket sans authentification
**Fichier** : `backend/src/websockets/websockets.js`

```javascript
socket.on("player-joined-game", async ({ room, userId }) => {
  // Pas de vérification que le socket correspond vraiment à cet userId !
```

**Risque** : Un utilisateur peut se faire passer pour un autre

**Solution** : Authentifier les WebSocket
```javascript
app.io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    const decoded = app.jwt.verify(token);
    socket.userId = decoded.id;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});
```

### 8. Variables d'environnement sensibles dans deploy/.env
**Contenu exposé** :
```
DB_PASSWORD=skyjo_password
JWT_SECRET=dev_secret_key
```

**Solution** : Ce fichier devrait être un `.env.example` avec des valeurs factices

## 🟢 SUGGESTIONS - Améliorations recommandées

### 9. Gestion d'erreurs
- Créer un middleware global de gestion d'erreurs
- Standardiser les réponses d'erreur

### 10. Tests
- Aucun test unitaire/intégration trouvé
- Ajouter Jest ou Vitest pour le frontend
- Ajouter des tests pour les routes critiques (login, game logic)

### 11. Optimisations frontend
- Beaucoup de `console.log` dans les composants
- Certains useEffect pourraient être optimisés
- Considérer React Query pour la gestion du cache API

### 12. Documentation API
- ✅ Swagger en place
- Manque : exemples de réponses d'erreur dans les schémas

### 13. Monitoring
- Pas de système de monitoring/alerting
- Recommandé : Sentry pour le tracking d'erreurs
- PM2 pour le process management en production

### 14. Performance BDD
- Pool de connexions configuré ✅
- Manque : indexes sur les colonnes fréquemment requêtées
- Considérer : Caching avec Redis pour les parties actives

### 15. CORS
```javascript
origin: [process.env.FRONTEND_HOST || "http://localhost:5173", "http://localhost:4173"]
```
- Hardcodé pour le dev ✅
- En production, utiliser uniquement `process.env.FRONTEND_HOST`

## 📊 Score de sécurité actuel

| Catégorie | Score | Détails |
|-----------|-------|---------|
| Authentification | 8/10 | ✅ Refresh token, httpOnly cookies, blacklist |
| Autorisation | 6/10 | ⚠️ WebSocket non authentifiés, validation userId |
| Secrets | 7/10 | ⚠️ Fallback par défaut, blacklist en RAM |
| Validation | 6/10 | ⚠️ Validation basique, pas de sanitization |
| Rate Limiting | 0/10 | ❌ Aucune protection |
| Logging | 5/10 | ⚠️ Console.log partout, pas structuré |
| **TOTAL** | **6.3/10** | 🟡 Bon mais peut mieux faire |

## ✅ Points forts identifiés

1. ✅ **Architecture moderne** : Fastify + React + TypeScript
2. ✅ **Système d'auth robuste** : Refresh token, httpOnly cookies
3. ✅ **Documentation API** : Swagger configuré
4. ✅ **WebSocket** : Communication temps réel bien implémentée
5. ✅ **CORS** : Correctement configuré pour dev et prod
6. ✅ **Gestion des emails** : Templates MJML + Nodemailer

## 🎯 Priorités recommandées

### Court terme (cette semaine)
1. ✅ Corriger le .gitignore
2. Ajouter rate limiting sur les routes sensibles
3. Authentifier les WebSocket
4. Valider que userId = user authentifié

### Moyen terme (ce mois)
1. Remplacer console.log par un vrai système de logging
2. Ajouter Redis pour la blacklist
3. Vérifier les secrets en production (exit si manquants)
4. Nettoyer les console.log du frontend

### Long terme
1. Ajouter des tests
2. Monitoring avec Sentry
3. Optimisations performance BDD
4. CI/CD avec tests automatisés
