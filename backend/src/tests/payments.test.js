import { describe, it, beforeAll, afterAll, afterEach } from "vitest";
import request from "supertest";
import app from "../app.js";
import { db } from "../db.js";

// IDs created during tests — cleaned up in afterAll
const created = { clientIds: [], paymentIds: [] };

describe("GET /api/payments", () => {
  it("deve retornar status 200", async () => {
    const res = await request(app).get("/api/payments");
    expect(res.status).toBe(200);
  });

  it("deve retornar um array", async () => {
    const res = await request(app).get("/api/payments");
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe("POST /api/payments", () => {
  let clientId;

  beforeAll(async () => {
    // Criar cliente temporário para usar nos testes
    const res = await request(app)
      .post("/api/clients")
      .send({ nome: "Cliente Teste Pagamentos", telefone: "11999990001" });
    clientId = res.body.id;
    created.clientIds.push(clientId);
  });

  it("cria pagamento com dados válidos — status 201 e id retornado", async () => {
    const res = await request(app)
      .post("/api/payments")
      .send({ clientId, competencia: "2026-03", amount: 5000 });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.competencia).toBe("2026-03");
    expect(res.body.amount).toBe(5000);

    created.paymentIds.push(res.body.id);
  });

  it("retorna 400 quando body está vazio", async () => {
    const res = await request(app).post("/api/payments").send({});
    expect(res.status).toBe(400);
  });

  it("retorna 400 quando clientId está ausente", async () => {
    const res = await request(app)
      .post("/api/payments")
      .send({ competencia: "2026-03", amount: 5000 });
    expect(res.status).toBe(400);
  });

  it("retorna 400 quando competencia está ausente", async () => {
    const res = await request(app)
      .post("/api/payments")
      .send({ clientId, amount: 5000 });
    expect(res.status).toBe(400);
  });

  it("retorna 400 quando amount está ausente", async () => {
    const res = await request(app)
      .post("/api/payments")
      .send({ clientId, competencia: "2026-03" });
    expect(res.status).toBe(400);
  });

  it("retorna 400 para clientId de cliente inexistente", async () => {
    const res = await request(app)
      .post("/api/payments")
      .send({ clientId: 999999, competencia: "2026-03", amount: 5000 });
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/payments/:id", () => {
  let clientId;
  let paymentId;

  beforeAll(async () => {
    const cRes = await request(app)
      .post("/api/clients")
      .send({ nome: "Cliente Teste Delete", telefone: "11999990002" });
    clientId = cRes.body.id;
    created.clientIds.push(clientId);

    const pRes = await request(app)
      .post("/api/payments")
      .send({ clientId, competencia: "2026-03", amount: 3000 });
    paymentId = pRes.body.id;
    // Não adicionar em created.paymentIds — este será deletado pelo teste
  });

  it("deleta o pagamento — status 204", async () => {
    const res = await request(app).delete(`/api/payments/${paymentId}`);
    expect([200, 204]).toContain(res.status);
  });

  it("pagamento deletado não aparece mais no GET", async () => {
    const res = await request(app).get("/api/payments");
    const ids = res.body.map((p) => p.id);
    expect(ids).not.toContain(paymentId);
  });

  it("retorna 404 ao tentar deletar pagamento inexistente", async () => {
    const res = await request(app).delete("/api/payments/999999");
    expect(res.status).toBe(404);
  });
});

afterAll(() => {
  // Limpar pagamentos criados
  for (const id of created.paymentIds) {
    db.prepare("DELETE FROM payments WHERE id = ?").run(id);
  }
  // Limpar clientes criados (CASCADE deletará pagamentos vinculados)
  for (const id of created.clientIds) {
    db.prepare("DELETE FROM clients WHERE id = ?").run(id);
  }
});
