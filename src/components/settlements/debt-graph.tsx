'use client';

import { motion } from 'framer-motion';
import { getAvatarColorClasses } from '@/lib/constants';
import { getInitials, cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/currencies';
import type { MemberBalance } from '@/types';

interface DebtGraphProps {
  balances: MemberBalance[];
  currency: string;
}

function MemberRow({
  balance,
  currency,
  maxAbsolute,
  index,
}: {
  balance: MemberBalance;
  currency: string;
  maxAbsolute: number;
  index: number;
}) {
  const { bg, text } = getAvatarColorClasses(balance.user.avatarColor);
  const net = balance.netBalance;
  const isPositive = net > 0;
  const isNeutral = net === 0;
  const barWidthPct = maxAbsolute > 0 ? (Math.abs(net) / maxAbsolute) * 100 : 0;

  return (
    <motion.div
      className="flex items-center gap-3"
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.07, type: 'spring', stiffness: 280, damping: 26 }}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex items-center justify-center w-9 h-9 rounded-full text-xs font-semibold select-none shrink-0',
          bg,
          text,
        )}
      >
        {getInitials(balance.user.name)}
      </div>

      {/* Name + bar */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-foreground truncate">
            {balance.user.name}
          </span>
          <span
            className={cn(
              'text-sm font-semibold tabular-nums shrink-0',
              isNeutral
                ? 'text-muted-foreground'
                : isPositive
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400',
            )}
          >
            {isNeutral
              ? 'Settled'
              : isPositive
                ? `+${formatCurrency(net, currency)}`
                : formatCurrency(net, currency)}
          </span>
        </div>

        {/* Bar */}
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <motion.div
            className={cn(
              'h-full rounded-full',
              isNeutral
                ? 'bg-muted-foreground/30'
                : isPositive
                  ? 'bg-emerald-500 dark:bg-emerald-400'
                  : 'bg-rose-500 dark:bg-rose-400',
            )}
            initial={{ width: 0 }}
            animate={{ width: `${barWidthPct}%` }}
            transition={{ delay: index * 0.07 + 0.15, duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>
    </motion.div>
  );
}

export function DebtGraph({ balances, currency }: DebtGraphProps) {
  const maxAbsolute = Math.max(...balances.map((b) => Math.abs(b.netBalance)), 0);

  if (balances.length === 0) {
    return (
      <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
        No balance data available.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {balances.map((balance, index) => (
        <MemberRow
          key={balance.user.id}
          balance={balance}
          currency={currency}
          maxAbsolute={maxAbsolute}
          index={index}
        />
      ))}
    </div>
  );
}
