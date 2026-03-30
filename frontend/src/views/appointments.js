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

  const options = clients
    .map((c) => `<option value="${c.id}">${escapeHtml(c.nome)}</option>`)
    .join("");

  const rows = appointments
    .map(
      (a) => `
      <tr class="border-t border-slate-800">
        <td class="px-3 py-2">${escapeHtml(a.client_nome || "")}</td>
        <td class="px-3 py-2">${escapeHtml(a.data_hora)}</td>
        <td class="px-3 py-2">${escapeHtml(a.servico || "")}</td>
        <td class="px-3 py-2">${escapeHtml(a.status)}</td>
        <td class="px-3 py-2 text-right space-x-2">
          <button type="button" data-action="edit-appointment" data-id="${a.id}" class="text-xs text-sky-400 hover:underline">Editar</button>
          ${a.status === "agendado" ? `
            <button type="button" data-action="complete-appointment" data-id="${a.id}" class="text-xs text-emerald-400 hover:underline">✓ Concluir</button>
            <button type="button" data-action="cancel-appointment" data-id="${a.id}" class="text-xs text-rose-400 hover:underline">✕ Cancelar</button>
          ` : ""}
        </td>
      </tr>`
    )
    .join("");

  const filterLabels = { today: "Hoje", week: "Esta semana", all: "Todos" };
  const filterBtns = ["today", "week", "all"].map(f => {
    const isActive = activeFilter === f;
    const cls = isActive
      ? "rounded-lg px-3 py-1.5 text-xs font-medium bg-amber-500 text-slate-950"
      : "rounded-lg px-3 py-1.5 text-xs font-medium border border-slate-700 text-slate-300 hover:bg-slate-800";
    return `<button type="button" data-action="filter-appointments" data-filter="${f}" class="${cls}">${filterLabels[f]}</button>`;
  }).join("");

  return `
    <div class="grid gap-8 lg:grid-cols-2">
      <section class="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <h2 class="text-base font-semibold text-white">Novo agendamento</h2>
        <form data-form="create-appointment" class="mt-4 grid gap-3">
          <label class="grid gap-1 text-sm">
            <span class="text-slate-400">Cliente</span>
            <select name="clientId" required class="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2">
              <option value="">Selecione…</option>
              ${options}
            </select>
          </label>
          <label class="grid gap-1 text-sm">
            <span class="text-slate-400">Data e hora (local)</span>
            <input name="dataHora" type="datetime-local" required class="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" />
          </label>
          <label class="grid gap-1 text-sm">
            <span class="text-slate-400">Serviço (livre)</span>
            <input name="servico" class="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" placeholder="Ex.: corte + barba" />
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
          <button type="submit" class="rounded-lg bg-amber-500 px-4 py-2 font-medium text-slate-950 hover:bg-amber-400">Salvar</button>
        </form>

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
      </section>

      <section class="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <h2 class="text-base font-semibold text-white">Lista</h2>
        <div class="mt-3 flex gap-2">
          ${filterBtns}
        </div>
        <div class="mt-4 overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="text-xs uppercase text-slate-500">
              <tr>
                <th class="px-3 py-2">Cliente</th>
                <th class="px-3 py-2">Quando</th>
                <th class="px-3 py-2">Serviço</th>
                <th class="px-3 py-2">Status</th>
                <th class="px-3 py-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>${rows || `<tr><td class="px-3 py-6 text-slate-500" colspan="5">Nenhum agendamento.</td></tr>`}</tbody>
          </table>
        </div>
      </section>
    </div>
  `;
}
