import { api } from "../api.js";
import { escapeHtml, formatMoney } from "../utils.js";

export async function viewSubscriptions() {
  const [clients, subs] = await Promise.all([
    api("/api/clients"),
    api("/api/subscriptions"),
  ]);

  const options = clients
    .map((c) => `<option value="${c.id}">${escapeHtml(c.nome)}</option>`)
    .join("");

  const rows = subs
    .map(
      (s) => `
      <tr class="border-t border-slate-800">
        <td class="px-3 py-2">${escapeHtml(s.client_nome || "")}</td>
        <td class="px-3 py-2">${formatMoney(s.valor_mensal)}</td>
        <td class="px-3 py-2">${s.ativo ? "sim" : "não"}</td>
        <td class="px-3 py-2 text-slate-400">${escapeHtml(s.start_date)} → ${escapeHtml(s.end_date || "—")}</td>
        <td class="px-3 py-2 text-right">
          <button type="button" data-action="edit-subscription" data-id="${s.id}" class="text-xs text-sky-400 hover:underline">Editar</button>
        </td>
      </tr>`
    )
    .join("");

  return `
    <div class="grid gap-8 lg:grid-cols-2">
      <section class="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <h2 class="text-base font-semibold text-white">Nova assinatura</h2>
        <p class="mt-1 text-sm text-slate-500">O valor mensal e o período podem ser alterados na lista (botão Editar).</p>
        <form data-form="create-subscription" class="mt-4 grid gap-3">
          <label class="grid gap-1 text-sm">
            <span class="text-slate-400">Cliente</span>
            <select name="clientId" required class="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2">
              <option value="">Selecione…</option>
              ${options}
            </select>
          </label>
          <label class="grid gap-1 text-sm">
            <span class="text-slate-400">Valor mensal (R$)</span>
            <input name="valorMensal" type="number" step="0.01" min="0" required class="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" />
          </label>
          <label class="grid gap-1 text-sm">
            <span class="text-slate-400">Início</span>
            <input name="startDate" type="date" required class="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" />
          </label>
          <label class="grid gap-1 text-sm">
            <span class="text-slate-400">Fim (opcional)</span>
            <input name="endDate" type="date" class="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" />
          </label>
          <label class="flex items-center gap-2 text-sm">
            <input name="ativo" type="checkbox" checked class="h-4 w-4 rounded border-slate-600 bg-slate-950" />
            <span class="text-slate-400">Ativa</span>
          </label>
          <button type="submit" class="rounded-lg bg-amber-500 px-4 py-2 font-medium text-slate-950 hover:bg-amber-400">Criar</button>
        </form>

        <div id="edit-subscription-wrap" class="mt-6 hidden rounded-xl border border-amber-900/40 bg-slate-950/50 p-4">
          <h2 class="text-base font-semibold text-amber-200">Editar assinatura</h2>
          <p class="mt-1 text-xs text-slate-500">Atualiza com <code class="text-slate-400">PUT /api/subscriptions/:id</code>. O cliente não pode ser trocado aqui.</p>
          <form data-form="update-subscription" class="mt-4 grid gap-3">
            <input type="hidden" name="id" />
            <p class="text-sm text-slate-400">Cliente: <span id="edit-sub-client-nome" class="text-white">—</span></p>
            <label class="grid gap-1 text-sm">
              <span class="text-slate-400">Valor mensal (R$)</span>
              <input name="valorMensal" type="number" step="0.01" min="0" required class="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" />
            </label>
            <label class="grid gap-1 text-sm">
              <span class="text-slate-400">Início</span>
              <input name="startDate" type="date" required class="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" />
            </label>
            <label class="grid gap-1 text-sm">
              <span class="text-slate-400">Fim (opcional)</span>
              <input name="endDate" type="date" class="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" />
            </label>
            <label class="flex items-center gap-2 text-sm">
              <input name="ativo" type="checkbox" class="h-4 w-4 rounded border-slate-600 bg-slate-950" />
              <span class="text-slate-400">Ativa</span>
            </label>
            <div class="flex flex-wrap gap-2">
              <button type="submit" class="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-amber-400">
                Salvar alterações
              </button>
              <button type="button" data-action="cancel-edit-subscription" class="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </section>

      <section class="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <h2 class="text-base font-semibold text-white">Lista</h2>
        <div class="mt-4 overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="text-xs uppercase text-slate-500">
              <tr>
                <th class="px-3 py-2">Cliente</th>
                <th class="px-3 py-2">Valor</th>
                <th class="px-3 py-2">Ativa</th>
                <th class="px-3 py-2">Período</th>
                <th class="px-3 py-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>${rows || `<tr><td class="px-3 py-6 text-slate-500" colspan="5">Nenhuma assinatura.</td></tr>`}</tbody>
          </table>
        </div>
      </section>
    </div>
  `;
}

