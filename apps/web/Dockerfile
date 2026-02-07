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
RUN pnpm turbo run build --filter=web

FROM nginx:alpine AS runner
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx","-g","daemon off;"]
