# Segurança (Etapa 8)

## Implementado (MVP)
- `helmet` (headers)
- `cors` com allowlist via `CORS_ORIGIN`
- `express-rate-limit` (300 req/min por IP)
- `express.json` com limite de 2MB
- `x-powered-by` desabilitado

## Recomendações para produção
- Rotacionar `JWT_SECRET`
- Habilitar CSP mais restritiva (ajustar para canvas)
- Auditoria de logs + alertas (Sentry/OTel)
- Rate limit específico para auth e websocket handshake
- Sanitização adicional para inputs renderizados em HTML
