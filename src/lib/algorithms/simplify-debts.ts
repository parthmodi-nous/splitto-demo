export interface DebtTransaction {
  from: string; // userId
  to: string; // userId
  amount: number;
  currency: string;
}

export interface RawDebt {
  from: string;
  to: string;
  amount: number;
  currency: string;
}

/**
 * Given a list of (userId → net balance) pairs, compute the minimum number of
 * transactions needed to settle all debts using a greedy algorithm.
 *
 * Positive balance = this person is owed money (creditor)
 * Negative balance = this person owes money (debtor)
 */
export function simplifyDebts(
  balances: Record<string, number>,
  currency: string
): DebtTransaction[] {
  const creditors: Array<{ id: string; amount: number }> = [];
  const debtors: Array<{ id: string; amount: number }> = [];

  for (const [userId, balance] of Object.entries(balances)) {
    const rounded = Math.round(balance * 100) / 100;
    if (rounded > 0.009) {
      creditors.push({ id: userId, amount: rounded });
    } else if (rounded < -0.009) {
      debtors.push({ id: userId, amount: rounded });
    }
  }

  // Sort creditors descending, debtors ascending (most negative first)
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => a.amount - b.amount);

  const transactions: DebtTransaction[] = [];

  let ci = 0;
  let di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const creditor = creditors[ci];
    const debtor = debtors[di];

    const amount = Math.min(creditor.amount, Math.abs(debtor.amount));
    const rounded = Math.round(amount * 100) / 100;

    if (rounded > 0.009) {
      transactions.push({
        from: debtor.id,
        to: creditor.id,
        amount: rounded,
        currency,
      });
    }

    creditor.amount -= amount;
    debtor.amount += amount;

    if (Math.abs(creditor.amount) < 0.01) ci++;
    if (Math.abs(debtor.amount) < 0.01) di++;
  }

  return transactions;
}

/**
 * Calculate net balances for each member in a group from expenses and settlements.
 * Returns a map of userId → net balance (positive = owed to them, negative = they owe)
 */
export function calculateNetBalances(
  expenses: Array<{
    paidBy: string;
    amount: string;
    currency: string;
    splits: Array<{ userId: string; amount: string }>;
  }>,
  settlements: Array<{
    paidBy: string;
    paidTo: string;
    amount: string;
  }>,
  groupCurrency: string,
  convertFn: (amount: number, from: string, to: string) => number
): Record<string, number> {
  const balances: Record<string, number> = {};

  const add = (userId: string, amount: number) => {
    balances[userId] = (balances[userId] ?? 0) + amount;
  };

  // Process expenses
  for (const expense of expenses) {
    const amountInGroupCurrency = convertFn(
      parseFloat(expense.amount),
      expense.currency,
      groupCurrency
    );

    // Person who paid gets credit
    add(expense.paidBy, amountInGroupCurrency);

    // Each person who owes gets debited
    for (const split of expense.splits) {
      const splitAmountInGroupCurrency = convertFn(
        parseFloat(split.amount),
        expense.currency,
        groupCurrency
      );
      add(split.userId, -splitAmountInGroupCurrency);
    }
  }

  // Process settlements: paidBy paid paidTo, so paidBy's debt decreases
  for (const settlement of settlements) {
    const amount = parseFloat(settlement.amount);
    add(settlement.paidBy, amount);
    add(settlement.paidTo, -amount);
  }

  return balances;
}
