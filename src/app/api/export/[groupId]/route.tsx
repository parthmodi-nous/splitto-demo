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

// ─── Palette ─────────────────────────────────────────────────────────────────
const C = {
  primary:       '#4f46e5',
  primaryLight:  '#eef2ff',
  primaryMid:    '#818cf8',
  positive:      '#059669',
  positiveLight: '#ecfdf5',
  negative:      '#dc2626',
  negativeLight: '#fef2f2',
  neutral:       '#64748b',
  neutralLight:  '#f8fafc',
  border:        '#e2e8f0',
  borderDark:    '#cbd5e1',
  textDark:      '#0f172a',
  textMid:       '#334155',
  textMuted:     '#64748b',
  white:         '#ffffff',
  rowAlt:        '#f8fafc',
};

interface DebtRow {
  fromUser: User;
  toUser: User;
  amount: number;
  currency: string;
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: C.textMid,
    backgroundColor: C.white,
  },

  // ── Top accent bar ──────────────────────────────────────────────────────────
  accentBar: {
    height: 5,
    backgroundColor: C.primary,
  },

  // ── Page body ───────────────────────────────────────────────────────────────
  body: {
    paddingHorizontal: 40,
    paddingTop: 28,
    paddingBottom: 40,
  },

  // ── Header block ────────────────────────────────────────────────────────────
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  appBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  appDot: {
    width: 20,
    height: 20,
    borderRadius: 5,
    backgroundColor: C.primary,
  },
  appName: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: C.primary,
    letterSpacing: 0.5,
  },
  metaBlock: {
    alignItems: 'flex-end',
  },
  metaText: {
    fontSize: 8,
    color: C.textMuted,
    marginBottom: 2,
  },

  // ── Group title ─────────────────────────────────────────────────────────────
  groupTitleBlock: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    borderBottomStyle: 'solid',
  },
  groupTitle: {
    fontSize: 26,
    fontFamily: 'Helvetica-Bold',
    color: C.textDark,
    marginBottom: 4,
  },
  groupSubtitle: {
    fontSize: 10,
    color: C.textMuted,
  },

  // ── Stat cards row ───────────────────────────────────────────────────────────
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: C.neutralLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    borderStyle: 'solid',
    padding: 12,
  },
  statLabel: {
    fontSize: 8,
    color: C.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: C.textDark,
  },
  statSub: {
    fontSize: 8,
    color: C.textMuted,
    marginTop: 2,
  },

  // ── Section header ───────────────────────────────────────────────────────────
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    marginTop: 24,
  },
  sectionAccent: {
    width: 3,
    height: 14,
    backgroundColor: C.primary,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: C.textDark,
  },

  // ── Table ────────────────────────────────────────────────────────────────────
  table: {
    width: '100%',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    borderStyle: 'solid',
    overflow: 'hidden',
  },
  tableHead: {
    flexDirection: 'row',
    backgroundColor: C.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  tableHeadCell: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    color: C.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingRight: 8,
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderTopWidth: 1,
    borderTopColor: C.border,
    borderTopStyle: 'solid',
  },
  tableRowAlt: {
    backgroundColor: C.rowAlt,
  },
  cell: {
    fontSize: 9.5,
    color: C.textMid,
    paddingRight: 8,
  },
  cellBold: {
    fontFamily: 'Helvetica-Bold',
    color: C.textDark,
  },

  // Column widths
  colDate:     { flex: 1.1 },
  colDesc:     { flex: 3 },
  colPaidBy:   { flex: 1.4 },
  colAmount:   { flex: 1, textAlign: 'right' },
  colCategory: { flex: 1.1 },
  colSplit:    { flex: 0.9 },
  colName:     { flex: 2 },
  colFrom:     { flex: 2 },
  colTo:       { flex: 2 },

  // ── Balance badge ────────────────────────────────────────────────────────────
  badge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
  },

  // ── Debt card ────────────────────────────────────────────────────────────────
  debtCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
    borderStyle: 'solid',
    backgroundColor: C.negativeLight,
    marginBottom: 8,
    overflow: 'hidden',
  },
  debtLeft: {
    flex: 1,
    padding: 12,
  },
  debtFromName: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: C.textDark,
  },
  debtFromLabel: {
    fontSize: 8,
    color: C.negative,
    marginTop: 2,
  },
  debtArrow: {
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  debtArrowLine: {
    fontSize: 16,
    color: C.textMuted,
  },
  debtRight: {
    flex: 1,
    padding: 12,
    alignItems: 'flex-end',
  },
  debtToName: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: C.textDark,
  },
  debtToLabel: {
    fontSize: 8,
    color: C.positive,
    marginTop: 2,
  },
  debtAmountStrip: {
    backgroundColor: C.negative,
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  debtAmountText: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: C.white,
  },
  debtAmountLabel: {
    fontSize: 7,
    color: '#fca5a5',
    marginTop: 2,
  },

  // ── Settled card ─────────────────────────────────────────────────────────────
  settledCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderStyle: 'solid',
    backgroundColor: C.positiveLight,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  settledText: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: C.positive,
  },
  settledSub: {
    fontSize: 9,
    color: C.positive,
    marginTop: 2,
  },

  // ── Footer ───────────────────────────────────────────────────────────────────
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: C.border,
    borderTopStyle: 'solid',
    paddingTop: 8,
  },
  footerText: {
    fontSize: 8,
    color: C.textMuted,
  },
  footerBrand: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: C.primaryMid,
  },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface GroupInfo {
  name: string;
  defaultCurrency: string;
  simplifyDebts: boolean;
}

function NetBadge({ net, currency }: { net: number; currency: string }) {
  if (net === 0) {
    return (
      <View style={[s.badge, { backgroundColor: '#f1f5f9' }]}>
        <Text style={[s.badgeText, { color: C.neutral }]}>Settled</Text>
      </View>
    );
  }
  const isPos = net > 0;
  return (
    <View style={[s.badge, { backgroundColor: isPos ? C.positiveLight : C.negativeLight }]}>
      <Text style={[s.badgeText, { color: isPos ? C.positive : C.negative }]}>
        {isPos ? '+' : ''}{formatCurrency(net, currency)}
      </Text>
    </View>
  );
}

// ─── Document ─────────────────────────────────────────────────────────────────

function buildDocument(
  group: GroupInfo,
  expenses: ExpenseWithDetails[],
  balances: MemberBalance[],
  debts: DebtRow[],
  generatedAt: string,
) {
  const nonSettlement = expenses.filter((e) => !e.isSettlement);
  const dates = nonSettlement.map((e) => e.date).sort();
  const dateRange =
    dates.length > 0
      ? `${formatDate(dates[0] ?? '')} – ${formatDate(dates[dates.length - 1] ?? '')}`
      : 'No expenses recorded';

  const totalAmount = nonSettlement.reduce(
    (sum, e) => sum + parseFloat(e.amount),
    0,
  );

  const categoryMap = nonSettlement.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + 1;
    return acc;
  }, {});
  const topCategory = Object.entries(categoryMap).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';

  return (
    <Document
      title={`${group.name} — Expense Report`}
      author="SplitLedger"
      subject="Group Expense Export"
    >
      <Page size="A4" style={s.page}>
        {/* ── Top accent bar ─────────────────────────────────────────────── */}
        <View style={s.accentBar} />

        <View style={s.body}>
          {/* ── Header row ─────────────────────────────────────────────────── */}
          <View style={s.headerRow}>
            <View style={s.appBadge}>
              <View style={s.appDot} />
              <Text style={s.appName}>SPLITLEGER</Text>
            </View>
            <View style={s.metaBlock}>
              <Text style={s.metaText}>Generated: {generatedAt}</Text>
              <Text style={s.metaText}>Currency: {group.defaultCurrency}</Text>
            </View>
          </View>

          {/* ── Group title ─────────────────────────────────────────────────── */}
          <View style={s.groupTitleBlock}>
            <Text style={s.groupTitle}>{group.name}</Text>
            <Text style={s.groupSubtitle}>Expense Report  ·  {dateRange}</Text>
          </View>

          {/* ── Stat cards ──────────────────────────────────────────────────── */}
          <View style={s.statsRow}>
            <View style={s.statCard}>
              <Text style={s.statLabel}>Total Spent</Text>
              <Text style={s.statValue}>{formatCurrency(totalAmount, group.defaultCurrency)}</Text>
              <Text style={s.statSub}>across all expenses</Text>
            </View>
            <View style={s.statCard}>
              <Text style={s.statLabel}>Transactions</Text>
              <Text style={s.statValue}>{nonSettlement.length}</Text>
              <Text style={s.statSub}>expense{nonSettlement.length !== 1 ? 's' : ''} recorded</Text>
            </View>
            <View style={s.statCard}>
              <Text style={s.statLabel}>Members</Text>
              <Text style={s.statValue}>{balances.length}</Text>
              <Text style={s.statSub}>participants</Text>
            </View>
            <View style={s.statCard}>
              <Text style={s.statLabel}>Top Category</Text>
              <Text style={s.statValue}>{topCategory.charAt(0).toUpperCase() + topCategory.slice(1)}</Text>
              <Text style={s.statSub}>most frequent</Text>
            </View>
          </View>

          {/* ── Members summary ──────────────────────────────────────────────── */}
          <View style={s.sectionHeader}>
            <View style={s.sectionAccent} />
            <Text style={s.sectionTitle}>Member Balances</Text>
          </View>
          <View style={s.table}>
            <View style={s.tableHead}>
              <Text style={[s.tableHeadCell, s.colName]}>Member</Text>
              <Text style={[s.tableHeadCell, s.colAmount]}>Total Paid</Text>
              <Text style={[s.tableHeadCell, s.colAmount]}>Their Share</Text>
              <Text style={[s.tableHeadCell, s.colAmount]}>Net Balance</Text>
            </View>
            {balances.map((b, i) => (
              <View key={b.user.id} style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]}>
                <Text style={[s.cell, s.cellBold, s.colName]}>{b.user.name}</Text>
                <Text style={[s.cell, s.colAmount]}>{formatCurrency(b.totalPaid, b.currency)}</Text>
                <Text style={[s.cell, s.colAmount]}>{formatCurrency(b.totalOwed, b.currency)}</Text>
                <View style={[s.colAmount, { alignItems: 'flex-end' }]}>
                  <NetBadge net={b.netBalance} currency={b.currency} />
                </View>
              </View>
            ))}
          </View>

          {/* ── Expenses table ───────────────────────────────────────────────── */}
          <View style={s.sectionHeader}>
            <View style={s.sectionAccent} />
            <Text style={s.sectionTitle}>Expense Breakdown</Text>
          </View>
          <View style={s.table}>
            <View style={s.tableHead}>
              <Text style={[s.tableHeadCell, s.colDate]}>Date</Text>
              <Text style={[s.tableHeadCell, s.colDesc]}>Description</Text>
              <Text style={[s.tableHeadCell, s.colPaidBy]}>Paid By</Text>
              <Text style={[s.tableHeadCell, s.colAmount]}>Amount</Text>
              <Text style={[s.tableHeadCell, s.colCategory]}>Category</Text>
              <Text style={[s.tableHeadCell, s.colSplit]}>Split</Text>
            </View>
            {nonSettlement.length === 0 && (
              <View style={s.tableRow}>
                <Text style={[s.cell, { color: C.textMuted }]}>No expenses recorded.</Text>
              </View>
            )}
            {nonSettlement.map((expense, i) => (
              <View key={expense.id} style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]}>
                <Text style={[s.cell, s.colDate]}>{formatDate(expense.date)}</Text>
                <Text style={[s.cell, s.cellBold, s.colDesc]}>{expense.description}</Text>
                <Text style={[s.cell, s.colPaidBy]}>{expense.paidByUser.name}</Text>
                <Text style={[s.cell, s.colAmount, { color: C.textDark, fontFamily: 'Helvetica-Bold' }]}>
                  {formatCurrency(parseFloat(expense.amount), expense.currency)}
                </Text>
                <Text style={[s.cell, s.colCategory, { color: C.textMuted }]}>
                  {expense.category.charAt(0).toUpperCase() + expense.category.slice(1)}
                </Text>
                <Text style={[s.cell, s.colSplit, { color: C.textMuted }]}>
                  {expense.splitType.charAt(0).toUpperCase() + expense.splitType.slice(1)}
                </Text>
              </View>
            ))}
          </View>

          {/* ── Who Owes Whom ─────────────────────────────────────────────────── */}
          <View style={s.sectionHeader}>
            <View style={s.sectionAccent} />
            <Text style={s.sectionTitle}>Settlement Summary — Who Pays Whom</Text>
          </View>

          {debts.length === 0 ? (
            <View style={s.settledCard}>
              <View>
                <Text style={s.settledText}>All settled up!</Text>
                <Text style={s.settledSub}>Everyone is even — no payments needed.</Text>
              </View>
            </View>
          ) : (
            debts.map((debt, i) => (
              <View key={i} style={s.debtCard}>
                {/* Payer */}
                <View style={s.debtLeft}>
                  <Text style={s.debtFromName}>{debt.fromUser.name}</Text>
                  <Text style={s.debtFromLabel}>needs to pay</Text>
                </View>

                {/* Arrow */}
                <View style={s.debtArrow}>
                  <Text style={s.debtArrowLine}>→</Text>
                </View>

                {/* Receiver */}
                <View style={s.debtRight}>
                  <Text style={s.debtToName}>{debt.toUser.name}</Text>
                  <Text style={s.debtToLabel}>will receive</Text>
                </View>

                {/* Amount strip */}
                <View style={s.debtAmountStrip}>
                  <Text style={s.debtAmountText}>
                    {formatCurrency(debt.amount, debt.currency)}
                  </Text>
                  <Text style={s.debtAmountLabel}>to pay</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>{group.name} · Expense Report</Text>
          <Text style={s.footerBrand}>SplitLedger</Text>
        </View>
      </Page>
    </Document>
  );
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> },
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

  const generatedAt = new Date().toLocaleDateString('en-IN', {
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
