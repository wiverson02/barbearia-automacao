import React from "react";
import Sidebar from "./Sidebar.jsx";

export default function Layout({ children }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-base)" }}>
      <Sidebar />
      <main
        style={{
          marginLeft: 256,
          flex: 1,
          padding: "2.5rem",
          minHeight: "100vh",
          background: "var(--bg-base)",
        }}
      >
        {children}
      </main>
    </div>
  );
}
