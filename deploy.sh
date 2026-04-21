#!/bin/bash

# ==========================================
# 🚀 DAO Project - Script de Déploiement Docker (production)
# ==========================================

set -euo pipefail

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

ENV_FILE="${ENV_FILE:-.env.production}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"

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
    
    # Vérifier Docker Compose v2
    if ! docker compose version &> /dev/null; then
        log_error "Docker Compose (plugin v2) n'est pas installé"
        exit 1
    fi
    
    if [ ! -f "$COMPOSE_FILE" ]; then
        log_error "Fichier compose introuvable: $COMPOSE_FILE"
        exit 1
    fi

    if [ ! -f "$ENV_FILE" ]; then
        log_error "Fichier d'environnement introuvable: $ENV_FILE"
        log_info "Copiez le template puis adaptez les valeurs:"
        log_info "cp .env.production.example .env.production"
        exit 1
    fi

    log_success "Prérequis vérifiés avec succès"
}

# ==========================================
# 🧹 Nettoyage des anciens conteneurs
# ==========================================
cleanup() {
    log_info "Nettoyage des anciens conteneurs..."
    
    # Arrêter et supprimer les conteneurs existants
    docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" down --remove-orphans || true
    
    log_success "Nettoyage terminé"
}

# ==========================================
# 🔨 Construction des images
# ==========================================
build_images() {
    log_info "Construction des images Docker..."
    
    # Construction avec cache pour optimiser
    docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" build --parallel
    
    log_success "Images construites avec succès"
}

# ==========================================
# 🚀 Démarrage des services
# ==========================================
start_services() {
    log_info "Démarrage des services..."
    
    # Démarrer toute la stack (PostgreSQL + Backend + Frontend)
    docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d --remove-orphans

    wait_for_health "db" 30
    wait_for_health "backend" 30
    wait_for_health "frontend" 30

    log_success "Services démarrés avec succès"
}

wait_for_health() {
    local service="$1"
    local retries="$2"

    log_info "Attente de la santé du service: $service"

    for ((i=1; i<=retries; i++)); do
        local cid
        cid=$(docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps -q "$service")
        if [ -z "$cid" ]; then
            sleep 2
            continue
        fi

        local status
        status=$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$cid" 2>/dev/null || true)

        if [ "$status" = "healthy" ] || [ "$status" = "running" ]; then
            log_success "$service est prêt ($status)"
            return 0
        fi

        if [ "$status" = "unhealthy" ] || [ "$status" = "exited" ]; then
            log_error "$service en échec ($status)"
            docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" logs --tail 120 "$service" || true
            exit 1
        fi

        sleep 2
    done

    log_error "Timeout d'attente pour $service"
    docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" logs --tail 120 "$service" || true
    exit 1
}

# ==========================================
# 📊 Affichage du statut
# ==========================================
show_status() {
    log_info "Statut des services:"
    docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps

    # Charger FRONTEND_PORT pour l'affichage
    set -a
    # shellcheck disable=SC1090
    source "$ENV_FILE"
    set +a
    
    echo ""
    log_info "URLs d'accès:"
    echo "🌐 Frontend: http://localhost:${FRONTEND_PORT:-80}"
    echo "🔧 API (via proxy): http://localhost:${FRONTEND_PORT:-80}/api"
    
    echo ""
    log_info "Commandes utiles:"
    echo "📋 Voir les logs: docker compose --env-file $ENV_FILE -f $COMPOSE_FILE logs -f"
    echo "🛑 Arrêter: docker compose --env-file $ENV_FILE -f $COMPOSE_FILE down"
    echo "🔄 Redémarrer: docker compose --env-file $ENV_FILE -f $COMPOSE_FILE restart"
}

# ==========================================
# 🎯 Fonction principale
# ==========================================
main() {
    log_info "Début du déploiement de l'application DAO (production)..."
    log_info "ENV_FILE=$ENV_FILE"
    log_info "COMPOSE_FILE=$COMPOSE_FILE"
    
    check_prerequisites
    cleanup
    build_images
    start_services
    show_status
    
    log_success "Déploiement terminé avec succès !"
    log_warning "Vérifiez les secrets de production (JWT_SECRET / POSTGRES_PASSWORD)"
}

# ==========================================
# 🚀 Exécution
# ==========================================
main "$@"
