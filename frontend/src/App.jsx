import React from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Clients from "./pages/Clients.jsx";
import Appointments from "./pages/Appointments.jsx";
import Subscriptions from "./pages/Subscriptions.jsx";
import Payments from "./pages/Payments.jsx";
import Services from "./pages/Services.jsx";

export default function App() {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/"              element={<Dashboard />} />
          <Route path="/clients"       element={<Clients />} />
          <Route path="/appointments"  element={<Appointments />} />
          <Route path="/subscriptions" element={<Subscriptions />} />
          <Route path="/payments"      element={<Payments />} />
          <Route path="/services"      element={<Services />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
}
