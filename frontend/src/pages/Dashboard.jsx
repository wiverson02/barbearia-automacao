import React, { useEffect, useState } from "react";
import { Users, CalendarDays, Scissors, DollarSign } from "lucide-react";

function StatCard({ title, value, icon: Icon, accentColor, badgeClass, loading }) {
  return (
    <div
      className="card"
      style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <p className="card-title">{title}</p>
        <span className={`badge ${badgeClass}`}>
          <Icon size={12} />
        </span>
      </div>
      <p
        className="card-value"
        style={{ color: accentColor }}
      >
        {loading ? "—" : value}
      </p>
    </div>
  );
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export default function Dashboard() {
  const [clients, setClients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/clients").then((r) => r.json()),
      fetch("/api/appointments").then((r) => r.json()),
      fetch("/api/payments").then((r) => r.json()),
      fetch("/api/services").then((r) => r.json()),
    ])
      .then(([c, a, p, s]) => {
        setClients(c);
        setAppointments(a);
        setPayments(p);
        setServices(s);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const today = todayStr();
  const month = currentMonth();

  const apptToday = appointments.filter((a) =>
    (a.date || a.scheduled_at || "").startsWith(today)
  ).length;

  const monthRevenue = payments
    .filter((p) => (p.paid_at || p.created_at || "").startsWith(month))
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const formatBRL = (val) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val / 100);

  return (
    <div>
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: "1.75rem",
          color: "var(--text-primary)",
          margin: "0 0 2rem",
        }}
      >
        Painel de Controle
      </h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: "1.25rem",
        }}
      >
        <StatCard
          title="Clientes"
          value={clients.length}
          icon={Users}
          accentColor="var(--accent-blue)"
          badgeClass="badge-blue"
          loading={loading}
        />
        <StatCard
          title="Agendamentos Hoje"
          value={apptToday}
          icon={CalendarDays}
          accentColor="var(--accent-red)"
          badgeClass="badge-red"
          loading={loading}
        />
        <StatCard
          title="Serviços"
          value={services.length}
          icon={Scissors}
          accentColor="var(--accent-purple)"
          badgeClass="badge-purple"
          loading={loading}
        />
        <StatCard
          title="Receita do Mês"
          value={formatBRL(monthRevenue)}
          icon={DollarSign}
          accentColor="var(--accent-green)"
          badgeClass="badge-green"
          loading={loading}
        />
      </div>
    </div>
  );
}
