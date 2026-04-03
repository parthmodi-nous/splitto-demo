'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { formatCurrency } from '@/lib/currencies';
import { getInitials } from '@/lib/utils';
import type { User } from '@/types';

interface MemberComparisonDataPoint {
  user: User;
  totalPaid: number;
  totalOwed: number;
}

interface MemberComparisonProps {
  data: MemberComparisonDataPoint[];
  currency: string;
}

interface CustomYAxisTickProps {
  x?: number;
  y?: number;
  payload?: { value: string };
}

function CustomYAxisTick({ x = 0, y = 0, payload }: CustomYAxisTickProps) {
  const name = payload?.value ?? '';
  const initials = getInitials(name);
  const displayName = name.length > 10 ? `${name.slice(0, 10)}…` : name;
  return (
    <g transform={`translate(${x},${y})`}>
      <circle cx={-28} cy={0} r={12} fill="var(--muted)" />
      <text
        x={-28}
        y={0}
        dy={4}
        textAnchor="middle"
        fontSize={9}
        fontWeight={600}
        fill="var(--muted-foreground)"
      >
        {initials}
      </text>
      <text
        x={-8}
        y={0}
        dy={4}
        textAnchor="end"
        fontSize={11}
        fill="var(--muted-foreground)"
      >
        {displayName}
      </text>
    </g>
  );
}

interface TooltipPayloadEntry {
  name: string;
  value: number;
  fill: string;
}

function CustomTooltip({
  active,
  payload,
  label,
  currency,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
  currency: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div
      style={{
        backgroundColor: 'var(--popover)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '8px 12px',
        color: 'var(--popover-foreground)',
        fontSize: '12px',
      }}
    >
      <p className="font-medium mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.fill }}>
          {entry.name}: {formatCurrency(entry.value, currency)}
        </p>
      ))}
    </div>
  );
}

export function MemberComparison({ data, currency }: MemberComparisonProps) {
  if (data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-sm text-muted-foreground border border-dashed border-border rounded-lg">
        No member data available
      </div>
    );
  }

  const chartData = data.map((d) => ({
    name: d.user.name,
    Paid: d.totalPaid,
    Owed: d.totalOwed,
  }));

  const barHeight = 48;
  const minHeight = 120;
  const chartHeight = Math.max(minHeight, data.length * barHeight + 60);

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart
        layout="vertical"
        data={chartData}
        margin={{ top: 4, right: 16, left: 100, bottom: 4 }}
        barGap={4}
        barCategoryGap="30%"
      >
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
        <XAxis
          type="number"
          tickFormatter={(v: number) => formatCurrency(v, currency)}
          tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={<CustomYAxisTick />}
          axisLine={false}
          tickLine={false}
          width={110}
        />
        <Tooltip content={<CustomTooltip currency={currency} />} />
        <Legend
          wrapperStyle={{ fontSize: '12px', color: 'var(--muted-foreground)' }}
        />
        <Bar dataKey="Paid" fill="var(--primary)" radius={[0, 4, 4, 0]} />
        <Bar dataKey="Owed" fill="var(--muted-foreground)" radius={[0, 4, 4, 0]} opacity={0.6} />
      </BarChart>
    </ResponsiveContainer>
  );
}
