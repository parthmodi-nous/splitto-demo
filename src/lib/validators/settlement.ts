import { z } from 'zod';

export const createSettlementSchema = z.object({
  groupId: z.string().uuid(),
  paidBy: z.string().uuid(),
  paidTo: z.string().uuid(),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3),
  note: z.string().max(500).optional(),
});

export type CreateSettlementInput = z.infer<typeof createSettlementSchema>;
