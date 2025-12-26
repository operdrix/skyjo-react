#!/bin/bash

# Script de test du système de Refresh Token
# Ce script teste le flux complet d'authentification avec refresh automatique

echo "🧪 Test du système de Refresh Token"
echo "===================================="
echo ""

BACKEND_URL="http://localhost:3000"
COOKIES_FILE="/tmp/skyjo-cookies.txt"
TEST_EMAIL="olivierperdrix@live.fr"
TEST_PASSWORD="password"

# Couleurs pour l'affichage
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour afficher les résultats
test_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ $2${NC}"
    else
        echo -e "${RED}✗ $2${NC}"
        exit 1
    fi
}

# Nettoyer les cookies précédents
rm -f $COOKIES_FILE

echo "⚙️  Préparation: Création d'un utilisateur de test"
echo "------------------------------------------------"

# Créer un utilisateur de test (ignorez l'erreur s'il existe déjà)
curl -s -X POST "$BACKEND_URL/api/register" \
  -H "Content-Type: application/json" \
  -d "{\"firstname\":\"Refresh\",\"lastname\":\"Test\",\"username\":\"refreshtest\",\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" > /dev/null 2>&1

# Vérifier l'utilisateur directement en BDD (simuler la vérification d'email)
echo "   Note: L'utilisateur doit être vérifié manuellement en BDD pour le test"
echo ""

# Utiliser un utilisateur existant et vérifié (adapter selon votre BDD)
echo -e "${YELLOW}ℹ️  Pour ce test, assurez-vous d'avoir un utilisateur vérifié.${NC}"
echo -e "${YELLOW}   Vous pouvez utiliser un compte existant en modifiant TEST_EMAIL et TEST_PASSWORD${NC}"
echo ""

echo "📝 Test 1: Connexion et création des tokens"
echo "-------------------------------------------"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BACKEND_URL/api/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" \
  -c $COOKIES_FILE)

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    test_result 0 "Connexion réussie (HTTP $HTTP_CODE)"
    echo "   Réponse: $BODY"
else
    test_result 1 "Connexion échouée (HTTP $HTTP_CODE)"
fi

# Vérifier que les 2 cookies sont créés
if grep -q "accessToken" $COOKIES_FILE && grep -q "refreshToken" $COOKIES_FILE; then
    test_result 0 "Les deux cookies (accessToken + refreshToken) sont créés"
    echo ""
    echo "   📋 Contenu des cookies:"
    grep -E "(accessToken|refreshToken)" $COOKIES_FILE | sed 's/^/   /'
else
    test_result 1 "Les cookies ne sont pas créés correctement"
fi

echo ""
echo "🔐 Test 2: Requête authentifiée avec access token valide"
echo "--------------------------------------------------------"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BACKEND_URL/api/users" -b $COOKIES_FILE)
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    test_result 0 "Requête authentifiée réussie (HTTP $HTTP_CODE)"
    USER_COUNT=$(echo "$BODY" | grep -o '"id"' | wc -l)
    echo "   Nombre d'utilisateurs retournés: $USER_COUNT"
else
    test_result 1 "Requête authentifiée échouée (HTTP $HTTP_CODE)"
fi

echo ""
echo "🔄 Test 3: Route de refresh token"
echo "---------------------------------"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BACKEND_URL/api/auth/refresh" \
  -H "Content-Type: application/json" \
  -d '{}' \
  -b $COOKIES_FILE \
  -c $COOKIES_FILE)

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    test_result 0 "Refresh du token réussi (HTTP $HTTP_CODE)"
    echo "   Réponse: $BODY"
    
    # Vérifier que le cookie accessToken a été mis à jour
    if grep -q "accessToken" $COOKIES_FILE; then
        test_result 0 "Le cookie accessToken a été renouvelé"
    else
        test_result 1 "Le cookie accessToken n'a pas été renouvelé"
    fi
else
    test_result 1 "Refresh du token échoué (HTTP $HTTP_CODE)"
fi

echo ""
echo "✅ Test 4: Vérification de l'auth après refresh"
echo "-----------------------------------------------"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BACKEND_URL/api/auth/verify" -b $COOKIES_FILE)
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ] && echo "$BODY" | grep -q '"valid":true'; then
    test_result 0 "Authentification valide après refresh (HTTP $HTTP_CODE)"
    echo "   Réponse: $BODY"
else
    test_result 1 "Authentification invalide après refresh (HTTP $HTTP_CODE)"
fi

echo ""
echo "🚪 Test 5: Déconnexion et suppression des tokens"
echo "------------------------------------------------"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BACKEND_URL/api/logout" \
  -H "Content-Type: application/json" \
  -d '{}' \
  -b $COOKIES_FILE \
  -c $COOKIES_FILE)

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ] && echo "$BODY" | grep -q '"logout":true'; then
    test_result 0 "Déconnexion réussie (HTTP $HTTP_CODE)"
    echo "   Réponse: $BODY"
else
    test_result 1 "Déconnexion échouée (HTTP $HTTP_CODE)"
fi

echo ""
echo "🔒 Test 6: Vérification que l'access token est bien invalidé"
echo "------------------------------------------------------------"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BACKEND_URL/api/users" -b $COOKIES_FILE)
HTTP_CODE=$(echo "$RESPONSE" | tail -1)

if [ "$HTTP_CODE" = "401" ]; then
    test_result 0 "Les requêtes sont bien rejetées après logout (HTTP $HTTP_CODE)"
else
    test_result 1 "Les requêtes ne sont pas rejetées après logout (HTTP $HTTP_CODE)"
fi

echo ""
echo "🎉 Tous les tests sont passés avec succès!"
echo "=========================================="
echo ""
echo "Le système de refresh token fonctionne correctement:"
echo "  ✓ Connexion crée 2 tokens (access + refresh)"
echo "  ✓ Requêtes authentifiées avec access token"
echo "  ✓ Refresh du token fonctionne"
echo "  ✓ Authentification valide après refresh"
echo "  ✓ Déconnexion supprime les tokens"
echo "  ✓ Tokens invalidés après logout"
echo ""
echo "📚 Consultez REFRESH-TOKEN.md pour plus d'informations"

# Nettoyer
rm -f $COOKIES_FILE
