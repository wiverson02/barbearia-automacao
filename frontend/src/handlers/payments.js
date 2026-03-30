import { api } from "../api.js";
import { toast } from "../ui/toast.js";

function refresh() {
  document.dispatchEvent(new CustomEvent("spa:refresh"));
}

export async function handleCreatePayment(e) {
  const form = e.target;
  const fd = new FormData(form);
  const competencia = String(fd.get("competencia") ?? "").trim();
  const amount = Number(String(fd.get("amount")).replace(",", "."));
  if (!competencia || !/^\d{4}-\d{2}$/.test(competencia))
    throw new Error("Competência inválida (use YYYY-MM)");
  if (!amount || amount <= 0) throw new Error("Informe um valor válido");
  const sub = fd.get("subscriptionId");
  const body = {
    clientId: Number(fd.get("clientId")),
    subscriptionId: sub ? Number(sub) : null,
    competencia,
    amount,
    status: "paid",
    pixKey: fd.get("pixKey") || null,
    txId: fd.get("txId") || null,
    comprovanteTexto: fd.get("comprovanteTexto") || null,
  };
  await api("/api/payments", { method: "POST", body });
  form.reset();
  toast.success("Pagamento registrado!");
  refresh();
}
