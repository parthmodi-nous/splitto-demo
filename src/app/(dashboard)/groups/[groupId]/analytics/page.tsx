import { notFound } from 'next/navigation';
import { getGroupExpenses } from '@/actions/expenses';
import { getGroupWithMembers } from '@/actions/groups';
import { getGroupBalances } from '@/actions/settlements';
import { PageHeader } from '@/components/shared/page-header';
import { AnalyticsCharts } from '@/components/charts/charts-client';
import { convertCurrency } from '@/lib/currencies';
import type { ExpenseWithDetails } from '@/types';

interface AnalyticsPageProps {
  params: Promise<{ groupId: string }>;
}


function computeSpendingByDate(
  expenses: ExpenseWithDetails[],
  groupCurrency: string
): Array<{ date: string; amount: number }> {
  const map = new Map<string, number>();
  for (const expense of expenses) {
    if (expense.isSettlement) continue;
    const amount = convertCurrency(
      parseFloat(expense.amount),
      expense.currency,
      groupCurrency
    );
    const existing = map.get(expense.date) ?? 0;
    map.set(expense.date, existing + amount);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, amount]) => ({ date, amount }));
}

function computeCategoryBreakdown(
  expenses: ExpenseWithDetails[],
  groupCurrency: string
): Array<{ category: string; amount: number; percentage: number }> {
  const map = new Map<string, number>();
  let total = 0;
  for (const expense of expenses) {
    if (expense.isSettlement) continue;
    const amount = convertCurrency(
      parseFloat(expense.amount),
      expense.currency,
      groupCurrency
    );
    map.set(expense.category, (map.get(expense.category) ?? 0) + amount);
    total += amount;
  }
  return Array.from(map.entries())
    .sort(([, a], [, b]) => b - a)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: total > 0 ? (amount / total) * 100 : 0,
    }));
}

function computeBalanceTrend(
  expenses: ExpenseWithDetails[],
  memberIds: string[],
  groupCurrency: string
): Array<{ date: string; [userId: string]: number | string }> {
  // Sort expenses ascending by date
  const sorted = [...expenses]
    .filter((e) => !e.isSettlement)
    .sort((a, b) => a.date.localeCompare(b.date));

  const running: Record<string, number> = {};
  for (const id of memberIds) {
    running[id] = 0;
  }

  const result: Array<{ date: string; [userId: string]: number | string }> = [];
  const datesSeen = new Set<string>();

  for (const expense of sorted) {
    const paidAmount = convertCurrency(
      parseFloat(expense.amount),
      expense.currency,
      groupCurrency
    );

    if (memberIds.includes(expense.paidBy)) {
      running[expense.paidBy] = (running[expense.paidBy] ?? 0) + paidAmount;
    }

    for (const split of expense.splits) {
      if (memberIds.includes(split.userId)) {
        const splitAmount = convertCurrency(
          parseFloat(split.amount),
          expense.currency,
          groupCurrency
        );
        running[split.userId] = (running[split.userId] ?? 0) - splitAmount;
      }
    }

    // Accumulate same-date entries, emit on date change
    if (!datesSeen.has(expense.date)) {
      datesSeen.add(expense.date);
      const point: { date: string; [userId: string]: number | string } = {
        date: expense.date,
      };
      for (const id of memberIds) {
        point[id] = Math.round((running[id] ?? 0) * 100) / 100;
      }
      result.push(point);
    } else {
      // Update the last point for this date
      const last = result[result.length - 1];
      if (last && last['date'] === expense.date) {
        for (const id of memberIds) {
          last[id] = Math.round((running[id] ?? 0) * 100) / 100;
        }
      }
    }
  }

  return result;
}

export default async function AnalyticsPage({ params }: AnalyticsPageProps) {
  const { groupId } = await params;

  const [expensesResult, groupResult, balancesResult] = await Promise.all([
    getGroupExpenses(groupId, { limit: 500 }),
    getGroupWithMembers(groupId),
    getGroupBalances(groupId),
  ]);

  if (!groupResult.success) {
    notFound();
  }

  const group = groupResult.data;
  const currency = group.defaultCurrency;
  const expenses = expensesResult.success ? expensesResult.data.expenses : [];
  const balances = balancesResult.success ? balancesResult.data : [];
  const members = group.members.map((m) => m.user);
  const memberIds = members.map((m) => m.id);

  const spendingData = computeSpendingByDate(expenses, currency);
  const categoryData = computeCategoryBreakdown(expenses, currency);
  const memberComparisonData = balances.map((b) => ({
    user: b.user,
    totalPaid: b.totalPaid,
    totalOwed: b.totalOwed,
  }));
  const balanceTrendData = computeBalanceTrend(expenses, memberIds, currency);

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto w-full space-y-6">
      <PageHeader
        title="Analytics"
        description="Spending insights and balance history for this group"
        breadcrumbs={[
          { label: 'Groups', href: '/groups' },
          { label: group.name, href: `/groups/${groupId}` },
          { label: 'Analytics' },
        ]}
      />

      <AnalyticsCharts
        spendingData={spendingData}
        categoryData={categoryData}
        memberComparisonData={memberComparisonData}
        balanceTrendData={balanceTrendData}
        members={members}
        currency={currency}
      />
    </div>
  );
}
