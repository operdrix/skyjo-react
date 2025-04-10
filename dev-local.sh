#!/bin/bash

# Définir la variable d'environnement pour le build (sans le /api)
export VITE_BACKEND_HOST=http://localhost:3000

# Lancer MySQL via Docker Compose
cd deploy
docker compose up -d mysql

# Lancer le backend en mode dev
cd ../backend
npm install
npm run dev &

# Lancer le frontend en mode dev
cd ../frontend
npm install
npm run dev 