#!/bin/bash
# Script de deploy para produção (servidor com Docker + Nginx)
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

echo "=== Whiteboard Zones - Deploy ==="

# Verifica .env
if [ ! -f .env ]; then
    echo "ERRO: Arquivo .env não encontrado."
    echo "Copie deploy/.env.prod.example para .env e preencha as variáveis."
    exit 1
fi

# Build e up
echo ">>> Build e subida dos containers..."
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d

echo ""
echo ">>> Containers em execução:"
docker compose -f docker-compose.prod.yml ps

echo ""
echo "=== Deploy concluído. ==="
echo "Web: http://127.0.0.1:8080 (ou via nginx)"
echo "API: http://127.0.0.1:3001/health"
