'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { Receipt } from 'lucide-react';
import { EXPENSE_CATEGORIES } from '@/lib/constants';
import type { ExpenseWithDetails } from '@/types';
import { ExpenseCard } from '@/components/expenses/expense-card';
import { EmptyState } from '@/components/shared/empty-state';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ExpenseListProps {
  groupId: string;
  expenses: ExpenseWithDetails[];
  currentUserId: string;
  onExpenseDeleted?: (expenseId: string) => void;
}

function groupByDate(expenses: ExpenseWithDetails[]): Map<string, ExpenseWithDetails[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(today.getDate() - 7);

  const groups = new Map<string, ExpenseWithDetails[]>();

  for (const expense of expenses) {
    const expDate = new Date(expense.date + 'T00:00:00');
    let label: string;

    if (expDate >= today) {
      label = 'Today';
    } else if (expDate >= yesterday) {
      label = 'Yesterday';
    } else if (expDate >= weekAgo) {
      label = 'This week';
    } else {
      label = expDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }

    const existing = groups.get(label) ?? [];
    existing.push(expense);
    groups.set(label, existing);
  }

  return groups;
}

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] } },
};

export function ExpenseList({
  groupId: _groupId,
  expenses,
  currentUserId,
  onExpenseDeleted,
}: ExpenseListProps) {
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [paidByFilter, setPaidByFilter] = useState<string | null>(null);
  const [localExpenses, setLocalExpenses] = useState<ExpenseWithDetails[]>(expenses);

  // Sync when parent expenses prop changes
  useMemo(() => {
    setLocalExpenses(expenses);
  }, [expenses]);

  // Unique payers from all expenses
  const payers = useMemo(() => {
    const seen = new Map<string, { id: string; name: string }>();
    for (const exp of localExpenses) {
      if (!seen.has(exp.paidByUser.id)) {
        seen.set(exp.paidByUser.id, { id: exp.paidByUser.id, name: exp.paidByUser.name });
      }
    }
    return Array.from(seen.values());
  }, [localExpenses]);

  // Active categories present in expenses
  const activeCategories = useMemo(() => {
    const cats = new Set(localExpenses.map((e) => e.category));
    return EXPENSE_CATEGORIES.filter((c) => cats.has(c.value));
  }, [localExpenses]);

  const filtered = useMemo(() => {
    return localExpenses.filter((e) => {
      if (categoryFilter && e.category !== categoryFilter) return false;
      if (paidByFilter && e.paidBy !== paidByFilter) return false;
      return true;
    });
  }, [localExpenses, categoryFilter, paidByFilter]);

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);

  const handleDelete = (expenseId: string) => {
    setLocalExpenses((prev) => prev.filter((e) => e.id !== expenseId));
    onExpenseDeleted?.(expenseId);
  };

  if (localExpenses.length === 0) {
    return (
      <EmptyState
        title="No expenses yet"
        description="Add your first expense to start splitting costs with your group."
        icon={<Receipt className="w-8 h-8" />}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="space-y-2">
        {activeCategories.length > 1 && (
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-xs text-muted-foreground mr-1">Category:</span>
            <button
              type="button"
              onClick={() => setCategoryFilter(null)}
              className={cn(
                'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                categoryFilter === null
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
              )}
            >
              All
            </button>
            {activeCategories.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategoryFilter(cat.value === categoryFilter ? null : cat.value)}
                className={cn(
                  'flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                  categoryFilter === cat.value
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                )}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>
        )}

        {payers.length > 1 && (
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-xs text-muted-foreground mr-1">Paid by:</span>
            <button
              type="button"
              onClick={() => setPaidByFilter(null)}
              className={cn(
                'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                paidByFilter === null
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
              )}
            >
              Anyone
            </button>
            {payers.map((payer) => (
              <button
                key={payer.id}
                type="button"
                onClick={() => setPaidByFilter(payer.id === paidByFilter ? null : payer.id)}
                className={cn(
                  'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                  paidByFilter === payer.id
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                )}
              >
                {payer.id === currentUserId ? 'You' : payer.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grouped expense list */}
      {filtered.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground">
          No expenses match the current filters.
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          <AnimatePresence mode="popLayout">
            {Array.from(grouped.entries()).map(([dateLabel, groupExpenses]) => (
              <motion.div key={dateLabel} variants={itemVariants} className="space-y-2">
                <div className="flex items-center gap-3">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {dateLabel}
                  </h3>
                  <Badge variant="secondary" className="text-xs py-0 h-5">
                    {groupExpenses.length}
                  </Badge>
                </div>
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-2"
                >
                  {groupExpenses.map((expense) => (
                    <motion.div key={expense.id} variants={itemVariants}>
                      <ExpenseCard
                        expense={expense}
                        currentUserId={currentUserId}
                        onDelete={() => handleDelete(expense.id)}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
