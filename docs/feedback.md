# Feedback (MVP)

Endpoint: `POST /feedback`

Body:
```json
{
  "kind": "GENERAL",
  "message": "texto...",
  "boardId": "optional",
  "meta": { "any": "json" }
}
```

Auth: opcional (se enviar Bearer token, registra userId).
