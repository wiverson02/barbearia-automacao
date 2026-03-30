import React, { useEffect, useState } from "react";
import { Clock } from "lucide-react";

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
    cents / 100
  );
}

/** preco stored in cents; form shows value in reais */
function centsToReais(cents) {
  return cents != null ? (cents / 100).toFixed(2) : "";
}

function reaisToCents(str) {
  return Math.round(parseFloat(str) * 100);
}

function ServiceForm({ initial, onSave, onCancel }) {
  const [nome, setNome] = useState(initial?.nome ?? "");
  const [preco, setPreco] = useState(centsToReais(initial?.preco));
  const [duracao, setDuracao] = useState(String(initial?.duracao_minutos ?? "30"));
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    await onSave({
      nome,
      preco: reaisToCents(preco),
      duracao_minutos: Number(duracao),
    });
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "1rem" }}>
        <div>
          <label style={labelStyle}>Nome do serviço *</label>
          <input
            style={inputStyle}
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: Corte + Barba"
            required
          />
        </div>
        <div>
          <label style={labelStyle}>Preço (R$) *</label>
          <input
            style={inputStyle}
            type="number"
            min="0"
            step="0.01"
            value={preco}
            onChange={(e) => setPreco(e.target.value)}
            placeholder="35.00"
            required
          />
        </div>
        <div>
          <label style={labelStyle}>Duração (min) *</label>
          <input
            style={inputStyle}
            type="number"
            min="1"
            step="1"
            value={duracao}
            onChange={(e) => setDuracao(e.target.value)}
            placeholder="30"
            required
          />
        </div>
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

function ServiceCard({ service, onEdit, onToggle, editing, onSave, onCancelEdit }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-default)",
        borderRadius: "var(--radius-xl, 12px)",
        padding: "1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.875rem",
        transition: "box-shadow 0.2s, transform 0.2s",
        boxShadow: hovered ? "0 8px 24px rgba(0,0,0,0.35)" : "none",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {editing ? (
        <ServiceForm
          initial={service}
          onSave={onSave}
          onCancel={onCancelEdit}
        />
      ) : (
        <>
          {/* Top row: name + badge */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
            <p
              style={{
                margin: 0,
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: "1.1rem",
                color: "var(--text-primary)",
                lineHeight: 1.3,
              }}
            >
              {service.nome}
            </p>
            <span className={`badge ${service.ativo ? "badge-green" : "badge-red"}`}>
              {service.ativo ? "ATIVO" : "INATIVO"}
            </span>
          </div>

          {/* Price */}
          <p
            style={{
              margin: 0,
              fontFamily: "var(--font-mono)",
              fontWeight: 700,
              fontSize: "1.5rem",
              color: "var(--accent-green)",
              lineHeight: 1,
            }}
          >
            {formatBRL(service.preco)}
          </p>

          {/* Duration */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", color: "var(--text-secondary)" }}>
            <Clock size={14} />
            <span style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem" }}>
              {service.duracao_minutos} min
            </span>
          </div>

          {/* Actions */}
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              paddingTop: "0.5rem",
              borderTop: "1px solid var(--border-subtle)",
              marginTop: "auto",
            }}
          >
            <button
              style={{ ...btnAction, background: "var(--bg-overlay)", color: "var(--accent-blue)" }}
              onClick={onEdit}
            >
              Editar
            </button>
            <button
              style={{
                ...btnAction,
                background: "transparent",
                color: service.ativo ? "var(--accent-red)" : "var(--accent-green)",
                border: `1px solid ${service.ativo ? "rgba(255,113,108,0.3)" : "rgba(88,231,171,0.3)"}`,
              }}
              onClick={onToggle}
            >
              {service.ativo ? "Desativar" : "Ativar"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [toast, setToast] = useState(null);

  function showToast(message, ok = true) {
    setToast({ message, ok });
    setTimeout(() => setToast(null), 3000);
  }

  async function loadServices() {
    try {
      const data = await fetch("/api/services/all").then((r) => r.json());
      setServices(data);
    } catch {
      showToast("Erro ao carregar serviços.", false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadServices();
  }, []);

  async function handleCreate(fields) {
    const res = await fetch("/api/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
    if (res.ok) {
      setShowNewForm(false);
      showToast("Serviço criado com sucesso.");
      loadServices();
    } else {
      const err = await res.json().catch(() => ({}));
      showToast(err.error || "Erro ao criar serviço.", false);
    }
  }

  async function handleUpdate(id, fields) {
    const res = await fetch(`/api/services/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
    if (res.ok) {
      setEditingId(null);
      showToast("Serviço atualizado.");
      loadServices();
    } else {
      const err = await res.json().catch(() => ({}));
      showToast(err.error || "Erro ao atualizar serviço.", false);
    }
  }

  async function handleToggle(service) {
    const res = await fetch(`/api/services/${service.id}/toggle`, { method: "PATCH" });
    if (res.ok) {
      const updated = await res.json();
      setServices((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    } else {
      showToast("Erro ao alterar status.", false);
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
            Serviços
          </h1>
          <p style={{ margin: 0, fontFamily: "var(--font-body)", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Catálogo de serviços da barbearia
          </p>
        </div>
        {!showNewForm && (
          <button
            className="btn btn-primary"
            onClick={() => { setShowNewForm(true); setEditingId(null); }}
            style={{ fontSize: "0.875rem" }}
          >
            + Novo Serviço
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

      {/* New service form */}
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
            Novo Serviço
          </p>
          <ServiceForm
            onSave={handleCreate}
            onCancel={() => setShowNewForm(false)}
          />
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <p style={{ textAlign: "center", color: "var(--text-secondary)", margin: "3rem 0" }}>
          Carregando serviços…
        </p>
      ) : services.length === 0 ? (
        <p style={{ textAlign: "center", color: "var(--text-secondary)", margin: "3rem 0" }}>
          Nenhum serviço cadastrado. Crie o primeiro serviço para começar.
        </p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: "1.25rem",
          }}
        >
          {services.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              editing={editingId === service.id}
              onEdit={() => setEditingId(editingId === service.id ? null : service.id)}
              onCancelEdit={() => setEditingId(null)}
              onSave={(fields) => handleUpdate(service.id, fields)}
              onToggle={() => handleToggle(service)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
