# Build stage
FROM node:20 AS builder
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./
RUN npm ci

# Copier le code source
COPY . .

# Variables d'environnement pour Vite (à définir dans Dokploy Build Args)
ARG VITE_BACKEND_HOST
ARG VITE_BACKEND_WS
ENV VITE_BACKEND_HOST=${VITE_BACKEND_HOST}
ENV VITE_BACKEND_WS=${VITE_BACKEND_WS}

# Build de l'application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copier les fichiers buildés
COPY --from=builder /app/dist /usr/share/nginx/html

# Copier la configuration nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
