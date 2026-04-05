'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { getCurrentUser, requireCurrentUser } from '@/lib/auth';
import { updateUserPreferencesSchema } from '@/lib/validators/user';
import type { ActionResponse } from '@/types';
import type { User } from '@/lib/db/schema';

export async function getCurrentUserProfile(): Promise<ActionResponse<User>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }
    return { success: true, data: user };
  } catch (error) {
    console.error('[getCurrentUserProfile]', error);
    return { success: false, error: 'Failed to fetch user profile' };
  }
}

export async function updateUserPreferences(
  data: z.infer<typeof updateUserPreferencesSchema>
): Promise<ActionResponse<User>> {
  try {
    const currentUser = await requireCurrentUser();

    const parsed = updateUserPreferencesSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
    }

    const updates: Partial<typeof users.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (parsed.data.name !== undefined) {
      updates.name = parsed.data.name;
    }
    if (parsed.data.defaultCurrency !== undefined) {
      updates.defaultCurrency = parsed.data.defaultCurrency;
    }

    const [updatedUser] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, currentUser.id))
      .returning();

    if (!updatedUser) {
      return { success: false, error: 'Failed to update user preferences' };
    }

    revalidatePath('/', 'layout');
    return { success: true, data: updatedUser };
  } catch (error) {
    console.error('[updateUserPreferences]', error);
    return { success: false, error: 'Failed to update preferences' };
  }
}
