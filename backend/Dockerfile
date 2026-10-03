# Contexte de build : racine du dépôt (docker build -f backend/Dockerfile .)
FROM node:24
WORKDIR /app/backend

# Copier les fichiers de dépendances
COPY backend/package*.json ./
RUN npm ci

# Copier le code source et les types partagés
COPY shared ../shared
COPY backend ./

# Vérification des types, puis retrait des dépendances de dev
RUN npm run typecheck && npm prune --omit=dev

# Version de la release (fournie par la CI), affichée au démarrage
ARG APP_VERSION=dev
ENV APP_VERSION=${APP_VERSION}

# Les variables d'environnement seront fournies par Dokploy
EXPOSE 3000

# Node 24 exécute le TypeScript directement ; les migrations sont appliquées au démarrage
CMD ["node", "src/server.ts"]
