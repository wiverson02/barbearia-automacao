import { Router } from "express";
import { db } from "../db.js";

const router = Router();

router.get("/", (req, res) => {
  const { clientId, from, to } = req.query;
  let sql = `
    SELECT a.*, c.nome AS client_nome
    FROM appointments a
    JOIN clients c ON c.id = a.client_id
    WHERE 1=1
  `;
  const params = [];
  if (clientId) {
    sql += " AND a.client_id = ?";
    params.push(clientId);
  }
  if (from) {
    sql += " AND a.data_hora >= ?";
    params.push(from);
  }
  if (to) {
    sql += " AND a.data_hora <= ?";
    params.push(to);
  }
  sql += " ORDER BY a.data_hora";
  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

router.post("/", (req, res) => {
  const { clientId, dataHora, servico, observacoes, duracaoMinutos, status } =
    req.body || {};
  if (!clientId || !dataHora) {
    return res.status(400).json({ error: "clientId e dataHora são obrigatórios" });
  }
  const c = db.prepare("SELECT id FROM clients WHERE id = ?").get(clientId);
  if (!c) return res.status(400).json({ error: "Cliente inválido" });

  const info = db
    .prepare(
      `INSERT INTO appointments (client_id, data_hora, servico, observacoes, duracao_minutos, status)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(
      clientId,
      dataHora,
      servico ?? null,
      observacoes ?? null,
      duracaoMinutos != null ? Number(duracaoMinutos) : null,
      status && String(status).trim() ? String(status).trim() : "agendado"
    );
  const row = db
    .prepare(
      `SELECT a.*, c.nome AS client_nome FROM appointments a
       JOIN clients c ON c.id = a.client_id WHERE a.id = ?`
    )
    .get(info.lastInsertRowid);
  res.status(201).json(row);
});

router.get("/:id", (req, res) => {
  const row = db
    .prepare(
      `SELECT a.*, c.nome AS client_nome FROM appointments a
       JOIN clients c ON c.id = a.client_id WHERE a.id = ?`
    )
    .get(req.params.id);
  if (!row) return res.status(404).json({ error: "Agendamento não encontrado" });
  res.json(row);
});

router.put("/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM appointments WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Agendamento não encontrado" });

  const { clientId, dataHora, servico, observacoes, duracaoMinutos, status } =
    req.body || {};
  const nextClientId = clientId !== undefined ? clientId : existing.client_id;
  if (nextClientId != null) {
    const c = db.prepare("SELECT id FROM clients WHERE id = ?").get(nextClientId);
    if (!c) return res.status(400).json({ error: "Cliente inválido" });
  }

  db.prepare(
    `UPDATE appointments SET
      client_id = ?,
      data_hora = ?,
      servico = ?,
      observacoes = ?,
      duracao_minutos = ?,
      status = ?
     WHERE id = ?`
  ).run(
    nextClientId,
    dataHora !== undefined ? dataHora : existing.data_hora,
    servico !== undefined ? servico : existing.servico,
    observacoes !== undefined ? observacoes : existing.observacoes,
    duracaoMinutos !== undefined
      ? duracaoMinutos != null
        ? Number(duracaoMinutos)
        : null
      : existing.duracao_minutos,
    status !== undefined
      ? String(status).trim() || existing.status
      : existing.status,
    req.params.id
  );

  const row = db
    .prepare(
      `SELECT a.*, c.nome AS client_nome FROM appointments a
       JOIN clients c ON c.id = a.client_id WHERE a.id = ?`
    )
    .get(req.params.id);
  res.json(row);
});

router.delete("/:id", (req, res) => {
  const info = db.prepare("DELETE FROM appointments WHERE id = ?").run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: "Agendamento não encontrado" });
  res.status(204).send();
});

export default router;
