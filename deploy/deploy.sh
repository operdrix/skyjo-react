#!/bin/bash

cd /opt/skyjo

# Pull des nouvelles images
docker compose pull

# Arrêt des conteneurs existants
docker compose down

# Démarrage des nouveaux conteneurs
docker compose up -d

# Vérification du statut
docker compose ps 