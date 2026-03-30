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

function ClientForm({ initial, onSave, onCancel }) {
  const [nome, setNome] = useState(initial?.nome ?? "");
  const [telefone, setTelefone] = useState(initial?.telefone ?? "");
  const [observacoes, setObservacoes] = useState(initial?.observacoes ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    await onSave({ nome, telefone, observacoes });
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div>
          <label style={labelStyle}>Nome *</label>
          <input
            style={inputStyle}
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome do cliente"
            required
          />
        </div>
        <div>
          <label style={labelStyle}>Telefone *</label>
          <input
            style={inputStyle}
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            placeholder="(11) 99999-9999"
            required
          />
        </div>
      </div>
      <div>
        <label style={labelStyle}>Observações</label>
        <input
          style={inputStyle}
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          placeholder="Alguma observação sobre o cliente"
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

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [toast, setToast] = useState(null); // { message, ok }

  function showToast(message, ok = true) {
    setToast({ message, ok });
    setTimeout(() => setToast(null), 3000);
  }

  async function loadClients() {
    try {
      const data = await fetch("/api/clients").then((r) => r.json());
      setClients(data);
    } catch {
      showToast("Erro ao carregar clientes.", false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadClients();
  }, []);

  async function handleCreate(fields) {
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
    if (res.ok) {
      setShowNewForm(false);
      showToast("Cliente cadastrado com sucesso.");
      loadClients();
    } else {
      const err = await res.json().catch(() => ({}));
      showToast(err.error || "Erro ao cadastrar cliente.", false);
    }
  }

  async function handleUpdate(id, fields) {
    const res = await fetch(`/api/clients/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
    if (res.ok) {
      setEditingId(null);
      showToast("Cliente atualizado.");
      loadClients();
    } else {
      const err = await res.json().catch(() => ({}));
      showToast(err.error || "Erro ao atualizar cliente.", false);
    }
  }

  async function handleDelete(client) {
    if (!window.confirm(`Excluir o cliente "${client.nome}"? Esta ação não pode ser desfeita.`)) return;
    const res = await fetch(`/api/clients/${client.id}`, { method: "DELETE" });
    if (res.ok) {
      showToast("Cliente excluído.");
      loadClients();
    } else {
      showToast("Erro ao excluir cliente.", false);
    }
  }

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
            Clientes
          </h1>
          <p style={{ margin: 0, fontFamily: "var(--font-body)", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Gerencie sua base de clientes
          </p>
        </div>
        {!showNewForm && (
          <button
            className="btn btn-primary"
            onClick={() => { setShowNewForm(true); setEditingId(null); }}
            style={{ fontSize: "0.875rem" }}
          >
            + Novo Cliente
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

      {/* New client form */}
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
            Novo Cliente
          </p>
          <ClientForm
            onSave={handleCreate}
            onCancel={() => setShowNewForm(false)}
          />
        </div>
      )}

      {/* Clients table */}
      <div
        className="card"
        style={{ padding: "1.5rem" }}
      >
        {loading ? (
          <p style={{ textAlign: "center", color: "var(--text-secondary)", margin: "2rem 0" }}>
            Carregando…
          </p>
        ) : clients.length === 0 ? (
          <p style={{ textAlign: "center", color: "var(--text-secondary)", margin: "2rem 0" }}>
            Nenhum cliente cadastrado ainda.
          </p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Nome", "Telefone", "Observações", "Ações"].map((h) => (
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
              {clients.map((client) => (
                <React.Fragment key={client.id}>
                  <tr>
                    <td
                      style={{
                        padding: "0.875rem 0",
                        borderBottom: editingId === client.id ? "none" : "1px solid var(--border-subtle)",
                        color: "var(--text-primary)",
                        fontFamily: "var(--font-body)",
                        fontSize: "0.9rem",
                        fontWeight: 500,
                        paddingRight: "1rem",
                      }}
                    >
                      {client.nome}
                    </td>
                    <td
                      style={{
                        padding: "0.875rem 0",
                        borderBottom: editingId === client.id ? "none" : "1px solid var(--border-subtle)",
                        color: "var(--text-secondary)",
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.8rem",
                        paddingRight: "1rem",
                      }}
                    >
                      {client.telefone || "—"}
                    </td>
                    <td
                      style={{
                        padding: "0.875rem 0",
                        borderBottom: editingId === client.id ? "none" : "1px solid var(--border-subtle)",
                        color: "var(--text-secondary)",
                        fontFamily: "var(--font-body)",
                        fontSize: "0.85rem",
                        paddingRight: "1rem",
                      }}
                    >
                      {client.observacoes || "—"}
                    </td>
                    <td
                      style={{
                        padding: "0.875rem 0",
                        borderBottom: editingId === client.id ? "none" : "1px solid var(--border-subtle)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <button
                        style={{
                          ...btnAction,
                          background: "var(--bg-overlay)",
                          color: "var(--accent-blue)",
                          marginRight: "0.5rem",
                        }}
                        onClick={() => setEditingId(editingId === client.id ? null : client.id)}
                      >
                        {editingId === client.id ? "Fechar" : "Editar"}
                      </button>
                      <button
                        style={{
                          ...btnAction,
                          background: "transparent",
                          color: "var(--accent-red)",
                        }}
                        onClick={() => handleDelete(client)}
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                  {editingId === client.id && (
                    <tr>
                      <td
                        colSpan={4}
                        style={{
                          padding: "0 0 0.875rem",
                          borderBottom: "1px solid var(--border-subtle)",
                        }}
                      >
                        <div
                          style={{
                            background: "var(--bg-elevated)",
                            border: "1px solid var(--border-default)",
                            borderRadius: "var(--radius-xl, 12px)",
                            padding: "1.25rem",
                          }}
                        >
                          <ClientForm
                            initial={client}
                            onSave={(fields) => handleUpdate(client.id, fields)}
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
