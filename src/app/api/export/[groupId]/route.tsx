import React from 'react';
import { renderToBuffer, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { getGroupExpenses } from '@/actions/expenses';
import { getGroupWithMembers } from '@/actions/groups';
import { getGroupBalances, getSimplifiedDebts } from '@/actions/settlements';
import { formatCurrency } from '@/lib/currencies';
import { formatDate } from '@/lib/utils';
import type { NextRequest } from 'next/server';
import type { ExpenseWithDetails, MemberBalance } from '@/types';
import type { User } from '@/lib/db/schema';

interface DebtRow {
  fromUser: User;
  toUser: User;
  amount: number;
  currency: string;
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1a1a1a',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    marginBottom: 8,
    marginTop: 20,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    borderBottomStyle: 'solid',
  },
  table: {
    width: '100%',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    borderBottomStyle: 'solid',
    paddingVertical: 6,
  },
  tableHeader: {
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    borderBottomStyle: 'solid',
  },
  tableHeaderCell: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  cell: {
    fontSize: 10,
    color: '#374151',
    paddingRight: 8,
  },
  cellName: { flex: 2 },
  cellAmount: { flex: 1, textAlign: 'right' },
  cellDate: { flex: 1 },
  cellDesc: { flex: 3 },
  cellPaidBy: { flex: 1.5 },
  cellCategory: { flex: 1 },
  cellSplit: { flex: 1 },
  positive: { color: '#059669' },
  negative: { color: '#dc2626' },
  neutral: { color: '#6b7280' },
  debtRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    borderBottomStyle: 'solid',
  },
});

interface GroupInfo {
  name: string;
  defaultCurrency: string;
  simplifyDebts: boolean;
}

function buildDocument(
  group: GroupInfo,
  expenses: ExpenseWithDetails[],
  balances: MemberBalance[],
  debts: DebtRow[],
  generatedAt: string
) {
  const nonSettlement = expenses.filter((e) => !e.isSettlement);
  const dates = nonSettlement.map((e) => e.date).sort();
  const dateRange =
    dates.length > 0
      ? `${formatDate(dates[0] ?? '')} – ${formatDate(dates[dates.length - 1] ?? '')}`
      : 'No expenses';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{group.name}</Text>
          <Text style={styles.subtitle}>Period: {dateRange}</Text>
          <Text style={styles.subtitle}>Generated: {generatedAt}</Text>
          <Text style={styles.subtitle}>Currency: {group.defaultCurrency}</Text>
        </View>

        {/* Members table */}
        <Text style={styles.sectionTitle}>Members Summary</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableHeaderCell, styles.cellName]}>Name</Text>
            <Text style={[styles.tableHeaderCell, styles.cellAmount]}>Total Paid</Text>
            <Text style={[styles.tableHeaderCell, styles.cellAmount]}>Total Owed</Text>
            <Text style={[styles.tableHeaderCell, styles.cellAmount]}>Net Balance</Text>
          </View>
          {balances.map((b) => (
            <View key={b.user.id} style={styles.tableRow}>
              <Text style={[styles.cell, styles.cellName]}>{b.user.name}</Text>
              <Text style={[styles.cell, styles.cellAmount]}>
                {formatCurrency(b.totalPaid, b.currency)}
              </Text>
              <Text style={[styles.cell, styles.cellAmount]}>
                {formatCurrency(b.totalOwed, b.currency)}
              </Text>
              <Text
                style={[
                  styles.cell,
                  styles.cellAmount,
                  b.netBalance > 0
                    ? styles.positive
                    : b.netBalance < 0
                      ? styles.negative
                      : styles.neutral,
                ]}
              >
                {b.netBalance > 0
                  ? `+${formatCurrency(b.netBalance, b.currency)}`
                  : formatCurrency(b.netBalance, b.currency)}
              </Text>
            </View>
          ))}
        </View>

        {/* Expenses table */}
        <Text style={styles.sectionTitle}>Expenses</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableHeaderCell, styles.cellDate]}>Date</Text>
            <Text style={[styles.tableHeaderCell, styles.cellDesc]}>Description</Text>
            <Text style={[styles.tableHeaderCell, styles.cellPaidBy]}>Paid By</Text>
            <Text style={[styles.tableHeaderCell, styles.cellAmount]}>Amount</Text>
            <Text style={[styles.tableHeaderCell, styles.cellCategory]}>Category</Text>
            <Text style={[styles.tableHeaderCell, styles.cellSplit]}>Split</Text>
          </View>
          {nonSettlement.map((expense) => (
            <View key={expense.id} style={styles.tableRow}>
              <Text style={[styles.cell, styles.cellDate]}>{formatDate(expense.date)}</Text>
              <Text style={[styles.cell, styles.cellDesc]}>{expense.description}</Text>
              <Text style={[styles.cell, styles.cellPaidBy]}>{expense.paidByUser.name}</Text>
              <Text style={[styles.cell, styles.cellAmount]}>
                {formatCurrency(parseFloat(expense.amount), expense.currency)}
              </Text>
              <Text style={[styles.cell, styles.cellCategory]}>{expense.category}</Text>
              <Text style={[styles.cell, styles.cellSplit]}>{expense.splitType}</Text>
            </View>
          ))}
          {nonSettlement.length === 0 && (
            <View style={styles.tableRow}>
              <Text style={[styles.cell, { color: '#9ca3af' }]}>No expenses recorded.</Text>
            </View>
          )}
        </View>

        {/* Settlement plan */}
        {group.simplifyDebts && debts.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Settlement Plan</Text>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={[styles.tableHeaderCell, { flex: 2 }]}>From</Text>
                <Text style={[styles.tableHeaderCell, { flex: 2 }]}>To</Text>
                <Text style={[styles.tableHeaderCell, styles.cellAmount]}>Amount</Text>
              </View>
              {debts.map((debt, i) => (
                <View key={i} style={styles.debtRow}>
                  <Text style={[styles.cell, { flex: 2 }]}>{debt.fromUser.name}</Text>
                  <Text style={[styles.cell, { flex: 2 }]}>{debt.toUser.name}</Text>
                  <Text style={[styles.cell, styles.cellAmount]}>
                    {formatCurrency(debt.amount, debt.currency)}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}
      </Page>
    </Document>
  );
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const { groupId } = await params;

  const [expensesResult, groupResult, balancesResult, debtsResult] = await Promise.all([
    getGroupExpenses(groupId, { limit: 1000 }),
    getGroupWithMembers(groupId),
    getGroupBalances(groupId),
    getSimplifiedDebts(groupId),
  ]);

  if (!groupResult.success) {
    return new Response('Group not found or access denied', { status: 404 });
  }

  const group = groupResult.data;
  const expenses = expensesResult.success ? expensesResult.data.expenses : [];
  const balances = balancesResult.success ? balancesResult.data : [];
  const debts: DebtRow[] = debtsResult.success ? debtsResult.data : [];

  const generatedAt = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const doc = buildDocument(group, expenses, balances, debts, generatedAt);
  const nodeBuffer = await renderToBuffer(doc);
  const buffer = new Uint8Array(nodeBuffer);

  const safeName = group.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const filename = `${safeName}-expenses.pdf`;

  return new Response(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
