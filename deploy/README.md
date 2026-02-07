# Deploy em Produção (Nginx + Docker)

Arquivos necessários para subir o whiteboard-zones em um servidor com **Nginx** como proxy reverso e **Docker** para os serviços.

## Arquivos deste diretório

| Arquivo | Descrição |
|---------|-----------|
| `nginx-whiteboard-zones.conf` | Nginx HTTP → redireciona para HTTPS + certbot |
| `nginx-whiteboard-zones-ssl.conf` | Nginx HTTPS (proxy para web:8088 e api:3001) |
| `nginx-whiteboard-zones-http-only.conf` | Nginx HTTP apenas (staging ou SSL externo) |
| `.env.prod.example` | Template de variáveis de ambiente |
| `deploy.sh` | Script para build e subir os containers |

## Pré-requisitos no servidor

- Docker e Docker Compose
- Nginx
- Certificado SSL (Let's Encrypt recomendado)

## Passo a passo

### 1. Enviar o código para o servidor

```bash
rsync -avz --exclude node_modules --exclude .git . usuario@servidor:/caminho/whiteboard-zones/
```

Ou via git:

```bash
git clone https://github.com/rafaelrns/whiteboard-zones.git
cd whiteboard-zones
```

### 2. Configurar variáveis de ambiente

```bash
cp deploy/.env.prod.example .env
# Edite .env e preencha JWT_SECRET, POSTGRES_PASSWORD, etc.
```

**Obrigatório alterar:**
- `JWT_SECRET` — gere com `openssl rand -base64 32`
- `POSTGRES_PASSWORD` — senha forte do banco

**Se usar outro domínio**, ajuste:
- `CORS_ORIGIN`
- `VITE_API_URL`

### 3. Subir os containers Docker

```bash
./deploy/deploy.sh
```

Ou manualmente:

```bash
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
```

Isso sobe:
- **postgres** (porta 5432 interna)
- **redis** (porta 6379 interna)
- **api** (porta 3001 → nginx faz proxy de /api)
- **web** (porta 8088 → nginx faz proxy de /)

### 4. Configurar o Nginx

**Com SSL (Let's Encrypt):**

```bash
# Instalar certbot
sudo apt install certbot python3-certbot-nginx

# Obter certificado (nginx deve estar parado ou usar webroot)
sudo certbot certonly --webroot -w /var/www/certbot -d all.tickello.com.br

# Copiar configs
sudo cp deploy/nginx-whiteboard-zones.conf /etc/nginx/sites-available/whiteboard-zones
sudo cp deploy/nginx-whiteboard-zones-ssl.conf /etc/nginx/sites-available/whiteboard-zones-ssl

# Habilitar
sudo ln -sf /etc/nginx/sites-available/whiteboard-zones /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/whiteboard-zones-ssl /etc/nginx/sites-enabled/

# Testar e recarregar
sudo nginx -t && sudo nginx -s reload
```

**Sem SSL (apenas HTTP):**

```bash
sudo cp deploy/nginx-whiteboard-zones-http-only.conf /etc/nginx/sites-available/whiteboard-zones
sudo ln -sf /etc/nginx/sites-available/whiteboard-zones /etc/nginx/sites-enabled/
sudo nginx -t && sudo nginx -s reload
```

### 5. Renovação automática do certificado (Let's Encrypt)

```bash
sudo certbot renew --dry-run   # testar
# Adicione ao crontab: 0 3 * * * certbot renew --quiet
```

## Portas utilizadas

| Serviço | Porta interna | Porta exposta |
|---------|---------------|---------------|
| Web (nginx) | 80 | 8088 |
| API | 3001 | 3001 |
| Postgres | 5432 | - |
| Redis | 6379 | - |

O Nginx do host escuta em 80/443 e faz proxy para 8088 (web) e 3001 (api).

## Comandos úteis

```bash
# Logs
docker compose -f docker-compose.prod.yml logs -f

# Parar
docker compose -f docker-compose.prod.yml down

# Rebuild após alterações
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d
```
