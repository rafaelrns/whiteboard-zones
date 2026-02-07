#!/bin/sh
set -e
cd /app
pnpm exec prisma migrate deploy --schema prisma/schema.prisma
exec node apps/api/dist/server.js
