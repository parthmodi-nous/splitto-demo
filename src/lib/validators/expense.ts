import { z } from 'zod';

export const expenseSplitSchema = z.object({
  userId: z.string().uuid(),
  amount: z.number().min(0),
  percentage: z.number().min(0).max(100).optional(),
  shares: z.number().int().min(0).optional(),
});

export const createExpenseSchema = z.object({
  groupId: z.string().uuid(),
  description: z.string().min(1, 'Description is required').max(500),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3),
  category: z.enum([
    'food',
    'transport',
    'accommodation',
    'entertainment',
    'shopping',
    'utilities',
    'health',
    'education',
    'travel',
    'other',
  ]),
  paidBy: z.string().uuid(),
  splitType: z.enum(['equal', 'exact', 'percentage', 'shares', 'adjustment']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  notes: z.string().max(2000).optional(),
  receiptUrl: z.string().url().optional().or(z.literal('')),
  splits: z.array(expenseSplitSchema).min(1, 'At least one split is required'),
});

export const updateExpenseSchema = createExpenseSchema.omit({ groupId: true }).partial().extend({
  splits: z.array(expenseSplitSchema).min(1).optional(),
});

export const getGroupExpensesSchema = z.object({
  groupId: z.string().uuid(),
  category: z
    .enum([
      'food',
      'transport',
      'accommodation',
      'entertainment',
      'shopping',
      'utilities',
      'health',
      'education',
      'travel',
      'other',
    ])
    .optional(),
  paidBy: z.string().uuid().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type ExpenseSplitInput = z.infer<typeof expenseSplitSchema>;
export type GetGroupExpensesInput = z.infer<typeof getGroupExpensesSchema>;
