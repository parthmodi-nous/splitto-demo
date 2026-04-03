'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import type { User } from '@/types';

const SpendingChart = dynamic(
  () => import('./spending-chart').then((m) => ({ default: m.SpendingChart })),
  { ssr: false, loading: () => <Skeleton className="h-56 w-full rounded-lg" /> }
);

const CategoryPie = dynamic(
  () => import('./category-pie').then((m) => ({ default: m.CategoryPie })),
  { ssr: false, loading: () => <Skeleton className="h-56 w-full rounded-lg" /> }
);

const MemberComparison = dynamic(
  () => import('./member-comparison').then((m) => ({ default: m.MemberComparison })),
  { ssr: false, loading: () => <Skeleton className="h-48 w-full rounded-lg" /> }
);

const BalanceTrend = dynamic(
  () => import('./balance-trend').then((m) => ({ default: m.BalanceTrend })),
  { ssr: false, loading: () => <Skeleton className="h-56 w-full rounded-lg" /> }
);

interface AnalyticsChartsProps {
  spendingData: Array<{ date: string; amount: number }>;
  categoryData: Array<{ category: string; amount: number; percentage: number }>;
  memberComparisonData: Array<{ user: User; totalPaid: number; totalOwed: number }>;
  balanceTrendData: Array<{ date: string; [userId: string]: number | string }>;
  members: User[];
  currency: string;
}

export function AnalyticsCharts({
  spendingData,
  categoryData,
  memberComparisonData,
  balanceTrendData,
  members,
  currency,
}: AnalyticsChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Spending Over Time</h2>
        <SpendingChart data={spendingData} currency={currency} />
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Category Breakdown</h2>
        <CategoryPie data={categoryData} currency={currency} />
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Member Spending</h2>
        <MemberComparison data={memberComparisonData} currency={currency} />
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Balance Over Time</h2>
        <BalanceTrend data={balanceTrendData} members={members} currency={currency} />
      </div>
    </div>
  );
}
