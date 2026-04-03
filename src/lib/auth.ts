// TODO: Replace with real auth
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { MOCK_USER_COOKIE } from '@/lib/constants';
import type { User } from '@/lib/db/schema';

// The single point where the current user is resolved.
// When real auth is added, only this function needs to change.
export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const userId = cookieStore.get(MOCK_USER_COOKIE)?.value;

  if (!userId) return null;

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return user ?? null;
}

// Returns the current user or throws if not found.
// Use this in server actions that require an authenticated user.
export async function requireCurrentUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('No user selected. Please select a demo user to continue.');
  }
  return user;
}
