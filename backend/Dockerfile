FROM node:20
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
# Les variables d'environnement seront fournies via docker-compose
EXPOSE 3000
CMD ["node", "dist/server.js"]
