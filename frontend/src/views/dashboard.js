import { api } from "../api.js";
import { formatMoney } from "../utils.js";

export async function viewDashboard() {
  const s = await api("/api/dashboard/summary");

  return `
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      ${card("Competência atual", formatCompetencia(s.competenciaAtual))}
      ${card("Total de clientes", String(s.totalClientes))}
      ${card("Recebido no mês (PIX pago)", formatMoney(s.recebidoMes))}
      ${card("Assinaturas ativas", String(s.assinaturasAtivas))}
      ${card("Pendência neste mês (assinaturas)", String(s.clientesComPendenciaNesteMes))}
      ${card("Clientes com atraso (algum mês)", String(s.clientesComAtrasoEmAlgumMes))}
    </div>
    <p class="mt-6 text-sm text-slate-400">
      Dica: cadastre clientes, crie uma assinatura e registre pagamentos em <a class="text-amber-400 underline" href="#/payments">PIX simulado</a>.
    </p>
  `;
}

function formatCompetencia(valor) {
  if (!valor) return valor;
  const [ano, mes] = valor.split("-");
  const data = new Date(Number(ano), Number(mes) - 1, 1);
  return data.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
    .replace(/^\w/, (c) => c.toUpperCase());
}

function card(title, value) {
  return `
    <div class="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
      <div class="text-xs uppercase text-slate-500">${title}</div>
      <div class="mt-2 text-2xl font-semibold text-white">${value}</div>
    </div>
  `;
}
