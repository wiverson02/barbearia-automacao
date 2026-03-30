# Agendamento Público — Plano B: Melhorias de UX no Painel do Barbeiro

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar badge de agendamentos do dia no menu, seção "Agenda de Hoje" no dashboard, filtro de data na tela de agendamentos e botões de concluir/cancelar com um clique.

**Architecture:** Todas as mudanças são no frontend — nenhuma rota nova no backend (as rotas existentes já suportam filtros por `from`/`to`). Estado do filtro ativo vive em variável de módulo em `handlers/appointments.js` (persiste entre refreshes do SPA). `layout.js` faz fetch assíncrono do badge na montagem do header.

**Tech Stack:** Vanilla JS ES6 modules, Tailwind CSS via PostCSS/Vite, Express + better-sqlite3 (backend sem alterações).

**Pré-requisito:** Este plano pode ser executado independentemente do Plano A.

---

## Files Overview

| Ação | Arquivo |
|------|---------|
| Modificar | `frontend/src/ui/layout.js` — badge de agendamentos do dia |
| Modificar | `frontend/src/views/dashboard.js` — seção "Agenda de Hoje" |
| Modificar | `frontend/src/views/appointments.js` — filtro de data + botões de status |
| Modificar | `frontend/src/handlers/appointments.js` — estado do filtro + handlers complete/cancel |
| Modificar | `frontend/src/handlers/index.js` — registrar novas actions |

---

### Task 1: Badge de agendamentos do dia em `ui/layout.js`

**Files:**
- Modify: `frontend/src/ui/layout.js`

- [ ] **Step 1: Tornar `layout` assíncrono e buscar contagem do dia**

A função `layout` precisa virar `async` e fazer um fetch antes de montar os links. O arquivo atual exporta `layout({ title, body })` — substituir pelo seguinte:

```js
import { escapeHtml } from "../utils.js";

export async function layout({ title, body }) {
  const currentHash = window.location.hash || "#/";

  // Buscar contagem de agendamentos de hoje para o badge
  const today = new Date().toISOString().slice(0, 10);
  let badgeCount = 0;
  try {
    const res = await fetch(`/api/appointments?from=${today}T00:00:00&to=${today}T23:59:59`);
    if (res.ok) {
      const rows = await res.json();
      badgeCount = rows.filter(a => a.status === "agendado").length;
    }
  } catch {
    // silencioso — badge simplesmente não aparece
  }

  const badge = badgeCount > 0
    ? ` <span style="background:#f59e0b;color:#0f172a;border-radius:9999px;padding:1px 7px;font-size:0.7rem;font-weight:700;margin-left:4px;">${badgeCount}</span>`
    : "";

  const nav = [
    { href: "#/",              label: "Dashboard"           },
    { href: "#/clients",       label: "Clientes"            },
    { href: "#/appointments",  label: `Agendamentos${badge}`, raw: true },
    { href: "#/subscriptions", label: "Assinaturas"         },
    { href: "#/payments",      label: "PIX simulado"        },
  ];

  const links = nav
    .map((n) => {
      const isActive =
        n.href === "#/"
          ? currentHash === "#/" || currentHash === "#"
          : currentHash.startsWith(n.href);
      const cls = isActive
        ? "rounded-lg px-3 py-2 text-sm bg-slate-800 text-amber-400"
        : "rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white";
      const label = n.raw ? n.label : escapeHtml(n.label);
      return `<a href="${n.href}" class="${cls}">${label}</a>`;
    })
    .join("");

  return `
    <div class="min-h-screen">
      <header class="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div class="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div class="text-xs uppercase tracking-widest text-amber-400/90">Barbearia</div>
            <h1 class="text-lg font-semibold text-white">${escapeHtml(title)}</h1>
          </div>
          <nav class="flex flex-wrap gap-1">${links}</nav>
        </div>
      </header>
      <main class="mx-auto max-w-6xl px-4 py-8">${body}</main>
    </div>
  `;
}
```

- [ ] **Step 2: Atualizar `router.js` para `await layout(...)`**

No arquivo `frontend/src/router.js`, a linha:

```js
  rootEl.innerHTML = layout({ title, body });
```

Deve virar:

```js
  rootEl.innerHTML = await layout({ title, body });
```

- [ ] **Step 3: Verificação manual**

Com backend e frontend rodando, crie um agendamento para hoje em `#/appointments`. Navegue para qualquer outra tela e volte — o menu "Agendamentos" deve mostrar `Agendamentos (1)` em badge âmbar.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/ui/layout.js frontend/src/router.js
git commit -m "feat: add today's appointment badge to nav menu"
```

---

### Task 2: Seção "Agenda de Hoje" no dashboard — `views/dashboard.js`

**Files:**
- Modify: `frontend/src/views/dashboard.js`

- [ ] **Step 1: Buscar agendamentos de hoje junto com o summary**

No início de `viewDashboard`, substituir:

```js
  const s = await api("/api/dashboard/summary");
```

Por:

```js
  const today = new Date().toISOString().slice(0, 10);
  const [s, todayAppointments] = await Promise.all([
    api("/api/dashboard/summary"),
    api(`/api/appointments?from=${today}T00:00:00&to=${today}T23:59:59`),
  ]);
```

- [ ] **Step 2: Adicionar a seção após os cards**

No `return`, após o fechamento do `</div>` dos cards e antes do `<p class="mt-6...">`, adicionar:

```js
      ${agendaHoje(todayAppointments, today)}
```

- [ ] **Step 3: Adicionar a função `agendaHoje`**

Antes da função `cardProgresso`, adicionar:

```js
function agendaHoje(appointments, today) {
  const d = new Date(`${today}T12:00:00`);
  const dataFmt = d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })
    .replace(/^\w/, c => c.toUpperCase());

  const statusColor = {
    agendado: "bg-sky-900/50 text-sky-400",
    concluido: "bg-emerald-900/50 text-emerald-400",
    cancelado: "bg-rose-900/50 text-rose-400",
  };

  const sorted = [...appointments].sort((a, b) => a.data_hora.localeCompare(b.data_hora));

  const rows = sorted.length
    ? sorted.map(a => {
        const hora = a.data_hora.slice(11, 16);
        const cor = statusColor[a.status] || "bg-slate-700 text-slate-400";
        return `
          <div class="flex items-center gap-3 border-t border-slate-800 py-3">
            <span class="text-sm font-mono text-slate-300 w-12 shrink-0">${hora}</span>
            <span class="text-sm text-white flex-1">${escapeHtml(a.client_nome || "—")}</span>
            <span class="text-xs text-slate-400 flex-1">${escapeHtml(a.servico || "")}</span>
            <span class="rounded px-2 py-0.5 text-xs font-medium ${cor}">${a.status}</span>
          </div>
        `;
      }).join("")
    : `<p class="py-4 text-sm text-slate-400">Nenhum agendamento hoje 🎉</p>`;

  return `
    <div class="mt-8 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
      <div class="flex items-center justify-between mb-2">
        <h2 class="text-base font-semibold text-white">Agenda de Hoje — ${dataFmt}</h2>
        <a href="#/appointments" class="text-xs text-amber-400 hover:underline">Ver todos →</a>
      </div>
      ${rows}
    </div>
  `;
}
```

- [ ] **Step 4: Adicionar import de `escapeHtml` no dashboard**

No topo de `views/dashboard.js`, adicionar:

```js
import { escapeHtml } from "../utils.js";
```

- [ ] **Step 5: Verificação manual**

Abra `#/` — a seção "Agenda de Hoje" aparece abaixo dos cards com os agendamentos do dia em ordem cronológica. Badge de status colorido em cada linha. Se não houver agendamentos: "Nenhum agendamento hoje 🎉".

- [ ] **Step 6: Commit**

```bash
git add frontend/src/views/dashboard.js
git commit -m "feat: add today's agenda section to dashboard"
```

---

### Task 3: Estado do filtro e handlers de status em `handlers/appointments.js`

**Files:**
- Modify: `frontend/src/handlers/appointments.js`

- [ ] **Step 1: Adicionar variável de estado do filtro e exportá-la**

No topo de `frontend/src/handlers/appointments.js`, após os imports, adicionar:

```js
export let activeFilter = "today";

export function setActiveFilter(f) {
  activeFilter = f;
}
```

- [ ] **Step 2: Adicionar handlers de filtro e de status**

Ao final do arquivo, adicionar:

```js
export function handleFilterAppointments(btn) {
  const filter = btn.dataset.filter;
  setActiveFilter(filter);
  refresh();
}

export async function handleCompleteAppointment(btn) {
  const id = btn.dataset.id;
  await api(`/api/appointments/${id}`, { method: "PUT", body: { status: "concluido" } });
  toast.success("Agendamento concluído!");
  refresh();
}

export async function handleCancelAppointment(btn) {
  const id = btn.dataset.id;
  await api(`/api/appointments/${id}`, { method: "PUT", body: { status: "cancelado" } });
  toast.success("Agendamento cancelado.");
  refresh();
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/handlers/appointments.js
git commit -m "feat: add filter state and complete/cancel handlers for appointments"
```

---

### Task 4: Filtro de data e botões de status em `views/appointments.js`

**Files:**
- Modify: `frontend/src/views/appointments.js`

- [ ] **Step 1: Importar estado do filtro e montar query com datas**

Substituir o import atual e o início da função `viewAppointments`:

```js
import { api } from "../api.js";
import { escapeHtml } from "../utils.js";
import { activeFilter } from "../handlers/appointments.js";

export async function viewAppointments() {
  const today = new Date().toISOString().slice(0, 10);

  let fromParam = "";
  let toParam = "";
  if (activeFilter === "today") {
    fromParam = `${today}T00:00:00`;
    toParam = `${today}T23:59:59`;
  } else if (activeFilter === "week") {
    const d = new Date();
    const dayOfWeek = d.getDay();
    const diffToMonday = (dayOfWeek + 6) % 7;
    const monday = new Date(d);
    monday.setDate(d.getDate() - diffToMonday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    fromParam = `${monday.toISOString().slice(0, 10)}T00:00:00`;
    toParam = `${sunday.toISOString().slice(0, 10)}T23:59:59`;
  }

  const appointmentsUrl = fromParam
    ? `/api/appointments?from=${fromParam}&to=${toParam}`
    : "/api/appointments";

  const [clients, appointments] = await Promise.all([
    api("/api/clients"),
    api(appointmentsUrl),
  ]);
```

- [ ] **Step 2: Adicionar botões de status nas linhas da tabela**

Na função que gera as linhas, substituir:

```js
        <td class="px-3 py-2 text-right">
          <button type="button" data-action="edit-appointment" data-id="${a.id}" class="text-xs text-sky-400 hover:underline">Editar</button>
        </td>
```

Por:

```js
        <td class="px-3 py-2 text-right space-x-2">
          <button type="button" data-action="edit-appointment" data-id="${a.id}" class="text-xs text-sky-400 hover:underline">Editar</button>
          ${a.status === "agendado" ? `
            <button type="button" data-action="complete-appointment" data-id="${a.id}" class="text-xs text-emerald-400 hover:underline">✓ Concluir</button>
            <button type="button" data-action="cancel-appointment" data-id="${a.id}" class="text-xs text-rose-400 hover:underline">✕ Cancelar</button>
          ` : ""}
        </td>
```

- [ ] **Step 3: Adicionar barra de filtros acima da lista**

Na seção da lista, antes do `<div class="mt-4 overflow-x-auto">`, adicionar:

```js
        <div class="mt-3 flex gap-2">
          ${["today", "week", "all"].map(f => {
            const labels = { today: "Hoje", week: "Esta semana", all: "Todos" };
            const isActive = activeFilter === f;
            const cls = isActive
              ? "rounded-lg px-3 py-1.5 text-xs font-medium bg-amber-500 text-slate-950"
              : "rounded-lg px-3 py-1.5 text-xs font-medium border border-slate-700 text-slate-300 hover:bg-slate-800";
            return `<button type="button" data-action="filter-appointments" data-filter="${f}" class="${cls}">${labels[f]}</button>`;
          }).join("")}
        </div>
```

- [ ] **Step 4: Verificação manual**

Abra `#/appointments` — filtro "Hoje" ativo por padrão, só agendamentos de hoje aparecem. Clicar "Esta semana" filtra a semana. Clicar "Todos" mostra tudo. Agendamentos com status `agendado` têm botões "✓ Concluir" e "✕ Cancelar" — clicar atualiza o status e mostra toast.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/views/appointments.js
git commit -m "feat: add date filter and complete/cancel buttons to appointments view"
```

---

### Task 5: Registrar novas actions em `handlers/index.js`

**Files:**
- Modify: `frontend/src/handlers/index.js`

- [ ] **Step 1: Atualizar import de appointments**

Trocar o import de appointments para incluir os novos handlers:

```js
import {
  handleCreateAppointment,
  handleUpdateAppointment,
  handleEditAppointment,
  handleCancelEditAppointment,
  handleFilterAppointments,
  handleCompleteAppointment,
  handleCancelAppointment,
} from "./appointments.js";
```

- [ ] **Step 2: Registrar as novas actions no listener de `click`**

No bloco `try` do listener de `click`, após `cancel-edit-appointment`, adicionar:

```js
    else if (action === "filter-appointments")   handleFilterAppointments(btn);
    else if (action === "complete-appointment")   await handleCompleteAppointment(btn);
    else if (action === "cancel-appointment")     await handleCancelAppointment(btn);
```

- [ ] **Step 3: Verificação final completa**

Com backend e frontend rodando:
1. Criar agendamento para hoje
2. `#/` → badge no menu "Agendamentos (1)" → seção "Agenda de Hoje" mostra o agendamento
3. `#/appointments` → filtro "Hoje" ativo → agendamento aparece → clicar "✓ Concluir" → status muda → toast verde → badge no menu atualiza

- [ ] **Step 4: Commit e push**

```bash
git add frontend/src/handlers/index.js
git commit -m "feat: register filter and status action handlers for appointments"
git push origin main
```

---

## Verificação Final — Plano B

1. Navegar entre telas → badge âmbar aparece em "Agendamentos" se há agendamentos de hoje com status `agendado`
2. `#/` → seção "Agenda de Hoje" com horários, nomes, serviços e badges de status coloridos; botão "Ver todos →" leva para `#/appointments`
3. `#/appointments` → filtro "Hoje" ativo por padrão → "Esta semana" → "Todos" → filtro destacado em âmbar
4. Agendamento com status `agendado` → botões "✓ Concluir" e "✕ Cancelar" → clicar muda status e atualiza lista
