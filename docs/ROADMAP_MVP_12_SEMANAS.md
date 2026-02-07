# Roadmap MVP — 12 semanas (Zonas Colaborativas)

Documento de arquitetura e plano de execução sequencial. Atualizado após análise do estado atual do repositório.

---

## 1. Estado atual do projeto (pós-Etapa 0–1)

### 1.1 Entregue e funcional
- **Monorepo**: pnpm workspaces + Turborepo.
- **API (Express + TS)**: health, auth (login/register com credenciais), boards, boards/demo, zones CRUD, suggestions CRUD + decision, queue (join/leave), invites, notifications, feedback. Prisma + PostgreSQL, Redis (sessões + locks + presença).
- **Socket.IO**: autenticação por token, rooms por board, Yjs (sync + awareness), locks por objeto e por zona, presença por board, eventos de fila.
- **Web (React 18 + Vite + Tailwind)**:
  - Login/registro, store (Zustand) com token/user.
  - Canvas (Fabric.js), overlay de zonas, PropertyPanel, histórico, comandos, templates, export.
  - Colaboração: Yjs (canvas JSON + zonas), awareness (cursors), locks por objeto (TTL 2 min).
  - ZoneManager (listar, selecionar, criar, deletar), ZoneSuggestPanel (cluster + sugestão de zonas).
  - Sugestões: SuggestionComposer, ReviewPanel.
  - NotificationCenter, CommandPalette (Cmd+K), OnboardingTour, PerfHUD.
- **Packages**: `@zones/shared` (tipos + contratos Zod), `@zones/collaboration-core` (zone-suggest, clusterObjects, suggestZones).
- **Docs**: architecture.md, openapi.yaml, DECISION_LOG.md, deploy, security, feedback.

### 1.2 Decisões já registradas (DECISION_LOG)
- D00: Monorepo pnpm + Turborepo.
- D01: Socket.IO operacional (presença/filas/notificações) separado de Yjs (estado CRDT).
- D02: Redis para estado efêmero (sessões, presença, locks).
- D03: Auth local (credenciais) na Etapa 1; OAuth preparado para Etapa 1.1/2.

### 1.3 Ajustes recentes (esta sessão)
- **App.tsx** corrigido: estado `socket`/`setSocket` e `onlineCount`/`setOnlineCount` definidos; layout separado para não logado (apenas LoginCard) e logado (header + CanvasPage + CommandPalette + OnboardingTour); comandos da palette (toggleTheme, logout) implementados.
- **Prisma**: relações inversas adicionadas em `User` e `Board` (suggestions, feedback, notifications, suggestionComments, etc.) para validação do schema.
- **API**: `@auth/express` atualizado para ^0.12.1; dependências `zod`, `@types/node`, `@types/bcryptjs`, `@types/swagger-ui-express`; `requireAuthOptional` corrigido para usar `getSession` + Prisma (sem JWT); tipagens explícitas em queue/zones/socket. **Build da API: OK.**
- **Web**: build corrigido (Fabric.js v6 com `import * as fabric`, `vite-env.d.ts` para `import.meta.env`, store com `notifications`/`setNotifications`, FabricBoard com `bringObjectToFront`/`sendObjectToFront`, `findTarget(ev)` com 1 arg, tipagens e refs ajustados). **Build do web: OK.**

---

## 2. Objetivo do produto (relembre)
1. Divisão inteligente do quadro em **zonas** com regras de colaboração distintas.
2. **Fila e “passagem de bastão”** para edição controlada (zonas LOCKED_ZONE).
3. **Modo sugestões paralelas** com revisão estruturada (REVIEW_REQUIRED).
4. Interface **intuitiva** para usuários não-técnicos.

---

## 3. Plano de execução sequencial (12 semanas)

Execução **etapa por etapa**: a cada etapa documentar decisões, gerar código e criar/ajustar testes. Manter stack consistente e priorizar UX e acessibilidade.

| Semana | Etapa | Foco | Entregas incrementais |
|--------|--------|------|------------------------|
| 1 | 0 (concluída) | Setup + docs + smoke | Monorepo, docs, CI smoke |
| 2 | 1 (concluída) | Infra básica | API, DB, Redis, Socket.IO, auth |
| 3 | 2 | **Zonas no canvas e regras** | UI de tipos de zona (FREE_EDIT, LOCKED_ZONE, REVIEW_REQUIRED, READ_ONLY), tooltips, indicadores visuais por tipo, persistência já existente |
| 4 | 3 | **Fila e passagem de bastão** | Entrar/sair da fila por zona LOCKED_ZONE, indicador “quem está editando”, passagem explícita (passar bastão), notificações na fila |
| 5 | 4 | **Yjs e colaboração em tempo real** | Consolidação Yjs (já iniciada): deltas por objeto/op, redução de payload; conflitos suaves; feedback visual de “outro usuário editando” |
| 6 | 5 | **Sugestões e revisão** | Fluxo completo: criar sugestão → revisar → aprovar/rejeitar com comentário; aplicar sugestão aprovada no canvas; notificações e histórico de decisões |
| 7 | 6 | **Convites e permissões** | Aceitar convite por link; roles por board (owner/editor/reviewer/viewer); ZonePermission aplicada nas ações (ver/editar/sugerir/aprovar) |
| 8 | 7 | **UX e acessibilidade** | Atalhos de teclado, foco visível, ARIA, contraste; onboarding por tipo de zona; mensagens de erro amigáveis; loading states |
| 9 | 8 | **Performance e escala** | Otimização de sync Yjs (chunking, compressão), virtualização de objetos no canvas se necessário, métricas e alertas |
| 10 | 9 | **Deploy e observabilidade** | Pipeline deploy (Vercel web + API em Railway/Render), health/ready, logs estruturados, métricas (Prometheus/OpenTelemetry) |
| 11 | 10 | **Testes E2E e aceitação** | Testes E2E (Playwright/Cypress): login → board → zona → fila/sugestão; cenários de aceitação documentados |
| 12 | 11 | **Polish e lançamento MVP** | Bugfixes, copy, documentação de uso, anúncio interno/beta |

---

## 4. Próximos passos imediatos (Semana 3 — Etapa 2)
- Revisar e desenhar indicadores visuais por tipo de zona (cor, ícone, label).
- Garantir que ZoneManager e ZoneOverlay mostrem claramente FREE_EDIT / LOCKED_ZONE / REVIEW_REQUIRED / READ_ONLY.
- Adicionar tooltips ou painel lateral explicando “o que significa cada zona” para usuários não-técnicos.
- Testes unitários para zone-suggest e para rotas de zones (já existem parcialmente); adicionar testes de UI para ZoneManager se necessário.

---

## 5. Stack tecnológica (consistência)
- **Frontend**: React 18, TypeScript, Vite, Tailwind, Headless UI, Fabric.js, Yjs + y-protocols/awareness.
- **Backend**: Node.js 20+, Express, TypeScript, Prisma, PostgreSQL, Redis.
- **Auth**: Credenciais (Etapa 1); OAuth (Auth.js) preparado.
- **Realtime**: Socket.IO (operacional), Yjs (estado compartilhado).
- **Deploy**: Docker (dev), Vercel (web), Railway/Render (API) — planejado.

Este documento será atualizado a cada etapa com decisões e conclusões.
