# Melhorias Barbearia — Rodada 3 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar validação em assinaturas, filtro de clientes por nome, edição de agendamentos e card de progresso financeiro no dashboard.

**Architecture:** Todas as mudanças seguem padrões já estabelecidos no projeto: validações via `throw new Error()` nos handlers, filtro client-side via `oninput`, painel inline de edição igual ao de clientes, e novo campo `esperadoMes` adicionado na rota de dashboard sem criar nova rota.

**Tech Stack:** Vanilla JS ES6 modules, Tailwind CSS via PostCSS/Vite, Express + better-sqlite3.

---

## Files Overview

| Ação | Arquivo | Motivo |
|------|---------|--------|
| Modificar | `frontend/src/handlers/subscriptions.js` | Validação de clientId e valorMensal |
| Modificar | `frontend/src/views/clients.js` | Input de busca + `data-name` no `<tr>` |
| Modificar | `frontend/src/views/appointments.js` | Botão Editar + painel `edit-appointment-wrap` |
| Modificar | `frontend/src/handlers/appointments.js` | Handlers de edição de agendamento |
| Modificar | `frontend/src/handlers/index.js` | Registrar novos handlers |
| Modificar | `backend/src/routes/dashboard.js` | Adicionar `esperadoMes` na resposta |
| Modificar | `frontend/src/views/dashboard.js` | Card com barra de progresso |

---

### Task 1: Validação em `handlers/subscriptions.js`

**Files:**
- Modify: `frontend/src/handlers/subscriptions.js`

- [ ] **Step 1: Adicionar validações em `handleCreateSubscription`**

Substituir a função completa:

```js
export async function handleCreateSubscription(e) {
  const form = e.target;
  const fd = new FormData(form);
  const clientId = fd.get("clientId");
  const valorMensal = Number(String(fd.get("valorMensal")).replace(",", "."));
  if (!clientId || Number(clientId) <= 0) throw new Error("Selecione um cliente");
  if (!valorMensal || valorMensal <= 0) throw new Error("Informe um valor mensal válido");
  const body = {
    clientId: Number(clientId),
    valorMensal,
    startDate: fd.get("startDate"),
    endDate: fd.get("endDate") || null,
    ativo: fd.get("ativo") === "on",
  };
  await api("/api/subscriptions", { method: "POST", body });
  form.reset();
  toast.success("Assinatura criada!");
  refresh();
}
```

- [ ] **Step 2: Adicionar validações em `handleUpdateSubscription`**

No início de `handleUpdateSubscription`, após a verificação de `id`, adicionar:

```js
const valorMensal = Number(String(fd.get("valorMensal")).replace(",", "."));
if (!valorMensal || valorMensal <= 0) throw new Error("Informe um valor mensal válido");
```

E trocar a linha `valorMensal: Number(...)` no `body` por `valorMensal,`.

O arquivo final de `handleUpdateSubscription` fica:

```js
export async function handleUpdateSubscription(e) {
  const form = e.target;
  const fd = new FormData(form);
  const id = fd.get("id");
  if (!id) throw new Error("Assinatura inválida");
  const valorMensal = Number(String(fd.get("valorMensal")).replace(",", "."));
  if (!valorMensal || valorMensal <= 0) throw new Error("Informe um valor mensal válido");
  const endRaw = fd.get("endDate");
  const body = {
    valorMensal,
    startDate: fd.get("startDate"),
    endDate: endRaw && String(endRaw).trim() ? endRaw : null,
    ativo: fd.get("ativo") === "on",
  };
  await api(`/api/subscriptions/${id}`, { method: "PUT", body });
  document.getElementById("edit-subscription-wrap")?.classList.add("hidden");
  const subNomeEl = document.getElementById("edit-sub-client-nome");
  if (subNomeEl) subNomeEl.textContent = "—";
  form.reset();
  toast.success("Assinatura atualizada!");
  refresh();
}
```

- [ ] **Step 3: Verificação manual**

Com frontend rodando (`cd frontend && npm run dev`), abra `#/subscriptions`:
- Clique "Salvar" sem selecionar cliente → toast vermelho "Selecione um cliente"
- Clique "Salvar" sem valor → toast vermelho "Informe um valor mensal válido"
- Preencha tudo corretamente → assinatura criada, toast verde

- [ ] **Step 4: Commit**

```bash
git add frontend/src/handlers/subscriptions.js
git commit -m "feat: add required field validation in subscription handlers"
```

---

### Task 2: Filtro de clientes por nome em `views/clients.js`

**Files:**
- Modify: `frontend/src/views/clients.js`

- [ ] **Step 1: Adicionar `data-name` no `<tr>` e `id` no `<tbody>`**

Na função que gera as linhas, trocar:

```js
const rows = clients
  .map(
    (c) => `
    <tr class="border-t border-slate-800">
```

Por:

```js
const rows = clients
  .map(
    (c) => `
    <tr class="border-t border-slate-800" data-name="${escapeHtml(c.nome)}">
```

E na `<tbody>`, trocar:

```html
<tbody>${rows || `<tr><td class="px-3 py-6 text-slate-500" colspan="3">Nenhum cliente ainda.</td></tr>`}</tbody>
```

Por:

```html
<tbody id="clients-tbody">${rows || `<tr><td class="px-3 py-6 text-slate-500" colspan="3">Nenhum cliente ainda.</td></tr>`}</tbody>
```

- [ ] **Step 2: Adicionar input de busca e script de filtragem**

Na seção "Lista", antes da `<div class="mt-4 overflow-x-auto">`, adicionar o input e após a tabela o script:

O bloco da seção lista fica assim:

```js
      <section class="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <h2 class="text-base font-semibold text-white">Lista</h2>
        <input
          id="client-search"
          type="text"
          placeholder="Buscar por nome…"
          oninput="filterClients(this.value)"
          class="mt-3 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500"
        />
        <div class="mt-4 overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="text-xs uppercase text-slate-500">
              <tr>
                <th class="px-3 py-2">Nome</th>
                <th class="px-3 py-2">Telefone</th>
                <th class="px-3 py-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody id="clients-tbody">${rows || `<tr><td class="px-3 py-6 text-slate-500" colspan="3">Nenhum cliente ainda.</td></tr>`}</tbody>
          </table>
        </div>
        <script>
          function filterClients(q) {
            const term = q.toLowerCase();
            document.querySelectorAll('#clients-tbody tr[data-name]').forEach(tr => {
              tr.style.display = tr.dataset.name.toLowerCase().includes(term) ? '' : 'none';
            });
          }
        </script>
      </section>
```

- [ ] **Step 3: Verificação manual**

Abra `#/clients` → o campo "Buscar por nome…" aparece acima da tabela → digitar parte de um nome filtra as linhas em tempo real → apagar o texto restaura a lista completa.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/views/clients.js
git commit -m "feat: add real-time client name filter to clients view"
```

---

### Task 3: Painel de edição de agendamentos em `views/appointments.js`

**Files:**
- Modify: `frontend/src/views/appointments.js`

- [ ] **Step 1: Adicionar botão Editar na tabela**

Na função que gera as linhas da tabela, trocar:

```js
  const rows = appointments
    .map(
      (a) => `
      <tr class="border-t border-slate-800">
        <td class="px-3 py-2">${escapeHtml(a.client_nome || "")}</td>
        <td class="px-3 py-2">${escapeHtml(a.data_hora)}</td>
        <td class="px-3 py-2">${escapeHtml(a.servico || "")}</td>
        <td class="px-3 py-2">${escapeHtml(a.status)}</td>
      </tr>`
    )
    .join("");
```

Por:

```js
  const rows = appointments
    .map(
      (a) => `
      <tr class="border-t border-slate-800">
        <td class="px-3 py-2">${escapeHtml(a.client_nome || "")}</td>
        <td class="px-3 py-2">${escapeHtml(a.data_hora)}</td>
        <td class="px-3 py-2">${escapeHtml(a.servico || "")}</td>
        <td class="px-3 py-2">${escapeHtml(a.status)}</td>
        <td class="px-3 py-2 text-right">
          <button type="button" data-action="edit-appointment" data-id="${a.id}" class="text-xs text-sky-400 hover:underline">Editar</button>
        </td>
      </tr>`
    )
    .join("");
```

Adicionar também o `<th>` correspondente na `<thead>`:

```html
<thead class="text-xs uppercase text-slate-500">
  <tr>
    <th class="px-3 py-2">Cliente</th>
    <th class="px-3 py-2">Quando</th>
    <th class="px-3 py-2">Serviço</th>
    <th class="px-3 py-2">Status</th>
    <th class="px-3 py-2 text-right">Ações</th>
  </tr>
</thead>
```

E a contagem de `colspan` na linha vazia de `<tbody>` muda de `4` para `5`:

```html
<tbody>${rows || `<tr><td class="px-3 py-6 text-slate-500" colspan="5">Nenhum agendamento.</td></tr>`}</tbody>
```

- [ ] **Step 2: Adicionar painel `edit-appointment-wrap` após o form de criação**

No `return`, após o `</form>` do form de criação (antes do `</section>`), adicionar:

```html
        <div id="edit-appointment-wrap" class="mt-6 hidden rounded-xl border border-sky-900/40 bg-slate-950/50 p-4">
          <h2 class="text-base font-semibold text-sky-200">Editar agendamento</h2>
          <form data-form="update-appointment" class="mt-4 grid gap-3">
            <input type="hidden" name="id" />
            <label class="grid gap-1 text-sm">
              <span class="text-slate-400">Cliente</span>
              <select name="clientId" class="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2">
                <option value="">Selecione…</option>
                ${options}
              </select>
            </label>
            <label class="grid gap-1 text-sm">
              <span class="text-slate-400">Data e hora (local)</span>
              <input name="dataHora" type="datetime-local" class="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" />
            </label>
            <label class="grid gap-1 text-sm">
              <span class="text-slate-400">Serviço (livre)</span>
              <input name="servico" class="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" />
            </label>
            <label class="grid gap-1 text-sm">
              <span class="text-slate-400">Observações</span>
              <textarea name="observacoes" rows="2" class="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"></textarea>
            </label>
            <label class="grid gap-1 text-sm">
              <span class="text-slate-400">Duração (min, opcional)</span>
              <input name="duracaoMinutos" type="number" min="1" class="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" />
            </label>
            <label class="grid gap-1 text-sm">
              <span class="text-slate-400">Status</span>
              <select name="status" class="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2">
                <option value="agendado">agendado</option>
                <option value="concluido">concluido</option>
                <option value="cancelado">cancelado</option>
              </select>
            </label>
            <div class="flex flex-wrap gap-2">
              <button type="submit" class="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-amber-400">
                Salvar alterações
              </button>
              <button type="button" data-action="cancel-edit-appointment" class="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">
                Cancelar
              </button>
            </div>
          </form>
        </div>
```

- [ ] **Step 3: Verificação visual**

Abra `#/appointments` → a tabela agora tem coluna "Ações" com botão "Editar". O painel de edição ainda não funciona (handlers serão adicionados na Task 4).

- [ ] **Step 4: Commit**

```bash
git add frontend/src/views/appointments.js
git commit -m "feat: add edit button and edit panel to appointments view"
```

---

### Task 4: Handlers de edição de agendamentos em `handlers/appointments.js`

**Files:**
- Modify: `frontend/src/handlers/appointments.js`

- [ ] **Step 1: Adicionar os três novos handlers ao final do arquivo**

```js
export async function handleUpdateAppointment(e) {
  const form = e.target;
  const fd = new FormData(form);
  const id = fd.get("id");
  if (!id) throw new Error("Agendamento inválido");
  const clientId = fd.get("clientId");
  const dataHora = fd.get("dataHora");
  const servico = String(fd.get("servico") ?? "").trim();
  if (!clientId || Number(clientId) <= 0) throw new Error("Selecione um cliente");
  if (!dataHora) throw new Error("Data e hora são obrigatórias");
  if (!servico) throw new Error("Serviço é obrigatório");
  const body = {
    clientId: Number(clientId),
    dataHora,
    servico,
    observacoes: fd.get("observacoes") || null,
    duracaoMinutos: fd.get("duracaoMinutos") ? Number(fd.get("duracaoMinutos")) : null,
    status: fd.get("status") || "agendado",
  };
  await api(`/api/appointments/${id}`, { method: "PUT", body });
  document.getElementById("edit-appointment-wrap")?.classList.add("hidden");
  form.reset();
  toast.success("Agendamento atualizado!");
  refresh();
}

export async function handleEditAppointment(btn) {
  const id = btn.dataset.id;
  const data = await api(`/api/appointments/${id}`);
  const wrap = document.getElementById("edit-appointment-wrap");
  const form = wrap?.querySelector('form[data-form="update-appointment"]');
  if (!form || !wrap) return;
  form.querySelector('[name="id"]').value = String(data.id);
  const clientSelect = form.querySelector('[name="clientId"]');
  if (clientSelect) clientSelect.value = String(data.client_id);
  const dataHoraRaw = data.data_hora ? String(data.data_hora).slice(0, 16) : "";
  form.querySelector('[name="dataHora"]').value = dataHoraRaw;
  form.querySelector('[name="servico"]').value = data.servico ?? "";
  form.querySelector('[name="observacoes"]').value = data.observacoes ?? "";
  const durEl = form.querySelector('[name="duracaoMinutos"]');
  if (durEl) durEl.value = data.duracao_minutos != null ? String(data.duracao_minutos) : "";
  const statusEl = form.querySelector('[name="status"]');
  if (statusEl) statusEl.value = data.status ?? "agendado";
  wrap.classList.remove("hidden");
  wrap.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

export function handleCancelEditAppointment() {
  const wrap = document.getElementById("edit-appointment-wrap");
  const form = wrap?.querySelector('form[data-form="update-appointment"]');
  form?.reset();
  wrap?.classList.add("hidden");
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/handlers/appointments.js
git commit -m "feat: add update/edit/cancel handlers for appointments"
```

---

### Task 5: Registrar novos handlers em `handlers/index.js`

**Files:**
- Modify: `frontend/src/handlers/index.js`

- [ ] **Step 1: Atualizar o import de appointments**

Trocar:

```js
import { handleCreateAppointment } from "./appointments.js";
```

Por:

```js
import {
  handleCreateAppointment,
  handleUpdateAppointment,
  handleEditAppointment,
  handleCancelEditAppointment,
} from "./appointments.js";
```

- [ ] **Step 2: Registrar `update-appointment` no listener de `submit`**

No bloco `try` do listener de `submit`, adicionar após `create-appointment`:

```js
else if (kind === "update-appointment")   await handleUpdateAppointment(e);
```

- [ ] **Step 3: Registrar `edit-appointment` e `cancel-edit-appointment` no listener de `click`**

No bloco `try` do listener de `click`, adicionar:

```js
else if (action === "edit-appointment")             await handleEditAppointment(btn);
else if (action === "cancel-edit-appointment")          handleCancelEditAppointment();
```

- [ ] **Step 4: Verificação manual**

Abra `#/appointments` → clicar "Editar" em um agendamento → painel aparece com dados preenchidos → alterar o serviço → "Salvar alterações" → toast verde e lista atualizada → clicar "Editar" novamente → "Cancelar" → painel fecha sem alteração.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/handlers/index.js
git commit -m "feat: register appointment edit handlers in index.js"
```

---

### Task 6: Adicionar `esperadoMes` no backend (`routes/dashboard.js`)

**Files:**
- Modify: `backend/src/routes/dashboard.js`

- [ ] **Step 1: Calcular `esperadoMes` e incluir na resposta**

Após a linha `const subsAtivas = db.prepare(...).all();`, adicionar:

```js
const esperadoMes = subsAtivas.reduce((acc, s) => acc + (s.valor_mensal ?? 0), 0);
```

E no `res.json({...})`, adicionar `esperadoMes`:

```js
  res.json({
    competenciaAtual: comp,
    totalClientes,
    recebidoMes,
    esperadoMes,
    assinaturasAtivas: subsAtivas.length,
    clientesComPendenciaNesteMes: clientesComPendenciaMes,
    clientesComAtrasoEmAlgumMes: clientesComAtraso.size,
  });
```

- [ ] **Step 2: Verificação**

```bash
cd backend && curl -s http://localhost:3001/api/dashboard/summary | node -e "process.stdin.resume();let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d).esperadoMes))"
```

Esperado: um número (0 se não há assinaturas, ou a soma dos valorMensal das ativas).

- [ ] **Step 3: Commit**

```bash
git add backend/src/routes/dashboard.js
git commit -m "feat: add esperadoMes to dashboard summary response"
```

---

### Task 7: Card de progresso no dashboard (`views/dashboard.js`)

**Files:**
- Modify: `frontend/src/views/dashboard.js`

- [ ] **Step 1: Substituir o card simples por card com barra de progresso**

Trocar a linha:

```js
      ${card("Recebido no mês (PIX pago)", formatMoney(s.recebidoMes))}
```

Por:

```js
      ${cardProgresso(s.recebidoMes, s.esperadoMes)}
```

- [ ] **Step 2: Adicionar a função `cardProgresso`**

Adicionar antes da função `card`:

```js
function cardProgresso(recebido, esperado) {
  if (!esperado) {
    return `
      <div class="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
        <div class="text-xs uppercase text-slate-500">Recebido no mês</div>
        <div class="mt-2 text-2xl font-semibold text-white">${formatMoney(recebido)}</div>
      </div>
    `;
  }
  const pct = Math.min(100, Math.round((recebido / esperado) * 100));
  const cor = pct >= 100 ? "#22c55e" : pct >= 50 ? "#f59e0b" : "#ef4444";
  return `
    <div class="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
      <div class="text-xs uppercase text-slate-500">Recebido / Esperado</div>
      <div class="mt-2 text-2xl font-semibold text-white">${formatMoney(recebido)}</div>
      <div class="mt-1 text-xs text-slate-400">de ${formatMoney(esperado)} esperado</div>
      <div class="mt-3 h-2 w-full rounded-full bg-slate-700">
        <div style="width:${pct}%;background:${cor};" class="h-2 rounded-full transition-all"></div>
      </div>
    </div>
  `;
}
```

- [ ] **Step 3: Verificação manual**

Abra `#/` → o card mostra o valor recebido, o esperado abaixo, e a barra de progresso colorida. Se não houver assinaturas ativas, mostra apenas "Recebido no mês" sem barra.

- [ ] **Step 4: Commit e push**

```bash
git add frontend/src/views/dashboard.js
git commit -m "feat: add progress card with esperado vs recebido to dashboard"
git push origin main
```

---

## Verificação Final

Com backend (`cd backend && npm run dev`) e frontend (`cd frontend && npm run dev`) rodando:

1. `#/subscriptions` → salvar sem cliente → toast "Selecione um cliente" → salvar sem valor → toast "Informe um valor mensal válido"
2. `#/clients` → digitar nome no campo de busca → lista filtra em tempo real
3. `#/appointments` → clicar Editar → painel abre com dados → alterar serviço → Salvar → toast verde; clicar Cancelar → fecha sem salvar
4. `#/` → card "Recebido / Esperado" com barra colorida
