'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { deleteExpense } from '@/actions/expenses';
import { EXPENSE_CATEGORIES } from '@/lib/constants';
import { getAvatarColorClasses } from '@/lib/constants';
import { SPLIT_TYPES } from '@/lib/constants';
import { formatCurrency } from '@/lib/currencies';
import { formatDate, getInitials, cn } from '@/lib/utils';
import type { ExpenseWithDetails } from '@/types';
import { Badge } from '@/components/ui/badge';

interface ExpenseCardProps {
  expense: ExpenseWithDetails;
  currentUserId: string;
  onDelete?: () => void;
  onEdit?: () => void;
}

export function ExpenseCard({ expense, currentUserId, onDelete, onEdit }: ExpenseCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const categoryInfo = EXPENSE_CATEGORIES.find((c) => c.value === expense.category);
  const splitTypeLabel = SPLIT_TYPES.find((s) => s.value === expense.splitType)?.label ?? expense.splitType;
  const { bg, text } = getAvatarColorClasses(expense.paidByUser.avatarColor);

  const userSplit = expense.splits.find((s) => s.userId === currentUserId);
  const userAmount = userSplit ? parseFloat(userSplit.amount) : 0;
  const isPayer = expense.paidBy === currentUserId;

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteExpense(expense.id);
    if (result.success) {
      toast.success('Expense deleted');
      onDelete?.();
    } else {
      toast.error(result.error ?? 'Failed to delete expense');
      setIsDeleting(false);
    }
  };

  // Swipe left threshold to reveal delete
  const SWIPE_THRESHOLD = -80;
  const isSwipeOpen = dragX <= SWIPE_THRESHOLD;

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Delete action revealed on swipe */}
      <div className="absolute inset-y-0 right-0 flex items-center px-4 bg-destructive rounded-xl">
        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          className="text-white flex flex-col items-center gap-0.5"
        >
          <Trash2 className="w-5 h-5" />
          <span className="text-xs">Delete</span>
        </button>
      </div>

      {/* Card body — draggable on mobile */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -120, right: 0 }}
        dragElastic={0.1}
        onDragStart={() => setIsDragging(true)}
        onDrag={(_, info) => setDragX(info.offset.x)}
        onDragEnd={(_, info) => {
          setIsDragging(false);
          if (info.offset.x > -40) {
            setDragX(0);
          } else {
            setDragX(SWIPE_THRESHOLD);
          }
        }}
        animate={{ x: isSwipeOpen && !isDragging ? SWIPE_THRESHOLD : isDragging ? undefined : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        whileHover={{ scale: 1.005 }}
        className={cn(
          'group relative bg-card border border-border rounded-xl p-4 cursor-pointer select-none touch-pan-y'
        )}
      >
        <div className="flex items-start gap-3">
          {/* Category icon */}
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted text-xl shrink-0">
            {categoryInfo?.icon ?? '📦'}
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{expense.description}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDate(expense.date)}
                </p>
              </div>

              {/* Amount (large) */}
              <div className="text-right shrink-0">
                <p
                  className={cn(
                    'text-base font-bold',
                    isPayer ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'
                  )}
                >
                  {formatCurrency(parseFloat(expense.amount), expense.currency)}
                </p>
                {!isPayer && userAmount > 0 && (
                  <p className="text-xs text-muted-foreground">
                    your share: {formatCurrency(userAmount, expense.currency)}
                  </p>
                )}
                {isPayer && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">you paid</p>
                )}
              </div>
            </div>

            {/* Paid by + split type */}
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    'flex items-center justify-center w-5 h-5 rounded-full text-xs font-semibold shrink-0',
                    bg,
                    text
                  )}
                >
                  {getInitials(expense.paidByUser.name)}
                </span>
                <span className="text-xs text-muted-foreground">
                  Paid by{' '}
                  <span className="font-medium text-foreground">
                    {expense.paidByUser.id === currentUserId ? 'you' : expense.paidByUser.name}
                  </span>
                </span>
              </div>
              <Badge variant="secondary" className="text-xs py-0 h-5">
                {splitTypeLabel}
              </Badge>
            </div>
          </div>
        </div>

        {/* Desktop hover actions */}
        <div className="absolute top-3 right-3 hidden group-hover:flex items-center gap-1 sm:flex opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="flex items-center justify-center w-7 h-7 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            disabled={isDeleting}
            className="flex items-center justify-center w-7 h-7 rounded-md hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
