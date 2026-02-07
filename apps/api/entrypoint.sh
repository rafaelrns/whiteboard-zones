#!/bin/sh
set -e
cd /app
echo ">>> Running Prisma migrations..."
pnpm exec prisma migrate deploy --schema prisma/schema.prisma || { echo "Prisma migrate failed"; exit 1; }
echo ">>> Starting API server..."
exec node apps/api/dist/server.js
