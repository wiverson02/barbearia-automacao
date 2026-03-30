import { Router } from "express";
import { db } from "../db.js";

const router = Router();

router.get("/", (req, res) => {
  const { clientId } = req.query;
  let sql = `
    SELECT s.*, c.nome AS client_nome
    FROM subscriptions s
    JOIN clients c ON c.id = s.client_id
  `;
  const params = [];
  if (clientId) {
    sql += " WHERE s.client_id = ?";
    params.push(clientId);
  }
  sql += " ORDER BY s.start_date DESC";
  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

router.post("/", (req, res) => {
  const { clientId, valorMensal, ativo, startDate, endDate } = req.body || {};
  if (!clientId || valorMensal == null || !startDate) {
    return res
      .status(400)
      .json({ error: "clientId, valorMensal e startDate são obrigatórios" });
  }
  const c = db.prepare("SELECT id FROM clients WHERE id = ?").get(clientId);
  if (!c) return res.status(400).json({ error: "Cliente inválido" });

  const info = db
    .prepare(
      `INSERT INTO subscriptions (client_id, valor_mensal, ativo, start_date, end_date, updated_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))`
    )
    .run(
      clientId,
      Number(valorMensal),
      ativo === false || ativo === 0 ? 0 : 1,
      startDate,
      endDate ?? null
    );
  const row = db
    .prepare(
      `SELECT s.*, c.nome AS client_nome FROM subscriptions s
       JOIN clients c ON c.id = s.client_id WHERE s.id = ?`
    )
    .get(info.lastInsertRowid);
  res.status(201).json(row);
});

router.get("/:id", (req, res) => {
  const row = db
    .prepare(
      `SELECT s.*, c.nome AS client_nome FROM subscriptions s
       JOIN clients c ON c.id = s.client_id WHERE s.id = ?`
    )
    .get(req.params.id);
  if (!row) return res.status(404).json({ error: "Assinatura não encontrada" });
  res.json(row);
});

router.put("/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM subscriptions WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Assinatura não encontrada" });

  const { valorMensal, ativo, startDate, endDate } = req.body || {};
  const nextEnd =
    endDate !== undefined ? (endDate === "" || endDate == null ? null : endDate) : existing.end_date;
  db.prepare(
    `UPDATE subscriptions SET
      valor_mensal = COALESCE(?, valor_mensal),
      ativo = COALESCE(?, ativo),
      start_date = COALESCE(?, start_date),
      end_date = ?,
      updated_at = datetime('now')
     WHERE id = ?`
  ).run(
    valorMensal != null ? Number(valorMensal) : null,
    ativo === undefined ? null : ativo === false || ativo === 0 ? 0 : 1,
    startDate && String(startDate).trim() ? startDate : null,
    nextEnd,
    req.params.id
  );

  const row = db
    .prepare(
      `SELECT s.*, c.nome AS client_nome FROM subscriptions s
       JOIN clients c ON c.id = s.client_id WHERE s.id = ?`
    )
    .get(req.params.id);
  res.json(row);
});

router.delete("/:id", (req, res) => {
  const info = db.prepare("DELETE FROM subscriptions WHERE id = ?").run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: "Assinatura não encontrada" });
  res.status(204).send();
});

export default router;
