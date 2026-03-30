import { api } from "../api.js";
import { escapeHtml, formatMoney } from "../utils.js";

export async function viewPayments() {
  const [clients, subs] = await Promise.all([
    api("/api/clients"),
    api("/api/subscriptions"),
  ]);

  const clientOpts = clients
    .map((c) => `<option value="${c.id}">${escapeHtml(c.nome)}</option>`)
    .join("");

  const subOpts = subs
    .filter((s) => s.ativo)
    .map(
      (s) =>
        `<option value="${s.id}" data-client="${s.client_id}">#${s.id} · ${escapeHtml(s.client_nome)} (${formatMoney(s.valor_mensal)})</option>`
    )
    .join("");

  const recent = await api("/api/payments");

  const rows = recent
    .slice(0, 15)
    .map(
      (p) => `
      <tr class="border-t border-slate-800">
        <td class="px-3 py-2">${escapeHtml(p.client_nome || "")}</td>
        <td class="px-3 py-2">${escapeHtml(p.competencia)}</td>
        <td class="px-3 py-2">${formatMoney(p.amount)}</td>
        <td class="px-3 py-2 text-slate-400">${escapeHtml(p.tx_id || "")}</td>
      </tr>`
    )
    .join("");

  return `
    <div class="grid gap-8 lg:grid-cols-2">
      <section class="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <h2 class="text-base font-semibold text-white">Registrar PIX (simulado)</h2>
        <p class="mt-1 text-sm text-slate-500">Simula um pagamento confirmado. Informe a competência (mês) e, se quiser, amarre à assinatura.</p>
        <form data-form="create-payment" class="mt-4 grid gap-3">
          <label class="grid gap-1 text-sm">
            <span class="text-slate-400">Cliente</span>
            <select id="pay-client" name="clientId" required class="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2">
              <option value="">Selecione…</option>
              ${clientOpts}
            </select>
          </label>
          <label class="grid gap-1 text-sm">
            <span class="text-slate-400">Assinatura (opcional)</span>
            <select name="subscriptionId" class="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2">
              <option value="">—</option>
              ${subOpts}
            </select>
          </label>
          <label class="grid gap-1 text-sm">
            <span class="text-slate-400">Competência (YYYY-MM)</span>
            <input name="competencia" placeholder="2026-03" required pattern="[0-9]{4}-[0-9]{2}" class="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" />
          </label>
          <label class="grid gap-1 text-sm">
            <span class="text-slate-400">Valor (R$)</span>
            <input name="amount" type="number" step="0.01" min="0" required class="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" />
          </label>
          <label class="grid gap-1 text-sm">
            <span class="text-slate-400">Chave PIX (opcional)</span>
            <input name="pixKey" class="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" />
          </label>
          <label class="grid gap-1 text-sm">
            <span class="text-slate-400">txId / identificador (opcional)</span>
            <input name="txId" class="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" />
          </label>
          <label class="grid gap-1 text-sm">
            <span class="text-slate-400">Comprovante (texto livre)</span>
            <textarea name="comprovanteTexto" rows="2" class="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"></textarea>
          </label>
          <button type="submit" class="rounded-lg bg-amber-500 px-4 py-2 font-medium text-slate-950 hover:bg-amber-400">Registrar pagamento</button>
        </form>
      </section>

      <section class="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <h2 class="text-base font-semibold text-white">Últimos pagamentos</h2>
        <div class="mt-4 overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="text-xs uppercase text-slate-500">
              <tr>
                <th class="px-3 py-2">Cliente</th>
                <th class="px-3 py-2">Comp.</th>
                <th class="px-3 py-2">Valor</th>
                <th class="px-3 py-2">txId</th>
              </tr>
            </thead>
            <tbody>${rows || `<tr><td class="px-3 py-6 text-slate-500" colspan="4">Nenhum pagamento.</td></tr>`}</tbody>
          </table>
        </div>
      </section>
    </div>
  `;
}

