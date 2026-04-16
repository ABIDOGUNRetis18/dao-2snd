#!/bin/bash

# ==========================================
# 🚀 DAO Project - Script de Déploiement Docker
# ==========================================

set -e  # Arrêter le script en cas d'erreur

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonctions de logging
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# ==========================================
# 📋 Vérifications pré-déploiement
# ==========================================
check_prerequisites() {
    log_info "Vérification des prérequis..."
    
    # Vérifier Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker n'est pas installé"
        exit 1
    fi
    
    # Vérifier Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose n'est pas installé"
        exit 1
    fi
    
    # Vérifier le fichier .env.production
    if [ ! -f ".env.production" ]; then
        log_error "Fichier .env.production non trouvé"
        exit 1
    fi
    
    log_success "Prérequis vérifiés avec succès"
}

# ==========================================
# 🧹 Nettoyage des anciens conteneurs
# ==========================================
cleanup() {
    log_info "Nettoyage des anciens conteneurs et images..."
    
    # Arrêter et supprimer les conteneurs existants
    docker-compose down --remove-orphans || true
    
    # Supprimer les images non utilisées
    docker image prune -f || true
    
    log_success "Nettoyage terminé"
}

# ==========================================
# 🔨 Construction des images
# ==========================================
build_images() {
    log_info "Construction des images Docker..."
    
    # Construction avec cache pour optimiser
    docker-compose build --parallel
    
    log_success "Images construites avec succès"
}

# ==========================================
# 🚀 Démarrage des services
# ==========================================
start_services() {
    log_info "Démarrage des services..."
    
    # Démarrer les services de base (MySQL + Backend)
    docker-compose up -d mysql backend
    
    # Attendre que la base de données soit prête
    log_info "Attente de la base de données..."
    sleep 30
    
    # Vérifier que le backend répond
    log_info "Vérification du backend..."
    for i in {1..10}; do
        if curl -f http://localhost:${APP_PORT:-1002}/api/test &> /dev/null; then
            log_success "Backend opérationnel"
            break
        fi
        if [ $i -eq 10 ]; then
            log_error "Backend ne répond pas après 10 tentatives"
            exit 1
        fi
        log_info "Tentative $i/10..."
        sleep 5
    done
    
    log_success "Services de base démarrés avec succès"
}

# ==========================================
# 🌐 Démarrage optionnel du frontend
# ==========================================
start_frontend() {
    if [ "$1" = "--with-frontend" ]; then
        log_info "Démarrage du frontend..."
        docker-compose --profile frontend up -d frontend
        log_success "Frontend démarré sur http://localhost:3000"
    fi
}

# ==========================================
# 📊 Affichage du statut
# ==========================================
show_status() {
    log_info "Statut des services:"
    docker-compose ps
    
    echo ""
    log_info "URLs d'accès:"
    echo "🔧 Backend API: http://localhost:${APP_PORT:-1002}"
    echo "🗄️ MySQL: localhost:${MYSQL_PORT:-3306}"
    
    if [ "$1" = "--with-frontend" ]; then
        echo "🌐 Frontend: http://localhost:3000"
    fi
    
    echo ""
    log_info "Commandes utiles:"
    echo "📋 Voir les logs: docker-compose logs -f"
    echo "🛑 Arrêter: docker-compose down"
    echo "🔄 Redémarrer: docker-compose restart"
}

# ==========================================
# 🎯 Fonction principale
# ==========================================
main() {
    log_info "Début du déploiement de l'application DAO..."
    
    check_prerequisites
    cleanup
    build_images
    start_services
    start_frontend "$1"
    show_status "$1"
    
    log_success "Déploiement terminé avec succès !"
    log_warning "N'oubliez pas de changer les secrets par défaut dans .env.production"
}

# ==========================================
# 🚀 Exécution
# ==========================================
main "$@"
