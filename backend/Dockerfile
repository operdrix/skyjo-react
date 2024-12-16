FROM node:20
WORKDIR /app
COPY . .
RUN npm ci
EXPOSE 3000
CMD ["node", "src/server.js"]
