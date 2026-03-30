# Agendamento Público — Plano A: Serviços + Rotas Públicas + Página de Agendamento

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar tabela de serviços no banco, CRUD no painel do barbeiro, rotas públicas sem autenticação e página mobile `agendar.html` com fluxo de 4 steps para o cliente agendar sozinho.

**Architecture:** Backend: tabela `services` em `db.js`, rotas em `routes/services.js` e `routes/public.js`, registradas em `server.js`. Frontend painel: view + handlers + router seguindo o padrão já estabelecido. Página pública: `frontend/public/agendar.html` — HTML independente do SPA, Tailwind via CDN, JS inline, consome `/api/public/*`.

**Tech Stack:** Express + better-sqlite3, Vanilla JS ES6 modules (painel), HTML+JS inline (página pública), Tailwind CSS CDN (página pública).

---

## Files Overview

| Ação | Arquivo |
|------|---------|
| Modificar | `backend/src/db.js` — tabela `services` + seeds |
| Criar | `backend/src/routes/services.js` — CRUD de serviços |
| Criar | `backend/src/routes/public.js` — rotas públicas |
| Modificar | `backend/src/server.js` — registrar `/api/services` e `/api/public` |
| Criar | `frontend/src/views/services.js` — tela de gestão |
| Criar | `frontend/src/handlers/services.js` — handlers CRUD |
| Modificar | `frontend/src/handlers/index.js` — registrar handlers de serviços |
| Modificar | `frontend/src/router.js` — rota `#/services` |
| Modificar | `frontend/src/ui/layout.js` — link "Serviços" no nav |
| Criar | `frontend/public/agendar.html` — página pública mobile |

---

### Task 1: Tabela `services` em `backend/src/db.js`

**Files:**
- Modify: `backend/src/db.js`

- [ ] **Step 1: Adicionar tabela e seeds ao `db.exec`**

No final do bloco `db.exec(...)`, antes do fechamento da template string, adicionar:

```sql
CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  preco REAL NOT NULL DEFAULT 0,
  duracao_minutos INTEGER NOT NULL DEFAULT 30,
  ativo INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_services_ativo ON services(ativo);
```

- [ ] **Step 2: Adicionar seeds após o `db.exec`**

Após o bloco `db.exec(...)`, adicionar:

```js
// Seeds de serviços — insere só se a tabela estiver vazia
const serviceCount = db.prepare("SELECT COUNT(*) AS n FROM services").get().n;
if (serviceCount === 0) {
  const insertService = db.prepare(
    "INSERT INTO services (nome, preco, duracao_minutos) VALUES (?, ?, ?)"
  );
  const seedServices = db.transaction(() => {
    insertService.run("Corte", 35.00, 30);
    insertService.run("Barba", 25.00, 20);
    insertService.run("Corte + Barba", 55.00, 50);
    insertService.run("Corte Infantil", 30.00, 25);
    insertService.run("Pigmentação", 45.00, 40);
  });
  seedServices();
}
```

- [ ] **Step 3: Verificar que o banco é criado sem erros**

```bash
cd backend && node --input-type=module <<'EOF'
import { db } from "./src/db.js";
console.log(db.prepare("SELECT * FROM services").all());
EOF
```

Esperado: array com 5 serviços listados.

- [ ] **Step 4: Commit**

```bash
git add backend/src/db.js
git commit -m "feat: add services table and seeds to db.js"
```

---

### Task 2: Rota CRUD de serviços — `backend/src/routes/services.js`

**Files:**
- Create: `backend/src/routes/services.js`

- [ ] **Step 1: Criar o arquivo**

```js
// backend/src/routes/services.js
import { Router } from "express";
import { db } from "../db.js";

const router = Router();

router.get("/", (_req, res) => {
  const rows = db.prepare("SELECT * FROM services WHERE ativo = 1 ORDER BY nome").all();
  res.json(rows);
});

router.get("/all", (_req, res) => {
  const rows = db.prepare("SELECT * FROM services ORDER BY nome").all();
  res.json(rows);
});

router.post("/", (req, res) => {
  const { nome, preco, duracao_minutos } = req.body || {};
  if (!nome || !String(nome).trim()) {
    return res.status(400).json({ error: "Nome é obrigatório" });
  }
  const info = db
    .prepare("INSERT INTO services (nome, preco, duracao_minutos) VALUES (?, ?, ?)")
    .run(String(nome).trim(), Number(preco) || 0, Number(duracao_minutos) || 30);
  const row = db.prepare("SELECT * FROM services WHERE id = ?").get(info.lastInsertRowid);
  res.status(201).json(row);
});

router.put("/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM services WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Serviço não encontrado" });
  const { nome, preco, duracao_minutos } = req.body || {};
  if (nome !== undefined && !String(nome).trim()) {
    return res.status(400).json({ error: "Nome não pode ser vazio" });
  }
  db.prepare("UPDATE services SET nome = ?, preco = ?, duracao_minutos = ? WHERE id = ?").run(
    nome !== undefined ? String(nome).trim() : existing.nome,
    preco !== undefined ? Number(preco) : existing.preco,
    duracao_minutos !== undefined ? Number(duracao_minutos) : existing.duracao_minutos,
    req.params.id
  );
  res.json(db.prepare("SELECT * FROM services WHERE id = ?").get(req.params.id));
});

router.get("/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM services WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "Serviço não encontrado" });
  res.json(row);
});

router.patch("/:id/toggle", (req, res) => {
  const existing = db.prepare("SELECT * FROM services WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Serviço não encontrado" });
  const newAtivo = existing.ativo ? 0 : 1;
  db.prepare("UPDATE services SET ativo = ? WHERE id = ?").run(newAtivo, req.params.id);
  res.json(db.prepare("SELECT * FROM services WHERE id = ?").get(req.params.id));
});

export default router;
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/routes/services.js
git commit -m "feat: add services CRUD route"
```

---

### Task 3: Rotas públicas — `backend/src/routes/public.js`

**Files:**
- Create: `backend/src/routes/public.js`

- [ ] **Step 1: Criar o arquivo**

```js
// backend/src/routes/public.js
import { Router } from "express";
import { db } from "../db.js";

const router = Router();

// GET /api/public/services
router.get("/services", (_req, res) => {
  const rows = db.prepare("SELECT * FROM services WHERE ativo = 1 ORDER BY nome").all();
  res.json(rows);
});

// POST /api/public/identify
router.post("/identify", (req, res) => {
  const { telefone } = req.body || {};
  if (!telefone || !String(telefone).trim()) {
    return res.status(400).json({ error: "Telefone é obrigatório" });
  }
  const client = db
    .prepare("SELECT id, nome, telefone FROM clients WHERE telefone = ?")
    .get(String(telefone).trim());
  if (client) {
    res.json({ found: true, client });
  } else {
    res.json({ found: false });
  }
});

// POST /api/public/clients
router.post("/clients", (req, res) => {
  const { nome, telefone } = req.body || {};
  if (!nome || !String(nome).trim()) {
    return res.status(400).json({ error: "Nome é obrigatório" });
  }
  if (!telefone || !String(telefone).trim()) {
    return res.status(400).json({ error: "Telefone é obrigatório" });
  }
  const existing = db
    .prepare("SELECT id FROM clients WHERE telefone = ?")
    .get(String(telefone).trim());
  if (existing) {
    return res.status(400).json({ error: "Telefone já cadastrado" });
  }
  const info = db
    .prepare("INSERT INTO clients (nome, telefone) VALUES (?, ?)")
    .run(String(nome).trim(), String(telefone).trim());
  const client = db
    .prepare("SELECT id, nome, telefone FROM clients WHERE id = ?")
    .get(info.lastInsertRowid);
  res.status(201).json(client);
});

// GET /api/public/slots?date=YYYY-MM-DD&serviceId=N
router.get("/slots", (req, res) => {
  const { date, serviceId } = req.query;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: "date inválido (use YYYY-MM-DD)" });
  }

  const service = serviceId
    ? db.prepare("SELECT duracao_minutos FROM services WHERE id = ?").get(serviceId)
    : null;
  const duracaoServico = service ? service.duracao_minutos : 30;

  // Todos os agendamentos do dia com status agendado
  const agendados = db
    .prepare(
      `SELECT data_hora, duracao_minutos FROM appointments
       WHERE data_hora >= ? AND data_hora < ? AND status = 'agendado'`
    )
    .all(`${date}T00:00:00`, `${date}T23:59:59`);

  // Gerar slots de 09:00 a 19:00 de 30 em 30 min
  const slots = [];
  for (let h = 9; h < 19; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hh = String(h).padStart(2, "0");
      const mm = String(m).padStart(2, "0");
      slots.push(`${hh}:${mm}`);
    }
  }

  // Filtrar slots ocupados considerando duração
  const available = slots.filter((slot) => {
    const [sh, sm] = slot.split(":").map(Number);
    const slotStart = sh * 60 + sm;
    const slotEnd = slotStart + duracaoServico;

    // Não cabe antes de 19:00
    if (slotEnd > 19 * 60) return false;

    // Verificar conflito com cada agendamento existente
    for (const ag of agendados) {
      const agTime = ag.data_hora.slice(11, 16); // "HH:MM"
      const [ah, am] = agTime.split(":").map(Number);
      const agStart = ah * 60 + am;
      const agEnd = agStart + (ag.duracao_minutos || 30);

      // Conflito se os intervalos se sobrepõem
      if (slotStart < agEnd && slotEnd > agStart) return false;
    }
    return true;
  });

  res.json(available);
});

// POST /api/public/appointments
router.post("/appointments", (req, res) => {
  const { clientId, serviceId, date, time } = req.body || {};
  if (!clientId || !serviceId || !date || !time) {
    return res.status(400).json({ error: "clientId, serviceId, date e time são obrigatórios" });
  }

  const client = db.prepare("SELECT id, nome FROM clients WHERE id = ?").get(clientId);
  if (!client) return res.status(400).json({ error: "Cliente inválido" });

  const service = db.prepare("SELECT * FROM services WHERE id = ? AND ativo = 1").get(serviceId);
  if (!service) return res.status(400).json({ error: "Serviço inválido ou inativo" });

  const dataHora = `${date}T${time}:00`;

  // Re-checagem de disponibilidade
  const [sh, sm] = time.split(":").map(Number);
  const slotStart = sh * 60 + sm;
  const slotEnd = slotStart + service.duracao_minutos;

  const agendados = db
    .prepare(
      `SELECT data_hora, duracao_minutos FROM appointments
       WHERE data_hora >= ? AND data_hora < ? AND status = 'agendado'`
    )
    .all(`${date}T00:00:00`, `${date}T23:59:59`);

  for (const ag of agendados) {
    const agTime = ag.data_hora.slice(11, 16);
    const [ah, am] = agTime.split(":").map(Number);
    const agStart = ah * 60 + am;
    const agEnd = agStart + (ag.duracao_minutos || 30);
    if (slotStart < agEnd && slotEnd > agStart) {
      return res.status(409).json({ error: "Horário não está mais disponível" });
    }
  }

  const info = db
    .prepare(
      `INSERT INTO appointments (client_id, data_hora, servico, duracao_minutos, status)
       VALUES (?, ?, ?, ?, 'agendado')`
    )
    .run(clientId, dataHora, service.nome, service.duracao_minutos);

  res.status(201).json({
    id: info.lastInsertRowid,
    dataHora,
    servico: service.nome,
    clientNome: client.nome,
  });
});

export default router;
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/routes/public.js
git commit -m "feat: add public routes for booking flow"
```

---

### Task 4: Registrar rotas em `backend/src/server.js`

**Files:**
- Modify: `backend/src/server.js`

- [ ] **Step 1: Importar e registrar as duas novas rotas**

Após a linha `import dashboardRouter from "./routes/dashboard.js";`, adicionar:

```js
import servicesRouter from "./routes/services.js";
import publicRouter from "./routes/public.js";
```

Após a linha `app.use("/api/dashboard", dashboardRouter);`, adicionar:

```js
app.use("/api/services", servicesRouter);
app.use("/api/public", publicRouter);
```

- [ ] **Step 2: Verificar que o backend sobe sem erros**

```bash
cd backend && npm run dev
```

Esperado: `API em http://localhost:3001` sem erros.

- [ ] **Step 3: Testar as rotas básicas**

```bash
curl -s http://localhost:3001/api/services | node -e "process.stdin.resume();let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d).length))"
```

Esperado: `5` (os 5 serviços seed).

```bash
curl -s "http://localhost:3001/api/public/slots?date=2026-04-01&serviceId=1" | node -e "process.stdin.resume();let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d)))"
```

Esperado: array com slots do dia (ex: `["09:00","09:30",...]`).

- [ ] **Step 4: Commit**

```bash
git add backend/src/server.js
git commit -m "feat: register /api/services and /api/public routes in server.js"
```

---

### Task 5: View de serviços no painel — `frontend/src/views/services.js`

**Files:**
- Create: `frontend/src/views/services.js`

- [ ] **Step 1: Criar o arquivo**

```js
// frontend/src/views/services.js
import { api } from "../api.js";
import { escapeHtml } from "../utils.js";
import { formatMoney } from "../utils.js";

export async function viewServices() {
  const services = await api("/api/services/all");

  const rows = services
    .map(
      (s) => `
      <tr class="border-t border-slate-800">
        <td class="px-3 py-2">${escapeHtml(s.nome)}</td>
        <td class="px-3 py-2 text-slate-300">${formatMoney(s.preco)}</td>
        <td class="px-3 py-2 text-slate-300">${s.duracao_minutos} min</td>
        <td class="px-3 py-2">
          <span class="rounded px-2 py-0.5 text-xs font-medium ${s.ativo ? "bg-emerald-900/50 text-emerald-400" : "bg-slate-700 text-slate-400"}">
            ${s.ativo ? "Ativo" : "Inativo"}
          </span>
        </td>
        <td class="px-3 py-2 text-right space-x-2">
          <button type="button" data-action="edit-service" data-id="${s.id}" class="text-xs text-sky-400 hover:underline">Editar</button>
          <button type="button" data-action="toggle-service" data-id="${s.id}" class="text-xs ${s.ativo ? "text-rose-400" : "text-emerald-400"} hover:underline">
            ${s.ativo ? "Desativar" : "Ativar"}
          </button>
        </td>
      </tr>`
    )
    .join("");

  return `
    <div class="grid gap-8 lg:grid-cols-2">
      <section class="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <h2 class="text-base font-semibold text-white">Novo serviço</h2>
        <form data-form="create-service" class="mt-4 grid gap-3">
          <label class="grid gap-1 text-sm">
            <span class="text-slate-400">Nome</span>
            <input name="nome" required class="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" placeholder="Ex.: Corte + Barba" />
          </label>
          <label class="grid gap-1 text-sm">
            <span class="text-slate-400">Preço (R$)</span>
            <input name="preco" type="number" min="0" step="0.01" class="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" placeholder="35.00" />
          </label>
          <label class="grid gap-1 text-sm">
            <span class="text-slate-400">Duração (min)</span>
            <input name="duracao_minutos" type="number" min="5" step="5" value="30" class="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" />
          </label>
          <button type="submit" class="rounded-lg bg-amber-500 px-4 py-2 font-medium text-slate-950 hover:bg-amber-400">
            Salvar
          </button>
        </form>

        <div id="edit-service-wrap" class="mt-6 hidden rounded-xl border border-amber-900/40 bg-slate-950/50 p-4">
          <h2 class="text-base font-semibold text-amber-200">Editar serviço</h2>
          <form data-form="update-service" class="mt-4 grid gap-3">
            <input type="hidden" name="id" />
            <label class="grid gap-1 text-sm">
              <span class="text-slate-400">Nome</span>
              <input name="nome" required class="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" />
            </label>
            <label class="grid gap-1 text-sm">
              <span class="text-slate-400">Preço (R$)</span>
              <input name="preco" type="number" min="0" step="0.01" class="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" />
            </label>
            <label class="grid gap-1 text-sm">
              <span class="text-slate-400">Duração (min)</span>
              <input name="duracao_minutos" type="number" min="5" step="5" class="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" />
            </label>
            <div class="flex flex-wrap gap-2">
              <button type="submit" class="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-amber-400">
                Salvar alterações
              </button>
              <button type="button" data-action="cancel-edit-service" class="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </section>

      <section class="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <h2 class="text-base font-semibold text-white">Serviços cadastrados</h2>
        <div class="mt-4 overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="text-xs uppercase text-slate-500">
              <tr>
                <th class="px-3 py-2">Nome</th>
                <th class="px-3 py-2">Preço</th>
                <th class="px-3 py-2">Duração</th>
                <th class="px-3 py-2">Status</th>
                <th class="px-3 py-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>${rows || `<tr><td class="px-3 py-6 text-slate-500" colspan="5">Nenhum serviço cadastrado.</td></tr>`}</tbody>
          </table>
        </div>
      </section>
    </div>
  `;
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/views/services.js
git commit -m "feat: add services view to admin panel"
```

---

### Task 6: Handlers de serviços — `frontend/src/handlers/services.js`

**Files:**
- Create: `frontend/src/handlers/services.js`

- [ ] **Step 1: Criar o arquivo**

```js
// frontend/src/handlers/services.js
import { api } from "../api.js";
import { toast } from "../ui/toast.js";

function refresh() {
  document.dispatchEvent(new CustomEvent("spa:refresh"));
}

export async function handleCreateService(e) {
  const form = e.target;
  const fd = new FormData(form);
  const nome = String(fd.get("nome") ?? "").trim();
  if (!nome) throw new Error("Nome é obrigatório");
  const body = {
    nome,
    preco: Number(fd.get("preco")) || 0,
    duracao_minutos: Number(fd.get("duracao_minutos")) || 30,
  };
  await api("/api/services", { method: "POST", body });
  form.reset();
  toast.success("Serviço criado!");
  refresh();
}

export async function handleUpdateService(e) {
  const form = e.target;
  const fd = new FormData(form);
  const id = fd.get("id");
  if (!id) throw new Error("Serviço inválido");
  const nome = String(fd.get("nome") ?? "").trim();
  if (!nome) throw new Error("Nome é obrigatório");
  const body = {
    nome,
    preco: Number(fd.get("preco")) || 0,
    duracao_minutos: Number(fd.get("duracao_minutos")) || 30,
  };
  await api(`/api/services/${id}`, { method: "PUT", body });
  document.getElementById("edit-service-wrap")?.classList.add("hidden");
  form.reset();
  toast.success("Serviço atualizado!");
  refresh();
}

export async function handleEditService(btn) {
  const id = btn.dataset.id;
  const data = await api(`/api/services/${id}`);
  const wrap = document.getElementById("edit-service-wrap");
  const form = wrap?.querySelector('form[data-form="update-service"]');
  if (!form || !wrap) return;
  form.querySelector('[name="id"]').value = String(data.id);
  form.querySelector('[name="nome"]').value = data.nome ?? "";
  form.querySelector('[name="preco"]').value = String(data.preco ?? 0);
  form.querySelector('[name="duracao_minutos"]').value = String(data.duracao_minutos ?? 30);
  wrap.classList.remove("hidden");
  wrap.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

export function handleCancelEditService() {
  const wrap = document.getElementById("edit-service-wrap");
  const form = wrap?.querySelector('form[data-form="update-service"]');
  form?.reset();
  wrap?.classList.add("hidden");
}

export async function handleToggleService(btn) {
  const id = btn.dataset.id;
  await api(`/api/services/${id}/toggle`, { method: "PATCH", body: {} });
  toast.success("Serviço atualizado!");
  refresh();
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/handlers/services.js
git commit -m "feat: add services handlers"
```

---

### Task 7: Registrar handlers e rota de serviços

**Files:**
- Modify: `frontend/src/handlers/index.js`
- Modify: `frontend/src/router.js`
- Modify: `frontend/src/ui/layout.js`

- [ ] **Step 1: Adicionar import e handlers em `handlers/index.js`**

Após os imports existentes, adicionar:

```js
import {
  handleCreateService,
  handleUpdateService,
  handleEditService,
  handleCancelEditService,
  handleToggleService,
} from "./services.js";
```

No listener de `submit`, adicionar após `create-payment`:

```js
else if (kind === "create-service")   await handleCreateService(e);
else if (kind === "update-service")   await handleUpdateService(e);
```

No listener de `click`, adicionar após `cancel-edit-appointment`:

```js
else if (action === "edit-service")          await handleEditService(btn);
else if (action === "cancel-edit-service")       handleCancelEditService();
else if (action === "toggle-service")        await handleToggleService(btn);
```

- [ ] **Step 2: Adicionar rota `#/services` em `router.js`**

Adicionar o import no topo:

```js
import { viewServices } from "./views/services.js";
```

No bloco de roteamento, antes do `else` final (rota não encontrada):

```js
    } else if (parts[0] === "services") {
      title = "Serviços";
      body = await viewServices();
```

- [ ] **Step 3: Adicionar "Serviços" no nav de `ui/layout.js`**

No array `nav`, após o item `PIX simulado`:

```js
    { href: "#/services",      label: "Serviços"     },
```

- [ ] **Step 4: Verificação manual**

Com frontend e backend rodando, abra `#/services`:
- 5 serviços aparecem na lista
- Criar novo serviço → aparece na lista
- Clicar "Editar" → painel abre com dados → alterar → salvar → toast verde
- Clicar "Desativar" → badge muda para "Inativo"

- [ ] **Step 5: Commit**

```bash
git add frontend/src/handlers/index.js frontend/src/router.js frontend/src/ui/layout.js
git commit -m "feat: register services handlers, route and nav link"
```

---

### Task 8: Página pública `frontend/public/agendar.html`

**Files:**
- Create: `frontend/public/agendar.html`

- [ ] **Step 1: Criar o arquivo**

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Agendar — Barber Elias</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: { extend: { colors: { slate: { 950: '#0f172a' } } } }
    }
  </script>
  <style>
    body { background: #0f172a; color: #f1f5f9; font-family: sans-serif; }
    .step { display: none; }
    .step.active { display: block; }
    .service-card { cursor: pointer; border: 2px solid #334155; border-radius: 12px; padding: 16px; transition: border-color 0.15s; }
    .service-card.selected { border-color: #f59e0b; background: #1c1a0a; }
    .slot-btn { border: 1px solid #334155; border-radius: 8px; padding: 8px 12px; font-size: 0.85rem; cursor: pointer; background: #1e293b; color: #f1f5f9; transition: background 0.15s; }
    .slot-btn:hover:not(:disabled) { background: #334155; }
    .slot-btn.selected { background: #f59e0b; color: #0f172a; font-weight: 600; border-color: #f59e0b; }
    .slot-btn:disabled { opacity: 0.35; cursor: not-allowed; }
    .progress-bar { display: flex; gap: 4px; margin-bottom: 24px; }
    .progress-dot { flex: 1; height: 4px; border-radius: 2px; background: #334155; transition: background 0.2s; }
    .progress-dot.done { background: #f59e0b; }
    input[type="date"] { color-scheme: dark; }
  </style>
</head>
<body class="min-h-screen flex flex-col items-center px-4 py-8">

  <div class="w-full max-w-sm">
    <!-- Header -->
    <div class="text-center mb-8">
      <div class="text-xs uppercase tracking-widest text-amber-400 mb-1">Barbearia</div>
      <h1 class="text-2xl font-bold text-white">BARBER ELIAS</h1>
    </div>

    <!-- Progress -->
    <div class="progress-bar" id="progress">
      <div class="progress-dot" id="dot-1"></div>
      <div class="progress-dot" id="dot-2"></div>
      <div class="progress-dot" id="dot-3"></div>
      <div class="progress-dot" id="dot-4"></div>
    </div>

    <!-- STEP 1: Telefone -->
    <div class="step active" data-step="1">
      <h2 class="text-lg font-semibold mb-1">Qual é o seu WhatsApp?</h2>
      <p class="text-sm text-slate-400 mb-4">Vamos te identificar para confirmar o agendamento.</p>
      <input id="input-telefone" type="tel" placeholder="Ex.: 11999999999"
        class="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-white mb-3" />
      <div id="wrap-nome" class="hidden mb-3">
        <p class="text-sm text-slate-400 mb-2">Não te encontramos. Qual é o seu nome?</p>
        <input id="input-nome" type="text" placeholder="Seu nome completo"
          class="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-white" />
      </div>
      <button id="btn-continuar" onclick="handleStep1()"
        class="w-full rounded-lg bg-amber-500 px-4 py-3 font-semibold text-slate-950 hover:bg-amber-400">
        Continuar →
      </button>
      <p id="err-1" class="mt-2 text-sm text-rose-400 hidden"></p>
    </div>

    <!-- STEP 2: Serviço -->
    <div class="step" data-step="2">
      <h2 class="text-lg font-semibold mb-1" id="saudacao">O que você vai fazer hoje?</h2>
      <p class="text-sm text-slate-400 mb-4">Toque no serviço para selecionar.</p>
      <div id="services-list" class="grid gap-3 mb-4"></div>
      <button onclick="goStep(3)"
        class="w-full rounded-lg bg-amber-500 px-4 py-3 font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-40"
        id="btn-step2-next" disabled>
        Próximo →
      </button>
      <button onclick="goStep(1)" class="mt-2 w-full text-sm text-slate-400 hover:text-white">← Voltar</button>
      <p id="err-2" class="mt-2 text-sm text-rose-400 hidden"></p>
    </div>

    <!-- STEP 3: Data e Horário -->
    <div class="step" data-step="3">
      <h2 class="text-lg font-semibold mb-1">Quando você quer vir?</h2>
      <p class="text-sm text-slate-400 mb-4">Escolha a data e o horário disponível.</p>
      <input id="input-date" type="date"
        class="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-white mb-4"
        onchange="loadSlots(this.value)" />
      <div id="slots-wrap" class="hidden">
        <p class="text-xs uppercase text-slate-500 mb-2">Horários disponíveis</p>
        <div id="slots-grid" class="flex flex-wrap gap-2 mb-4"></div>
      </div>
      <p id="slots-empty" class="hidden text-sm text-slate-400 mb-4">Nenhum horário disponível nesta data.</p>
      <button onclick="goStep(4)"
        class="w-full rounded-lg bg-amber-500 px-4 py-3 font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-40"
        id="btn-step3-next" disabled>
        Próximo →
      </button>
      <button onclick="goStep(2)" class="mt-2 w-full text-sm text-slate-400 hover:text-white">← Voltar</button>
    </div>

    <!-- STEP 4: Confirmação -->
    <div class="step" data-step="4">
      <h2 class="text-lg font-semibold mb-1" id="confirm-title">Tudo certo! ✂️</h2>
      <p class="text-sm text-slate-400 mb-4">Confira os detalhes antes de confirmar.</p>
      <div class="rounded-xl border border-slate-700 bg-slate-900 p-4 mb-4 grid gap-2 text-sm">
        <div class="flex justify-between"><span class="text-slate-400">Serviço</span><span id="sum-servico" class="text-white font-medium"></span></div>
        <div class="flex justify-between"><span class="text-slate-400">Data</span><span id="sum-data" class="text-white font-medium"></span></div>
        <div class="flex justify-between"><span class="text-slate-400">Horário</span><span id="sum-hora" class="text-white font-medium"></span></div>
        <div class="flex justify-between"><span class="text-slate-400">Duração</span><span id="sum-duracao" class="text-white font-medium"></span></div>
      </div>
      <button onclick="confirmarAgendamento()"
        class="w-full rounded-lg bg-amber-500 px-4 py-3 font-semibold text-slate-950 hover:bg-amber-400">
        ✅ Confirmar agendamento
      </button>
      <button onclick="goStep(3)" class="mt-2 w-full text-sm text-slate-400 hover:text-white">← Voltar e corrigir</button>
      <p id="err-4" class="mt-2 text-sm text-rose-400 hidden"></p>
    </div>

    <!-- STEP 5: Sucesso -->
    <div class="step" data-step="5">
      <div class="text-center py-8">
        <div class="text-5xl mb-4">✂️</div>
        <h2 class="text-xl font-bold text-white mb-2">Agendado com sucesso!</h2>
        <p class="text-slate-400 mb-6" id="success-msg"></p>
        <button onclick="reiniciar()"
          class="rounded-lg bg-amber-500 px-6 py-3 font-semibold text-slate-950 hover:bg-amber-400">
          Fazer outro agendamento
        </button>
      </div>
    </div>
  </div>

  <script>
    const state = {
      step: 1,
      client: null,
      service: null,
      date: "",
      time: "",
    };

    const API = "/api/public";

    function showStep(n) {
      state.step = n;
      document.querySelectorAll(".step").forEach(el => el.classList.remove("active"));
      document.querySelector(`[data-step="${n}"]`).classList.add("active");
      // Atualizar progress dots (steps 1-4)
      for (let i = 1; i <= 4; i++) {
        const dot = document.getElementById(`dot-${i}`);
        if (dot) dot.classList.toggle("done", i < n || (i === n && n <= 4));
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function goStep(n) {
      showStep(n);
    }

    function showErr(id, msg) {
      const el = document.getElementById(id);
      if (!el) return;
      el.textContent = msg;
      el.classList.remove("hidden");
      setTimeout(() => el.classList.add("hidden"), 4000);
    }

    // Step 1
    async function handleStep1() {
      const telefone = document.getElementById("input-telefone").value.trim();
      if (!telefone) return showErr("err-1", "Informe seu WhatsApp.");

      const wrapNome = document.getElementById("wrap-nome");
      const inputNome = document.getElementById("input-nome");
      const nomeVisible = !wrapNome.classList.contains("hidden");

      try {
        if (!nomeVisible) {
          // Primeiro clique: identificar
          const res = await fetch(`${API}/identify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ telefone }),
          });
          const data = await res.json();
          if (!res.ok) return showErr("err-1", data.error || "Erro ao identificar.");

          if (data.found) {
            state.client = data.client;
            localStorage.setItem("barber_telefone", telefone);
            avancarStep2();
          } else {
            // Mostrar campo de nome
            wrapNome.classList.remove("hidden");
            inputNome.focus();
            document.getElementById("btn-continuar").textContent = "Cadastrar e continuar →";
          }
        } else {
          // Segundo clique: cadastrar
          const nome = inputNome.value.trim();
          if (!nome) return showErr("err-1", "Informe seu nome.");
          const res = await fetch(`${API}/clients`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nome, telefone }),
          });
          const data = await res.json();
          if (!res.ok) return showErr("err-1", data.error || "Erro ao cadastrar.");
          state.client = data;
          localStorage.setItem("barber_telefone", telefone);
          avancarStep2();
        }
      } catch {
        showErr("err-1", "Erro de conexão. Tente novamente.");
      }
    }

    async function avancarStep2() {
      document.getElementById("saudacao").textContent = `Olá, ${state.client.nome}! O que você vai fazer hoje?`;
      // Carregar serviços
      const res = await fetch(`${API}/services`);
      const services = await res.json();
      const list = document.getElementById("services-list");
      list.innerHTML = services.map(s => `
        <div class="service-card" data-id="${s.id}" data-nome="${s.nome}" data-preco="${s.preco}" data-dur="${s.duracao_minutos}"
          onclick="selectService(this)">
          <div class="flex justify-between items-center">
            <span class="font-medium text-white">${s.nome}</span>
            <span class="text-amber-400 font-semibold">R$ ${s.preco.toFixed(2).replace(".", ",")}</span>
          </div>
          <div class="text-xs text-slate-400 mt-1">${s.duracao_minutos} min</div>
        </div>
      `).join("");
      showStep(2);
    }

    function selectService(card) {
      document.querySelectorAll(".service-card").forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");
      state.service = {
        id: card.dataset.id,
        nome: card.dataset.nome,
        preco: parseFloat(card.dataset.preco),
        duracao_minutos: parseInt(card.dataset.dur),
      };
      document.getElementById("btn-step2-next").disabled = false;
    }

    // Step 3
    async function loadSlots(date) {
      state.date = date;
      state.time = "";
      document.getElementById("btn-step3-next").disabled = true;

      const res = await fetch(`${API}/slots?date=${date}&serviceId=${state.service.id}`);
      const slots = await res.json();

      const grid = document.getElementById("slots-grid");
      const wrap = document.getElementById("slots-wrap");
      const empty = document.getElementById("slots-empty");

      if (!slots.length) {
        wrap.classList.add("hidden");
        empty.classList.remove("hidden");
        return;
      }

      empty.classList.add("hidden");
      wrap.classList.remove("hidden");
      grid.innerHTML = slots.map(s => `
        <button class="slot-btn" onclick="selectSlot(this, '${s}')">${s}</button>
      `).join("");
    }

    function selectSlot(btn, time) {
      document.querySelectorAll(".slot-btn").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      state.time = time;
      document.getElementById("btn-step3-next").disabled = false;
    }

    // Step 4
    function goStep(n) {
      if (n === 4) {
        const d = new Date(`${state.date}T${state.time}`);
        const dataFormatada = d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
        dataFormatada.replace(/^\w/, c => c.toUpperCase());
        document.getElementById("confirm-title").textContent = `Tudo certo, ${state.client.nome}! ✂️`;
        document.getElementById("sum-servico").textContent = state.service.nome;
        document.getElementById("sum-data").textContent = dataFormatada;
        document.getElementById("sum-hora").textContent = state.time;
        document.getElementById("sum-duracao").textContent = `~${state.service.duracao_minutos} min`;
      }
      showStep(n);
    }

    async function confirmarAgendamento() {
      try {
        const res = await fetch(`${API}/appointments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId: state.client.id,
            serviceId: state.service.id,
            date: state.date,
            time: state.time,
          }),
        });
        const data = await res.json();
        if (!res.ok) return showErr("err-4", data.error || "Erro ao agendar.");

        const d = new Date(`${state.date}T${state.time}`);
        const dataFmt = d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
        document.getElementById("success-msg").textContent =
          `${state.service.nome} — ${dataFmt} às ${state.time}`;
        showStep(5);
      } catch {
        showErr("err-4", "Erro de conexão. Tente novamente.");
      }
    }

    function reiniciar() {
      state.client = null;
      state.service = null;
      state.date = "";
      state.time = "";
      document.getElementById("input-nome").value = "";
      document.getElementById("wrap-nome").classList.add("hidden");
      document.getElementById("btn-continuar").textContent = "Continuar →";
      document.getElementById("btn-step2-next").disabled = true;
      showStep(1);
      // Manter telefone salvo
      const tel = localStorage.getItem("barber_telefone");
      if (tel) document.getElementById("input-telefone").value = tel;
    }

    // Init: definir data mínima e restaurar telefone salvo
    const today = new Date().toISOString().slice(0, 10);
    document.getElementById("input-date").min = today;
    const savedTel = localStorage.getItem("barber_telefone");
    if (savedTel) {
      document.getElementById("input-telefone").value = savedTel;
      document.getElementById("input-telefone").focus();
    }
    showStep(1);
  </script>
</body>
</html>
```

- [ ] **Step 2: Verificação manual no browser**

Com frontend e backend rodando, abra `http://localhost:5173/agendar.html`:
- Telefone novo → pede nome → step 2 com saudação "Olá, [nome]!"
- Telefone existente → reconhece → step 2 direto
- Selecionar serviço → step 3 → selecionar data → slots aparecem → selecionar horário → step 4 → confirmar → step 5 sucesso
- Verificar em `#/appointments` no painel: agendamento aparece

- [ ] **Step 3: Commit e push**

```bash
git add frontend/public/agendar.html
git commit -m "feat: add public booking page agendar.html"
git push origin main
```

---

## Verificação Final — Plano A

1. `#/services` → criar, editar, desativar serviços
2. `http://localhost:5173/agendar.html` (mobile DevTools):
   - Telefone novo → pede nome → cadastra → step 2
   - Telefone existente → "Olá, [nome]!" → step 2
   - Selecionar serviço → data → slots (sem conflito de duração) → confirmar
   - Agendamento aparece em `#/appointments`
3. Telefone salvo no `localStorage` → recarregar página → campo já preenchido
