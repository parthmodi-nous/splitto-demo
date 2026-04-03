'use client';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { PieSectorDataItem } from 'recharts/types/polar/Pie';
import { formatCurrency } from '@/lib/currencies';
import { EXPENSE_CATEGORIES } from '@/lib/constants';

interface CategoryDataPoint {
  category: string;
  amount: number;
  percentage: number;
}

interface CategoryPieProps {
  data: CategoryDataPoint[];
  currency: string;
  onCategoryClick?: (category: string) => void;
}

// Tailwind-compatible hex palette for chart segments
const CATEGORY_COLORS: string[] = [
  '#10b981', // emerald-500
  '#3b82f6', // blue-500
  '#a855f7', // purple-500
  '#f59e0b', // amber-500
  '#f43f5e', // rose-500
  '#06b6d4', // cyan-500
  '#f97316', // orange-500
  '#14b8a6', // teal-500
  '#6366f1', // indigo-500
  '#84cc16', // lime-500
];

function getCategoryLabel(category: string): string {
  const found = EXPENSE_CATEGORIES.find((c) => c.value === category);
  return found ? `${found.icon} ${found.label}` : category;
}

function getCategoryIcon(category: string): string {
  const found = EXPENSE_CATEGORIES.find((c) => c.value === category);
  return found ? found.icon : '📦';
}

interface TooltipPayloadEntry {
  name: string;
  value: number;
  payload: CategoryDataPoint & { fill: string };
}

function CustomTooltip({
  active,
  payload,
  currency,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  currency: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const entry = payload[0];
  if (!entry) return null;
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
      <p className="font-medium">{getCategoryLabel(entry.payload.category)}</p>
      <p>{formatCurrency(entry.value, currency)}</p>
      <p className="text-muted-foreground">{entry.payload.percentage.toFixed(1)}%</p>
    </div>
  );
}

export function CategoryPie({ data, currency, onCategoryClick }: CategoryPieProps) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-muted-foreground border border-dashed border-border rounded-lg">
        No category data available
      </div>
    );
  }

  const handleClick = (entry: PieSectorDataItem & { category?: string }) => {
    if (entry.category) onCategoryClick?.(entry.category);
  };

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={2}
            dataKey="amount"
            isAnimationActive
            animationBegin={0}
            animationDuration={600}
            onClick={handleClick}
            style={{ cursor: onCategoryClick ? 'pointer' : 'default' }}
          >
            {data.map((entry, index) => (
              <Cell
                key={entry.category}
                fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                stroke="transparent"
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip currency={currency} />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="space-y-1.5">
        {data.map((entry, index) => (
          <div
            key={entry.category}
            className={`flex items-center gap-2 text-sm rounded-md px-2 py-1 transition-colors ${
              onCategoryClick
                ? 'cursor-pointer hover:bg-accent/60'
                : ''
            }`}
            onClick={() => onCategoryClick?.(entry.category)}
          >
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }}
            />
            <span className="flex-1 text-foreground truncate">
              {getCategoryIcon(entry.category)}{' '}
              {EXPENSE_CATEGORIES.find((c) => c.value === entry.category)?.label ?? entry.category}
            </span>
            <span className="text-muted-foreground shrink-0">
              {formatCurrency(entry.amount, currency)}
            </span>
            <span className="text-muted-foreground shrink-0 w-10 text-right">
              {entry.percentage.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
