# Contexte de build : racine du dépôt (docker build -f frontend/Dockerfile .)
# Build stage
FROM node:24 AS builder
WORKDIR /app/frontend

# Copier les fichiers de dépendances
COPY frontend/package*.json ./
RUN npm ci

# Copier le code source et les types partagés
COPY shared ../shared
COPY frontend ./

# Variables Vite figées dans le bundle (build args fournis par la CI de release)
ARG VITE_BACKEND_HOST
ARG VITE_BACKEND_WS
ARG VITE_APP_VERSION
ENV VITE_BACKEND_HOST=${VITE_BACKEND_HOST}
ENV VITE_BACKEND_WS=${VITE_BACKEND_WS}
ENV VITE_APP_VERSION=${VITE_APP_VERSION}

# Build de l'application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copier les fichiers buildés
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

# Copier la configuration nginx
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
