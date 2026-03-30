import { api } from "../api.js";
import { formatMoney, escapeHtml } from "../utils.js";

export async function viewDashboard() {
  const today = new Date().toISOString().slice(0, 10);
  const [s, todayAppointments] = await Promise.all([
    api("/api/dashboard/summary"),
    api(`/api/appointments?from=${today}T00:00:00&to=${today}T23:59:59`),
  ]);

  return `
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      ${card("Competência atual", formatCompetencia(s.competenciaAtual))}
      ${card("Total de clientes", String(s.totalClientes))}
      ${cardProgresso(s.recebidoMes, s.esperadoMes)}
      ${card("Assinaturas ativas", String(s.assinaturasAtivas))}
      ${card("Pendência neste mês (assinaturas)", String(s.clientesComPendenciaNesteMes))}
      ${card("Clientes com atraso (algum mês)", String(s.clientesComAtrasoEmAlgumMes))}
    </div>
    ${agendaHoje(todayAppointments, today)}
    <p class="mt-6 text-sm text-slate-400">
      Dica: cadastre clientes, crie uma assinatura e registre pagamentos em <a class="text-amber-400 underline" href="#/payments">PIX simulado</a>.
    </p>
  `;
}

function agendaHoje(appointments, today) {
  const d = new Date(`${today}T12:00:00`);
  const dataFmt = d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })
    .replace(/^\w/, c => c.toUpperCase());

  const statusColor = {
    agendado: "bg-sky-900/50 text-sky-400",
    concluido: "bg-emerald-900/50 text-emerald-400",
    cancelado: "bg-rose-900/50 text-rose-400",
  };

  const sorted = [...appointments].sort((a, b) => a.data_hora.localeCompare(b.data_hora));

  const rows = sorted.length
    ? sorted.map(a => {
        const hora = a.data_hora.slice(11, 16);
        const cor = statusColor[a.status] || "bg-slate-700 text-slate-400";
        return `
          <div class="flex items-center gap-3 border-t border-slate-800 py-3">
            <span class="text-sm font-mono text-slate-300 w-12 shrink-0">${hora}</span>
            <span class="text-sm text-white flex-1">${escapeHtml(a.client_nome || "—")}</span>
            <span class="text-xs text-slate-400 flex-1">${escapeHtml(a.servico || "")}</span>
            <span class="rounded px-2 py-0.5 text-xs font-medium ${cor}">${a.status}</span>
          </div>
        `;
      }).join("")
    : `<p class="py-4 text-sm text-slate-400">Nenhum agendamento hoje 🎉</p>`;

  return `
    <div class="mt-8 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
      <div class="flex items-center justify-between mb-2">
        <h2 class="text-base font-semibold text-white">Agenda de Hoje — ${dataFmt}</h2>
        <a href="#/appointments" class="text-xs text-amber-400 hover:underline">Ver todos →</a>
      </div>
      ${rows}
    </div>
  `;
}

function cardProgresso(recebido, esperado) {
  if (!esperado) {
    return `
      <div class="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
        <div class="text-xs uppercase text-slate-500">Recebido no mês</div>
        <div class="mt-2 text-2xl font-semibold text-white">${formatMoney(recebido)}</div>
      </div>
    `;
  }
  const pct = Math.min(100, Math.round((recebido / esperado) * 100));
  const cor = pct >= 100 ? "#22c55e" : pct >= 50 ? "#f59e0b" : "#ef4444";
  return `
    <div class="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
      <div class="text-xs uppercase text-slate-500">Recebido / Esperado</div>
      <div class="mt-2 text-2xl font-semibold text-white">${formatMoney(recebido)}</div>
      <div class="mt-1 text-xs text-slate-400">de ${formatMoney(esperado)} esperado</div>
      <div class="mt-3 h-2 w-full rounded-full bg-slate-700">
        <div style="width:${pct}%;background:${cor};" class="h-2 rounded-full transition-all"></div>
      </div>
    </div>
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
