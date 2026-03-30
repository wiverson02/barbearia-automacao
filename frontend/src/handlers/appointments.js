import { api } from "../api.js";
import { toast } from "../ui/toast.js";

function refresh() {
  document.dispatchEvent(new CustomEvent("spa:refresh"));
}

export async function handleUpdateAppointment(e) {
  const form = e.target;
  const fd = new FormData(form);
  const id = fd.get("id");
  if (!id) throw new Error("Agendamento inválido");
  const clientId = fd.get("clientId");
  const dataHora = fd.get("dataHora");
  const servico = String(fd.get("servico") ?? "").trim();
  if (!clientId || Number(clientId) <= 0) throw new Error("Selecione um cliente");
  if (!dataHora) throw new Error("Data e hora são obrigatórias");
  if (!servico) throw new Error("Serviço é obrigatório");
  const body = {
    clientId: Number(clientId),
    dataHora,
    servico,
    observacoes: fd.get("observacoes") || null,
    duracaoMinutos: fd.get("duracaoMinutos") ? Number(fd.get("duracaoMinutos")) : null,
    status: fd.get("status") || "agendado",
  };
  await api(`/api/appointments/${id}`, { method: "PUT", body });
  document.getElementById("edit-appointment-wrap")?.classList.add("hidden");
  form.reset();
  toast.success("Agendamento atualizado!");
  refresh();
}

export async function handleEditAppointment(btn) {
  const id = btn.dataset.id;
  const data = await api(`/api/appointments/${id}`);
  const wrap = document.getElementById("edit-appointment-wrap");
  const form = wrap?.querySelector('form[data-form="update-appointment"]');
  if (!form || !wrap) return;
  form.querySelector('[name="id"]').value = String(data.id);
  const clientSelect = form.querySelector('[name="clientId"]');
  if (clientSelect) clientSelect.value = String(data.client_id);
  const dataHoraRaw = data.data_hora ? String(data.data_hora).slice(0, 16) : "";
  form.querySelector('[name="dataHora"]').value = dataHoraRaw;
  form.querySelector('[name="servico"]').value = data.servico ?? "";
  form.querySelector('[name="observacoes"]').value = data.observacoes ?? "";
  const durEl = form.querySelector('[name="duracaoMinutos"]');
  if (durEl) durEl.value = data.duracao_minutos != null ? String(data.duracao_minutos) : "";
  const statusEl = form.querySelector('[name="status"]');
  if (statusEl) statusEl.value = data.status ?? "agendado";
  wrap.classList.remove("hidden");
  wrap.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

export function handleCancelEditAppointment() {
  const wrap = document.getElementById("edit-appointment-wrap");
  const form = wrap?.querySelector('form[data-form="update-appointment"]');
  form?.reset();
  wrap?.classList.add("hidden");
}

export async function handleCreateAppointment(e) {
  const form = e.target;
  const fd = new FormData(form);
  const clientId = fd.get("clientId");
  const dataHora = fd.get("dataHora");
  const servico = String(fd.get("servico") ?? "").trim();
  if (!clientId || Number(clientId) <= 0) throw new Error("Selecione um cliente");
  if (!dataHora) throw new Error("Data e hora são obrigatórias");
  if (!servico) throw new Error("Serviço é obrigatório");
  const body = {
    clientId: Number(clientId),
    dataHora,
    servico,
    observacoes: fd.get("observacoes") || null,
    duracaoMinutos: fd.get("duracaoMinutos") ? Number(fd.get("duracaoMinutos")) : null,
    status: fd.get("status") || "agendado",
  };
  await api("/api/appointments", { method: "POST", body });
  form.reset();
  toast.success("Agendamento criado!");
  refresh();
}
