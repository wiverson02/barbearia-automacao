// backend/src/routes/public.js
import { Router } from "express";
import { db } from "../db.js";

const router = Router();

// GET /api/public/services
router.get("/services", (_req, res) => {
  const rows = db.prepare("SELECT * FROM services WHERE ativo = 1 ORDER BY nome").all();
  res.json(rows);
});

// POST /api/public/identify
router.post("/identify", (req, res) => {
  const { telefone } = req.body || {};
  if (!telefone || !String(telefone).trim()) {
    return res.status(400).json({ error: "Telefone é obrigatório" });
  }
  const client = db
    .prepare("SELECT id, nome, telefone FROM clients WHERE telefone = ?")
    .get(String(telefone).trim());
  if (client) {
    res.json({ found: true, client });
  } else {
    res.json({ found: false });
  }
});

// POST /api/public/clients
router.post("/clients", (req, res) => {
  const { nome, telefone } = req.body || {};
  if (!nome || !String(nome).trim()) {
    return res.status(400).json({ error: "Nome é obrigatório" });
  }
  if (!telefone || !String(telefone).trim()) {
    return res.status(400).json({ error: "Telefone é obrigatório" });
  }
  const existing = db
    .prepare("SELECT id FROM clients WHERE telefone = ?")
    .get(String(telefone).trim());
  if (existing) {
    return res.status(400).json({ error: "Telefone já cadastrado" });
  }
  const info = db
    .prepare("INSERT INTO clients (nome, telefone) VALUES (?, ?)")
    .run(String(nome).trim(), String(telefone).trim());
  const client = db
    .prepare("SELECT id, nome, telefone FROM clients WHERE id = ?")
    .get(info.lastInsertRowid);
  res.status(201).json(client);
});

// GET /api/public/slots?date=YYYY-MM-DD&serviceId=N
router.get("/slots", (req, res) => {
  const { date, serviceId } = req.query;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: "date inválido (use YYYY-MM-DD)" });
  }

  const service = serviceId
    ? db.prepare("SELECT duracao_minutos FROM services WHERE id = ?").get(serviceId)
    : null;
  const duracaoServico = service ? service.duracao_minutos : 30;

  // Todos os agendamentos do dia com status agendado
  const agendados = db
    .prepare(
      `SELECT data_hora, duracao_minutos FROM appointments
       WHERE data_hora >= ? AND data_hora < ? AND status = 'agendado'`
    )
    .all(`${date}T00:00:00`, `${date}T23:59:59`);

  // Gerar slots de 09:00 a 19:00 de 30 em 30 min
  const slots = [];
  for (let h = 9; h < 19; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hh = String(h).padStart(2, "0");
      const mm = String(m).padStart(2, "0");
      slots.push(`${hh}:${mm}`);
    }
  }

  // Filtrar slots ocupados considerando duração
  const available = slots.filter((slot) => {
    const [sh, sm] = slot.split(":").map(Number);
    const slotStart = sh * 60 + sm;
    const slotEnd = slotStart + duracaoServico;

    // Não cabe antes de 19:00
    if (slotEnd > 19 * 60) return false;

    // Verificar conflito com cada agendamento existente
    for (const ag of agendados) {
      const agTime = ag.data_hora.slice(11, 16); // "HH:MM"
      const [ah, am] = agTime.split(":").map(Number);
      const agStart = ah * 60 + am;
      const agEnd = agStart + (ag.duracao_minutos || 30);

      // Conflito se os intervalos se sobrepõem
      if (slotStart < agEnd && slotEnd > agStart) return false;
    }
    return true;
  });

  res.json(available);
});

// POST /api/public/appointments
router.post("/appointments", (req, res) => {
  const { clientId, serviceId, date, time } = req.body || {};
  if (!clientId || !serviceId || !date || !time) {
    return res.status(400).json({ error: "clientId, serviceId, date e time são obrigatórios" });
  }

  const client = db.prepare("SELECT id, nome FROM clients WHERE id = ?").get(clientId);
  if (!client) return res.status(400).json({ error: "Cliente inválido" });

  const service = db.prepare("SELECT * FROM services WHERE id = ? AND ativo = 1").get(serviceId);
  if (!service) return res.status(400).json({ error: "Serviço inválido ou inativo" });

  const dataHora = `${date}T${time}:00`;

  // Re-checagem de disponibilidade
  const [sh, sm] = time.split(":").map(Number);
  const slotStart = sh * 60 + sm;
  const slotEnd = slotStart + service.duracao_minutos;

  const agendados = db
    .prepare(
      `SELECT data_hora, duracao_minutos FROM appointments
       WHERE data_hora >= ? AND data_hora < ? AND status = 'agendado'`
    )
    .all(`${date}T00:00:00`, `${date}T23:59:59`);

  for (const ag of agendados) {
    const agTime = ag.data_hora.slice(11, 16);
    const [ah, am] = agTime.split(":").map(Number);
    const agStart = ah * 60 + am;
    const agEnd = agStart + (ag.duracao_minutos || 30);
    if (slotStart < agEnd && slotEnd > agStart) {
      return res.status(409).json({ error: "Horário não está mais disponível" });
    }
  }

  const info = db
    .prepare(
      `INSERT INTO appointments (client_id, data_hora, servico, duracao_minutos, status)
       VALUES (?, ?, ?, ?, 'agendado')`
    )
    .run(clientId, dataHora, service.nome, service.duracao_minutos);

  res.status(201).json({
    id: info.lastInsertRowid,
    dataHora,
    servico: service.nome,
    clientNome: client.nome,
  });
});

export default router;
