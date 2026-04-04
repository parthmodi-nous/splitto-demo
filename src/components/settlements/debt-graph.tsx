'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, CheckCircle2 } from 'lucide-react';
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

      {/* Name + status + bar */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <span className="text-sm font-medium text-foreground truncate block">
              {balance.user.name}
            </span>
            {/* Plain-language status */}
            <span className={cn(
              'text-xs font-medium flex items-center gap-1',
              isNeutral
                ? 'text-muted-foreground'
                : isPositive
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400',
            )}>
              {isNeutral ? (
                <><CheckCircle2 className="w-3 h-3" /> All clear</>
              ) : isPositive ? (
                <><TrendingUp className="w-3 h-3" /> Gets back money</>
              ) : (
                <><TrendingDown className="w-3 h-3" /> Needs to pay</>
              )}
            </span>
          </div>

          {/* Amount badge */}
          <div className={cn(
            'flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-bold tabular-nums shrink-0',
            isNeutral
              ? 'bg-muted text-muted-foreground'
              : isPositive
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                : 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
          )}>
            {isNeutral ? (
              <span>✓ Settled</span>
            ) : isPositive ? (
              <span>💰 +{formatCurrency(net, currency)}</span>
            ) : (
              <span>💸 {formatCurrency(net, currency)}</span>
            )}
          </div>
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
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground rounded-lg bg-muted/50 px-3 py-2">
        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
          <TrendingUp className="w-3 h-3" /> 💰 Gets back = others owe them
        </span>
        <span className="text-border">·</span>
        <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-medium">
          <TrendingDown className="w-3 h-3" /> 💸 Needs to pay = they owe others
        </span>
      </div>

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
