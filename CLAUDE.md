# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Comandos de desenvolvimento

Dois terminais são necessários — backend e frontend rodam separados.

```bash
# Terminal 1 — Backend (API na porta 3001)
cd backend
npm install
npm run dev        # node --watch src/server.js (recarrega automaticamente)

# Terminal 2 — Frontend (Vite na porta 5173)
cd frontend
npm install
npm run dev        # abre http://localhost:5173

# Build de produção do frontend
cd frontend && npm run build
```

Não há testes automatizados. Validação manual via browser em `http://localhost:5173`.

Se a porta 3001 estiver ocupada no Windows:
```bash
$env:PORT=3002; npm run dev
```

## Arquitetura

### Backend (`backend/src/`)

Express com melhor-sqlite3. O banco é inicializado automaticamente ao importar `db.js` — as tabelas são criadas com `CREATE TABLE IF NOT EXISTS`. O arquivo do banco fica em `backend/data/barber.db` (criado na primeira execução).

**Rotas REST:**
- `GET/POST /api/clients` — lista e cria clientes
- `GET/PUT/DELETE /api/clients/:id` — operações por cliente
- `GET /api/clients/:id/finance` — painel financeiro: assinaturas ativas + situação de cada competência (pago/pendente/atrasado) + histórico de pagamentos
- `GET/POST /api/appointments` — agendamentos
- `GET/POST /api/subscriptions`, `GET/PUT /api/subscriptions/:id`
- `GET/POST /api/payments`
- `GET /api/dashboard/summary`

**Utilitários do backend:**
- `utils/months.js` — manipulação de competências no formato `YYYY-MM`
- `utils/finance.js` — `buildSubscriptionFinance(sub, paidRows)` calcula a situação de cada mês de uma assinatura com base nos pagamentos registrados

### Frontend (`frontend/src/`)

SPA sem framework — JavaScript ES6 puro com módulos nativos. Roteamento por hash (`window.location.hash`).

**Fluxo de renderização:**
1. `main.js` monta o router no `#app`
2. `router.js` escuta `hashchange` e `spa:refresh`, chama a view correta, escreve o HTML em `rootEl.innerHTML`
3. Cada view (`views/*.js`) retorna uma string HTML com os dados já buscados da API
4. `ui/layout.js` envolve o corpo de cada view com header + nav

**Fluxo de interação:**
1. `handlers.js` registra dois listeners globais no `document`: `submit` e `click` com delegação de eventos
2. Formulários usam `data-form="<kind>"` para identificação; botões usam `data-action="<action>"`
3. Após mutação bem-sucedida, dispara `document.dispatchEvent(new CustomEvent("spa:refresh"))` para re-renderizar

**Proxy Vite:** qualquer requisição `/api/*` em desenvolvimento é encaminhada automaticamente para `http://localhost:3001` — não há chamadas diretas com host no código do frontend.

**Convenções do frontend:**
- `escapeHtml` e `formatMoney` estão duplicadas em cada view — futura centralização em `utils.js` (ver spec em `docs/superpowers/specs/`)
- Erros hoje usam `alert()` — planejado substituir por `ui/toast.js`
- Não há tipagem nem bundling de CSS separado — Tailwind via PostCSS no build do Vite
