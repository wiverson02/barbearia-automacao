import { Router } from "express";
import { db } from "../db.js";
import { currentCompetencia } from "../utils/months.js";
import { buildSubscriptionFinance } from "../utils/finance.js";

const router = Router();

router.get("/summary", (_req, res) => {
  const comp = currentCompetencia();

  const totalClientes = db.prepare("SELECT COUNT(*) AS n FROM clients").get().n;

  const recebidoMes = db
    .prepare(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM payments
       WHERE competencia = ? AND status = 'paid'`
    )
    .get(comp).total;

  const subsAtivas = db
    .prepare("SELECT * FROM subscriptions WHERE ativo = 1")
    .all();

  const paymentsAll = db
    .prepare(`SELECT subscription_id, competencia, status FROM payments`)
    .all();

  const bySub = new Map();
  for (const p of paymentsAll) {
    if (p.subscription_id == null) continue;
    if (!bySub.has(p.subscription_id)) bySub.set(p.subscription_id, []);
    bySub.get(p.subscription_id).push(p);
  }

  let clientesComPendenciaMes = 0;
  const clientesComAtraso = new Set();

  for (const sub of subsAtivas) {
    const paidRows = (bySub.get(sub.id) || []).map((p) => ({
      competencia: p.competencia,
      status: p.status,
    }));
    const { meses } = buildSubscriptionFinance(sub, paidRows);
    const noMes = meses.find((m) => m.competencia === comp);
    if (noMes && noMes.situacao !== "pago") {
      clientesComPendenciaMes += 1;
    }
    for (const m of meses) {
      if (m.situacao === "atrasado") {
        clientesComAtraso.add(sub.client_id);
      }
    }
  }

  res.json({
    competenciaAtual: comp,
    totalClientes,
    recebidoMes: recebidoMes,
    assinaturasAtivas: subsAtivas.length,
    clientesComPendenciaNesteMes: clientesComPendenciaMes,
    clientesComAtrasoEmAlgumMes: clientesComAtraso.size,
  });
});

export default router;
