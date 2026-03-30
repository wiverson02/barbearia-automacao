# Barber Elias — Sistema de Gestão

Sistema de gestão para barbearia com painel administrativo, agendamento público e testes automatizados.

**Stack:** React 19 + React Router + Vite + Tailwind (frontend) · Node + Express + SQLite `better-sqlite3` (backend) · Vitest + Supertest + React Testing Library (testes)

---

## Como rodar

Dois terminais são necessários — backend e frontend rodam separados.

### 1) Backend (API · porta 3001)

```bash
cd backend
npm install
npm run dev        # node --watch — recarrega automaticamente
```

Banco criado automaticamente em `backend/data/barber.db` na primeira execução.

> **Windows — porta em uso:**
> ```powershell
> $env:PORT=3002; npm run dev
> ```

### 2) Frontend (Vite · porta 5173)

```bash
cd frontend
npm install
npm run dev
```

Abra `http://localhost:5173`. O proxy do Vite encaminha `/api/*` automaticamente para o backend — nenhuma configuração extra necessária.

---

## Funcionalidades

### Painel administrativo (`/`)

| Página | Rota | O que faz |
|---|---|---|
| Dashboard | `/#/` | Resumo: total de clientes, agendamentos de hoje, serviços e receita do mês |
| Clientes | `/#/clients` | CRUD completo — cadastro, edição inline e exclusão com confirmação |
| Agendamentos | `/#/appointments` | CRUD com filtros Hoje / Esta semana / Todos; badge de status |
| Serviços | `/#/services` | Grid de cards; ativar/desativar serviço; edição inline |
| Assinaturas | `/#/subscriptions` | Planos mensais por cliente; ativar/cancelar |
| Pagamentos | `/#/payments` | Registro de pagamentos PIX; resumo financeiro do mês no topo |

**Design:** Midnight Atelier — dark theme com variáveis CSS (`--bg-base`, `--accent-blue`, etc.), tipografia Manrope + Inter + JetBrains Mono, badges coloridos por status, toasts de sucesso/erro.

### Agendamento público (`/agendar.html`)

Página sem login para o cliente agendar diretamente:
1. Identifica pelo telefone (ou cria cadastro na hora)
2. Escolhe o serviço
3. Seleciona data e horário disponível (slots de 09:00–19:00, conflitos verificados em tempo real)
4. Confirma o agendamento

---

## API REST

Base URL: `http://localhost:3001`

### Rotas administrativas

| Método | Rota | Descrição |
|---|---|---|
| GET/POST | `/api/clients` | Lista e cria clientes |
| GET/PUT/DELETE | `/api/clients/:id` | Operações por cliente |
| GET/POST | `/api/appointments` | Lista e cria agendamentos |
| GET/PUT/DELETE | `/api/appointments/:id` | Operações por agendamento |
| GET/POST | `/api/subscriptions` | Lista e cria assinaturas |
| GET/PUT/DELETE | `/api/subscriptions/:id` | Operações por assinatura |
| GET/POST | `/api/payments` | Lista e registra pagamentos |
| DELETE | `/api/payments/:id` | Remove pagamento |
| GET | `/api/services` | Lista serviços ativos |
| GET | `/api/services/all` | Lista todos os serviços (inclusive inativos) |
| GET/POST | `/api/services/:id` | Operações por serviço |
| PATCH | `/api/services/:id/toggle` | Ativa ou desativa serviço |
| GET | `/api/dashboard/summary` | Dados do painel resumido |
| GET | `/api/clients/:id/finance` | Painel financeiro do cliente (assinaturas + status por competência) |

### Rotas públicas (sem autenticação)

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/public/services` | Serviços ativos (para a página de agendamento) |
| POST | `/api/public/identify` | Identifica cliente por telefone |
| POST | `/api/public/clients` | Cria cliente novo (auto-cadastro) |
| GET | `/api/public/slots?date=&serviceId=` | Horários disponíveis no dia |
| POST | `/api/public/appointments` | Cria agendamento público |

---

## Testes automatizados

### Rodar os testes

```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm test
```

Modo watch (re-executa ao salvar):

```bash
npm run test:watch
```

### Cobertura atual

| Suite | Arquivo | Testes |
|---|---|---|
| Backend — `/api/payments` | `backend/src/tests/payments.test.js` | 11 |
| Frontend — `<Payments />` | `frontend/src/tests/Payments.test.jsx` | 11 |
| **Total** | | **22** |

O backend usa um banco isolado (`backend/data/test.db`) durante os testes via variável `DATABASE_URL` — o banco de produção não é afetado.

---

## Estrutura do projeto

```
barbearia-automacao/
├── backend/
│   ├── src/
│   │   ├── app.js          # Express app (sem listen — usado pelos testes)
│   │   ├── server.js       # Ponto de entrada — importa app.js e chama listen
│   │   ├── db.js           # Inicialização do SQLite + schema + seeds
│   │   ├── routes/
│   │   │   ├── clients.js
│   │   │   ├── appointments.js
│   │   │   ├── subscriptions.js
│   │   │   ├── payments.js
│   │   │   ├── services.js
│   │   │   ├── dashboard.js
│   │   │   └── public.js
│   │   ├── utils/
│   │   │   ├── months.js   # Manipulação de competências YYYY-MM
│   │   │   └── finance.js  # buildSubscriptionFinance()
│   │   └── tests/
│   │       └── payments.test.js
│   ├── data/               # barber.db (criado automaticamente)
│   └── vitest.config.js
│
├── frontend/
│   ├── src/
│   │   ├── main.jsx        # Ponto de entrada React
│   │   ├── App.jsx         # HashRouter + rotas
│   │   ├── components/
│   │   │   ├── Layout.jsx  # Wrapper com sidebar
│   │   │   └── Sidebar.jsx # Navegação lateral
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Clients.jsx
│   │   │   ├── Appointments.jsx
│   │   │   ├── Services.jsx
│   │   │   ├── Subscriptions.jsx
│   │   │   └── Payments.jsx
│   │   ├── styles/
│   │   │   └── midnight-theme.css  # Design system (variáveis + classes)
│   │   └── tests/
│   │       ├── setup.js
│   │       └── Payments.test.jsx
│   ├── agendar.html        # Página pública de agendamento (sem React)
│   └── vitest.config.js
│
└── CLAUDE.md               # Instruções para o Claude Code
```
