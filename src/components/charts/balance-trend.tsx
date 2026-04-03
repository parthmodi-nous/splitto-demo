'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { formatCurrency } from '@/lib/currencies';
import type { User } from '@/types';

// Maps avatarColor name to a chart-friendly hex
const AVATAR_COLOR_HEX: Record<string, string> = {
  emerald: '#10b981',
  blue: '#3b82f6',
  purple: '#a855f7',
  amber: '#f59e0b',
  rose: '#f43f5e',
  cyan: '#06b6d4',
  orange: '#f97316',
  teal: '#14b8a6',
};

function colorForUser(user: User, index: number): string {
  const fromMap = AVATAR_COLOR_HEX[user.avatarColor];
  if (fromMap) return fromMap;
  const fallbacks = Object.values(AVATAR_COLOR_HEX);
  return fallbacks[index % fallbacks.length] ?? '#6366f1';
}

interface BalanceTrendDataPoint {
  date: string;
  [userId: string]: number | string;
}

interface BalanceTrendProps {
  data: BalanceTrendDataPoint[];
  members: User[];
  currency: string;
}

interface TooltipPayloadEntry {
  name: string;
  value: number;
  color: string;
  dataKey: string;
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
  let formattedLabel = label ?? '';
  try {
    formattedLabel = format(parseISO(label ?? ''), 'MMM d, yyyy');
  } catch {
    // use raw label
  }
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
      <p className="font-medium mb-1">{formattedLabel}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} style={{ color: entry.color }}>
          {entry.name}: {formatCurrency(entry.value, currency)}
        </p>
      ))}
    </div>
  );
}

export function BalanceTrend({ data, members, currency }: BalanceTrendProps) {
  if (data.length === 0 || members.length === 0) {
    return (
      <div className="h-56 flex items-center justify-center text-sm text-muted-foreground border border-dashed border-border rounded-lg">
        No balance trend data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={224}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={(tick: string) => {
            try {
              return format(parseISO(tick), 'MMM d');
            } catch {
              return tick;
            }
          }}
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
        <Tooltip content={<CustomTooltip currency={currency} />} />
        <Legend
          wrapperStyle={{ fontSize: '12px', color: 'var(--muted-foreground)' }}
        />
        {members.map((member, index) => (
          <Line
            key={member.id}
            type="monotone"
            dataKey={member.id}
            name={member.name}
            stroke={colorForUser(member, index)}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
