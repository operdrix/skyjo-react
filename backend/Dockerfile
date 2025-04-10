FROM node:20
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Les variables d'environnement seront fournies via docker-compose
EXPOSE 3000
CMD ["node", "src/server.js"]
