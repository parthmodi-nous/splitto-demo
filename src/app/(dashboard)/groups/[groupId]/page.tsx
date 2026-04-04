import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Settings, Plus, Users, Download } from 'lucide-react';
import { getGroupWithMembers } from '@/actions/groups';
import { getGroupExpenses } from '@/actions/expenses';
import { getGroupBalances, getSimplifiedDebts } from '@/actions/settlements';
import { PageHeader } from '@/components/shared/page-header';
import { AvatarGroup } from '@/components/shared/avatar-group';
import { formatCurrency } from '@/lib/currencies';
import { formatDate, cn } from '@/lib/utils';

type TabId = 'expenses' | 'balances' | 'settlements';

const TABS: { id: TabId; label: string }[] = [
  { id: 'expenses', label: 'Expenses' },
  { id: 'balances', label: 'Balances' },
  { id: 'settlements', label: 'Settlements' },
];

interface GroupPageProps {
  params: Promise<{ groupId: string }>;
  searchParams: Promise<{ tab?: string }>;
}

async function ExpensesTab({ groupId }: { groupId: string }) {
  const result = await getGroupExpenses(groupId, { limit: 50 });
  if (!result.success) {
    return <p className="text-sm text-muted-foreground py-8 text-center">{result.error}</p>;
  }
  const expenses = result.data.expenses;

  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center rounded-xl border border-dashed border-border">
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-lg">🧾</div>
        <p className="font-medium text-foreground">No expenses yet</p>
        <p className="text-sm text-muted-foreground">Add the first expense to start tracking.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {expenses.map((expense) => (
        <div
          key={expense.id}
          className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 hover:bg-accent/50 transition-colors"
        >
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground text-sm truncate">{expense.description}</p>
            <p className="text-xs text-muted-foreground">
              Paid by {expense.paidByUser.name} · {formatDate(expense.date)}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="font-semibold text-foreground text-sm">
              {formatCurrency(parseFloat(expense.amount), expense.currency)}
            </p>
            <p className="text-xs text-muted-foreground capitalize">{expense.category}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

async function BalancesTab({ groupId }: { groupId: string }) {
  const result = await getGroupBalances(groupId);
  if (!result.success) {
    return <p className="text-sm text-muted-foreground py-8 text-center">{result.error}</p>;
  }
  const balances = result.data;

  if (balances.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
        <p className="text-muted-foreground">No balance data available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {balances.map((item) => {
        const isPositive = item.netBalance > 0;
        const isNeutral = item.netBalance === 0;
        return (
          <div
            key={item.user.id}
            className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3"
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground text-sm">{item.user.name}</p>
              <p className="text-xs text-muted-foreground">
                Spent {formatCurrency(item.totalPaid, item.currency)} · Share {formatCurrency(item.totalOwed, item.currency)}
              </p>
            </div>
            <div className={cn(
              'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
              isNeutral
                ? 'bg-muted text-muted-foreground'
                : isPositive
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
            )}>
              {isNeutral ? (
                <span>✓ Settled</span>
              ) : isPositive ? (
                <span>💰 gets back {formatCurrency(item.netBalance, item.currency)}</span>
              ) : (
                <span>💸 owes {formatCurrency(Math.abs(item.netBalance), item.currency)}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

async function SettlementsTab({ groupId }: { groupId: string }) {
  const result = await getSimplifiedDebts(groupId);
  if (!result.success) {
    return <p className="text-sm text-muted-foreground py-8 text-center">{result.error}</p>;
  }
  const debts = result.data;

  if (debts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center rounded-xl border border-dashed border-border">
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-lg">✅</div>
        <p className="font-medium text-foreground">All settled up!</p>
        <p className="text-sm text-muted-foreground">Everyone is even — no settlements needed.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {debts.map((debt, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3"
        >
          <span className="text-lg shrink-0">💸</span>
          <div className="flex-1 min-w-0 text-sm">
            <span className="font-semibold text-foreground">{debt.fromUser.name}</span>
            <span className="text-muted-foreground mx-1.5">needs to pay</span>
            <span className="font-semibold text-foreground">{debt.toUser.name}</span>
          </div>
          <span className="font-bold text-sm text-rose-600 dark:text-rose-400 shrink-0">
            {formatCurrency(debt.amount, debt.currency)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default async function GroupPage({ params, searchParams }: GroupPageProps) {
  const { groupId } = await params;
  const { tab: tabParam } = await searchParams;
  const activeTab: TabId = (tabParam as TabId) ?? 'expenses';

  const result = await getGroupWithMembers(groupId);
  if (!result.success) {
    notFound();
  }

  const group = result.data;
  const memberAvatars = group.members.map((m) => ({
    name: m.user.name,
    avatarColor: m.user.avatarColor,
  }));

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title={group.name}
          description={group.description ?? undefined}
          breadcrumbs={[
            { label: 'Groups', href: '/groups' },
            { label: group.name },
          ]}
        />
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`/groups/${groupId}/expenses/new`}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Expense</span>
          </Link>
          <a
            href={`/api/export/${groupId}`}
            download
            className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
            title="Export as PDF"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </a>
          <Link
            href={`/groups/${groupId}/settings`}
            className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Settings</span>
          </Link>
        </div>
      </div>

      {/* Members row */}
      <div className="flex items-center gap-2">
        <AvatarGroup users={memberAvatars} max={6} size="sm" />
        <span className="text-sm text-muted-foreground flex items-center gap-1">
          <Users className="w-3.5 h-3.5" />
          {group.members.length} {group.members.length === 1 ? 'member' : 'members'}
        </span>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-0 -mb-px">
          {TABS.map((tab) => (
            <Link
              key={tab.id}
              href={`/groups/${groupId}?tab=${tab.id}`}
              className={cn(
                'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border',
              )}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <Suspense
        fallback={
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-14 rounded-lg border border-border bg-card animate-pulse" />
            ))}
          </div>
        }
      >
        {activeTab === 'expenses' && <ExpensesTab groupId={groupId} />}
        {activeTab === 'balances' && <BalancesTab groupId={groupId} />}
        {activeTab === 'settlements' && <SettlementsTab groupId={groupId} />}
      </Suspense>

    </div>
  );
}
