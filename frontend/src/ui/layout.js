import { escapeHtml } from "../utils.js";

export function layout({ title, body }) {
  const currentHash = window.location.hash || "#/";

  const nav = [
    { href: "#/",              label: "Dashboard"    },
    { href: "#/clients",       label: "Clientes"     },
    { href: "#/appointments",  label: "Agendamentos" },
    { href: "#/subscriptions", label: "Assinaturas"  },
    { href: "#/payments",      label: "PIX simulado" },
  ];

  const links = nav
    .map((n) => {
      const isActive =
        n.href === "#/"
          ? currentHash === "#/" || currentHash === "#"
          : currentHash.startsWith(n.href);
      const cls = isActive
        ? "rounded-lg px-3 py-2 text-sm bg-slate-800 text-amber-400"
        : "rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white";
      return `<a href="${n.href}" class="${cls}">${n.label}</a>`;
    })
    .join("");

  return `
    <div class="min-h-screen">
      <header class="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div class="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div class="text-xs uppercase tracking-widest text-amber-400/90">Barbearia</div>
            <h1 class="text-lg font-semibold text-white">${escapeHtml(title)}</h1>
          </div>
          <nav class="flex flex-wrap gap-1">${links}</nav>
        </div>
      </header>
      <main class="mx-auto max-w-6xl px-4 py-8">${body}</main>
    </div>
  `;
}
