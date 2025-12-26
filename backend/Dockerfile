FROM node:20
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./
RUN npm ci

# Copier le code source
COPY . .

# Les variables d'environnement seront fournies par Dokploy
EXPOSE 3000

CMD ["node", "src/server.js"]
