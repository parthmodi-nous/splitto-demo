import { simplifyDebts, type DebtTransaction } from './simplify-debts';

export { simplifyDebts };
export type { DebtTransaction };

/**
 * Computes minimum payment plan given raw pairwise debts.
 * Aggregates into net balances first, then simplifies.
 */
export function computeMinimumPayments(
  rawDebts: Array<{ from: string; to: string; amount: number }>,
  currency: string
): DebtTransaction[] {
  const balances: Record<string, number> = {};

  for (const debt of rawDebts) {
    balances[debt.from] = (balances[debt.from] ?? 0) - debt.amount;
    balances[debt.to] = (balances[debt.to] ?? 0) + debt.amount;
  }

  return simplifyDebts(balances, currency);
}
