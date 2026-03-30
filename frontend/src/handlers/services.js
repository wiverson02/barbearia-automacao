// frontend/src/handlers/services.js
import { api } from "../api.js";
import { toast } from "../ui/toast.js";

function refresh() {
  document.dispatchEvent(new CustomEvent("spa:refresh"));
}

export async function handleCreateService(e) {
  const form = e.target;
  const fd = new FormData(form);
  const nome = String(fd.get("nome") ?? "").trim();
  if (!nome) throw new Error("Nome é obrigatório");
  const body = {
    nome,
    preco: Number(fd.get("preco")) || 0,
    duracao_minutos: Number(fd.get("duracao_minutos")) || 30,
  };
  await api("/api/services", { method: "POST", body });
  form.reset();
  toast.success("Serviço criado!");
  refresh();
}

export async function handleUpdateService(e) {
  const form = e.target;
  const fd = new FormData(form);
  const id = fd.get("id");
  if (!id) throw new Error("Serviço inválido");
  const nome = String(fd.get("nome") ?? "").trim();
  if (!nome) throw new Error("Nome é obrigatório");
  const body = {
    nome,
    preco: Number(fd.get("preco")) || 0,
    duracao_minutos: Number(fd.get("duracao_minutos")) || 30,
  };
  await api(`/api/services/${id}`, { method: "PUT", body });
  document.getElementById("edit-service-wrap")?.classList.add("hidden");
  form.reset();
  toast.success("Serviço atualizado!");
  refresh();
}

export async function handleEditService(btn) {
  const id = btn.dataset.id;
  const data = await api(`/api/services/${id}`);
  const wrap = document.getElementById("edit-service-wrap");
  const form = wrap?.querySelector('form[data-form="update-service"]');
  if (!form || !wrap) return;
  form.querySelector('[name="id"]').value = String(data.id);
  form.querySelector('[name="nome"]').value = data.nome ?? "";
  form.querySelector('[name="preco"]').value = String(data.preco ?? 0);
  form.querySelector('[name="duracao_minutos"]').value = String(data.duracao_minutos ?? 30);
  wrap.classList.remove("hidden");
  wrap.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

export function handleCancelEditService() {
  const wrap = document.getElementById("edit-service-wrap");
  const form = wrap?.querySelector('form[data-form="update-service"]');
  form?.reset();
  wrap?.classList.add("hidden");
}

export async function handleToggleService(btn) {
  const id = btn.dataset.id;
  await api(`/api/services/${id}/toggle`, { method: "PATCH", body: {} });
  toast.success("Serviço atualizado!");
  refresh();
}
