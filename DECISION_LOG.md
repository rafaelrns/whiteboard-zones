# DECISION_LOG — Zonas Colaborativas

## D00 — Monorepo com pnpm + Turborepo
- pnpm workspaces + turbo para orquestração.

## D01 — Separar Socket.IO (operacional) de Yjs (estado CRDT)
- Socket.IO: presença/filas/notificações.
- Yjs: estado do quadro (Etapa 4).

## D02 — Redis para estado efêmero
- Sessões (Bearer), presença, locks.

## D03 — Auth local na Etapa 1 + Auth.js (OAuth) preparado
- MVP da Etapa 1 usa **credenciais** com sessão em Redis.
- OAuth (Google/GitHub) via Auth.js/NextAuth no Express é habilitado por envs e será consolidado na Etapa 1.1/2.

## D04 — Roadmap MVP 12 semanas
- Plano sequencial documentado em `docs/ROADMAP_MVP_12_SEMANAS.md`.
- Etapas 0–1 consideradas concluídas; próxima entrega incremental: Etapa 2 (zonas no canvas e regras visuais).

## D05 — App único: estado de socket no App
- Socket.IO conectado no App (após login); estado `socket` e `onlineCount` centralizados no App.
- Tela não logada: apenas header + LoginCard; tela logada: header (com presença/tema/usuário/sair) + CanvasPage + CommandPalette + OnboardingTour.
- CommandPalette com comandos: alternar tema, sair (sem roteamento no MVP).
