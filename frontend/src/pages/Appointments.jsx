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

const STATUS_OPTIONS = ["agendado", "concluído", "cancelado"];

const BADGE = {
  agendado: "badge-blue",
  "concluído": "badge-green",
  cancelado: "badge-red",
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function weekEnd() {
  const d = new Date();
  d.setDate(d.getDate() + (6 - d.getDay()));
  return d.toISOString().slice(0, 10);
}

/** Split ISO datetime "2024-06-15T14:30" → { date: "2024-06-15", time: "14:30" } */
function splitDataHora(dataHora) {
  if (!dataHora) return { date: "", time: "" };
  const [date, time = ""] = dataHora.split("T");
  return { date, time: time.slice(0, 5) };
}

function joinDataHora(date, time) {
  if (!date) return "";
  return time ? `${date}T${time}` : `${date}T00:00`;
}

function formatDisplay(dataHora) {
  if (!dataHora) return "—";
  const { date, time } = splitDataHora(dataHora);
  if (!date) return "—";
  const [y, m, d] = date.split("-");
  return `${d}/${m}/${y}${time ? ` ${time}` : ""}`;
}

function AppointmentForm({ initial, clients, onSave, onCancel }) {
  const { date: initDate, time: initTime } = splitDataHora(initial?.data_hora);
  const [clientId, setClientId] = useState(String(initial?.client_id ?? ""));
  const [date, setDate] = useState(initDate);
  const [time, setTime] = useState(initTime);
  const [servico, setServico] = useState(initial?.servico ?? "");
  const [observacoes, setObservacoes] = useState(initial?.observacoes ?? "");
  const [status, setStatus] = useState(initial?.status ?? "agendado");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    await onSave({
      clientId: Number(clientId),
      dataHora: joinDataHora(date, time),
      servico: servico || null,
      observacoes: observacoes || null,
      status,
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
            onChange={(e) => setClientId(e.target.value)}
            required
          >
            <option value="">Selecione um cliente</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Serviço</label>
          <input
            style={inputStyle}
            value={servico}
            onChange={(e) => setServico(e.target.value)}
            placeholder="Ex: Corte + Barba"
          />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
        <div>
          <label style={labelStyle}>Data *</label>
          <input
            style={inputStyle}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        <div>
          <label style={labelStyle}>Hora</label>
          <input
            style={inputStyle}
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>
        <div>
          <label style={labelStyle}>Status</label>
          <select
            style={{ ...inputStyle, cursor: "pointer" }}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label style={labelStyle}>Observações</label>
        <textarea
          style={{ ...inputStyle, resize: "vertical", minHeight: "4rem" }}
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          placeholder="Alguma observação sobre o atendimento"
        />
      </div>
      <div style={{ display: "flex", gap: "0.75rem" }}>
        <button
          type="submit"
          disabled={saving}
          className="btn btn-primary"
          style={{ fontSize: "0.875rem" }}
        >
          {saving ? "Salvando…" : "Salvar"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-secondary"
          style={{ fontSize: "0.875rem" }}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState("hoje"); // "hoje" | "semana" | "todos"
  const [toast, setToast] = useState(null);

  function showToast(message, ok = true) {
    setToast({ message, ok });
    setTimeout(() => setToast(null), 3000);
  }

  async function loadAll() {
    try {
      const [appts, cls] = await Promise.all([
        fetch("/api/appointments").then((r) => r.json()),
        fetch("/api/clients").then((r) => r.json()),
      ]);
      setAppointments(appts);
      setClients(cls);
    } catch {
      showToast("Erro ao carregar dados.", false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleCreate(fields) {
    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
    if (res.ok) {
      setShowNewForm(false);
      showToast("Agendamento criado com sucesso.");
      loadAll();
    } else {
      const err = await res.json().catch(() => ({}));
      showToast(err.error || "Erro ao criar agendamento.", false);
    }
  }

  async function handleUpdate(id, fields) {
    const res = await fetch(`/api/appointments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
    if (res.ok) {
      setEditingId(null);
      showToast("Agendamento atualizado.");
      loadAll();
    } else {
      const err = await res.json().catch(() => ({}));
      showToast(err.error || "Erro ao atualizar agendamento.", false);
    }
  }

  async function handleDelete(appt) {
    const label = appt.client_nome ? `"${appt.client_nome}"` : `#${appt.id}`;
    if (!window.confirm(`Excluir o agendamento de ${label}? Esta ação não pode ser desfeita.`)) return;
    const res = await fetch(`/api/appointments/${appt.id}`, { method: "DELETE" });
    if (res.ok) {
      showToast("Agendamento excluído.");
      loadAll();
    } else {
      showToast("Erro ao excluir agendamento.", false);
    }
  }

  const today = todayStr();
  const wEnd = weekEnd();

  const filtered = appointments.filter((a) => {
    const date = (a.data_hora || "").slice(0, 10);
    if (filter === "hoje") return date === today;
    if (filter === "semana") return date >= today && date <= wEnd;
    return true;
  });

  const filterBtns = [
    { key: "hoje", label: "Hoje" },
    { key: "semana", label: "Esta semana" },
    { key: "todos", label: "Todos" },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
        <div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: "1.75rem",
              color: "var(--text-primary)",
              margin: "0 0 0.25rem",
            }}
          >
            Agendamentos
          </h1>
          <p style={{ margin: 0, fontFamily: "var(--font-body)", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Agenda do dia e histórico de atendimentos
          </p>
        </div>
        {!showNewForm && (
          <button
            className="btn btn-primary"
            onClick={() => { setShowNewForm(true); setEditingId(null); }}
            style={{ fontSize: "0.875rem" }}
          >
            + Novo Agendamento
          </button>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div
          style={{
            marginBottom: "1.25rem",
            padding: "0.75rem 1rem",
            borderRadius: "var(--radius-sm, 6px)",
            background: toast.ok ? "rgba(88,231,171,0.12)" : "rgba(255,113,108,0.12)",
            color: toast.ok ? "var(--accent-green)" : "var(--accent-red)",
            fontFamily: "var(--font-body)",
            fontSize: "0.875rem",
            fontWeight: 500,
            border: `1px solid ${toast.ok ? "rgba(88,231,171,0.25)" : "rgba(255,113,108,0.25)"}`,
          }}
        >
          {toast.message}
        </div>
      )}

      {/* New appointment form */}
      {showNewForm && (
        <div
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-default)",
            borderRadius: "var(--radius-xl, 12px)",
            padding: "1.5rem",
            marginBottom: "1.5rem",
          }}
        >
          <p
            style={{
              margin: "0 0 1.25rem",
              fontFamily: "var(--font-body)",
              fontWeight: 600,
              fontSize: "0.875rem",
              color: "var(--text-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Novo Agendamento
          </p>
          <AppointmentForm
            clients={clients}
            onSave={handleCreate}
            onCancel={() => setShowNewForm(false)}
          />
        </div>
      )}

      {/* Filter buttons */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem" }}>
        {filterBtns.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            style={{
              padding: "0.375rem 1rem",
              fontSize: "0.8rem",
              fontFamily: "var(--font-body)",
              fontWeight: 600,
              borderRadius: "var(--radius-sm, 6px)",
              cursor: "pointer",
              border: filter === key ? `1px solid var(--accent-blue)` : "1px solid var(--border-default)",
              background: filter === key ? "var(--bg-overlay)" : "transparent",
              color: filter === key ? "var(--accent-blue)" : "var(--text-secondary)",
              transition: "all 0.15s",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: "1.5rem" }}>
        {loading ? (
          <p style={{ textAlign: "center", color: "var(--text-secondary)", margin: "2rem 0" }}>
            Carregando…
          </p>
        ) : filtered.length === 0 ? (
          <p style={{ textAlign: "center", color: "var(--text-secondary)", margin: "2rem 0" }}>
            Nenhum agendamento encontrado.
          </p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Cliente", "Serviço", "Data / Hora", "Status", "Ações"].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      fontFamily: "var(--font-body)",
                      fontWeight: 600,
                      fontSize: "0.7rem",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "var(--text-muted)",
                      paddingBottom: "0.75rem",
                      borderBottom: "1px solid var(--border-subtle)",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((appt) => (
                <React.Fragment key={appt.id}>
                  <tr>
                    <td style={tdStyle(editingId === appt.id)}>
                      {appt.client_nome || "—"}
                    </td>
                    <td style={{ ...tdStyle(editingId === appt.id), color: "var(--text-secondary)", paddingRight: "1rem" }}>
                      {appt.servico || "—"}
                    </td>
                    <td style={{ ...tdStyle(editingId === appt.id), fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--text-secondary)", paddingRight: "1rem" }}>
                      {formatDisplay(appt.data_hora)}
                    </td>
                    <td style={{ ...tdStyle(editingId === appt.id), paddingRight: "1rem" }}>
                      <span className={`badge ${BADGE[appt.status] || "badge-blue"}`}>
                        {appt.status || "agendado"}
                      </span>
                    </td>
                    <td style={{ ...tdStyle(editingId === appt.id), whiteSpace: "nowrap" }}>
                      <button
                        style={{ ...btnAction, background: "var(--bg-overlay)", color: "var(--accent-blue)", marginRight: "0.5rem" }}
                        onClick={() => setEditingId(editingId === appt.id ? null : appt.id)}
                      >
                        {editingId === appt.id ? "Fechar" : "Editar"}
                      </button>
                      <button
                        style={{ ...btnAction, background: "transparent", color: "var(--accent-red)" }}
                        onClick={() => handleDelete(appt)}
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                  {editingId === appt.id && (
                    <tr>
                      <td
                        colSpan={5}
                        style={{ padding: "0 0 0.875rem", borderBottom: "1px solid var(--border-subtle)" }}
                      >
                        <div
                          style={{
                            background: "var(--bg-elevated)",
                            border: "1px solid var(--border-default)",
                            borderRadius: "var(--radius-xl, 12px)",
                            padding: "1.25rem",
                          }}
                        >
                          <AppointmentForm
                            initial={appt}
                            clients={clients}
                            onSave={(fields) => handleUpdate(appt.id, fields)}
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
