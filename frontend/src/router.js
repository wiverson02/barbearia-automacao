import { layout } from "./ui/layout.js";
import { viewDashboard } from "./views/dashboard.js";
import { viewClients } from "./views/clients.js";
import { viewFinance } from "./views/finance.js";
import { viewAppointments } from "./views/appointments.js";
import { viewSubscriptions } from "./views/subscriptions.js";
import { viewPayments } from "./views/payments.js";
import { escapeHtml } from "./utils.js";

function parseHash() {
  const h = window.location.hash.replace(/^#/, "") || "/";
  const parts = h.split("/").filter(Boolean);
  return { parts, raw: h };
}

let rootEl = null;

async function render() {
  if (!rootEl) return;
  const { parts } = parseHash();
  let title = "Início";
  let body = "";

  try {
    if (parts.length === 0 || parts[0] === "") {
      title = "Dashboard";
      body = await viewDashboard();
    } else if (parts[0] === "clients" && parts.length === 1) {
      title = "Clientes";
      body = await viewClients();
    } else if (parts[0] === "clients" && parts[2] === "finance" && parts[1]) {
      title = "Financeiro do cliente";
      body = await viewFinance(parts[1]);
    } else if (parts[0] === "appointments") {
      title = "Agendamentos";
      body = await viewAppointments();
    } else if (parts[0] === "subscriptions") {
      title = "Assinaturas";
      body = await viewSubscriptions();
    } else if (parts[0] === "payments") {
      title = "Pagamento PIX (simulado)";
      body = await viewPayments();
    } else {
      title = "Não encontrado";
      body = `<p class="text-slate-400">Rota não encontrada. Use o menu.</p>`;
    }
  } catch (e) {
    body = `<p class="text-rose-400">${escapeHtml(String(e.message || e))}</p>`;
  }

  rootEl.innerHTML = layout({ title, body });
}

export function mountRouter(root) {
  rootEl = root;
  window.addEventListener("hashchange", () => {
    render();
  });
  document.addEventListener("spa:refresh", () => {
    render();
  });
  render();
}
