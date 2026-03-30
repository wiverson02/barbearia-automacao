import { api } from "../api.js";
import { toast } from "../ui/toast.js";
import { modal } from "../ui/modal.js";

function refresh() {
  document.dispatchEvent(new CustomEvent("spa:refresh"));
}

export async function handleCreateClient(e) {
  const form = e.target;
  const fd = new FormData(form);
  const nome = String(fd.get("nome") ?? "").trim();
  const telefone = String(fd.get("telefone") ?? "").trim();
  if (!nome) throw new Error("Nome é obrigatório");
  if (!telefone) throw new Error("Telefone é obrigatório");
  const body = {
    nome,
    telefone,
    observacoes: fd.get("observacoes") || null,
  };
  await api("/api/clients", { method: "POST", body });
  form.reset();
  toast.success("Cliente salvo com sucesso!");
  refresh();
}

export async function handleUpdateClient(e) {
  const form = e.target;
  const fd = new FormData(form);
  const id = fd.get("id");
  if (!id) throw new Error("Cliente inválido");
  const nome = String(fd.get("nome") ?? "").trim();
  const telefone = String(fd.get("telefone") ?? "").trim();
  if (!nome) throw new Error("Nome é obrigatório");
  if (!telefone) throw new Error("Telefone é obrigatório");
  const body = {
    nome,
    telefone,
    observacoes: fd.get("observacoes") || null,
  };
  await api(`/api/clients/${id}`, { method: "PUT", body });
  document.getElementById("edit-client-wrap")?.classList.add("hidden");
  form.reset();
  toast.success("Cliente atualizado!");
  refresh();
}

export async function handleEditClient(btn) {
  const id = btn.dataset.id;
  const data = await api(`/api/clients/${id}`);
  const wrap = document.getElementById("edit-client-wrap");
  const form = wrap?.querySelector('form[data-form="update-client"]');
  if (!form || !wrap) return;
  form.querySelector('[name="id"]').value = String(data.id);
  form.querySelector('[name="nome"]').value = data.nome ?? "";
  form.querySelector('[name="telefone"]').value = data.telefone ?? "";
  form.querySelector('[name="observacoes"]').value = data.observacoes ?? "";
  wrap.classList.remove("hidden");
  wrap.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

export function handleCancelEditClient() {
  const wrap = document.getElementById("edit-client-wrap");
  const form = wrap?.querySelector('form[data-form="update-client"]');
  form?.reset();
  wrap?.classList.add("hidden");
}

export async function handleDeleteClient(btn) {
  const id = btn.dataset.id;
  const name = btn.dataset.name || "este cliente";
  const confirmed = await modal.confirm(`Excluir ${name}?`);
  if (!confirmed) return;
  await api(`/api/clients/${id}`, { method: "DELETE" });
  toast.success("Cliente excluído.");
  refresh();
}
