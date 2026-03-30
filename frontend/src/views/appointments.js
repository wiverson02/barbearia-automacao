import { api } from "../api.js";
import { escapeHtml } from "../utils.js";

export async function viewAppointments() {
  const [clients, appointments] = await Promise.all([
    api("/api/clients"),
    api("/api/appointments"),
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
      </tr>`
    )
    .join("");

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
      </section>

      <section class="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <h2 class="text-base font-semibold text-white">Lista</h2>
        <div class="mt-4 overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="text-xs uppercase text-slate-500">
              <tr>
                <th class="px-3 py-2">Cliente</th>
                <th class="px-3 py-2">Quando</th>
                <th class="px-3 py-2">Serviço</th>
                <th class="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>${rows || `<tr><td class="px-3 py-6 text-slate-500" colspan="4">Nenhum agendamento.</td></tr>`}</tbody>
          </table>
        </div>
      </section>
    </div>
  `;
}

