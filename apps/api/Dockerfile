# syntax=docker/dockerfile:1
FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY ../../package.json ../../pnpm-lock.yaml ../../pnpm-workspace.yaml ../../turbo.json ./
COPY ../../apps ./apps
COPY ../../packages ./packages
RUN pnpm install --frozen-lockfile

FROM deps AS build
RUN pnpm turbo run build --filter=api

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps ./apps
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/package.json ./package.json
EXPOSE 3001
CMD ["node","apps/api/dist/index.js"]
