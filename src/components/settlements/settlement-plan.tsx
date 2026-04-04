'use client';

import { useState } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { getAvatarColorClasses } from '@/lib/constants';
import { getInitials, cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/currencies';
import { Button } from '@/components/ui/button';
import { SettleDialog } from '@/components/settlements/settle-dialog';
import type { User } from '@/types';

interface DebtItem {
  from: User;
  to: User;
  amount: number;
  currency: string;
}

interface SettlementPlanProps {
  debts: DebtItem[];
  groupId: string;
  onSettle?: (from: string, to: string, amount: number, currency: string) => void;
  isLoading?: boolean;
}

interface UserAvatarProps {
  user: User;
  size?: 'sm' | 'md';
}

function UserAvatar({ user, size = 'md' }: UserAvatarProps) {
  const { bg, text } = getAvatarColorClasses(user.avatarColor);
  const sizeClass = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={cn(
          'flex items-center justify-center rounded-full font-semibold select-none',
          sizeClass,
          bg,
          text,
        )}
      >
        {getInitials(user.name)}
      </div>
      <span className="text-xs text-muted-foreground truncate max-w-[64px] text-center leading-tight">
        {user.name.split(' ')[0]}
      </span>
    </div>
  );
}

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 28 } },
};

export function SettlementPlan({ debts, groupId, onSettle, isLoading }: SettlementPlanProps) {
  const [dialogDebt, setDialogDebt] = useState<DebtItem | null>(null);

  if (!isLoading && debts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center rounded-xl border border-dashed border-border">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-2xl">
          🎉
        </div>
        <p className="font-semibold text-foreground">All settled up!</p>
        <p className="text-sm text-muted-foreground">Everyone is even — no payments needed.</p>
      </div>
    );
  }

  return (
    <>
      <motion.ul
        className="space-y-3"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <AnimatePresence>
          {debts.map((debt, index) => (
            <motion.li
              key={`${debt.from.id}-${debt.to.id}-${index}`}
              variants={itemVariants}
              layout
              className="rounded-xl border border-border bg-card overflow-hidden"
            >
              {/* Header strip */}
              <div className="flex items-center justify-between gap-2 bg-rose-50 dark:bg-rose-900/20 border-b border-rose-100 dark:border-rose-900/40 px-4 py-2">
                <span className="text-xs font-semibold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                  💸 Payment needed
                </span>
                <span className="text-base font-bold tabular-nums text-rose-700 dark:text-rose-400">
                  {formatCurrency(debt.amount, debt.currency)}
                </span>
              </div>

              {/* Body: from → to */}
              <div className="flex items-center gap-3 px-4 py-3">
                {/* Payer */}
                <div className="flex flex-col items-center gap-1 min-w-0">
                  <UserAvatar user={debt.from} />
                  <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                    💸 paying
                  </span>
                </div>

                {/* Arrow */}
                <div className="flex flex-1 flex-col items-center gap-0.5">
                  <div className="flex items-center gap-1 w-full">
                    <div className="h-px flex-1 bg-border" />
                    <ArrowRight className="w-4 h-4 shrink-0 text-muted-foreground" />
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <span className="text-xs text-muted-foreground">sends to</span>
                </div>

                {/* Receiver */}
                <div className="flex flex-col items-center gap-1 min-w-0">
                  <UserAvatar user={debt.to} />
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    💰 receives
                  </span>
                </div>

                {/* Settle button */}
                <Button
                  size="sm"
                  variant="outline"
                  className="ml-auto shrink-0"
                  onClick={() => setDialogDebt(debt)}
                  disabled={isLoading}
                >
                  Mark Paid ✓
                </Button>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>

      {dialogDebt && (
        <SettleDialog
          open={dialogDebt !== null}
          onOpenChange={(open) => {
            if (!open) setDialogDebt(null);
          }}
          groupId={groupId}
          fromUser={dialogDebt.from}
          toUser={dialogDebt.to}
          suggestedAmount={dialogDebt.amount}
          currency={dialogDebt.currency}
          onSuccess={() => {
            onSettle?.(
              dialogDebt.from.id,
              dialogDebt.to.id,
              dialogDebt.amount,
              dialogDebt.currency,
            );
            setDialogDebt(null);
          }}
        />
      )}
    </>
  );
}
