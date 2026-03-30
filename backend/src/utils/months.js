/** @param {string} yyyymm "YYYY-MM" */
export function parseComp(yyyymm) {
  const [y, m] = yyyymm.split("-").map(Number);
  return { y, m };
}

/** @param {string} a "YYYY-MM" @param {string} b "YYYY-MM" */
export function compareComp(a, b) {
  const A = parseComp(a);
  const B = parseComp(b);
  if (A.y !== B.y) return A.y - B.y;
  return A.m - B.m;
}

/** @param {string} start "YYYY-MM" @param {string} end "YYYY-MM" inclusive */
export function listMonthsInclusive(start, end) {
  const out = [];
  let { y, m } = parseComp(start);
  const endP = parseComp(end);
  while (y < endP.y || (y === endP.y && m <= endP.m)) {
    out.push(`${y.toString().padStart(4, "0")}-${m.toString().padStart(2, "0")}`);
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return out;
}

/** Hoje como "YYYY-MM" (local) */
export function currentCompetencia() {
  const d = new Date();
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  return `${y}-${String(m).padStart(2, "0")}`;
}
