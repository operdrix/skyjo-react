#!/bin/sh

# Ce script remplace les variables d'environnement dans les fichiers static si nécessaire
# Utile si vous devez injecter des variables d'environnement au moment du lancement du conteneur
# Par exemple, VITE_BACKEND_HOST peut être définie différemment selon l'environnement

# Script basé sur https://github.com/nginxinc/docker-nginx/tree/master/entrypoint

set -e

REGEX='__([A-Z0-9_]+)__'
VARS_TO_REPLACE='VITE_BACKEND_HOST VITE_BACKEND_WS'

echo "Checking for environment variables in the static files"

# Trouver tous les fichiers index.html et les .js dans le répertoire d'hébergement de nginx
find /usr/share/nginx/html -type f -name "*.html" -o -name "*.js" | while read -r file; do
  # Vérifier si le fichier contient des variables à remplacer
  if grep -q "__${VARS_TO_REPLACE}__" "$file"; then
    echo "Replacing environment variables in $file"
    
    # Remplacer les variables d'environnement
    envsubst "$(printf '${%s} ' $VARS_TO_REPLACE)" < "$file" > "$file.tmp" && mv "$file.tmp" "$file"
  fi
done

echo "Environment variable check complete" 