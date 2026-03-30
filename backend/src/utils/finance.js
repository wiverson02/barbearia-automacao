import { compareComp, currentCompetencia, listMonthsInclusive } from "./months.js";

/**
 * @param {object} sub { id, valor_mensal, ativo, start_date, end_date }
 * @param {Array<{competencia: string, status: string}>} paidRows competências com pagamento pago
 */
export function buildSubscriptionFinance(sub, paidRows) {
  const nowComp = currentCompetencia();
  const start = sub.start_date.slice(0, 7);
  const endRaw = sub.end_date ? sub.end_date.slice(0, 7) : nowComp;
  const end = compareComp(endRaw, nowComp) > 0 ? nowComp : endRaw;
  if (compareComp(end, start) < 0) {
    return { subscription: sub, meses: [] };
  }

  const paidSet = new Set(
    paidRows.filter((r) => r.status === "paid").map((r) => r.competencia)
  );

  const meses = listMonthsInclusive(start, end).map((comp) => {
    const pago = paidSet.has(comp);
    let situacao = "pendente";
    if (pago) situacao = "pago";
    else if (compareComp(comp, nowComp) < 0) situacao = "atrasado";
    return {
      competencia: comp,
      valorEsperado: sub.valor_mensal,
      situacao,
    };
  });

  return { subscription: sub, meses };
}
