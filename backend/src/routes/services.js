// backend/src/routes/services.js
import { Router } from "express";
import { db } from "../db.js";

const router = Router();

router.get("/", (_req, res) => {
  const rows = db.prepare("SELECT * FROM services WHERE ativo = 1 ORDER BY nome").all();
  res.json(rows);
});

router.get("/all", (_req, res) => {
  const rows = db.prepare("SELECT * FROM services ORDER BY nome").all();
  res.json(rows);
});

router.get("/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM services WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "Serviço não encontrado" });
  res.json(row);
});

router.post("/", (req, res) => {
  const { nome, preco, duracao_minutos } = req.body || {};
  if (!nome || !String(nome).trim()) {
    return res.status(400).json({ error: "Nome é obrigatório" });
  }
  const info = db
    .prepare("INSERT INTO services (nome, preco, duracao_minutos) VALUES (?, ?, ?)")
    .run(String(nome).trim(), Number(preco) || 0, Number(duracao_minutos) || 30);
  const row = db.prepare("SELECT * FROM services WHERE id = ?").get(info.lastInsertRowid);
  res.status(201).json(row);
});

router.put("/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM services WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Serviço não encontrado" });
  const { nome, preco, duracao_minutos } = req.body || {};
  if (nome !== undefined && !String(nome).trim()) {
    return res.status(400).json({ error: "Nome não pode ser vazio" });
  }
  db.prepare("UPDATE services SET nome = ?, preco = ?, duracao_minutos = ? WHERE id = ?").run(
    nome !== undefined ? String(nome).trim() : existing.nome,
    preco !== undefined ? Number(preco) : existing.preco,
    duracao_minutos !== undefined ? Number(duracao_minutos) : existing.duracao_minutos,
    req.params.id
  );
  res.json(db.prepare("SELECT * FROM services WHERE id = ?").get(req.params.id));
});

router.patch("/:id/toggle", (req, res) => {
  const existing = db.prepare("SELECT * FROM services WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Serviço não encontrado" });
  const newAtivo = existing.ativo ? 0 : 1;
  db.prepare("UPDATE services SET ativo = ? WHERE id = ?").run(newAtivo, req.params.id);
  res.json(db.prepare("SELECT * FROM services WHERE id = ?").get(req.params.id));
});

export default router;
