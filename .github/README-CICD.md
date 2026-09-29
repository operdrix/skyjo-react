# CI/CD Skyjo - Build via Dokploy

Ce projet utilise **Dokploy** pour le build et le déploiement continu.

## 🏗️ Architecture de déploiement

Contrairement à une approche classique avec GitHub Actions + Docker Hub, ce projet utilise Dokploy pour :
- **Build automatique** : Dokploy build directement depuis GitHub
- **Déploiement** : Gestion complète de l'orchestration des services
- **Surveillance** : Auto-deploy sur push vers `main` (si activé)

## 🔄 Workflow

```
GitHub (push sur main)
    ↓
Dokploy (détecte le changement)
    ↓
Build depuis Dockerfile
    ↓
Déploiement automatique
```

## 📦 Services

3 services sont définis dans Dokploy :

### 1. Database (MySQL)
- Service géré directement par Dokploy
- Pas de build nécessaire

### 2. Backend
- **Source** : GitHub → branche `main` → context `./backend`
- **Build** : Via [backend/Dockerfile](../backend/Dockerfile)
- **Variables** : Définies dans Dokploy (Environment)

### 3. Frontend
- **Source** : GitHub → branche `main` → context `./frontend`
- **Build** : Via [frontend/Dockerfile](../frontend/Dockerfile)
- **Variables** : Définies dans Dokploy (Build Args)

## 🌿 Flux de branches

```
feat/* ou fix/*  →  PR vers dev (branche par défaut)  →  PR de release dev → main  →  Dokploy
```

- `dev` : intégration de toutes les nouveautés, PR validées par `validate-pr.yml`.
- `main` : version stable, c'est elle que Dokploy déploie (la recette peut suivre `dev` en changeant la branche source du service dans Dokploy).

## 🚀 Pour déployer

### Déploiement automatique (recommandé)

1. Activez **Auto Deploy** dans chaque service Dokploy
2. Push votre code sur la branche déployée (`main`)
3. Dokploy détecte le changement et rebuild automatiquement

### Déploiement manuel

1. Push votre code sur `main`
2. Allez dans Dokploy → Service concerné
3. Cliquez sur **Redeploy**

## 📄 Documentation complète

Pour la configuration détaillée de chaque service, consultez :

👉 **[README-DOKPLOY.md](../README-DOKPLOY.md)** à la racine du projet

Ce fichier contient :
- Configuration complète de chaque service
- Liste exhaustive des variables d'environnement
- Build Args pour le frontend
- Dépannage et bonnes pratiques

## 🔧 Pas de GitHub Actions

Ce projet n'utilise **pas** de workflow GitHub Actions car :
- Dokploy gère le build directement depuis GitHub
- Pas besoin de pousser les images sur Docker Hub
- Simplification du pipeline CI/CD

## 📋 Fichiers de référence

- [deploy/docker-compose.yml](../deploy/docker-compose.yml) : Structure de référence des services
- [backend/Dockerfile](../backend/Dockerfile) : Dockerfile du backend
- [frontend/Dockerfile](../frontend/Dockerfile) : Dockerfile du frontend

## ✅ Avantages de cette approche

1. **Simplicité** : Pas de gestion de registry Docker
2. **Rapidité** : Build et déploiement en un seul endroit
3. **Traçabilité** : Logs de build et déploiement centralisés dans Dokploy
4. **Coût** : Pas besoin de service externe (Docker Hub, etc.)

---

Pour toute question sur le déploiement, consultez le [README-DOKPLOY.md](../README-DOKPLOY.md) complet.
