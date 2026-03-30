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

function reaisToCents(str) {
  return Math.round(parseFloat(str) * 100);
}

function centsToReais(cents) {
  return cents != null ? (cents / 100).toFixed(2) : "";
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

const STATUS_MAP = {
  paid: { label: "PAGO", badge: "badge-green" },
  pending: { label: "PENDENTE", badge: "badge-blue" },
  overdue: { label: "ATRASADO", badge: "badge-red" },
  failed: { label: "FALHOU", badge: "badge-red" },
};

function StatusBadge({ status }) {
  const s = STATUS_MAP[status] ?? { label: status ?? "—", badge: "badge-blue" };
  return <span className={`badge ${s.badge}`}>{s.label}</span>;
}

function SummaryCard({ label, value, color }) {
  return (
    <div
      className="card"
      style={{ display: "flex", flexDirection: "column", gap: "0.5rem", flex: 1 }}
    >
      <p style={{ margin: 0, fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-secondary)" }}>
        {label}
      </p>
      <p style={{ margin: 0, fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "1.25rem", color }}>
        {value}
      </p>
    </div>
  );
}

function PaymentForm({ clients, subscriptions, onSave, onCancel }) {
  const [clientId, setClientId] = useState("");
  const [subscriptionId, setSubscriptionId] = useState("");
  const [competencia, setCompetencia] = useState(currentMonth());
  const [amount, setAmount] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [txId, setTxId] = useState("");
  const [comprovanteTexto, setComprovanteTexto] = useState("");
  const [saving, setSaving] = useState(false);

  const clientSubs = subscriptions.filter(
    (s) => clientId && String(s.client_id) === String(clientId)
  );

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    await onSave({
      clientId: Number(clientId),
      subscriptionId: subscriptionId ? Number(subscriptionId) : null,
      competencia,
      amount: reaisToCents(amount),
      pixKey: pixKey || null,
      txId: txId || null,
      comprovanteTexto: comprovanteTexto || null,
    });
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div>
          <label style={labelStyle}>Cliente *</label>
          <select
            style={{ ...inputStyle, cursor: "pointer" }}
            value={clientId}
            onChange={(e) => { setClientId(e.target.value); setSubscriptionId(""); }}
            required
          >
            <option value="">Selecione um cliente</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Assinatura (opcional)</label>
          <select
            style={{ ...inputStyle, cursor: "pointer" }}
            value={subscriptionId}
            onChange={(e) => setSubscriptionId(e.target.value)}
            disabled={!clientId || clientSubs.length === 0}
          >
            <option value="">— sem assinatura vinculada —</option>
            {clientSubs.map((s) => (
              <option key={s.id} value={s.id}>
                {formatBRL(s.valor_mensal)} / mês (desde {s.start_date?.slice(0, 10)})
              </option>
            ))}
          </select>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div>
          <label style={labelStyle}>Competência (YYYY-MM) *</label>
          <input
            style={inputStyle}
            type="month"
            value={competencia}
            onChange={(e) => setCompetencia(e.target.value)}
            required
          />
        </div>
        <div>
          <label style={labelStyle}>Valor (R$) *</label>
          <input
            style={inputStyle}
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="50.00"
            required
          />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div>
          <label style={labelStyle}>Chave PIX (opcional)</label>
          <input
            style={inputStyle}
            value={pixKey}
            onChange={(e) => setPixKey(e.target.value)}
            placeholder="email, CPF, telefone..."
          />
        </div>
        <div>
          <label style={labelStyle}>TxID (opcional)</label>
          <input
            style={inputStyle}
            value={txId}
            onChange={(e) => setTxId(e.target.value)}
            placeholder="ID da transação PIX"
          />
        </div>
      </div>
      <div>
        <label style={labelStyle}>Comprovante (opcional)</label>
        <textarea
          style={{ ...inputStyle, resize: "vertical", minHeight: "3.5rem" }}
          value={comprovanteTexto}
          onChange={(e) => setComprovanteTexto(e.target.value)}
          placeholder="Texto do comprovante ou observações"
        />
      </div>
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

function tdStyle(last) {
  return {
    padding: "0.875rem 0",
    borderBottom: last ? "none" : "1px solid var(--border-subtle)",
    color: "var(--text-primary)",
    fontFamily: "var(--font-body)",
    fontSize: "0.9rem",
    fontWeight: 500,
    paddingRight: "1rem",
  };
}

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [clients, setClients] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [toast, setToast] = useState(null);

  function showToast(message, ok = true) {
    setToast({ message, ok });
    setTimeout(() => setToast(null), 3000);
  }

  async function loadAll() {
    try {
      const [pays, cls, subs] = await Promise.all([
        fetch("/api/payments").then((r) => r.json()),
        fetch("/api/clients").then((r) => r.json()),
        fetch("/api/subscriptions").then((r) => r.json()),
      ]);
      setPayments(pays);
      setClients(cls);
      setSubscriptions(subs);
    } catch {
      showToast("Erro ao carregar dados.", false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAll(); }, []);

  async function handleCreate(fields) {
    const res = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
    if (res.ok) {
      setShowNewForm(false);
      showToast("Pagamento registrado com sucesso.");
      loadAll();
    } else {
      const err = await res.json().catch(() => ({}));
      showToast(err.error || "Erro ao registrar pagamento.", false);
    }
  }

  async function handleDelete(payment) {
    const label = payment.client_nome ? `"${payment.client_nome}"` : `#${payment.id}`;
    if (!window.confirm(`Excluir o pagamento de ${label} (${payment.competencia})? Esta ação não pode ser desfeita.`)) return;
    const res = await fetch(`/api/payments/${payment.id}`, { method: "DELETE" });
    if (res.ok) {
      showToast("Pagamento excluído.");
      loadAll();
    } else {
      showToast("Erro ao excluir pagamento.", false);
    }
  }

  // Summary calculations
  const month = currentMonth();
  const totalPago = payments
    .filter((p) => p.status === "paid" && p.competencia === month)
    .reduce((s, p) => s + (p.amount ?? 0), 0);
  const totalPendente = payments
    .filter((p) => p.status === "pending")
    .reduce((s, p) => s + (p.amount ?? 0), 0);
  const totalAtrasado = payments
    .filter((p) => p.status === "overdue")
    .reduce((s, p) => s + (p.amount ?? 0), 0);

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.75rem", color: "var(--text-primary)", margin: "0 0 0.25rem" }}>
            Pagamentos
          </h1>
          <p style={{ margin: 0, fontFamily: "var(--font-body)", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Histórico de pagamentos PIX
          </p>
        </div>
        {!showNewForm && (
          <button className="btn btn-primary" onClick={() => setShowNewForm(true)} style={{ fontSize: "0.875rem" }}>
            + Registrar Pagamento
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

      {/* Summary cards */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <SummaryCard label={`Pago em ${month}`} value={formatBRL(totalPago)} color="var(--accent-green)" />
        <SummaryCard label="Pendente" value={formatBRL(totalPendente)} color="var(--accent-blue)" />
        <SummaryCard label="Atrasado" value={formatBRL(totalAtrasado)} color="var(--accent-red)" />
      </div>

      {/* New payment form */}
      {showNewForm && (
        <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-xl, 12px)", padding: "1.5rem", marginBottom: "1.5rem" }}>
          <p style={{ margin: "0 0 1.25rem", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "0.875rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Registrar Pagamento
          </p>
          <PaymentForm
            clients={clients}
            subscriptions={subscriptions}
            onSave={handleCreate}
            onCancel={() => setShowNewForm(false)}
          />
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ padding: "1.5rem" }}>
        {loading ? (
          <p style={{ textAlign: "center", color: "var(--text-secondary)", margin: "2rem 0" }}>Carregando…</p>
        ) : payments.length === 0 ? (
          <p style={{ textAlign: "center", color: "var(--text-secondary)", margin: "2rem 0" }}>Nenhum pagamento registrado ainda.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Cliente", "Competência", "Valor", "Status", "Ações"].map((h) => (
                  <th key={h} style={{ textAlign: "left", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", paddingBottom: "0.75rem", borderBottom: "1px solid var(--border-subtle)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payments.map((p, i) => {
                const isLast = i === payments.length - 1;
                return (
                  <tr key={p.id}>
                    <td style={tdStyle(isLast)}>{p.client_nome || "—"}</td>
                    <td style={{ ...tdStyle(isLast), fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                      {p.competencia || "—"}
                    </td>
                    <td style={{ ...tdStyle(isLast), fontFamily: "var(--font-mono)", fontSize: "0.875rem", color: "var(--accent-green)" }}>
                      {formatBRL(p.amount)}
                    </td>
                    <td style={tdStyle(isLast)}>
                      <StatusBadge status={p.status} />
                    </td>
                    <td style={{ ...tdStyle(isLast), whiteSpace: "nowrap" }}>
                      <button
                        style={{ ...btnAction, background: "transparent", color: "var(--accent-red)" }}
                        onClick={() => handleDelete(p)}
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
