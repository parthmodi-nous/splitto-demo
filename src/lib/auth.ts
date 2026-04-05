import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { cache } from 'react';
import { headers } from 'next/headers';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users, sessions, accounts, verifications } from '@/lib/db/schema';
import { AVATAR_COLORS } from '@/lib/constants';
import type { User } from '@/lib/db/schema';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: users,
      session: sessions,
      account: accounts,
      verification: verifications,
    },
  }),

  advanced: {
    // Use UUID format for all generated IDs — required because our
    // users.id (and all FK references) are uuid type in PostgreSQL.
    database: {
      generateId: 'uuid',
    },
  },

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },

  user: {
    additionalFields: {
      avatarColor: {
        type: 'string',
        required: false,
        defaultValue: 'blue',
        input: false,
      },
      defaultCurrency: {
        type: 'string',
        required: false,
        defaultValue: 'USD',
        input: true,
      },
    },
  },

  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const colors = AVATAR_COLORS.map((c) => c.value);
          const randomColor = colors[Math.floor(Math.random() * colors.length)] ?? 'blue';
          return {
            data: {
              ...user,
              avatarColor: randomColor,
            },
          };
        },
      },
    },
  },
});

// Cached session fetch — deduped per request so layout + page + actions
// never make more than one DB session lookup per render cycle.
const getSessionCached = cache(async () => {
  try {
    return await auth.api.getSession({ headers: await headers() });
  } catch {
    return null;
  }
});

// Cached user fetch — deduped per request.
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const session = await getSessionCached();
  if (!session?.user?.id) return null;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  return user ?? null;
});

// Returns the current user or throws if unauthenticated.
export async function requireCurrentUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');
  return user;
}
