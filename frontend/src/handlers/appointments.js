import { api } from "../api.js";
import { toast } from "../ui/toast.js";

function refresh() {
  document.dispatchEvent(new CustomEvent("spa:refresh"));
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
