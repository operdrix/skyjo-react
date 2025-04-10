#!/bin/bash

# Définir la variable d'environnement pour le build (sans le /api)
export VITE_BACKEND_HOST=http://localhost:3000

# Construire les images locales
docker build -t skyjo-frontend:local --build-arg VITE_BACKEND_HOST=$VITE_BACKEND_HOST ./frontend
docker build -t skyjo-backend:local ./backend

# Lancer les conteneurs avec docker-compose
cd deploy
docker-compose up 