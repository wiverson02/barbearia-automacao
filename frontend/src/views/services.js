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
