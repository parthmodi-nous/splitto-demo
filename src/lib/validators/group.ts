import { z } from 'zod';

export const createGroupSchema = z.object({
  name: z.string().min(1, 'Group name is required').max(255),
  description: z.string().max(1000).optional(),
  defaultCurrency: z.string().length(3).default('USD'),
  simplifyDebts: z.boolean().default(true),
});

export const updateGroupSchema = createGroupSchema.partial().extend({
  name: z.string().min(1).max(255).optional(),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;
