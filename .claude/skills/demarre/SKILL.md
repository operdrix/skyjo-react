---
name: demarre
description: Démarre la pile locale (MySQL, back, front) et vérifie qu'elle répond. Utilise sur /demarre, "lance l'appli", "démarre le projet", "run en local".
---

# /demarre

1. `make install` si `node_modules` manque dans `backend/` ou `frontend/`.
2. `make env` puis `make db-up` (MySQL :3306, Redis :6379, phpMyAdmin :8080, Mailpit SMTP :1025 / UI :8025). Variante tout-Docker : `make full` (front :8081). Docker doit tourner.
3. Lance `make back` et `make front` en tâches de fond (`run_in_background`), pas `make dev` en avant-plan.
4. Vérifie : `curl -s localhost:3000/api` renvoie `documentationURL`, et `curl -sI localhost:5173` répond 200.
5. Rapporte les URLs : front http://localhost:5173, API http://localhost:3000/api/documentation, phpMyAdmin http://localhost:8080, Mailpit http://localhost:8025. En cas d'échec, montre les dernières lignes du log du service concerné.
6. Arrêt : `make db-down` et stop des tâches de fond.
