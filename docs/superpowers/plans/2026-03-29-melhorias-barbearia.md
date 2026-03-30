# Melhorias do Frontend — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar sistema de toast, centralizar utilitários, destacar nav ativo e dividir handlers por domínio.

**Architecture:** SPA com vanilla JS e módulos ES6. Sem framework de testes — verificação feita manualmente no browser (Vite em `localhost:5173`, backend em `localhost:3001`). As quatro tarefas são independentes e executadas em sequência.

**Tech Stack:** Vite 6, JavaScript ES6 modules, Tailwind CSS 3, Express + better-sqlite3 (backend não é alterado).

---

## Mapa de arquivos

| Ação     | Arquivo                                   | Responsabilidade                                          |
|----------|-------------------------------------------|-----------------------------------------------------------|
| Criar    | `frontend/src/utils.js`                   | `escapeHtml` e `formatMoney` — fonte única de verdade     |
| Criar    | `frontend/src/ui/toast.js`                | Container de toasts + objeto `toast` exportado            |
| Criar    | `frontend/src/handlers/index.js`          | Registra os dois listeners globais e delega               |
| Criar    | `frontend/src/handlers/clients.js`        | Handlers de cliente (create, update, edit, delete)        |
| Criar    | `frontend/src/handlers/subscriptions.js`  | Handlers de assinatura (create, update, edit)             |
| Criar    | `frontend/src/handlers/appointments.js`   | Handler de agendamento (create)                           |
| Criar    | `frontend/src/handlers/payments.js`       | Handler de pagamento (create)                             |
| Modificar| `frontend/src/views/clients.js`           | Trocar `escapeHtml` local por import de utils             |
| Modificar| `frontend/src/views/appointments.js`      | Trocar `escapeHtml` local por import de utils             |
| Modificar| `frontend/src/views/finance.js`           | Trocar helpers locais por import de utils                 |
| Modificar| `frontend/src/views/payments.js`          | Trocar helpers locais por import de utils                 |
| Modificar| `frontend/src/views/subscriptions.js`     | Trocar helpers locais por import de utils                 |
| Modificar| `frontend/src/ui/layout.js`               | Detectar hash ativo e aplicar classe ao link              |
| Modificar| `frontend/src/handlers.js`                | Adicionar import de toast, substituir `alert`, add toasts de sucesso |
| Modificar| `frontend/src/main.js`                    | Trocar import de `./handlers.js` para `./handlers/index.js` |
| Remover  | `frontend/src/handlers.js`                | Substituído pela pasta `handlers/`                        |

---

## Tarefa 1 — Criar `utils.js` e atualizar as 5 views

**Arquivos:**
- Criar: `frontend/src/utils.js`
- Modificar: `frontend/src/views/clients.js`
- Modificar: `frontend/src/views/appointments.js`
- Modificar: `frontend/src/views/finance.js`
- Modificar: `frontend/src/views/payments.js`
- Modificar: `frontend/src/views/subscriptions.js`

- [ ] **Passo 1: Criar `frontend/src/utils.js`**

```js
export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function formatMoney(n) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(n) || 0);
}
```

- [ ] **Passo 2: Atualizar `frontend/src/views/clients.js`**

Adicionar no topo do arquivo (após o import de `api`):
```js
import { escapeHtml } from "../utils.js";
```

Remover do final do arquivo estas linhas (a função inteira):
```js
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
```

- [ ] **Passo 3: Atualizar `frontend/src/views/appointments.js`**

Adicionar no topo:
```js
import { escapeHtml } from "../utils.js";
```

Remover do final (a função `escapeHtml` inteira — mesmas 7 linhas acima).

- [ ] **Passo 4: Atualizar `frontend/src/views/finance.js`**

Adicionar no topo:
```js
import { escapeHtml, formatMoney } from "../utils.js";
```

Remover do final as duas funções locais:
```js
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatMoney(n) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number(n) || 0
  );
}
```

- [ ] **Passo 5: Atualizar `frontend/src/views/payments.js`**

Adicionar no topo:
```js
import { escapeHtml, formatMoney } from "../utils.js";
```

Remover as duas funções locais do final (mesmas do passo 4).

- [ ] **Passo 6: Atualizar `frontend/src/views/subscriptions.js`**

Adicionar no topo:
```js
import { escapeHtml, formatMoney } from "../utils.js";
```

Remover as duas funções locais do final (mesmas do passo 4).

- [ ] **Passo 7: Verificar no browser**

Com backend (`cd backend && npm run dev`) e frontend (`cd frontend && npm run dev`) rodando, abra `http://localhost:5173`.

Navegue por todas as telas:
- `#/clients` → lista de clientes deve aparecer normalmente
- `#/appointments` → lista de agendamentos deve aparecer
- `#/subscriptions` → lista de assinaturas deve aparecer
- `#/payments` → lista de pagamentos deve aparecer
- Clique em "Financeiro" de qualquer cliente → deve mostrar assinaturas e pagamentos

Se alguma tela estiver em branco ou com erro, abra o DevTools (F12) → aba Console e corrija o import faltante.

- [ ] **Passo 8: Commit**

```bash
git add frontend/src/utils.js frontend/src/views/
git commit -m "refactor: centraliza escapeHtml e formatMoney em utils.js"
```

---

## Tarefa 2 — Criar `ui/toast.js`

**Arquivos:**
- Criar: `frontend/src/ui/toast.js`

- [ ] **Passo 1: Criar `frontend/src/ui/toast.js`**

```js
const STYLES = `
@keyframes toast-in {
  from { opacity: 0; transform: translateY(0.5rem); }
  to   { opacity: 1; transform: translateY(0); }
}
#toast-container {
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  z-index: 9999;
  pointer-events: none;
}
.toast-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  color: #fff;
  font-size: 0.875rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.4);
  animation: toast-in 0.2s ease forwards;
  pointer-events: auto;
  max-width: 320px;
}
.toast-close {
  margin-left: auto;
  background: none;
  border: none;
  color: inherit;
  opacity: 0.7;
  cursor: pointer;
  font-size: 1.1rem;
  line-height: 1;
  padding: 0 0.25rem;
}
.toast-close:hover { opacity: 1; }
`;

const COLORS = {
  success: "#15803d",
  error:   "#b91c1c",
  warn:    "#b45309",
};

const ICONS = {
  success: "✅",
  error:   "❌",
  warn:    "⚠️",
};

function ensureContainer() {
  let el = document.getElementById("toast-container");
  if (el) return el;

  const style = document.createElement("style");
  style.textContent = STYLES;
  document.head.appendChild(style);

  el = document.createElement("div");
  el.id = "toast-container";
  document.body.appendChild(el);
  return el;
}

function show(type, message) {
  const container = ensureContainer();

  const item = document.createElement("div");
  item.className = "toast-item";
  item.style.background = COLORS[type];
  item.innerHTML = `
    <span>${ICONS[type]}</span>
    <span>${String(message)}</span>
    <button class="toast-close" aria-label="Fechar">×</button>
  `;

  const close = item.querySelector(".toast-close");
  const timer = setTimeout(() => item.remove(), 3000);
  close.addEventListener("click", () => {
    clearTimeout(timer);
    item.remove();
  });

  container.appendChild(item);
}

export const toast = {
  success: (msg) => show("success", msg),
  error:   (msg) => show("error",   msg),
  warn:    (msg) => show("warn",    msg),
};
```

- [ ] **Passo 2: Verificar no browser via console**

Com o Vite rodando, abra `http://localhost:5173`, depois abra o DevTools (F12) → aba Console e execute cada linha:

```js
// Testar os 3 tipos de toast
const { toast } = await import("/src/ui/toast.js");
toast.success("Funcionou!");
toast.error("Erro de teste");
toast.warn("Aviso de teste");
```

Você deve ver 3 toasts empilhados no canto inferior direito. Cada um some após 3 segundos. O botão × fecha manualmente.

- [ ] **Passo 3: Commit**

```bash
git add frontend/src/ui/toast.js
git commit -m "feat: cria sistema de toast (success, error, warn)"
```

---

## Tarefa 3 — Substituir `alert()` por toast em `handlers.js`

**Arquivos:**
- Modificar: `frontend/src/handlers.js`

- [ ] **Passo 1: Substituir o conteúdo completo de `frontend/src/handlers.js`**

```js
import { toast } from "./ui/toast.js";

function refresh() {
  document.dispatchEvent(new CustomEvent("spa:refresh"));
}

document.addEventListener("submit", async (e) => {
  const form = e.target;
  if (!(form instanceof HTMLFormElement)) return;
  const kind = form.dataset.form;
  if (!kind) return;

  e.preventDefault();

  try {
    if (kind === "create-client") {
      const fd = new FormData(form);
      const body = {
        nome: fd.get("nome"),
        telefone: fd.get("telefone") || null,
        observacoes: fd.get("observacoes") || null,
      };
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar");
      form.reset();
      toast.success("Cliente salvo com sucesso!");
      refresh();
      return;
    }

    if (kind === "update-client") {
      const fd = new FormData(form);
      const id = fd.get("id");
      if (!id) throw new Error("Cliente inválido");
      const body = {
        nome: fd.get("nome"),
        telefone: fd.get("telefone") || null,
        observacoes: fd.get("observacoes") || null,
      };
      const res = await fetch(`/api/clients/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao atualizar");
      document.getElementById("edit-client-wrap")?.classList.add("hidden");
      form.reset();
      toast.success("Cliente atualizado!");
      refresh();
      return;
    }

    if (kind === "create-appointment") {
      const fd = new FormData(form);
      const body = {
        clientId: Number(fd.get("clientId")),
        dataHora: fd.get("dataHora"),
        servico: fd.get("servico") || null,
        observacoes: fd.get("observacoes") || null,
        duracaoMinutos: fd.get("duracaoMinutos") ? Number(fd.get("duracaoMinutos")) : null,
        status: fd.get("status") || "agendado",
      };
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao agendar");
      form.reset();
      toast.success("Agendamento criado!");
      refresh();
      return;
    }

    if (kind === "create-subscription") {
      const fd = new FormData(form);
      const body = {
        clientId: Number(fd.get("clientId")),
        valorMensal: Number(String(fd.get("valorMensal")).replace(",", ".")),
        startDate: fd.get("startDate"),
        endDate: fd.get("endDate") || null,
        ativo: fd.get("ativo") === "on",
      };
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro na assinatura");
      form.reset();
      toast.success("Assinatura criada!");
      refresh();
      return;
    }

    if (kind === "update-subscription") {
      const fd = new FormData(form);
      const id = fd.get("id");
      if (!id) throw new Error("Assinatura inválida");
      const endRaw = fd.get("endDate");
      const body = {
        valorMensal: Number(String(fd.get("valorMensal")).replace(",", ".")),
        startDate: fd.get("startDate"),
        endDate: endRaw && String(endRaw).trim() ? endRaw : null,
        ativo: fd.get("ativo") === "on",
      };
      const res = await fetch(`/api/subscriptions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao atualizar assinatura");
      document.getElementById("edit-subscription-wrap")?.classList.add("hidden");
      const subNomeEl = document.getElementById("edit-sub-client-nome");
      if (subNomeEl) subNomeEl.textContent = "—";
      form.reset();
      toast.success("Assinatura atualizada!");
      refresh();
      return;
    }

    if (kind === "create-payment") {
      const fd = new FormData(form);
      const sub = fd.get("subscriptionId");
      const body = {
        clientId: Number(fd.get("clientId")),
        subscriptionId: sub ? Number(sub) : null,
        competencia: fd.get("competencia"),
        amount: Number(String(fd.get("amount")).replace(",", ".")),
        status: "paid",
        pixKey: fd.get("pixKey") || null,
        txId: fd.get("txId") || null,
        comprovanteTexto: fd.get("comprovanteTexto") || null,
      };
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro no pagamento");
      form.reset();
      toast.success("Pagamento registrado!");
      refresh();
      return;
    }
  } catch (err) {
    toast.error(err.message || String(err));
  }
});

document.addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const action = btn.dataset.action;

  if (action === "edit-client") {
    try {
      const id = btn.dataset.id;
      const res = await fetch(`/api/clients/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Cliente não encontrado");

      const wrap = document.getElementById("edit-client-wrap");
      const form = wrap?.querySelector('form[data-form="update-client"]');
      if (!form || !wrap) return;

      form.querySelector('[name="id"]').value = String(data.id);
      form.querySelector('[name="nome"]').value = data.nome ?? "";
      form.querySelector('[name="telefone"]').value = data.telefone ?? "";
      form.querySelector('[name="observacoes"]').value = data.observacoes ?? "";

      wrap.classList.remove("hidden");
      wrap.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } catch (err) {
      toast.error(err.message || String(err));
    }
    return;
  }

  if (action === "cancel-edit-client") {
    const wrap = document.getElementById("edit-client-wrap");
    const form = wrap?.querySelector('form[data-form="update-client"]');
    form?.reset();
    wrap?.classList.add("hidden");
    return;
  }

  if (action === "edit-subscription") {
    try {
      const id = btn.dataset.id;
      const res = await fetch(`/api/subscriptions/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Assinatura não encontrada");

      const wrap = document.getElementById("edit-subscription-wrap");
      const form = wrap?.querySelector('form[data-form="update-subscription"]');
      if (!form || !wrap) return;

      const nomeEl = document.getElementById("edit-sub-client-nome");
      if (nomeEl) nomeEl.textContent = data.client_nome ?? "—";

      form.querySelector('[name="id"]').value = String(data.id);
      form.querySelector('[name="valorMensal"]').value = String(data.valor_mensal ?? "");
      const sd = data.start_date != null ? String(data.start_date).slice(0, 10) : "";
      form.querySelector('[name="startDate"]').value = sd;
      const ed = data.end_date != null ? String(data.end_date).slice(0, 10) : "";
      form.querySelector('[name="endDate"]').value = ed;
      const ativoEl = form.querySelector('[name="ativo"]');
      if (ativoEl) ativoEl.checked = Boolean(data.ativo);

      wrap.classList.remove("hidden");
      wrap.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } catch (err) {
      toast.error(err.message || String(err));
    }
    return;
  }

  if (action === "cancel-edit-subscription") {
    const wrap = document.getElementById("edit-subscription-wrap");
    const form = wrap?.querySelector('form[data-form="update-subscription"]');
    form?.reset();
    const nomeEl = document.getElementById("edit-sub-client-nome");
    if (nomeEl) nomeEl.textContent = "—";
    wrap?.classList.add("hidden");
    return;
  }

  if (action === "delete-client") {
    try {
      const id = btn.dataset.id;
      if (!confirm("Excluir este cliente?")) return;
      const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erro ao excluir");
      }
      toast.success("Cliente excluído.");
      refresh();
    } catch (err) {
      toast.error(err.message || String(err));
    }
  }
});
```

- [ ] **Passo 2: Verificar no browser — erro**

Vá para `#/clients`. No formulário "Novo cliente", clique em "Salvar" **sem preencher o nome**.

Esperado: toast vermelho com "Nome é obrigatório" no canto inferior direito. Nenhum `alert()` deve aparecer.

- [ ] **Passo 3: Verificar no browser — sucesso**

Preencha o nome de um cliente e salve.

Esperado: toast verde com "Cliente salvo com sucesso!" aparece e some após 3 segundos. A lista atualiza automaticamente.

- [ ] **Passo 4: Commit**

```bash
git add frontend/src/handlers.js
git commit -m "feat: substitui alert() por toast e adiciona feedback de sucesso"
```

---

## Tarefa 4 — Link ativo na navegação

**Arquivos:**
- Modificar: `frontend/src/ui/layout.js`

- [ ] **Passo 1: Substituir o conteúdo completo de `frontend/src/ui/layout.js`**

```js
export function layout({ title, body }) {
  const currentHash = window.location.hash || "#/";

  const nav = [
    { href: "#/",             label: "Dashboard"    },
    { href: "#/clients",      label: "Clientes"     },
    { href: "#/appointments", label: "Agendamentos" },
    { href: "#/subscriptions",label: "Assinaturas"  },
    { href: "#/payments",     label: "PIX simulado" },
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
      return `<a href="${n.href}" class="${cls}">${n.label}</a>`;
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

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
```

- [ ] **Passo 2: Verificar no browser**

Navegue entre as páginas pelo menu:
- Em `#/` → link "Dashboard" deve ter fundo escuro e texto dourado (`text-amber-400`)
- Em `#/clients` → link "Clientes" deve estar destacado
- Em `#/clients/1/finance` → link "Clientes" deve continuar destacado (hash começa com `#/clients`)
- Os outros links devem estar cinza e voltar dourado ao hover

- [ ] **Passo 3: Commit**

```bash
git add frontend/src/ui/layout.js
git commit -m "feat: destaca link ativo no menu de navegação"
```

---

## Tarefa 5 — Refatorar `handlers.js` em pasta `handlers/`

**Arquivos:**
- Criar: `frontend/src/handlers/clients.js`
- Criar: `frontend/src/handlers/subscriptions.js`
- Criar: `frontend/src/handlers/appointments.js`
- Criar: `frontend/src/handlers/payments.js`
- Criar: `frontend/src/handlers/index.js`
- Modificar: `frontend/src/main.js`
- Remover: `frontend/src/handlers.js`

- [ ] **Passo 1: Criar `frontend/src/handlers/clients.js`**

```js
import { api } from "../api.js";
import { toast } from "../ui/toast.js";

function refresh() {
  document.dispatchEvent(new CustomEvent("spa:refresh"));
}

export async function handleCreateClient(e) {
  const form = e.target;
  const fd = new FormData(form);
  const body = {
    nome: fd.get("nome"),
    telefone: fd.get("telefone") || null,
    observacoes: fd.get("observacoes") || null,
  };
  await api("/api/clients", { method: "POST", body });
  form.reset();
  toast.success("Cliente salvo com sucesso!");
  refresh();
}

export async function handleUpdateClient(e) {
  const form = e.target;
  const fd = new FormData(form);
  const id = fd.get("id");
  if (!id) throw new Error("Cliente inválido");
  const body = {
    nome: fd.get("nome"),
    telefone: fd.get("telefone") || null,
    observacoes: fd.get("observacoes") || null,
  };
  await api(`/api/clients/${id}`, { method: "PUT", body });
  document.getElementById("edit-client-wrap")?.classList.add("hidden");
  form.reset();
  toast.success("Cliente atualizado!");
  refresh();
}

export async function handleEditClient(btn) {
  const id = btn.dataset.id;
  const data = await api(`/api/clients/${id}`);
  const wrap = document.getElementById("edit-client-wrap");
  const form = wrap?.querySelector('form[data-form="update-client"]');
  if (!form || !wrap) return;
  form.querySelector('[name="id"]').value = String(data.id);
  form.querySelector('[name="nome"]').value = data.nome ?? "";
  form.querySelector('[name="telefone"]').value = data.telefone ?? "";
  form.querySelector('[name="observacoes"]').value = data.observacoes ?? "";
  wrap.classList.remove("hidden");
  wrap.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

export function handleCancelEditClient() {
  const wrap = document.getElementById("edit-client-wrap");
  const form = wrap?.querySelector('form[data-form="update-client"]');
  form?.reset();
  wrap?.classList.add("hidden");
}

export async function handleDeleteClient(btn) {
  const id = btn.dataset.id;
  if (!confirm("Excluir este cliente?")) return;
  await api(`/api/clients/${id}`, { method: "DELETE" });
  toast.success("Cliente excluído.");
  refresh();
}
```

- [ ] **Passo 2: Criar `frontend/src/handlers/subscriptions.js`**

```js
import { api } from "../api.js";
import { toast } from "../ui/toast.js";

function refresh() {
  document.dispatchEvent(new CustomEvent("spa:refresh"));
}

export async function handleCreateSubscription(e) {
  const form = e.target;
  const fd = new FormData(form);
  const body = {
    clientId: Number(fd.get("clientId")),
    valorMensal: Number(String(fd.get("valorMensal")).replace(",", ".")),
    startDate: fd.get("startDate"),
    endDate: fd.get("endDate") || null,
    ativo: fd.get("ativo") === "on",
  };
  await api("/api/subscriptions", { method: "POST", body });
  form.reset();
  toast.success("Assinatura criada!");
  refresh();
}

export async function handleUpdateSubscription(e) {
  const form = e.target;
  const fd = new FormData(form);
  const id = fd.get("id");
  if (!id) throw new Error("Assinatura inválida");
  const endRaw = fd.get("endDate");
  const body = {
    valorMensal: Number(String(fd.get("valorMensal")).replace(",", ".")),
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

export async function handleEditSubscription(btn) {
  const id = btn.dataset.id;
  const data = await api(`/api/subscriptions/${id}`);
  const wrap = document.getElementById("edit-subscription-wrap");
  const form = wrap?.querySelector('form[data-form="update-subscription"]');
  if (!form || !wrap) return;
  const nomeEl = document.getElementById("edit-sub-client-nome");
  if (nomeEl) nomeEl.textContent = data.client_nome ?? "—";
  form.querySelector('[name="id"]').value = String(data.id);
  form.querySelector('[name="valorMensal"]').value = String(data.valor_mensal ?? "");
  const sd = data.start_date != null ? String(data.start_date).slice(0, 10) : "";
  form.querySelector('[name="startDate"]').value = sd;
  const ed = data.end_date != null ? String(data.end_date).slice(0, 10) : "";
  form.querySelector('[name="endDate"]').value = ed;
  const ativoEl = form.querySelector('[name="ativo"]');
  if (ativoEl) ativoEl.checked = Boolean(data.ativo);
  wrap.classList.remove("hidden");
  wrap.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

export function handleCancelEditSubscription() {
  const wrap = document.getElementById("edit-subscription-wrap");
  const form = wrap?.querySelector('form[data-form="update-subscription"]');
  form?.reset();
  const nomeEl = document.getElementById("edit-sub-client-nome");
  if (nomeEl) nomeEl.textContent = "—";
  wrap?.classList.add("hidden");
}
```

- [ ] **Passo 3: Criar `frontend/src/handlers/appointments.js`**

```js
import { api } from "../api.js";
import { toast } from "../ui/toast.js";

function refresh() {
  document.dispatchEvent(new CustomEvent("spa:refresh"));
}

export async function handleCreateAppointment(e) {
  const form = e.target;
  const fd = new FormData(form);
  const body = {
    clientId: Number(fd.get("clientId")),
    dataHora: fd.get("dataHora"),
    servico: fd.get("servico") || null,
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

- [ ] **Passo 4: Criar `frontend/src/handlers/payments.js`**

```js
import { api } from "../api.js";
import { toast } from "../ui/toast.js";

function refresh() {
  document.dispatchEvent(new CustomEvent("spa:refresh"));
}

export async function handleCreatePayment(e) {
  const form = e.target;
  const fd = new FormData(form);
  const sub = fd.get("subscriptionId");
  const body = {
    clientId: Number(fd.get("clientId")),
    subscriptionId: sub ? Number(sub) : null,
    competencia: fd.get("competencia"),
    amount: Number(String(fd.get("amount")).replace(",", ".")),
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

- [ ] **Passo 5: Criar `frontend/src/handlers/index.js`**

```js
import { toast } from "../ui/toast.js";
import {
  handleCreateClient,
  handleUpdateClient,
  handleEditClient,
  handleCancelEditClient,
  handleDeleteClient,
} from "./clients.js";
import {
  handleCreateSubscription,
  handleUpdateSubscription,
  handleEditSubscription,
  handleCancelEditSubscription,
} from "./subscriptions.js";
import { handleCreateAppointment } from "./appointments.js";
import { handleCreatePayment } from "./payments.js";

document.addEventListener("submit", async (e) => {
  const form = e.target;
  if (!(form instanceof HTMLFormElement)) return;
  const kind = form.dataset.form;
  if (!kind) return;
  e.preventDefault();
  try {
    if (kind === "create-client")       await handleCreateClient(e);
    else if (kind === "update-client")       await handleUpdateClient(e);
    else if (kind === "create-appointment")  await handleCreateAppointment(e);
    else if (kind === "create-subscription") await handleCreateSubscription(e);
    else if (kind === "update-subscription") await handleUpdateSubscription(e);
    else if (kind === "create-payment")      await handleCreatePayment(e);
  } catch (err) {
    toast.error(err.message || String(err));
  }
});

document.addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const action = btn.dataset.action;
  try {
    if (action === "edit-client")                  await handleEditClient(btn);
    else if (action === "cancel-edit-client")           handleCancelEditClient();
    else if (action === "edit-subscription")        await handleEditSubscription(btn);
    else if (action === "cancel-edit-subscription")     handleCancelEditSubscription();
    else if (action === "delete-client")            await handleDeleteClient(btn);
  } catch (err) {
    toast.error(err.message || String(err));
  }
});
```

- [ ] **Passo 6: Atualizar `frontend/src/main.js`**

Trocar a linha de import de handlers:
```js
// Antes:
import "./handlers.js";

// Depois:
import "./handlers/index.js";
```

O arquivo completo fica:
```js
import "./style.css";
import "./handlers/index.js";
import { mountRouter } from "./router.js";

mountRouter(document.getElementById("app"));
```

- [ ] **Passo 7: Remover o arquivo antigo**

```bash
rm frontend/src/handlers.js
```

- [ ] **Passo 8: Verificar no browser — fluxo completo**

Teste cada ação uma vez:
1. `#/clients` → criar cliente → toast verde "Cliente salvo com sucesso!"
2. `#/clients` → clicar "Editar" → alterar nome → salvar → toast verde "Cliente atualizado!"
3. `#/clients` → clicar "Excluir" → confirmar → toast verde "Cliente excluído."
4. `#/appointments` → criar agendamento → toast verde "Agendamento criado!"
5. `#/subscriptions` → criar assinatura → toast verde "Assinatura criada!"
6. `#/subscriptions` → clicar "Editar" → alterar valor → salvar → toast verde "Assinatura atualizada!"
7. `#/payments` → registrar pagamento → toast verde "Pagamento registrado!"
8. Qualquer formulário com campo obrigatório vazio → toast vermelho com a mensagem de erro

- [ ] **Passo 9: Commit final**

```bash
git add frontend/src/handlers/ frontend/src/main.js
git commit -m "refactor: divide handlers.js em pasta handlers/ por domínio"
```

---

## Resumo dos commits produzidos

```
refactor: centraliza escapeHtml e formatMoney em utils.js
feat: cria sistema de toast (success, error, warn)
feat: substitui alert() por toast e adiciona feedback de sucesso
feat: destaca link ativo no menu de navegação
refactor: divide handlers.js em pasta handlers/ por domínio
```
