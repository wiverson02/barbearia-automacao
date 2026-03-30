import { Router } from "express";
import { db } from "../db.js";

const router = Router();

router.get("/", (req, res) => {
  const { clientId, competencia } = req.query;
  let sql = `
    SELECT p.*, c.nome AS client_nome
    FROM payments p
    JOIN clients c ON c.id = p.client_id
    WHERE 1=1
  `;
  const params = [];
  if (clientId) {
    sql += " AND p.client_id = ?";
    params.push(clientId);
  }
  if (competencia) {
    sql += " AND p.competencia = ?";
    params.push(competencia);
  }
  sql += " ORDER BY p.paid_at DESC";
  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

/** PIX simulado: registra um pagamento (normalmente status paid) */
router.post("/", (req, res) => {
  const {
    clientId,
    subscriptionId,
    competencia,
    amount,
    status,
    pixKey,
    txId,
    comprovanteTexto,
    paidAt,
  } = req.body || {};

  if (!clientId || !competencia || amount == null) {
    return res
      .status(400)
      .json({ error: "clientId, competencia (YYYY-MM) e amount são obrigatórios" });
  }

  const c = db.prepare("SELECT id FROM clients WHERE id = ?").get(clientId);
  if (!c) return res.status(400).json({ error: "Cliente inválido" });

  if (subscriptionId != null) {
    const s = db
      .prepare("SELECT id FROM subscriptions WHERE id = ? AND client_id = ?")
      .get(subscriptionId, clientId);
    if (!s) return res.status(400).json({ error: "Assinatura inválida para este cliente" });
  }

  const comp = String(competencia).slice(0, 7);
  const st = status === "failed" ? "failed" : "paid";
  const when = paidAt || new Date().toISOString();

  const info = db
    .prepare(
      `INSERT INTO payments (
        client_id, subscription_id, competencia, amount, status,
        pix_key, tx_id, comprovante_texto, paid_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      clientId,
      subscriptionId ?? null,
      comp,
      Number(amount),
      st,
      pixKey ?? null,
      txId ?? null,
      comprovanteTexto ?? null,
      when
    );

  const row = db
    .prepare(
      `SELECT p.*, c.nome AS client_nome FROM payments p
       JOIN clients c ON c.id = p.client_id WHERE p.id = ?`
    )
    .get(info.lastInsertRowid);
  res.status(201).json(row);
});

router.delete("/:id", (req, res) => {
  const info = db.prepare("DELETE FROM payments WHERE id = ?").run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: "Pagamento não encontrado" });
  res.status(204).send();
});

export default router;
