'use client';

import { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/currencies';
import { format, parseISO, startOfWeek, startOfMonth } from 'date-fns';

interface SpendingDataPoint {
  date: string;
  amount: number;
}

interface SpendingChartProps {
  data: SpendingDataPoint[];
  currency: string;
  loading?: boolean;
}

type ViewMode = 'monthly' | 'weekly';

function groupByMonth(data: SpendingDataPoint[]): SpendingDataPoint[] {
  const map = new Map<string, number>();
  for (const point of data) {
    const key = format(startOfMonth(parseISO(point.date)), 'yyyy-MM');
    map.set(key, (map.get(key) ?? 0) + point.amount);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, amount]) => ({ date, amount }));
}

function groupByWeek(data: SpendingDataPoint[]): SpendingDataPoint[] {
  const map = new Map<string, number>();
  for (const point of data) {
    const key = format(startOfWeek(parseISO(point.date), { weekStartsOn: 1 }), 'yyyy-MM-dd');
    map.set(key, (map.get(key) ?? 0) + point.amount);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, amount]) => ({ date, amount }));
}

function formatXAxisTick(tick: string, mode: ViewMode): string {
  try {
    const date = parseISO(mode === 'monthly' ? `${tick}-01` : tick);
    return mode === 'monthly' ? format(date, 'MMM yy') : format(date, 'MMM d');
  } catch {
    return tick;
  }
}

export function SpendingChart({ data, currency, loading = false }: SpendingChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-8 w-36" />
        </div>
        <Skeleton className="h-56 w-full rounded-lg" />
      </div>
    );
  }

  const grouped = viewMode === 'monthly' ? groupByMonth(data) : groupByWeek(data);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-sm font-medium text-muted-foreground">Spending over time</p>
        <div className="inline-flex rounded-md border border-border overflow-hidden text-xs">
          <button
            onClick={() => setViewMode('monthly')}
            className={`px-3 py-1.5 font-medium transition-colors ${
              viewMode === 'monthly'
                ? 'bg-primary text-primary-foreground'
                : 'bg-background text-muted-foreground hover:bg-accent'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setViewMode('weekly')}
            className={`px-3 py-1.5 font-medium transition-colors ${
              viewMode === 'weekly'
                ? 'bg-primary text-primary-foreground'
                : 'bg-background text-muted-foreground hover:bg-accent'
            }`}
          >
            Weekly
          </button>
        </div>
      </div>

      {grouped.length === 0 ? (
        <div className="h-56 flex items-center justify-center text-sm text-muted-foreground border border-dashed border-border rounded-lg">
          No spending data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={224}>
          <AreaChart data={grouped} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="spendingGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={(tick: string) => formatXAxisTick(tick, viewMode)}
              tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v: number) => formatCurrency(v, currency)}
              tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
              axisLine={false}
              tickLine={false}
              width={70}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--popover)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: 'var(--popover-foreground)',
                fontSize: '12px',
              }}
              formatter={(value) => [formatCurrency(Number(value), currency), 'Spent']}
              labelFormatter={(label) => formatXAxisTick(String(label), viewMode)}
            />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="var(--primary)"
              strokeWidth={2}
              fill="url(#spendingGradient)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0, fill: 'var(--primary)' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </motion.div>
  );
}
