# Melhorias Barbearia — Rodada 2 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar modal de confirmação (bottom sheet), validações em agendamentos e pagamentos, estado de carregamento nos botões de salvar, e atualizar o README.

**Architecture:** Novo módulo singleton `ui/modal.js` (padrão idêntico ao `ui/toast.js`); validações inseridas nos handlers existentes via `throw new Error(msg)`; estado de carregamento centralizado no listener de `submit` em `handlers/index.js` usando `finally`.

**Tech Stack:** Vanilla JS ES6 modules, Tailwind CSS (via PostCSS/Vite), sem dependências externas.

---

## Files Overview

| Ação | Arquivo | Motivo |
|------|---------|--------|
| Criar | `frontend/src/ui/modal.js` | Bottom sheet de confirmação |
| Modificar | `frontend/src/views/clients.js` | Adicionar `data-name` no botão Excluir |
| Modificar | `frontend/src/handlers/clients.js` | Substituir `confirm()` por `modal.confirm()` |
| Modificar | `frontend/src/handlers/appointments.js` | Adicionar validação de campos |
| Modificar | `frontend/src/handlers/payments.js` | Adicionar validação de campos |
| Modificar | `frontend/src/handlers/index.js` | Estado de carregamento no submit |
| Modificar | `README.md` | Remover "Próximos passos", atualizar "O que já existe" |

---

### Task 1: Criar `frontend/src/ui/modal.js`

**Files:**
- Create: `frontend/src/ui/modal.js`

- [ ] **Step 1: Criar o arquivo `modal.js`**

```js
// frontend/src/ui/modal.js
let overlay = null;
let sheet = null;
let resolvePromise = null;

function inject() {
  if (overlay) return;

  overlay = document.createElement("div");
  overlay.id = "modal-overlay";
  overlay.style.cssText =
    "position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:50;display:none;";

  sheet = document.createElement("div");
  sheet.id = "modal-sheet";
  sheet.style.cssText = [
    "position:fixed;bottom:0;left:0;right:0;",
    "background:#1e293b;border-top:1px solid #334155;",
    "border-top-left-radius:16px;border-top-right-radius:16px;",
    "padding:20px;z-index:51;",
    "transform:translateY(100%);transition:transform 200ms ease-out;",
  ].join("");

  sheet.innerHTML = `
    <div style="width:40px;height:4px;background:#475569;border-radius:2px;margin:0 auto 16px;"></div>
    <p id="modal-msg" style="color:#f1f5f9;font-weight:600;margin:0 0 4px;font-size:0.95rem;"></p>
    <p style="color:#94a3b8;font-size:0.8rem;margin:0 0 16px;">Esta ação não pode ser desfeita.</p>
    <div style="display:flex;gap:8px;">
      <button id="modal-cancel" type="button" style="flex:1;background:#1e293b;border:1px solid #475569;color:#cbd5e1;padding:10px;border-radius:8px;font-size:0.85rem;cursor:pointer;">Cancelar</button>
      <button id="modal-confirm" type="button" style="flex:1;background:#dc2626;border:none;color:#fff;padding:10px;border-radius:8px;font-size:0.85rem;font-weight:600;cursor:pointer;">Confirmar exclusão</button>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.appendChild(sheet);

  overlay.addEventListener("click", () => close(false));
  document.getElementById("modal-cancel").addEventListener("click", () => close(false));
  document.getElementById("modal-confirm").addEventListener("click", () => close(true));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.style.display !== "none") close(false);
  });
}

function close(result) {
  sheet.style.transition = "transform 150ms ease-in";
  sheet.style.transform = "translateY(100%)";
  setTimeout(() => {
    overlay.style.display = "none";
    sheet.style.transition = "transform 200ms ease-out";
    if (resolvePromise) {
      resolvePromise(result);
      resolvePromise = null;
    }
  }, 150);
}

export const modal = {
  confirm(message) {
    inject();
    document.getElementById("modal-msg").textContent = message;
    overlay.style.display = "block";
    requestAnimationFrame(() => {
      sheet.style.transform = "translateY(0)";
    });
    return new Promise((resolve) => {
      resolvePromise = resolve;
    });
  },
};
```

- [ ] **Step 2: Verificar criação do arquivo**

```bash
ls frontend/src/ui/
```

Esperado: `modal.js` e `toast.js` listados.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/ui/modal.js
git commit -m "feat: add modal.js bottom sheet confirmation component"
```

---

### Task 2: Adicionar `data-name` ao botão Excluir em `views/clients.js`

**Files:**
- Modify: `frontend/src/views/clients.js:16`

- [ ] **Step 1: Atualizar o botão Excluir na lista de clientes**

No arquivo `frontend/src/views/clients.js`, linha 16, trocar:

```js
<button type="button" data-action="delete-client" data-id="${c.id}" class="text-xs text-rose-400 hover:underline">Excluir</button>
```

Por:

```js
<button type="button" data-action="delete-client" data-id="${c.id}" data-name="${escapeHtml(c.nome)}" class="text-xs text-rose-400 hover:underline">Excluir</button>
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/views/clients.js
git commit -m "feat: add data-name to delete-client button for modal context"
```

---

### Task 3: Substituir `confirm()` por `modal.confirm()` em `handlers/clients.js`

**Files:**
- Modify: `frontend/src/handlers/clients.js`

- [ ] **Step 1: Adicionar import do modal**

No topo de `frontend/src/handlers/clients.js`, após a linha `import { toast } from "../ui/toast.js";`, adicionar:

```js
import { modal } from "../ui/modal.js";
```

- [ ] **Step 2: Substituir `confirm()` na função `handleDeleteClient`**

Trocar:

```js
export async function handleDeleteClient(btn) {
  const id = btn.dataset.id;
  if (!confirm("Excluir este cliente?")) return;
  await api(`/api/clients/${id}`, { method: "DELETE" });
  toast.success("Cliente excluído.");
  refresh();
}
```

Por:

```js
export async function handleDeleteClient(btn) {
  const id = btn.dataset.id;
  const name = btn.dataset.name || "este cliente";
  const confirmed = await modal.confirm(`Excluir ${name}?`);
  if (!confirmed) return;
  await api(`/api/clients/${id}`, { method: "DELETE" });
  toast.success("Cliente excluído.");
  refresh();
}
```

- [ ] **Step 3: Verificação manual**

Com `cd frontend && npm run dev` rodando, abra `http://localhost:5173/#/clients`:
- Clique "Excluir" em qualquer cliente → bottom sheet deve deslizar de baixo com o nome
- Clique "Cancelar" → sheet fecha, cliente permanece
- Clique "Confirmar exclusão" → cliente excluído, toast verde aparece

- [ ] **Step 4: Commit**

```bash
git add frontend/src/handlers/clients.js
git commit -m "feat: replace confirm() with modal bottom sheet in handleDeleteClient"
```

---

### Task 4: Adicionar validação em `handlers/appointments.js`

**Files:**
- Modify: `frontend/src/handlers/appointments.js`

- [ ] **Step 1: Adicionar validações antes do `body`**

Substituir a função `handleCreateAppointment` completa:

```js
export async function handleCreateAppointment(e) {
  const form = e.target;
  const fd = new FormData(form);
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
  await api("/api/appointments", { method: "POST", body });
  form.reset();
  toast.success("Agendamento criado!");
  refresh();
}
```

- [ ] **Step 2: Verificação manual**

Abra `http://localhost:5173/#/appointments`:
- Clique "Salvar" sem cliente → toast vermelho "Selecione um cliente"
- Clique "Salvar" sem data/hora → toast vermelho "Data e hora são obrigatórias"
- Clique "Salvar" sem serviço → toast vermelho "Serviço é obrigatório"

- [ ] **Step 3: Commit**

```bash
git add frontend/src/handlers/appointments.js
git commit -m "feat: add required field validation in handleCreateAppointment"
```

---

### Task 5: Adicionar validação em `handlers/payments.js`

**Files:**
- Modify: `frontend/src/handlers/payments.js`

- [ ] **Step 1: Adicionar validações antes do `body`**

Substituir a função `handleCreatePayment` completa:

```js
export async function handleCreatePayment(e) {
  const form = e.target;
  const fd = new FormData(form);
  const competencia = String(fd.get("competencia") ?? "").trim();
  const amount = Number(String(fd.get("amount")).replace(",", "."));
  if (!competencia || !/^\d{4}-\d{2}$/.test(competencia))
    throw new Error("Competência inválida (use YYYY-MM)");
  if (!amount || amount <= 0) throw new Error("Informe um valor válido");
  const sub = fd.get("subscriptionId");
  const body = {
    clientId: Number(fd.get("clientId")),
    subscriptionId: sub ? Number(sub) : null,
    competencia,
    amount,
    status: "paid",
    pixKey: fd.get("pixKey") || null,
    txId: fd.get("txId") || null,
    comprovanteTexto: fd.get("comprovanteTexto") || null,
  };
  await api("/api/payments", { method: "POST", body });
  form.reset();
  toast.success("Pagamento registrado!");
  refresh();
}
```

- [ ] **Step 2: Verificação manual**

Abra `http://localhost:5173/#/payments`:
- Clique "Registrar pagamento" sem competência ou com formato errado → toast "Competência inválida (use YYYY-MM)"
- Clique sem valor → toast "Informe um valor válido"

- [ ] **Step 3: Commit**

```bash
git add frontend/src/handlers/payments.js
git commit -m "feat: add required field validation in handleCreatePayment"
```

---

### Task 6: Estado de carregamento nos botões de submit em `handlers/index.js`

**Files:**
- Modify: `frontend/src/handlers/index.js`

- [ ] **Step 1: Atualizar o listener de `submit` com estado de carregamento**

Substituir o bloco `document.addEventListener("submit", ...)` completo:

```js
document.addEventListener("submit", async (e) => {
  const form = e.target;
  if (!(form instanceof HTMLFormElement)) return;
  const kind = form.dataset.form;
  if (!kind) return;
  e.preventDefault();
  const btn = form.querySelector('[type="submit"]');
  const originalText = btn ? btn.textContent : null;
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Salvando...";
  }
  try {
    if (kind === "create-client")             await handleCreateClient(e);
    else if (kind === "update-client")        await handleUpdateClient(e);
    else if (kind === "create-appointment")   await handleCreateAppointment(e);
    else if (kind === "create-subscription")  await handleCreateSubscription(e);
    else if (kind === "update-subscription")  await handleUpdateSubscription(e);
    else if (kind === "create-payment")       await handleCreatePayment(e);
  } catch (err) {
    toast.error(err.message || String(err));
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  }
});
```

O bloco `document.addEventListener("click", ...)` permanece sem alteração.

- [ ] **Step 2: Verificação manual**

Em qualquer formulário (ex: `#/clients`), clique "Salvar" com dados válidos — o botão deve mostrar "Salvando..." e ficar desabilitado durante a requisição, depois restaurar o texto original.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/handlers/index.js
git commit -m "feat: add loading state to submit buttons via finally in index.js"
```

---

### Task 7: Atualizar README

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Ler o README atual**

Leia `README.md` para localizar as seções "Próximos passos" e "O que já existe".

- [ ] **Step 2: Remover a seção "Próximos passos"**

Remover a seção inteira "Próximos passos" (título + todos os itens abaixo).

- [ ] **Step 3: Acrescentar novos itens em "O que já existe"**

No final da lista em "O que já existe", adicionar:

```
- Toasts de sucesso e erro (substituem `alert()`)
- Modal de confirmação para exclusão (bottom sheet)
- Validações de campos obrigatórios (clientes, agendamentos, pagamentos)
- Link ativo destacado no menu de navegação
- Handlers organizados por domínio (`handlers/clients.js`, etc.)
```

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: update README — remove stale next steps, add implemented features"
```

---

## Verificação Final

Com backend (`cd backend && npm run dev`) e frontend (`cd frontend && npm run dev`) rodando:

1. `#/clients` → Excluir cliente → bottom sheet com nome → Cancelar (sem excluir) → Confirmar (exclui + toast verde)
2. `#/appointments` → Salvar sem campos → toasts vermelhos corretos para cada campo
3. `#/payments` → Registrar sem competência ou valor → toasts vermelhos
4. Qualquer formulário → botão mostra "Salvando..." e fica desabilitado durante request
5. README sem seção "Próximos passos", com novos itens em "O que já existe"
