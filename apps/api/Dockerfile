# syntax=docker/dockerfile:1
# Build context: raiz do monorepo
FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY apps ./apps
COPY packages ./packages
COPY prisma ./prisma
RUN pnpm install --frozen-lockfile

FROM deps AS build
RUN pnpm exec prisma generate --schema prisma/schema.prisma
RUN pnpm turbo run build --filter=@zones/api

FROM base AS runner
RUN apk add --no-cache wget openssl
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/apps ./apps
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/prisma ./prisma
COPY --from=deps /app/package.json ./package.json
COPY apps/api/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
EXPOSE 3001
ENTRYPOINT ["/entrypoint.sh"]
