# Zonas Colaborativas — Whiteboard com colaboração híbrida por zonas (MVP)

Este repositório contém o **MVP em construção** do produto "Zonas Colaborativas":
- Quadro branco online
- Zonas com diferentes regras (livre, bloqueada com fila, revisão, somente leitura)
- Colaboração em tempo real (Socket.IO + Yjs planejado)
- Modo sugestão/revisão (planejado)

## Entregas incluídas
- **ETAPA 0 (Semana 1)**: planejamento + setup do monorepo + docs + smoke tests
- **ETAPA 1 (Semana 2)**: infraestrutura básica (API + DB + Redis + Socket.IO + auth inicial)

## Stack
- Frontend: React 18 + TypeScript + Vite + Tailwind + Headless UI
- Backend: Node.js + Express + TypeScript
- DB: PostgreSQL + Prisma
- Cache/Realtime: Redis + Socket.IO
- Auth: Auth.js (NextAuth) no Express (providers Google/GitHub + credenciais)
- Deploy: Docker (dev) + Vercel (web) + Railway/Render (api) — planejado

## Requisitos
- Node.js 20+
- pnpm 9+
- Docker + Docker Compose

## Rodar local (dev)
```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

docker compose up -d postgres redis
pnpm install
pnpm prisma:generate   # gera o client Prisma (necessário com pnpm; ver nota abaixo)
pnpm prisma:migrate
pnpm seed              # opcional: cria usuário de teste para login
pnpm dev
```

**Notas:**  
- Com pnpm, rode `pnpm prisma:generate` após o install. Se a API falhar com "did not initialize", execute de novo. Se atualizar `@prisma/client`, ajuste o `output` em `prisma/schema.prisma` para o novo caminho em `node_modules/.pnpm/`.  
- Se a porta 3000 estiver em uso, encerre o processo que a usa ou rode o frontend em outra porta: `pnpm --filter @zones/web dev -- --port 3002`.

### URLs
- Web: http://localhost:3000
- API: http://localhost:3001
- Swagger: http://localhost:3001/api-docs

### Usuário de teste (dev)
Após rodar `pnpm seed` na raiz, use para login:
- **Email:** `teste@zones.local`
- **Senha:** `senha12345`

## Scripts principais
- `pnpm dev` — roda web + api em paralelo (turbo)
- `pnpm lint` — eslint
- `pnpm test` — vitest (unit) + supertest (api)
- `pnpm prisma:generate` — gera o client Prisma (rodar após install no monorepo pnpm)
- `pnpm prisma:migrate` — migrações Prisma (dev)
- `pnpm seed` — cria usuário de teste (email: teste@zones.local, senha: senha12345)
- `pnpm prisma:studio` — Prisma Studio

## Documentação
- `docs/architecture.md`
- `docs/openapi.yaml`
- `DECISION_LOG.md`

