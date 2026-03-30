# Agendamento Público + Melhorias de UX — Design Spec

**Data:** 2026-03-30  
**Projeto:** BARBER ELIAS (`barbearia-automacao`)  
**Objetivo:** Criar página pública de agendamento para o cliente usar no celular + melhorias de UX no painel do barbeiro.

---

## Contexto

O sistema já tem: clientes, agendamentos, assinaturas, pagamentos, dashboard.  
O que falta: o **cliente** conseguir agendar sozinho pelo celular, sem precisar ligar.  
E o **barbeiro** ter uma UX melhor no dia a dia (agenda visual, badge de notificação, etc.).

---

## PARTE 1 — Tabela de Serviços (banco + painel)

### Problema
Hoje o campo "serviço" em agendamentos é texto livre. O barbeiro digita "corte", "corte + barba", etc. Não há lista padronizada nem preços.

### Solução
Criar tabela `services` no banco. O barbeiro cadastra os serviços no painel. A página pública lista esses serviços para o cliente escolher.

### Schema da tabela
```sql
CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  preco REAL NOT NULL DEFAULT 0,
  duracao_minutos INTEGER NOT NULL DEFAULT 30,
  ativo INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### Seeds iniciais (inserir só se a tabela estiver vazia)
```sql
INSERT INTO services (nome, preco, duracao_minutos) VALUES
  ('Corte', 35.00, 30),
  ('Barba', 25.00, 20),
  ('Corte + Barba', 55.00, 50),
  ('Corte Infantil', 30.00, 25),
  ('Pigmentação', 45.00, 40);
```

### Rotas backend — `/api/services`
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/services` | Lista serviços ativos (`ativo = 1`) |
| GET | `/api/services/all` | Lista todos (para o painel do barbeiro) |
| POST | `/api/services` | Cria serviço |
| PUT | `/api/services/:id` | Edita serviço |
| PATCH | `/api/services/:id/toggle` | Ativa/desativa |

### Arquivo a criar
`backend/src/routes/services.js` — registrado em `server.js` como `/api/services`.

### Tela no painel — nova rota `#/services`
View simples com:
- Formulário: nome (obrigatório), preço (R$), duração (min), botão Salvar
- Tabela: nome | preço | duração | ativo | ações (Editar / Ativar/Desativar)
- Botão de editar inline (igual ao padrão já usado em clientes/assinaturas)

Adicionar "Serviços" no menu de navegação em `ui/layout.js`.

**Arquivos afetados:**
| Ação | Arquivo |
|------|---------|
| Criar | `backend/src/routes/services.js` |
| Modificar | `backend/src/db.js` — adicionar tabela + seeds |
| Modificar | `backend/src/server.js` — registrar rota `/api/services` |
| Criar | `frontend/src/views/services.js` |
| Modificar | `frontend/src/router.js` — adicionar rota `#/services` |
| Modificar | `frontend/src/ui/layout.js` — adicionar "Serviços" no nav |
| Criar | `frontend/src/handlers/services.js` |
| Modificar | `frontend/src/handlers/index.js` — registrar handlers de serviços |

---

## PARTE 2 — Rotas Públicas (sem autenticação)

Rotas sob `/api/public/*` — sem nenhuma proteção, consumidas pela página pública.

### `GET /api/public/services`
Retorna serviços com `ativo = 1`. Igual a `/api/services` mas sem autenticação futura.

### `POST /api/public/identify`
Identifica ou cadastra o cliente pelo telefone.

**Request body:**
```json
{ "telefone": "11999999999" }
```

**Lógica:**
- Busca `SELECT * FROM clients WHERE telefone = ?`
- Se encontrado: retorna `{ found: true, client: { id, nome, telefone } }`
- Se não encontrado: retorna `{ found: false }` (frontend vai pedir o nome)

### `POST /api/public/clients`
Cadastra novo cliente (chamado só quando `found: false`).

**Request body:**
```json
{ "nome": "João Silva", "telefone": "11999999999" }
```
- Valida telefone não duplicado
- Insere na tabela `clients`
- Retorna o cliente criado

### `GET /api/public/slots?date=YYYY-MM-DD&serviceId=N`
Retorna horários disponíveis para uma data, considerando a duração do serviço escolhido.

**Lógica:**
- Horários fixos da barbearia: 09:00 até 19:00, de 30 em 30 min
- Busca agendamentos do dia com status `agendado`, incluindo `duracao_minutos` de cada um
- Um slot está **ocupado** se qualquer agendamento existente sobrepõe o intervalo `[slot, slot + duracao_do_servico_escolhido)`
- Também bloqueia slots em que o serviço não caberia antes de 19:00
- Retorna array de strings: `["09:00", "09:30", "10:00", ...]`

> **Decisão consciente:** conflito calculado por duração, não apenas por slot exato. Um "Corte + Barba" (50min) às 14:00 bloqueia 14:00 e 14:30.

### `POST /api/public/appointments`
Cria agendamento pelo cliente.

**Request body:**
```json
{
  "clientId": 5,
  "serviceId": 2,
  "date": "2026-04-01",
  "time": "14:00"
}
```

**Lógica:**
- Busca o serviço para pegar `nome` e `duracao_minutos`
- Monta `data_hora = date + "T" + time + ":00"`
- Verifica se o slot ainda está livre (re-checagem com mesma lógica de duração do `GET /slots`)
- Insere em `appointments` com `status = 'agendado'`, gravando `services.nome` no campo `servico` (texto) e `duracao_minutos` no campo `duracao_minutos`
- Não adiciona coluna `service_id` — mantém compatibilidade total com agendamentos existentes
- Retorna `{ id, dataHora, servico, clientNome }`

**Arquivo a criar:**
`backend/src/routes/public.js` — registrado em `server.js` como `/api/public`.

---

## PARTE 3 — Página Pública de Agendamento

### Arquivo
`frontend/public/agendar.html`

Esta é uma **página HTML independente**, fora do SPA. O Vite serve arquivos de `frontend/public/` diretamente, então ela fica acessível em `http://localhost:5173/agendar.html`.

### Design
- Mobile-first, tela única com steps (sem SPA, sem framework)
- Cores do projeto: fundo `#0f172a` (slate-950), amber-500 para destaques
- Tailwind via CDN (`https://cdn.tailwindcss.com`) para não precisar de build
- Logo/nome "BARBER ELIAS" no topo
- Sem menu, sem nav — página focada só no agendamento

### Fluxo em 4 steps (tudo na mesma página, mostrando/escondendo seções)

```
STEP 1 — Telefone
  [ Campo: número do WhatsApp        ]
  [ Botão: Continuar →               ]
       ↓ (POST /api/public/identify)
  SE encontrado → pula pro step 2 com nome já preenchido
  SE não encontrado → mostra campo "Qual é seu nome?"
       ↓ (POST /api/public/clients)
  
STEP 2 — Serviço
  "Olá, João! O que você vai fazer hoje?"
  [ Card: Corte        R$ 35  30min  ]
  [ Card: Barba        R$ 25  20min  ]
  [ Card: Corte+Barba  R$ 55  50min  ]
  (cards clicáveis, selecionado fica com borda amber)

STEP 3 — Data e Horário
  "Quando você quer vir?"
  [ Seletor de data: input type="date", mínimo = hoje ]
  
  (após escolher data, carrega slots disponíveis)
  
  Grade de horários (botões):
  [ 09:00 ] [ 09:30 ] [ 10:00 ] [ 10:30 ] ...
  (horários ocupados ficam desabilitados/cinza)

STEP 4 — Confirmação
  "Tudo certo, João! ✂️"
  Resumo:
    Serviço: Corte + Barba
    Data: Terça, 01 de Abril
    Horário: 14:00
    Duração: ~50 min
  
  [ ✅ Confirmar Agendamento ]
  [ ← Voltar e corrigir      ]
  
  (após confirmar → tela de sucesso com mensagem e opção de agendar novamente)
```

### Estado local (JS puro, sem framework)
```js
const state = {
  step: 1,           // step atual
  client: null,      // { id, nome, telefone }
  service: null,     // { id, nome, preco, duracao_minutos }
  date: "",          // "YYYY-MM-DD"
  time: "",          // "HH:MM"
};
```

### Navegação entre steps
- `showStep(n)` — esconde todos os `[data-step]`, mostra só o `n`
- Botão "Voltar" nos steps 2, 3 e 4 chama `showStep(n-1)`
- Progresso visual: barra ou indicador de passo no topo (1 de 4, 2 de 4...)

### Persistência do telefone
Salvar `telefone` no `localStorage` após identificação bem-sucedida. Na próxima visita, preencher o campo automaticamente e focar no botão "Continuar".

---

## PARTE 4 — Melhorias de UX no Painel do Barbeiro

### 4.1 — Badge de agendamentos do dia no menu

**Onde:** `ui/layout.js`
**O que:** Ao carregar o layout, fazer `fetch("/api/appointments?from=HOJE&to=HOJE")` e mostrar um badge com a quantidade de agendamentos de hoje no link "Agendamentos".

```
Agendamentos  (3)   ← badge amber arredondado
```

Se zero, não mostra o badge. Atualiza a cada navegação (já que o layout é recriado no `spa:refresh`).

> **Decisão consciente:** o fetch ocorre a cada navegação. Para uma barbearia com uso leve isso é aceitável — sem cache adicional.

### 4.2 — Agenda do dia no Dashboard

**Onde:** `views/dashboard.js`  
**O que:** Adicionar seção "Agenda de Hoje" logo abaixo dos cards de resumo.

Layout da seção:
```
┌─ Agenda de Hoje — Segunda, 30 de março ─────────────┐
│  09:00  João Silva       Corte + Barba   agendado    │
│  10:30  Pedro Souza      Corte           concluido   │  
│  14:00  (vazio)                                      │
│  Nenhum agendamento após esse horário                │
└──────────────────────────────────────────────────────┘
```

- Busca via `GET /api/appointments?from=HOJE_ISO&to=HOJE_ISO`
- Lista em ordem cronológica
- Badge de status colorido: `agendado` = azul, `concluido` = verde, `cancelado` = vermelho
- Se lista vazia: "Nenhum agendamento hoje 🎉"
- Botão "Ver todos" leva para `#/appointments`

### 4.3 — Filtro de data nos Agendamentos

**Onde:** `views/appointments.js`  
**O que:** Adicionar filtro simples no topo da lista.

```
[ Hoje ] [ Esta semana ] [ Todos ]  ou  [ input date ]
```

- Default: "Hoje" ao abrir a tela
- Cada botão atualiza os query params na busca
- "Todos" remove o filtro de data
- O filtro selecionado fica destacado em amber

**Implementação:**
- Salvar filtro ativo em variável de módulo em `handlers/appointments.js` (`let activeFilter = "today"`) — persiste entre refreshes porque o módulo JS não é recarregado pelo SPA
- A view já aceita `from` e `to` no backend, só precisa montar as datas certas
- `handlers/index.js` captura `data-action="filter-appointments"` com `data-filter="today|week|all"`
- A view recebe o filtro ativo como parâmetro para destacar o botão correto em amber

### 4.4 — Status rápido nos agendamentos (concluir com 1 clique)

**Onde:** `views/appointments.js` + `handlers/appointments.js`  
**O que:** Botão "✓ Concluir" direto na linha da tabela para agendamentos com status `agendado`.

```
| João Silva | 14:00 | Corte | agendado | [✓ Concluir] [✕ Cancelar] |
| Pedro ...  | 10:00 | Barba | concluido|                           |
```

- `data-action="complete-appointment"` com `data-id`
- `data-action="cancel-appointment"` com `data-id`
- Chama `PUT /api/appointments/:id` com `{ status: "concluido" }` ou `{ status: "cancelado" }`
- Toast de confirmação + refresh

---

## Ordem de implementação recomendada

1. **Tabela de serviços** (banco + rotas + tela no painel) — base para tudo
2. **Rotas públicas** (`/api/public/*`) — backend pronto antes do frontend
3. **Página pública** (`agendar.html`) — consome as rotas públicas
4. **Badge no menu** — pequena, impacto visual imediato
5. **Agenda do dia no Dashboard** — melhoria de valor alto
6. **Filtro de data nos Agendamentos** — qualidade de vida diária
7. **Botões concluir/cancelar** — agilidade no atendimento

---

## Mapa completo de arquivos

| Ação | Arquivo | Motivo |
|------|---------|--------|
| Modificar | `backend/src/db.js` | Adicionar tabela `services` + seeds |
| Criar | `backend/src/routes/services.js` | CRUD de serviços |
| Criar | `backend/src/routes/public.js` | Rotas públicas sem auth |
| Modificar | `backend/src/server.js` | Registrar `/api/services` e `/api/public` |
| Criar | `frontend/public/agendar.html` | Página pública mobile |
| Criar | `frontend/src/views/services.js` | Tela de gestão de serviços |
| Modificar | `frontend/src/views/dashboard.js` | Agenda do dia |
| Modificar | `frontend/src/views/appointments.js` | Filtro de data + botões de status |
| Criar | `frontend/src/handlers/services.js` | Handlers de serviços |
| Modificar | `frontend/src/handlers/appointments.js` | Handlers complete/cancel |
| Modificar | `frontend/src/handlers/index.js` | Registrar novos handlers e actions |
| Modificar | `frontend/src/router.js` | Rota `#/services` |
| Modificar | `frontend/src/ui/layout.js` | Link "Serviços" + badge agendamentos do dia |

---

## O que NÃO muda

- Nenhuma tabela existente é alterada (só adiciona `services`)
- As rotas existentes (`/api/clients`, `/api/appointments`, etc.) não são modificadas
- O SPA existente continua funcionando igual
- `agendar.html` é completamente independente do SPA — não interfere em nada

---

## Verificação manual (sem testes automatizados)

1. `#/services` → criar serviço → aparece na lista → desativar → some da lista pública
2. `http://localhost:5173/agendar.html` no celular (ou DevTools mobile):
   - Telefone novo → pede nome → cadastra → vai ao step 2
   - Telefone existente → reconhece → "Olá, João!" → step 2
   - Seleciona serviço → step 3 → seleciona data → slots carregam → seleciona horário
   - Step 4 → confirma → aparece em `#/appointments` no painel
3. Dashboard → seção "Agenda de Hoje" mostra o agendamento recém-criado
4. Menu "Agendamentos" → badge `(1)` aparece
5. `#/appointments` → filtro "Hoje" ativo por padrão → botão "✓ Concluir" na linha → clica → status muda para "concluido"
