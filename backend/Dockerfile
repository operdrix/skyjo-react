# Étape de build
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Étape de production
FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY package*.json ./
# Installation des dépendances de production uniquement
RUN npm ci --omit=dev
# Les variables d'environnement seront fournies via docker-compose
EXPOSE 3000
CMD ["node", "dist/server.js"]
