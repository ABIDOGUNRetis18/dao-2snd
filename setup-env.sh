# ==========================================
# 🚀 DAO Project - Environment Setup Script
# ==========================================
# 
# 📋 Instructions d'utilisation:
# 1. Copiez .env.example en .env.local pour le développement
# 2. Copiez .env.development en .env.local pour le développement
# 3. Copiez .env.production.example en .env.production pour la production
# 4. Lancez ce script pour vérifier la configuration
# ==========================================

#!/bin/bash

# Couleurs pour une meilleure lisibilité
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 DAO Project - Environment Setup${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""

# Fonction pour vérifier si une variable existe
check_env_var() {
    local var_name=$1
    local var_value=${!var_name}
    
    if [ -z "$var_value" ]; then
        echo -e "${RED}❌ $var_name: Non défini${NC}"
        return 1
    else
        echo -e "${GREEN}✅ $var_name: Défini${NC}"
        return 0
    fi
}

# Fonction pour vérifier les variables obligatoires
check_required_vars() {
    echo -e "${YELLOW}📋 Vérification des variables obligatoires...${NC}"
    echo ""
    
    local required_vars=(
        "NODE_ENV"
        "PORT"
        "DB_HOST"
        "DB_PORT"
        "DB_NAME"
        "DB_USER"
        "DB_PASSWORD"
        "JWT_SECRET"
        "SESSION_SECRET"
    )
    
    local missing_count=0
    
    for var in "${required_vars[@]}"; do
        if ! check_env_var "$var"; then
            ((missing_count++))
        fi
    done
    
    echo ""
    if [ $missing_count -eq 0 ]; then
        echo -e "${GREEN}✅ Toutes les variables obligatoires sont définies!${NC}"
    else
        echo -e "${RED}❌ $missing_count variables obligatoires manquantes!${NC}"
        return 1
    fi
}

# Fonction pour vérifier les variables de production
check_production_vars() {
    echo -e "${YELLOW}🏭 Vérification des variables de production...${NC}"
    echo ""
    
    local prod_vars=(
        "SENTRY_DSN"
        "AWS_ACCESS_KEY_ID"
        "AWS_SECRET_ACCESS_KEY"
        "SMTP_USER"
        "SMTP_PASSWORD"
    )
    
    local missing_count=0
    
    for var in "${prod_vars[@]}"; do
        if ! check_env_var "$var"; then
            echo -e "${YELLOW}⚠️  $var: Non défini (recommandé pour la production)${NC}"
            ((missing_count++))
        fi
    done
    
    echo ""
    if [ $missing_count -eq 0 ]; then
        echo -e "${GREEN}✅ Toutes les variables de production sont configurées!${NC}"
    else
        echo -e "${YELLOW}⚠️  $missing_count variables de production non configurées${NC}"
    fi
}

# Fonction pour vérifier la sécurité
check_security() {
    echo -e "${YELLOW}🔐 Vérification de la sécurité...${NC}"
    echo ""
    
    # Vérifier la longueur des secrets
    if [ ${#JWT_SECRET} -lt 32 ]; then
        echo -e "${RED}❌ JWT_SECRET: Trop court (minimum 32 caractères)${NC}"
    else
        echo -e "${GREEN}✅ JWT_SECRET: Longueur suffisante${NC}"
    fi
    
    if [ ${#SESSION_SECRET} -lt 32 ]; then
        echo -e "${RED}❌ SESSION_SECRET: Trop court (minimum 32 caractères)${NC}"
    else
        echo -e "${GREEN}✅ SESSION_SECRET: Longueur suffisante${NC}"
    fi
    
    # Vérifier si on est en production avec des secrets de développement
    if [ "$NODE_ENV" = "production" ]; then
        if [[ "$JWT_SECRET" == *"dev"* ]] || [[ "$JWT_SECRET" == *"developpement"* ]]; then
            echo -e "${RED}❌ JWT_SECRET: Semble être un secret de développement en production!${NC}"
        else
            echo -e "${GREEN}✅ JWT_SECRET: Ne semble pas être un secret de développement${NC}"
        fi
    fi
    
    echo ""
}

# Fonction pour afficher la configuration actuelle
show_config() {
    echo -e "${BLUE}📊 Configuration actuelle:${NC}"
    echo ""
    echo -e "${BLUE}Environnement:${NC} $NODE_ENV"
    echo -e "${BLUE}Port:${NC} $PORT"
    echo -e "${BLUE}Base de données:${NC} $DB_USER@$DB_HOST:$DB_PORT/$DB_NAME"
    echo -e "${BLUE}Frontend URL:${NC} $FRONTEND_URL"
    echo ""
}

# Fonction pour vérifier les fichiers d'environnement
check_env_files() {
    echo -e "${YELLOW}📁 Vérification des fichiers d'environnement...${NC}"
    echo ""
    
    if [ -f ".env.local" ]; then
        echo -e "${GREEN}✅ .env.local: Existe${NC}"
    else
        echo -e "${RED}❌ .env.local: Manquant${NC}"
    fi
    
    if [ -f ".env.development" ]; then
        echo -e "${GREEN}✅ .env.development: Existe${NC}"
    else
        echo -e "${YELLOW}⚠️  .env.development: Manquant${NC}"
    fi
    
    if [ -f ".env.production.example" ]; then
        echo -e "${GREEN}✅ .env.production.example: Existe${NC}"
    else
        echo -e "${YELLOW}⚠️  .env.production.example: Manquant${NC}"
    fi
    
    if [ -f ".env.example" ]; then
        echo -e "${GREEN}✅ .env.example: Existe${NC}"
    else
        echo -e "${YELLOW}⚠️  .env.example: Manquant${NC}"
    fi
    
    echo ""
}

# Point d'entrée principal
main() {
    # Charger les variables d'environnement
    if [ -f ".env.local" ]; then
        export $(cat .env.local | grep -v '^#' | xargs)
    elif [ -f ".env.development" ]; then
        export $(cat .env.development | grep -v '^#' | xargs)
    elif [ -f ".env" ]; then
        export $(cat .env | grep -v '^#' | xargs)
    fi
    
    echo -e "${BLUE}🔧 Environnement chargé: ${NC}$NODE_ENV"
    echo ""
    
    # Vérifications
    check_env_files
    show_config
    check_required_vars
    check_security
    
    if [ "$NODE_ENV" = "production" ]; then
        check_production_vars
    fi
    
    echo ""
    echo -e "${GREEN}🎉 Vérification terminée!${NC}"
    echo ""
    
    # Instructions supplémentaires
    if [ ! -f ".env.local" ]; then
        echo -e "${YELLOW}💡 Pour créer votre environnement local:${NC}"
        echo -e "${YELLOW}   cp .env.development .env.local${NC}"
        echo ""
    fi
    
    if [ "$NODE_ENV" = "production" ] && [ ! -f ".env.production" ]; then
        echo -e "${YELLOW}💡 Pour créer votre environnement de production:${NC}"
        echo -e "${YELLOW}   cp .env.production.example .env.production${NC}"
        echo -e "${YELLOW}   # Puis modifiez les valeurs marquées 🔐${NC}"
        echo ""
    fi
}

# Lancer le script
main "$@"
