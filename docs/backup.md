# Backup e Recuperação (Etapa 8)

## Postgres
### Backup manual
```bash
pg_dump "$DATABASE_URL" > backup.sql
```

### Backup em Docker (local)
```bash
docker exec -t <container_postgres> pg_dump -U postgres whiteboard > backup.sql
```

## Restore
```bash
psql "$DATABASE_URL" < backup.sql
```

## Estratégia recomendada
- Backups automáticos diários (provedor gerenciado)
- Retenção: 7 dias (mínimo), ideal 30 dias
- Teste de restore mensal
