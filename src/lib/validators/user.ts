import { z } from 'zod';

export const updateUserPreferencesSchema = z.object({
  defaultCurrency: z.string().length(3).optional(),
  name: z.string().min(1).max(255).optional(),
});

export const switchUserSchema = z.object({
  userId: z.string().uuid(),
});

export type UpdateUserPreferencesInput = z.infer<typeof updateUserPreferencesSchema>;
export type SwitchUserInput = z.infer<typeof switchUserSchema>;
