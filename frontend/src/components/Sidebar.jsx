import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  CreditCard,
  Banknote,
  Scissors,
} from "lucide-react";

const navItems = [
  { to: "/",             label: "Dashboard",    icon: LayoutDashboard },
  { to: "/clients",      label: "Clientes",     icon: Users },
  { to: "/appointments", label: "Agendamentos", icon: CalendarDays },
  { to: "/subscriptions",label: "Assinaturas",  icon: CreditCard },
  { to: "/payments",     label: "Pagamentos",   icon: Banknote },
  { to: "/services",     label: "Serviços",     icon: Scissors },
];

export default function Sidebar() {
  return (
    <aside
      style={{
        width: 256,
        minHeight: "100vh",
        background: "var(--sidebar-bg)",
        borderRight: "1px solid var(--border-subtle)",
        position: "fixed",
        top: 0,
        left: 0,
        display: "flex",
        flexDirection: "column",
        padding: "2rem 0 1rem",
      }}
    >
      {/* Brand */}
      <div style={{ padding: "0 1.5rem 2rem" }}>
        <p
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: "1rem",
            color: "var(--text-primary)",
            margin: 0,
            letterSpacing: "0.05em",
          }}
        >
          BARBER ELIAS
        </p>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontWeight: 600,
            fontSize: 10,
            color: "var(--text-secondary)",
            margin: "4px 0 0",
            letterSpacing: "0.1em",
          }}
        >
          BARBER MANAGEMENT
        </p>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1 }}>
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            style={({ isActive }) => ({
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.65rem 1.5rem",
              textDecoration: "none",
              color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
              borderLeft: isActive
                ? "3px solid var(--accent-blue)"
                : "3px solid transparent",
              background: isActive ? "var(--sidebar-border)" : "transparent",
              fontSize: "0.875rem",
              fontWeight: isActive ? 600 : 400,
              transition: "all 0.15s",
            })}
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
