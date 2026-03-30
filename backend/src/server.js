import express from "express";
import cors from "cors";
import clientsRouter from "./routes/clients.js";
import appointmentsRouter from "./routes/appointments.js";
import subscriptionsRouter from "./routes/subscriptions.js";
import paymentsRouter from "./routes/payments.js";
import dashboardRouter from "./routes/dashboard.js";
import servicesRouter from "./routes/services.js";
import publicRouter from "./routes/public.js";
import "./db.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: true }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/clients", clientsRouter);
app.use("/api/appointments", appointmentsRouter);
app.use("/api/subscriptions", subscriptionsRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/services", servicesRouter);
app.use("/api/public", publicRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Erro interno" });
});

const server = app.listen(PORT, () => {
  console.log(`API em http://localhost:${PORT}`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `Porta ${PORT} já está em uso. Encerre o outro Node (ex.: outro terminal com a API) ou rode com outra porta:\n  $env:PORT=3002; npm run dev`
    );
    process.exit(1);
  }
  throw err;
});
