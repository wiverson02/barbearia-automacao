import { Router } from "express";
import { db } from "../db.js";
import { buildSubscriptionFinance } from "../utils/finance.js";

const router = Router();

router.get("/", (_req, res) => {
  const rows = db.prepare("SELECT * FROM clients ORDER BY nome COLLATE NOCASE").all();
  res.json(rows);
});

router.post("/", (req, res) => {
  const { nome, telefone, observacoes } = req.body || {};
  if (!nome || String(nome).trim() === "") {
    return res.status(400).json({ error: "nome é obrigatório" });
  }
  if (!telefone || String(telefone).trim() === "") {
    return res.status(400).json({ error: "telefone é obrigatório" });
  }
  const info = db
    .prepare(
      "INSERT INTO clients (nome, telefone, observacoes) VALUES (?, ?, ?)"
    )
    .run(nome.trim(), telefone ?? null, observacoes ?? null);
  const row = db.prepare("SELECT * FROM clients WHERE id = ?").get(info.lastInsertRowid);
  res.status(201).json(row);
});

/** Painel financeiro: assinaturas ativas + meses (pago / pendente / atrasado) */
router.get("/:id/finance", (req, res) => {
  const client = db.prepare("SELECT * FROM clients WHERE id = ?").get(req.params.id);
  if (!client) return res.status(404).json({ error: "Cliente não encontrado" });

  const subs = db
    .prepare(
      "SELECT * FROM subscriptions WHERE client_id = ? AND ativo = 1 ORDER BY start_date"
    )
    .all(req.params.id);

  const payments = db
    .prepare(
      `SELECT id, subscription_id, competencia, amount, status, paid_at, tx_id
       FROM payments WHERE client_id = ? ORDER BY competencia DESC`
    )
    .all(req.params.id);

  const bySub = new Map();
  for (const p of payments) {
    const key = p.subscription_id ?? "sem_assinatura";
    if (!bySub.has(key)) bySub.set(key, []);
    bySub.get(key).push(p);
  }

  const assinaturasDetalhe = subs.map((sub) => {
    const paidRows = (bySub.get(sub.id) || []).map((p) => ({
      competencia: p.competencia,
      status: p.status,
    }));
    return buildSubscriptionFinance(sub, paidRows);
  });

  res.json({
    client,
    payments,
    assinaturas: assinaturasDetalhe,
  });
});

router.get("/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM clients WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "Cliente não encontrado" });
  res.json(row);
});

router.put("/:id", (req, res) => {
  const { nome, telefone, observacoes } = req.body || {};
  if (!nome || String(nome).trim() === "") {
    return res.status(400).json({ error: "nome é obrigatório" });
  }
  if (!telefone || String(telefone).trim() === "") {
    return res.status(400).json({ error: "telefone é obrigatório" });
  }
  const existing = db.prepare("SELECT * FROM clients WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Cliente não encontrado" });
  db.prepare(
    "UPDATE clients SET nome = ?, telefone = ?, observacoes = ? WHERE id = ?"
  ).run(
    nome != null ? String(nome).trim() : existing.nome,
    telefone !== undefined ? telefone : existing.telefone,
    observacoes !== undefined ? observacoes : existing.observacoes,
    req.params.id
  );
  const row = db.prepare("SELECT * FROM clients WHERE id = ?").get(req.params.id);
  res.json(row);
});

router.delete("/:id", (req, res) => {
  const info = db.prepare("DELETE FROM clients WHERE id = ?").run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: "Cliente não encontrado" });
  res.status(204).send();
});

export default router;
