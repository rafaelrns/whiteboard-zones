# Deploy (Etapa 8)

## Visão geral
- **Web**: Vercel (Vite)
- **API + WebSocket**: Railway ou Render (Node/Express)
- **Postgres**: Railway Postgres (ou Neon/Supabase)
- **Redis**: Railway Redis (ou Upstash Redis)

## Variáveis de ambiente

### Web (Vercel)
- `VITE_API_URL=https://<api-domain>`

### API (Railway/Render)
- `PORT=3001`
- `DATABASE_URL=...`
- `REDIS_URL=...`
- `JWT_SECRET=...`
- `CORS_ORIGIN=https://<web-domain>`
- `LOG_LEVEL=info`

## Build/Start (API)
- Build: `pnpm turbo run build --filter=api`
- Start: `node apps/api/dist/index.js`

## Observação importante (WebSocket)
- Garanta que a plataforma suporte **WebSockets** (Railway/Render suportam).
- Habilite sticky sessions se necessário (Redis ajuda nos locks e presença).

## Docker (local / staging)
```bash
docker compose -f docker-compose.prod.yml up --build
```
Web: http://localhost:8088  
API: http://localhost:3001/health
