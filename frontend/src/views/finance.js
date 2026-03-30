import { api } from "../api.js";
import { escapeHtml, formatMoney } from "../utils.js";

export async function viewFinance(id) {
  const data = await api(`/api/clients/${id}/finance`);
  const nome = data.client?.nome || "Cliente";

  const assinaturasHtml = (data.assinaturas || [])
    .map((a) => {
      const sub = a.subscription;
      const meses = (a.meses || [])
        .map((m) => {
          const cls =
            m.situacao === "pago"
              ? "text-emerald-400"
              : m.situacao === "atrasado"
                ? "text-rose-400"
                : "text-amber-300";
          return `<tr class="border-t border-slate-800">
            <td class="px-3 py-2">${escapeHtml(m.competencia)}</td>
            <td class="px-3 py-2">${formatMoney(m.valorEsperado)}</td>
            <td class="px-3 py-2 ${cls}">${escapeHtml(m.situacao)}</td>
          </tr>`;
        })
        .join("");

      return `
        <div class="rounded-lg border border-slate-800 bg-slate-950/40 p-4">
          <div class="text-sm text-slate-400">Assinatura #${sub.id} · R$ ${Number(sub.valor_mensal).toFixed(2)}/mês</div>
          <div class="mt-2 overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead class="text-xs uppercase text-slate-500">
                <tr>
                  <th class="px-3 py-2">Competência</th>
                  <th class="px-3 py-2">Valor esperado</th>
                  <th class="px-3 py-2">Situação</th>
                </tr>
              </thead>
              <tbody>${meses || `<tr><td class="px-3 py-3 text-slate-500" colspan="3">Sem meses nesta janela.</td></tr>`}</tbody>
            </table>
          </div>
        </div>
      `;
    })
    .join("");

  const pagamentos = (data.payments || [])
    .map(
      (p) => `
      <tr class="border-t border-slate-800">
        <td class="px-3 py-2">${escapeHtml(p.competencia)}</td>
        <td class="px-3 py-2">${formatMoney(p.amount)}</td>
        <td class="px-3 py-2">${escapeHtml(p.status)}</td>
        <td class="px-3 py-2 text-slate-400">${escapeHtml(p.paid_at || "")}</td>
        <td class="px-3 py-2 text-slate-400">${escapeHtml(p.tx_id || "")}</td>
      </tr>`
    )
    .join("");

  return `
    <div class="mb-4 flex items-center justify-between gap-4">
      <div>
        <a href="#/clients" class="text-sm text-slate-400 hover:text-white">← Voltar</a>
        <h2 class="mt-2 text-xl font-semibold text-white">${escapeHtml(nome)}</h2>
      </div>
      <a href="#/payments" class="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-amber-400">Registrar PIX</a>
    </div>

    <section class="mb-8 space-y-4">
      <h3 class="text-base font-semibold text-white">Assinaturas (ativas) e competências</h3>
      ${assinaturasHtml || `<p class="text-slate-500">Nenhuma assinatura ativa. Crie em <a class="text-amber-400 underline" href="#/subscriptions">Assinaturas</a>.</p>`}
    </section>

    <section>
      <h3 class="text-base font-semibold text-white">Histórico de pagamentos</h3>
      <div class="mt-3 overflow-x-auto rounded-xl border border-slate-800">
        <table class="w-full text-left text-sm">
          <thead class="bg-slate-900/60 text-xs uppercase text-slate-500">
            <tr>
              <th class="px-3 py-2">Competência</th>
              <th class="px-3 py-2">Valor</th>
              <th class="px-3 py-2">Status</th>
              <th class="px-3 py-2">Pago em</th>
              <th class="px-3 py-2">txId</th>
            </tr>
          </thead>
          <tbody>${pagamentos || `<tr><td class="px-3 py-6 text-slate-500" colspan="5">Nenhum pagamento registrado.</td></tr>`}</tbody>
        </table>
      </div>
    </section>
  `;
}

