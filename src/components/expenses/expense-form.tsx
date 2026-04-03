'use client';

import { useState, useCallback, useTransition } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { Loader2, CalendarDays } from 'lucide-react';
import { createExpense, updateExpense } from '@/actions/expenses';
import { createExpenseSchema } from '@/lib/validators/expense';
import { EXPENSE_CATEGORIES } from '@/lib/constants';
import { getAvatarColorClasses } from '@/lib/constants';
import { getInitials, cn } from '@/lib/utils';
import type { ExpenseWithDetails } from '@/types';
import { CurrencyInput } from '@/components/shared/currency-input';
import { CategoryPicker } from '@/components/expenses/category-picker';
import { SplitSelector } from '@/components/expenses/split-selector';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type SplitType = 'equal' | 'exact' | 'percentage' | 'shares' | 'adjustment';

interface SplitEntry {
  userId: string;
  amount: number;
  percentage?: number;
  shares?: number;
}

interface Member {
  id: string;
  name: string;
  avatarColor: string;
}

interface ExpenseFormProps {
  groupId: string;
  members: Member[];
  currentUserId: string;
  expense?: ExpenseWithDetails;
  onSuccess?: () => void;
}

type FormErrors = Partial<Record<string, string>>;

function todayDateString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function buildInitialSplits(expense: ExpenseWithDetails | undefined, members: Member[]): SplitEntry[] {
  if (expense) {
    return expense.splits.map((s) => ({
      userId: s.userId,
      amount: parseFloat(s.amount),
      percentage: s.percentage !== null ? parseFloat(s.percentage ?? '0') : undefined,
      shares: s.shares ?? undefined,
    }));
  }
  return members.map((m) => ({ userId: m.id, amount: 0 }));
}

export function ExpenseForm({
  groupId,
  members,
  currentUserId,
  expense,
  onSuccess,
}: ExpenseFormProps) {
  const isEditing = Boolean(expense);

  const [description, setDescription] = useState(expense?.description ?? '');
  const [amount, setAmount] = useState(expense ? parseFloat(expense.amount) : 0);
  const [currencyCode, setCurrencyCode] = useState(expense?.currency ?? 'USD');
  const [paidBy, setPaidBy] = useState(expense?.paidBy ?? currentUserId);
  const [date, setDate] = useState(expense?.date ?? todayDateString());
  const [category, setCategory] = useState<string>(expense?.category ?? 'other');
  const [splitType, setSplitType] = useState<SplitType>(
    (expense?.splitType as SplitType) ?? 'equal'
  );
  const [splits, setSplits] = useState<SplitEntry[]>(() =>
    buildInitialSplits(expense, members)
  );
  const [notes, setNotes] = useState(expense?.notes ?? '');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isPending, startTransition] = useTransition();

  const validate = useCallback((): boolean => {
    const result = createExpenseSchema.safeParse({
      groupId,
      description,
      amount,
      currency: currencyCode,
      category,
      paidBy,
      splitType,
      date,
      notes: notes || undefined,
      splits: splits
        .filter((s) => s.amount > 0)
        .map((s) => ({
          userId: s.userId,
          amount: s.amount,
          percentage: s.percentage,
          shares: s.shares,
        })),
    });

    if (result.success) {
      setErrors({});
      return true;
    }

    const newErrors: FormErrors = {};
    for (const issue of result.error.issues) {
      const field = issue.path[0]?.toString() ?? 'form';
      if (!newErrors[field]) {
        newErrors[field] = issue.message;
      }
    }
    setErrors(newErrors);
    return false;
  }, [groupId, description, amount, currencyCode, category, paidBy, splitType, date, notes, splits]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!validate()) return;

      const payload = {
        groupId,
        description,
        amount,
        currency: currencyCode,
        category: category as z.infer<typeof createExpenseSchema>['category'],
        paidBy,
        splitType: splitType as z.infer<typeof createExpenseSchema>['splitType'],
        date,
        notes: notes || undefined,
        splits: splits
          .filter((s) => s.amount > 0)
          .map((s) => ({
            userId: s.userId,
            amount: s.amount,
            percentage: s.percentage,
            shares: s.shares,
          })),
      };

      startTransition(async () => {
        const result = isEditing && expense
          ? await updateExpense(expense.id, payload)
          : await createExpense(payload);

        if (result.success) {
          toast.success(isEditing ? 'Expense updated' : 'Expense added');
          onSuccess?.();
        } else {
          toast.error(result.error ?? 'Something went wrong');
        }
      });
    },
    [
      validate,
      groupId,
      description,
      amount,
      currencyCode,
      category,
      paidBy,
      splitType,
      date,
      notes,
      splits,
      isEditing,
      expense,
      onSuccess,
    ]
  );

  const categoryIcon =
    EXPENSE_CATEGORIES.find((c) => c.value === category)?.icon ?? '📦';

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-24 sm:pb-6">
      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <input
          id="description"
          type="text"
          autoFocus
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What was this expense for?"
          className={cn(
            'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            errors.description && 'border-destructive focus-visible:ring-destructive'
          )}
        />
        {errors.description && (
          <p className="text-xs text-destructive">{errors.description}</p>
        )}
      </div>

      {/* Amount + Currency */}
      <div className="space-y-1.5">
        <Label>Amount</Label>
        <CurrencyInput
          value={amount}
          onChange={setAmount}
          currency={currencyCode}
          onCurrencyChange={setCurrencyCode}
          className={cn(errors.amount && 'border-destructive')}
        />
        {errors.amount && (
          <p className="text-xs text-destructive">{errors.amount}</p>
        )}
      </div>

      {/* Paid by */}
      <div className="space-y-1.5">
        <Label>Paid by</Label>
        <div className="flex flex-wrap gap-2">
          {members.map((m) => {
            const { bg, text } = getAvatarColorClasses(m.avatarColor);
            const isSelected = paidBy === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setPaidBy(m.id)}
                className={cn(
                  'flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                  isSelected
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:border-primary/50 text-muted-foreground hover:text-foreground'
                )}
              >
                <span
                  className={cn(
                    'flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold',
                    bg,
                    text
                  )}
                >
                  {getInitials(m.name)}
                </span>
                {m.name}
              </button>
            );
          })}
        </div>
        {errors.paidBy && (
          <p className="text-xs text-destructive">{errors.paidBy}</p>
        )}
      </div>

      {/* Date */}
      <div className="space-y-1.5">
        <Label htmlFor="date">Date</Label>
        <div className="relative">
          <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={cn(
              'flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              errors.date && 'border-destructive focus-visible:ring-destructive'
            )}
          />
        </div>
        {errors.date && (
          <p className="text-xs text-destructive">{errors.date}</p>
        )}
      </div>

      {/* Category */}
      <div className="space-y-1.5">
        <Label>
          Category{' '}
          <span className="ml-1">{categoryIcon}</span>
        </Label>
        <CategoryPicker value={category} onChange={setCategory} />
        {errors.category && (
          <p className="text-xs text-destructive">{errors.category}</p>
        )}
      </div>

      {/* Split selector */}
      <div className="space-y-1.5">
        <Label>Split</Label>
        <SplitSelector
          members={members}
          totalAmount={amount}
          currency={currencyCode}
          paidBy={paidBy}
          splitType={splitType}
          onSplitTypeChange={setSplitType}
          splits={splits}
          onSplitsChange={setSplits}
          error={errors.splits}
        />
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any additional details..."
          rows={3}
          className="resize-none"
        />
        {errors.notes && (
          <p className="text-xs text-destructive">{errors.notes}</p>
        )}
      </div>

      {/* Submit — sticky on mobile */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border sm:static sm:p-0 sm:bg-transparent sm:border-0">
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          {isEditing ? 'Update Expense' : 'Add Expense'}
        </Button>
      </div>
    </form>
  );
}
