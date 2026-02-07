# Load tests (Artillery)

## Pré-requisitos
- API rodando em `localhost:3001`
- Você precisa fornecer `token` (JWT do login) e `boardId`.

## Execução
Exemplo (exportando vars):
```bash
export token="SEU_TOKEN"
export boardId="SEU_BOARD_ID"
npx artillery run -v -o report.json tests/load/socket-yjs.yml
```

Obs: este cenário é propositalmente simples para MVP.
