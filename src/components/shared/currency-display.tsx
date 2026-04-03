'use client';

import { formatCurrency } from '@/lib/currencies';
import { cn } from '@/lib/utils';

interface CurrencyDisplayProps {
  amount: number;
  currency: string;
  className?: string;
  showSign?: boolean;
  colored?: boolean;
}

export function CurrencyDisplay({
  amount,
  currency,
  className,
  showSign = false,
  colored = false,
}: CurrencyDisplayProps) {
  const isPositive = amount >= 0;
  const formatted = formatCurrency(Math.abs(amount), currency);
  const sign = amount < 0 ? '-' : showSign && amount > 0 ? '+' : '';

  return (
    <span
      className={cn(
        'font-mono tabular-nums',
        colored && isPositive && 'text-positive',
        colored && !isPositive && 'text-negative',
        className,
      )}
    >
      {sign}
      {formatted}
    </span>
  );
}
