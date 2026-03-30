import React, { useEffect, useState } from "react";

const btnAction = {
  padding: "0.25rem 0.75rem",
  fontSize: "0.75rem",
  borderRadius: "var(--radius-sm, 6px)",
  border: "none",
  cursor: "pointer",
  fontFamily: "var(--font-body)",
  fontWeight: 600,
};

const inputStyle = {
  width: "100%",
  background: "var(--bg-overlay)",
  border: "1px solid var(--border-default)",
  borderRadius: "var(--radius-sm, 6px)",
  color: "var(--text-primary)",
  fontFamily: "var(--font-body)",
  fontSize: "0.875rem",
  padding: "0.5rem 0.75rem",
  outline: "none",
};

const labelStyle = {
  display: "block",
  fontSize: "0.75rem",
  fontWeight: 600,
  color: "var(--text-secondary)",
  marginBottom: "0.375rem",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};

function formatBRL(cents) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    (cents ?? 0) / 100
  );
}

function centsToReais(cents) {
  return cents != null ? (cents / 100).toFixed(2) : "";
}

function reaisToCents(str) {
  return Math.round(parseFloat(str) * 100);
}

function formatDate(iso) {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

function statusBadge(ativo) {
  return ativo ? (
    <span className="badge badge-green">ATIVA</span>
  ) : (
    <span className="badge badge-red">CANCELADA</span>
  );
}

function SubscriptionForm({ initial, clients, onSave, onCancel }) {
  const [clientId, setClientId] = useState(String(initial?.client_id ?? ""));
  const [valorMensal, setValorMensal] = useState(centsToReais(initial?.valor_mensal));
  const [startDate, setStartDate] = useState(initial?.start_date?.slice(0, 10) ?? "");
  const [ativo, setAtivo] = useState(initial ? Boolean(initial.ativo) : true);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    await onSave({
      clientId: Number(clientId),
      valorMensal: reaisToCents(valorMensal),
      startDate,
      ativo,
    });
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "1rem" }}>
        <div>
          <label style={labelStyle}>Cliente *</label>
          <select
            style={{ ...inputStyle, cursor: "pointer" }}
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            required
            disabled={!!initial}
          >
            <option value="">Selecione um cliente</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Valor mensal (R$) *</label>
          <input
            style={inputStyle}
            type="number"
            min="0"
            step="0.01"
            value={valorMensal}
            onChange={(e) => setValorMensal(e.target.value)}
            placeholder="50.00"
            required
          />
        </div>
        <div>
          <label style={labelStyle}>Data de início *</label>
          <input
            style={inputStyle}
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>
      </div>
      {initial && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <input
            id="ativo-toggle"
            type="checkbox"
            checked={ativo}
            onChange={(e) => setAtivo(e.target.checked)}
            style={{ accentColor: "var(--accent-blue)", width: "1rem", height: "1rem", cursor: "pointer" }}
          />
          <label
            htmlFor="ativo-toggle"
            style={{ ...labelStyle, margin: 0, textTransform: "none", letterSpacing: 0, fontSize: "0.85rem", cursor: "pointer" }}
          >
            Assinatura ativa
          </label>
        </div>
      )}
      <div style={{ display: "flex", gap: "0.75rem" }}>
        <button type="submit" disabled={saving} className="btn btn-primary" style={{ fontSize: "0.875rem" }}>
          {saving ? "Salvando…" : "Salvar"}
        </button>
        <button type="button" onClick={onCancel} className="btn btn-secondary" style={{ fontSize: "0.875rem" }}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

function tdStyle(isEditing) {
  return {
    padding: "0.875rem 0",
    borderBottom: isEditing ? "none" : "1px solid var(--border-subtle)",
    color: "var(--text-primary)",
    fontFamily: "var(--font-body)",
    fontSize: "0.9rem",
    fontWeight: 500,
    paddingRight: "1rem",
  };
}

export default function Subscriptions() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [toast, setToast] = useState(null);

  function showToast(message, ok = true) {
    setToast({ message, ok });
    setTimeout(() => setToast(null), 3000);
  }

  async function loadAll() {
    try {
      const [subs, cls] = await Promise.all([
        fetch("/api/subscriptions").then((r) => r.json()),
        fetch("/api/clients").then((r) => r.json()),
      ]);
      setSubscriptions(subs);
      setClients(cls);
    } catch {
      showToast("Erro ao carregar dados.", false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAll(); }, []);

  async function handleCreate(fields) {
    const res = await fetch("/api/subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
    if (res.ok) {
      setShowNewForm(false);
      showToast("Assinatura criada com sucesso.");
      loadAll();
    } else {
      const err = await res.json().catch(() => ({}));
      showToast(err.error || "Erro ao criar assinatura.", false);
    }
  }

  async function handleUpdate(id, fields) {
    const res = await fetch(`/api/subscriptions/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
    if (res.ok) {
      setEditingId(null);
      showToast("Assinatura atualizada.");
      loadAll();
    } else {
      const err = await res.json().catch(() => ({}));
      showToast(err.error || "Erro ao atualizar assinatura.", false);
    }
  }

  async function handleDelete(sub) {
    if (!window.confirm(`Excluir a assinatura de "${sub.client_nome}"? Esta ação não pode ser desfeita.`)) return;
    const res = await fetch(`/api/subscriptions/${sub.id}`, { method: "DELETE" });
    if (res.ok) {
      showToast("Assinatura excluída.");
      loadAll();
    } else {
      showToast("Erro ao excluir assinatura.", false);
    }
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.75rem", color: "var(--text-primary)", margin: "0 0 0.25rem" }}>
            Assinaturas
          </h1>
          <p style={{ margin: 0, fontFamily: "var(--font-body)", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Planos mensais dos clientes
          </p>
        </div>
        {!showNewForm && (
          <button className="btn btn-primary" onClick={() => { setShowNewForm(true); setEditingId(null); }} style={{ fontSize: "0.875rem" }}>
            + Nova Assinatura
          </button>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          marginBottom: "1.25rem",
          padding: "0.75rem 1rem",
          borderRadius: "var(--radius-sm, 6px)",
          background: toast.ok ? "rgba(88,231,171,0.12)" : "rgba(255,113,108,0.12)",
          color: toast.ok ? "var(--accent-green)" : "var(--accent-red)",
          fontFamily: "var(--font-body)",
          fontSize: "0.875rem",
          fontWeight: 500,
          border: `1px solid ${toast.ok ? "rgba(88,231,171,0.25)" : "rgba(255,113,108,0.25)"}`,
        }}>
          {toast.message}
        </div>
      )}

      {/* New subscription form */}
      {showNewForm && (
        <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-xl, 12px)", padding: "1.5rem", marginBottom: "1.5rem" }}>
          <p style={{ margin: "0 0 1.25rem", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "0.875rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Nova Assinatura
          </p>
          <SubscriptionForm clients={clients} onSave={handleCreate} onCancel={() => setShowNewForm(false)} />
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ padding: "1.5rem" }}>
        {loading ? (
          <p style={{ textAlign: "center", color: "var(--text-secondary)", margin: "2rem 0" }}>Carregando…</p>
        ) : subscriptions.length === 0 ? (
          <p style={{ textAlign: "center", color: "var(--text-secondary)", margin: "2rem 0" }}>Nenhuma assinatura cadastrada ainda.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Cliente", "Valor", "Início", "Status", "Ações"].map((h) => (
                  <th key={h} style={{ textAlign: "left", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", paddingBottom: "0.75rem", borderBottom: "1px solid var(--border-subtle)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((sub) => (
                <React.Fragment key={sub.id}>
                  <tr>
                    <td style={tdStyle(editingId === sub.id)}>{sub.client_nome}</td>
                    <td style={{ ...tdStyle(editingId === sub.id), fontFamily: "var(--font-mono)", fontSize: "0.875rem", color: "var(--accent-green)" }}>
                      {formatBRL(sub.valor_mensal)}
                    </td>
                    <td style={{ ...tdStyle(editingId === sub.id), fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                      {formatDate(sub.start_date)}
                    </td>
                    <td style={tdStyle(editingId === sub.id)}>
                      {statusBadge(sub.ativo)}
                    </td>
                    <td style={{ ...tdStyle(editingId === sub.id), whiteSpace: "nowrap" }}>
                      <button
                        style={{ ...btnAction, background: "var(--bg-overlay)", color: "var(--accent-blue)", marginRight: "0.5rem" }}
                        onClick={() => setEditingId(editingId === sub.id ? null : sub.id)}
                      >
                        {editingId === sub.id ? "Fechar" : "Editar"}
                      </button>
                      <button
                        style={{ ...btnAction, background: "transparent", color: "var(--accent-red)" }}
                        onClick={() => handleDelete(sub)}
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                  {editingId === sub.id && (
                    <tr>
                      <td colSpan={5} style={{ padding: "0 0 0.875rem", borderBottom: "1px solid var(--border-subtle)" }}>
                        <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-xl, 12px)", padding: "1.25rem" }}>
                          <SubscriptionForm
                            initial={sub}
                            clients={clients}
                            onSave={(fields) => handleUpdate(sub.id, fields)}
                            onCancel={() => setEditingId(null)}
                          />
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
