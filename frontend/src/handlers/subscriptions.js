import { api } from "../api.js";
import { toast } from "../ui/toast.js";

function refresh() {
  document.dispatchEvent(new CustomEvent("spa:refresh"));
}

export async function handleCreateSubscription(e) {
  const form = e.target;
  const fd = new FormData(form);
  const clientId = fd.get("clientId");
  const valorMensal = Number(String(fd.get("valorMensal")).replace(",", "."));
  if (!clientId || Number(clientId) <= 0) throw new Error("Selecione um cliente");
  if (!valorMensal || valorMensal <= 0) throw new Error("Informe um valor mensal válido");
  const body = {
    clientId: Number(clientId),
    valorMensal,
    startDate: fd.get("startDate"),
    endDate: fd.get("endDate") || null,
    ativo: fd.get("ativo") === "on",
  };
  await api("/api/subscriptions", { method: "POST", body });
  form.reset();
  toast.success("Assinatura criada!");
  refresh();
}

export async function handleUpdateSubscription(e) {
  const form = e.target;
  const fd = new FormData(form);
  const id = fd.get("id");
  if (!id) throw new Error("Assinatura inválida");
  const valorMensal = Number(String(fd.get("valorMensal")).replace(",", "."));
  if (!valorMensal || valorMensal <= 0) throw new Error("Informe um valor mensal válido");
  const endRaw = fd.get("endDate");
  const body = {
    valorMensal,
    startDate: fd.get("startDate"),
    endDate: endRaw && String(endRaw).trim() ? endRaw : null,
    ativo: fd.get("ativo") === "on",
  };
  await api(`/api/subscriptions/${id}`, { method: "PUT", body });
  document.getElementById("edit-subscription-wrap")?.classList.add("hidden");
  const subNomeEl = document.getElementById("edit-sub-client-nome");
  if (subNomeEl) subNomeEl.textContent = "—";
  form.reset();
  toast.success("Assinatura atualizada!");
  refresh();
}

export async function handleEditSubscription(btn) {
  const id = btn.dataset.id;
  const data = await api(`/api/subscriptions/${id}`);
  const wrap = document.getElementById("edit-subscription-wrap");
  const form = wrap?.querySelector('form[data-form="update-subscription"]');
  if (!form || !wrap) return;
  const nomeEl = document.getElementById("edit-sub-client-nome");
  if (nomeEl) nomeEl.textContent = data.client_nome ?? "—";
  form.querySelector('[name="id"]').value = String(data.id);
  form.querySelector('[name="valorMensal"]').value = String(data.valor_mensal ?? "");
  const sd = data.start_date != null ? String(data.start_date).slice(0, 10) : "";
  form.querySelector('[name="startDate"]').value = sd;
  const ed = data.end_date != null ? String(data.end_date).slice(0, 10) : "";
  form.querySelector('[name="endDate"]').value = ed;
  const ativoEl = form.querySelector('[name="ativo"]');
  if (ativoEl) ativoEl.checked = Boolean(data.ativo);
  wrap.classList.remove("hidden");
  wrap.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

export function handleCancelEditSubscription() {
  const wrap = document.getElementById("edit-subscription-wrap");
  const form = wrap?.querySelector('form[data-form="update-subscription"]');
  form?.reset();
  const nomeEl = document.getElementById("edit-sub-client-nome");
  if (nomeEl) nomeEl.textContent = "—";
  wrap?.classList.add("hidden");
}
