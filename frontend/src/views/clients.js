import { api } from "../api.js";
import { escapeHtml } from "../utils.js";

export async function viewClients() {
  const clients = await api("/api/clients");

  const rows = clients
    .map(
      (c) => `
      <tr class="border-t border-slate-800" data-name="${escapeHtml(c.nome)}">
        <td class="px-3 py-2">${escapeHtml(c.nome)}</td>
        <td class="px-3 py-2 text-slate-400">${escapeHtml(c.telefone || "")}</td>
        <td class="px-3 py-2 text-right space-x-2">
          <button type="button" data-action="edit-client" data-id="${c.id}" class="text-xs text-sky-400 hover:underline">Editar</button>
          <a class="text-amber-400 underline" href="#/clients/${c.id}/finance">Financeiro</a>
          <button type="button" data-action="delete-client" data-id="${c.id}" data-name="${escapeHtml(c.nome)}" class="text-xs text-rose-400 hover:underline">Excluir</button>
        </td>
      </tr>`
    )
    .join("");

  return `
    <div class="grid gap-8 lg:grid-cols-2">
      <section class="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <h2 class="text-base font-semibold text-white">Novo cliente</h2>
        <form data-form="create-client" class="mt-4 grid gap-3">
          <label class="grid gap-1 text-sm">
            <span class="text-slate-400">Nome</span>
            <input name="nome" required class="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" />
          </label>
          <label class="grid gap-1 text-sm">
            <span class="text-slate-400">Telefone</span>
            <input name="telefone" class="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" />
          </label>
          <label class="grid gap-1 text-sm">
            <span class="text-slate-400">Observações</span>
            <textarea name="observacoes" rows="3" class="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"></textarea>
          </label>
          <button type="submit" class="rounded-lg bg-amber-500 px-4 py-2 font-medium text-slate-950 hover:bg-amber-400">
            Salvar
          </button>
        </form>

        <div id="edit-client-wrap" class="mt-6 hidden rounded-xl border border-amber-900/40 bg-slate-950/50 p-4">
          <h2 class="text-base font-semibold text-amber-200">Editar cliente</h2>
          <p class="mt-1 text-xs text-slate-500">Os dados vêm da API (<code class="text-slate-400">GET /api/clients/:id</code>).</p>
          <form data-form="update-client" class="mt-4 grid gap-3">
            <input type="hidden" name="id" />
            <label class="grid gap-1 text-sm">
              <span class="text-slate-400">Nome</span>
              <input name="nome" required class="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" />
            </label>
            <label class="grid gap-1 text-sm">
              <span class="text-slate-400">Telefone</span>
              <input name="telefone" class="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" />
            </label>
            <label class="grid gap-1 text-sm">
              <span class="text-slate-400">Observações</span>
              <textarea name="observacoes" rows="3" class="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"></textarea>
            </label>
            <div class="flex flex-wrap gap-2">
              <button type="submit" class="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-amber-400">
                Salvar alterações
              </button>
              <button type="button" data-action="cancel-edit-client" class="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </section>

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
    </div>
  `;
}

