# Melhorias do Projeto Barbearia — Design Spec

**Data:** 2026-03-29
**Status:** Aprovado

---

## Contexto

O projeto é uma SPA (Single Page Application) com:
- **Backend:** Node.js + Express + SQLite (`better-sqlite3`)
- **Frontend:** Vite + JavaScript ES6 (módulos) + Tailwind CSS
- Roteamento por hash (`#/`, `#/clients`, etc.)
- Handlers de eventos globais em `handlers.js`
- Views que retornam strings HTML renderizadas via `router.js`

Quatro melhorias foram definidas e aprovadas. Cada uma é independente e pode ser implementada em sequência.

---

## Melhoria 1 — Sistema de Toast (`ui/toast.js`)

### Problema
Toda mensagem de erro usa `alert()` nativo do browser, que bloqueia a página inteira e exige clique em OK. Mensagens de sucesso não existem — não há feedback visual quando uma ação funciona.

### Solução
Criar `frontend/src/ui/toast.js` que injeta um container fixo no DOM e exporta o objeto `toast`.

### API pública
```js
toast.success("Cliente salvo com sucesso!");
toast.error("Nome é obrigatório");
toast.warn("Assinatura sem data de fim");
```

### Comportamento
- Container fixo no canto inferior direito (`position: fixed; bottom: 1rem; right: 1rem`)
- Cada toast: fundo colorido, ícone, mensagem, botão `×` para fechar manualmente
- Some automaticamente após 3 segundos
- Múltiplos toasts empilham verticalmente sem sobrepor
- Animação de entrada: slide-up + fade-in via classe CSS

### Cores por tipo
| Tipo    | Fundo       | Ícone |
|---------|-------------|-------|
| success | `#15803d`   | ✅    |
| error   | `#b91c1c`   | ❌    |
| warn    | `#b45309`   | ⚠️    |

### Arquivos afetados
- **Criado:** `frontend/src/ui/toast.js`
- **Modificado:** `frontend/src/handlers.js` — substituir todos os `alert(...)` por `toast.error(...)` e adicionar `toast.success(...)` após cada operação bem-sucedida

### Mapeamento de substituições em `handlers.js`
| Linha aprox. | Substituição |
|---|---|
| 149 (catch geral) | `alert(err)` → `toast.error(err.message)` |
| 162 (edit-client catch) | `alert(err)` → `toast.error(err.message)` |
| 195 (edit-subscription catch) | `alert(err)` → `toast.error(err.message)` |
| 239 (delete-client catch) | `alert(err)` → `toast.error(err.message)` |
| Após cada `refresh()` com sucesso | `toast.success("...")` |

---

## Melhoria 2 — Utilitários compartilhados (`utils.js`)

### Problema
As funções `escapeHtml` e `formatMoney` estão copiadas nos 5 arquivos de view:
`clients.js`, `appointments.js`, `finance.js`, `payments.js`, `subscriptions.js`.

### Solução
Criar `frontend/src/utils.js` com ambas exportadas. Remover as cópias locais de cada view e adicionar o import.

### Conteúdo de `utils.js`
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

### Arquivos afetados
- **Criado:** `frontend/src/utils.js`
- **Modificado (remover função local + adicionar import):**
  - `frontend/src/views/clients.js`
  - `frontend/src/views/appointments.js`
  - `frontend/src/views/finance.js`
  - `frontend/src/views/payments.js`
  - `frontend/src/views/subscriptions.js`

---

## Melhoria 3 — Link ativo na navegação

### Problema
Todos os links do menu têm a mesma aparência. Não há indicação visual de qual página está ativa.

### Solução
Em `frontend/src/ui/layout.js`, comparar o `href` de cada item do nav com `window.location.hash`. O link correspondente à rota atual recebe classes de destaque.

### Classes CSS
| Estado | Classes Tailwind |
|--------|-----------------|
| Normal | `text-slate-300 hover:bg-slate-800 hover:text-white` |
| Ativo  | `bg-slate-800 text-amber-400` |

### Lógica de comparação
O hash atual (`window.location.hash`) é comparado com o `href` do link. O link do Dashboard (`#/`) é ativo quando o hash está vazio ou é `#/`.

### Arquivos afetados
- **Modificado:** `frontend/src/ui/layout.js` — lógica de classes no map dos links

---

## Melhoria 4 — Refatoração de `handlers.js`

### Problema
`handlers.js` tem ~250 linhas num único arquivo misturando handlers de 4 domínios distintos (clientes, assinaturas, agendamentos, pagamentos), dificultando leitura e manutenção.

### Solução
Criar a pasta `frontend/src/handlers/` e dividir por domínio.

### Estrutura de arquivos
```
frontend/src/handlers/
  index.js         → registra os dois listeners globais (submit + click) no document
  clients.js       → handleCreateClient, handleUpdateClient, handleEditClient,
                     handleCancelEditClient, handleDeleteClient
  subscriptions.js → handleCreateSubscription, handleUpdateSubscription,
                     handleEditSubscription, handleCancelEditSubscription
  appointments.js  → handleCreateAppointment
  payments.js      → handleCreatePayment
```

### Padrão de cada handler
Cada função recebe o evento (`e` ou dados extraídos) e retorna uma Promise. `index.js` chama a função correta conforme `kind` (submit) ou `action` (click), e trata erros com `toast.error`.

### `index.js` — estrutura
```js
import { handleCreateClient, ... } from "./clients.js";
// ... demais imports

document.addEventListener("submit", async (e) => {
  const form = e.target;
  if (!(form instanceof HTMLFormElement)) return;
  const kind = form.dataset.form;
  if (!kind) return;
  e.preventDefault();
  try {
    if (kind === "create-client") await handleCreateClient(e);
    // ...
  } catch (err) {
    toast.error(err.message || String(err));
  }
});

document.addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  // ...
});
```

### Arquivos afetados
- **Criado:** `frontend/src/handlers/index.js`
- **Criado:** `frontend/src/handlers/clients.js`
- **Criado:** `frontend/src/handlers/subscriptions.js`
- **Criado:** `frontend/src/handlers/appointments.js`
- **Criado:** `frontend/src/handlers/payments.js`
- **Removido:** `frontend/src/handlers.js`
- **Modificado:** `frontend/src/main.js` — import atualizado para `./handlers/index.js`

---

## Ordem de implementação recomendada

1. **Melhoria 2** (utils.js) — sem dependências, elimina duplicação primeiro
2. **Melhoria 1** (toast.js) — depende só do DOM, sem dependências internas
3. **Melhoria 3** (nav ativo) — pequena mudança isolada em layout.js
4. **Melhoria 4** (refatorar handlers) — por último, pois usa toast do passo 2

---

## O que não muda

- Nenhuma rota do backend é alterada
- Nenhuma lógica de negócio é alterada
- A estrutura do banco de dados não muda
- O comportamento de `confirm()` no delete é mantido (já é adequado para confirmação destrutiva)
