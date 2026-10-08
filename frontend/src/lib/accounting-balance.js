export const balanceColumns = ["debit", "credit", "debtor", "creditor", "asset", "liability", "loss", "profit"];

export function buildBalance(entries, accounts) {
  const catalog = new Map(accounts.map((account) => [account.code, account]));
  const movements = new Map();
  const cents = (value) => {
    const amount = Math.round(Number(value) * 100);
    if (!Number.isSafeInteger(amount) || amount < 0) throw new Error("El asiento contiene un importe no válido.");
    return amount;
  };
  for (const entry of entries) for (const line of entry.lines) {
    const account = catalog.get(line.account);
    if (!account) throw new Error(`La cuenta ${line.account} no está en el plan contable.`);
    const row = movements.get(line.account) || { code: account.code, name: account.name, type: account.type, debit: 0, credit: 0 };
    row.debit += cents(line.debit);
    row.credit += cents(line.credit);
    movements.set(line.account, row);
  }
  const rows = [...movements.values()].sort((a, b) => a.code.localeCompare(b.code, "es", { numeric: true })).map((row) => {
    const type = row.type.toLowerCase().trim();
    const debtor = Math.max(row.debit - row.credit, 0);
    const creditor = Math.max(row.credit - row.debit, 0);
    const inventory = ["activo", "pasivo", "patrimonio"].includes(type);
    if (!inventory && !["ingreso", "gasto", "costo", "egreso"].includes(type)) {
      throw new Error(`La cuenta ${row.code} necesita una clasificación contable válida.`);
    }
    return { ...row, debtor, creditor, asset: inventory ? debtor : 0, liability: inventory ? creditor : 0,
      loss: inventory ? 0 : debtor, profit: inventory ? 0 : creditor };
  });
  const sums = Object.fromEntries(balanceColumns.map((key) => [key, rows.reduce((sum, row) => sum + row[key], 0)]));
  const result = sums.profit - sums.loss;
  const closing = Object.fromEntries(balanceColumns.map((key) => [key, 0]));
  if (result > 0) { closing.liability = result; closing.loss = result; }
  if (result < 0) { closing.asset = -result; closing.profit = -result; }
  const grandTotals = Object.fromEntries(balanceColumns.map((key) => [key, sums[key] + closing[key]]));
  const moneyValues = (row) => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, balanceColumns.includes(key) ? value / 100 : value]));
  return { rows: rows.map(moneyValues), sums: moneyValues(sums), closing: moneyValues(closing),
    grandTotals: moneyValues(grandTotals), result: result / 100, difference: (sums.debit - sums.credit) / 100 };
}
