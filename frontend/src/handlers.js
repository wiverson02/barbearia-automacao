import { toast } from "./ui/toast.js";

function refresh() {
  document.dispatchEvent(new CustomEvent("spa:refresh"));
}

document.addEventListener("submit", async (e) => {
  const form = e.target;
  if (!(form instanceof HTMLFormElement)) return;
  const kind = form.dataset.form;
  if (!kind) return;

  e.preventDefault();

  try {
    if (kind === "create-client") {
      const fd = new FormData(form);
      const body = {
        nome: fd.get("nome"),
        telefone: fd.get("telefone") || null,
        observacoes: fd.get("observacoes") || null,
      };
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar");
      form.reset();
      toast.success("Cliente salvo com sucesso!");
      refresh();
      return;
    }

    if (kind === "update-client") {
      const fd = new FormData(form);
      const id = fd.get("id");
      if (!id) throw new Error("Cliente invalido");
      const body = {
        nome: fd.get("nome"),
        telefone: fd.get("telefone") || null,
        observacoes: fd.get("observacoes") || null,
      };
      const res = await fetch(`/api/clients/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao atualizar");
      document.getElementById("edit-client-wrap")?.classList.add("hidden");
      form.reset();
      toast.success("Cliente atualizado!");
      refresh();
      return;
    }

    if (kind === "create-appointment") {
      const fd = new FormData(form);
      const body = {
        clientId: Number(fd.get("clientId")),
        dataHora: fd.get("dataHora"),
        servico: fd.get("servico") || null,
        observacoes: fd.get("observacoes") || null,
        duracaoMinutos: fd.get("duracaoMinutos") ? Number(fd.get("duracaoMinutos")) : null,
        status: fd.get("status") || "agendado",
      };
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao agendar");
      form.reset();
      toast.success("Agendamento criado!");
      refresh();
      return;
    }

    if (kind === "create-subscription") {
      const fd = new FormData(form);
      const body = {
        clientId: Number(fd.get("clientId")),
        valorMensal: Number(String(fd.get("valorMensal")).replace(",", ".")),
        startDate: fd.get("startDate"),
        endDate: fd.get("endDate") || null,
        ativo: fd.get("ativo") === "on",
      };
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro na assinatura");
      form.reset();
      toast.success("Assinatura criada!");
      refresh();
      return;
    }

    if (kind === "update-subscription") {
      const fd = new FormData(form);
      const id = fd.get("id");
      if (!id) throw new Error("Assinatura invalida");
      const endRaw = fd.get("endDate");
      const body = {
        valorMensal: Number(String(fd.get("valorMensal")).replace(",", ".")),
        startDate: fd.get("startDate"),
        endDate: endRaw && String(endRaw).trim() ? endRaw : null,
        ativo: fd.get("ativo") === "on",
      };
      const res = await fetch(`/api/subscriptions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao atualizar assinatura");
      document.getElementById("edit-subscription-wrap")?.classList.add("hidden");
      const subNomeEl = document.getElementById("edit-sub-client-nome");
      if (subNomeEl) subNomeEl.textContent = "\u2014";
      form.reset();
      toast.success("Assinatura atualizada!");
      refresh();
      return;
    }

    if (kind === "create-payment") {
      const fd = new FormData(form);
      const sub = fd.get("subscriptionId");
      const body = {
        clientId: Number(fd.get("clientId")),
        subscriptionId: sub ? Number(sub) : null,
        competencia: fd.get("competencia"),
        amount: Number(String(fd.get("amount")).replace(",", ".")),
        status: "paid",
        pixKey: fd.get("pixKey") || null,
        txId: fd.get("txId") || null,
        comprovanteTexto: fd.get("comprovanteTexto") || null,
      };
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro no pagamento");
      form.reset();
      toast.success("Pagamento registrado!");
      refresh();
      return;
    }
  } catch (err) {
    toast.error(err.message || String(err));
  }
});

document.addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const action = btn.dataset.action;

  if (action === "edit-client") {
    try {
      const id = btn.dataset.id;
      const res = await fetch(`/api/clients/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Cliente nao encontrado");

      const wrap = document.getElementById("edit-client-wrap");
      const form = wrap?.querySelector('form[data-form="update-client"]');
      if (!form || !wrap) return;

      form.querySelector('[name="id"]').value = String(data.id);
      form.querySelector('[name="nome"]').value = data.nome ?? "";
      form.querySelector('[name="telefone"]').value = data.telefone ?? "";
      form.querySelector('[name="observacoes"]').value = data.observacoes ?? "";

      wrap.classList.remove("hidden");
      wrap.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } catch (err) {
      toast.error(err.message || String(err));
    }
    return;
  }

  if (action === "cancel-edit-client") {
    const wrap = document.getElementById("edit-client-wrap");
    const form = wrap?.querySelector('form[data-form="update-client"]');
    form?.reset();
    wrap?.classList.add("hidden");
    return;
  }

  if (action === "edit-subscription") {
    try {
      const id = btn.dataset.id;
      const res = await fetch(`/api/subscriptions/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Assinatura nao encontrada");

      const wrap = document.getElementById("edit-subscription-wrap");
      const form = wrap?.querySelector('form[data-form="update-subscription"]');
      if (!form || !wrap) return;

      const nomeEl = document.getElementById("edit-sub-client-nome");
      if (nomeEl) nomeEl.textContent = data.client_nome ?? "\u2014";

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
    } catch (err) {
      toast.error(err.message || String(err));
    }
    return;
  }

  if (action === "cancel-edit-subscription") {
    const wrap = document.getElementById("edit-subscription-wrap");
    const form = wrap?.querySelector('form[data-form="update-subscription"]');
    form?.reset();
    const nomeEl = document.getElementById("edit-sub-client-nome");
    if (nomeEl) nomeEl.textContent = "\u2014";
    wrap?.classList.add("hidden");
    return;
  }

  if (action === "delete-client") {
    try {
      const id = btn.dataset.id;
      if (!confirm("Excluir este cliente?")) return;
      const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erro ao excluir");
      }
      toast.success("Cliente excluido.");
      refresh();
    } catch (err) {
      toast.error(err.message || String(err));
    }
  }
});
