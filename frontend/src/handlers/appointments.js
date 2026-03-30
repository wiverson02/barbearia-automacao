import { api } from "../api.js";
import { toast } from "../ui/toast.js";

function refresh() {
  document.dispatchEvent(new CustomEvent("spa:refresh"));
}

export async function handleCreateAppointment(e) {
  const form = e.target;
  const fd = new FormData(form);
  const body = {
    clientId: Number(fd.get("clientId")),
    dataHora: fd.get("dataHora"),
    servico: fd.get("servico") || null,
    observacoes: fd.get("observacoes") || null,
    duracaoMinutos: fd.get("duracaoMinutos") ? Number(fd.get("duracaoMinutos")) : null,
    status: fd.get("status") || "agendado",
  };
  await api("/api/appointments", { method: "POST", body });
  form.reset();
  toast.success("Agendamento criado!");
  refresh();
}
