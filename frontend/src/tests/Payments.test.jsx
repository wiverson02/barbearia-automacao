import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, it, vi } from "vitest";
import Payments from "../pages/Payments.jsx";

// Resposta padrão vazia para os três fetches do useEffect
function mockEmptyLoads() {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => [],
  });
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("Payments — renderização inicial", () => {
  beforeEach(() => mockEmptyLoads());

  it("renderiza o título 'Pagamentos'", async () => {
    render(<Payments />);
    expect(screen.getByText("Pagamentos")).toBeInTheDocument();
  });

  it("renderiza o subtítulo", async () => {
    render(<Payments />);
    expect(screen.getByText(/histórico de pagamentos pix/i)).toBeInTheDocument();
  });

  it("renderiza o botão '+ Registrar Pagamento'", async () => {
    render(<Payments />);
    expect(screen.getByText(/registrar pagamento/i)).toBeInTheDocument();
  });
});

describe("Payments — estado de loading", () => {
  it("exibe 'Carregando' enquanto o fetch não resolve", () => {
    // fetch nunca resolve — loading permanece true
    global.fetch = vi.fn().mockReturnValue(new Promise(() => {}));
    render(<Payments />);
    expect(screen.getByText(/carregando/i)).toBeInTheDocument();
  });
});

describe("Payments — formulário", () => {
  beforeEach(() => mockEmptyLoads());

  it("formulário não está visível antes de clicar no botão", async () => {
    render(<Payments />);
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(screen.queryByText("Cancelar")).not.toBeInTheDocument();
  });

  it("formulário aparece ao clicar em '+ Registrar Pagamento'", async () => {
    render(<Payments />);
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    const btn = screen.getByText(/registrar pagamento/i);
    await userEvent.click(btn);
    expect(screen.getByText("Cancelar")).toBeInTheDocument();
  });

  it("formulário fecha ao clicar em Cancelar", async () => {
    render(<Payments />);
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    await userEvent.click(screen.getByText(/registrar pagamento/i));
    expect(screen.getByText("Cancelar")).toBeInTheDocument();
    await userEvent.click(screen.getByText("Cancelar"));
    expect(screen.queryByText("Cancelar")).not.toBeInTheDocument();
  });
});

describe("Payments — lista de pagamentos", () => {
  it("exibe 'Nenhum pagamento' quando a lista está vazia", async () => {
    mockEmptyLoads();
    render(<Payments />);
    await waitFor(() => expect(screen.getByText(/nenhum pagamento/i)).toBeInTheDocument());
  });

  it("exibe dados do pagamento retornado pelo mock", async () => {
    const fakePagamento = {
      id: 1,
      client_nome: "João Silva",
      competencia: "2026-03",
      amount: 5000,
      status: "paid",
    };

    global.fetch = vi.fn().mockImplementation((url) => {
      if (url === "/api/payments") {
        return Promise.resolve({ ok: true, json: async () => [fakePagamento] });
      }
      return Promise.resolve({ ok: true, json: async () => [] });
    });

    render(<Payments />);

    await waitFor(() =>
      expect(screen.getByText("João Silva")).toBeInTheDocument()
    );
    expect(screen.getByText("2026-03")).toBeInTheDocument();
  });

  it("exibe badge PAGO para status 'paid'", async () => {
    const fakePagamento = {
      id: 2,
      client_nome: "Maria Teste",
      competencia: "2026-03",
      amount: 3000,
      status: "paid",
    };

    global.fetch = vi.fn().mockImplementation((url) => {
      if (url === "/api/payments") {
        return Promise.resolve({ ok: true, json: async () => [fakePagamento] });
      }
      return Promise.resolve({ ok: true, json: async () => [] });
    });

    render(<Payments />);
    await waitFor(() => expect(screen.getByText("PAGO")).toBeInTheDocument());
  });
});

describe("Payments — cards de resumo", () => {
  beforeEach(() => mockEmptyLoads());

  it("renderiza os três cards de resumo financeiro", async () => {
    render(<Payments />);
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(screen.getByText(/pendente/i)).toBeInTheDocument();
    expect(screen.getByText(/atrasado/i)).toBeInTheDocument();
  });
});
