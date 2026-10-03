# Skyjo — commandes de dev local. `make help` liste les cibles.
COMPOSE = docker compose --env-file backend/.env

.DEFAULT_GOAL := help
# backend/.env est la source unique des identifiants (lus aussi par docker-compose.yml)
.PHONY: help install env db-up db-down db-reset db-generate full dev back front test lint build check clean

help: ## Liste les commandes
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk -F':.*?## ' '{printf "  %-10s %s\n", $$1, $$2}'

install: ## Installe les dépendances (back + front)
	cd backend && npm ci
	cd frontend && npm ci

env: ## Crée les .env depuis les .env.example s'ils manquent
	@test -f backend/.env || { cp backend/.env.example backend/.env; echo "backend/.env créé"; }
	@test -f frontend/.env || { cp frontend/.env.example frontend/.env; echo "frontend/.env créé"; }

db-up: env ## Démarre MySQL (:3306), phpMyAdmin (:8080) et Mailpit (:8025)
	$(COMPOSE) up -d --wait mysql
	$(COMPOSE) up -d phpmyadmin mailpit

db-down: ## Arrête toute la stack Docker (profil full inclus)
	$(COMPOSE) --profile full down

db-reset: db-up ## Vide la base de dev (jetable) et applique les migrations Drizzle
	$(COMPOSE) exec -T mysql sh -c 'mysql -uroot -p"$$MYSQL_ROOT_PASSWORD" -e "DROP DATABASE IF EXISTS $$MYSQL_DATABASE; CREATE DATABASE $$MYSQL_DATABASE; GRANT ALL PRIVILEGES ON $$MYSQL_DATABASE.* TO \`$$MYSQL_USER\`@\`%\`;"'
	cd backend && npm run db:migrate

db-generate: ## Génère une migration Drizzle depuis backend/src/db/schema.ts
	cd backend && npm run db:generate

full: env ## Lance toute la stack en images Docker (front :8081, back :3000)
	$(COMPOSE) --profile full up -d --build --wait

dev: db-up ## Lance base + back (:3000) + front (:5173)
	$(MAKE) -j2 back front

back: ## Lance le back seul (watch)
	cd backend && npm run dev

front: ## Lance le front seul (Vite)
	cd frontend && npm run dev

test: ## Lance les tests (là où le script existe)
	cd backend && npm run test --if-present
	cd frontend && npm run test --if-present

lint: ## Lint back + front
	cd backend && npm run lint
	cd frontend && npm run lint

build: ## Build back (si script) + front
	cd backend && npm run build --if-present
	cd frontend && npm run build

check: lint test build ## Porte de sortie avant commit/PR

clean: ## Supprime node_modules et dist
	rm -rf backend/node_modules frontend/node_modules frontend/dist backend/dist
