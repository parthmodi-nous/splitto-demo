'use server';

import { desc, eq, inArray, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { activityLog, users, groups, groupMembers } from '@/lib/db/schema';
import { requireCurrentUser } from '@/lib/auth';
import type { ActionResponse } from '@/types';
import type { ActivityLogWithUser } from '@/types';

/**
 * Fetch the last 50 activity log entries across all groups the current user belongs to.
 */
export async function getActivityFeed(): Promise<ActionResponse<ActivityLogWithUser[]>> {
  try {
    const currentUser = await requireCurrentUser();

    // Get all group IDs the current user is a member of
    const memberships = await db
      .select({ groupId: groupMembers.groupId })
      .from(groupMembers)
      .where(eq(groupMembers.userId, currentUser.id));

    const groupIds = memberships.map((m) => m.groupId);

    if (groupIds.length === 0) {
      return { success: true, data: [] };
    }

    const logs = await db
      .select()
      .from(activityLog)
      .where(inArray(activityLog.groupId, groupIds))
      .orderBy(desc(activityLog.createdAt))
      .limit(50);

    if (logs.length === 0) {
      return { success: true, data: [] };
    }

    // Bulk-load users and groups referenced by the logs
    const userIds = [...new Set(logs.map((l) => l.userId))];
    const logGroupIds = [...new Set(logs.map((l) => l.groupId).filter((id): id is string => id !== null))];

    const [logUsers, logGroups] = await Promise.all([
      db.select().from(users).where(inArray(users.id, userIds)),
      logGroupIds.length > 0
        ? db.select().from(groups).where(inArray(groups.id, logGroupIds))
        : Promise.resolve([]),
    ]);

    const userMap = new Map(logUsers.map((u) => [u.id, u]));
    const groupMap = new Map(logGroups.map((g) => [g.id, g]));

    const result: ActivityLogWithUser[] = logs
      .map((log) => {
        const user = userMap.get(log.userId);
        if (!user) return null;
        const group = log.groupId ? (groupMap.get(log.groupId) ?? null) : null;
        return { ...log, user, group };
      })
      .filter((entry): entry is ActivityLogWithUser => entry !== null);

    return { success: true, data: result };
  } catch (error) {
    console.error('[getActivityFeed]', error);
    return { success: false, error: 'Failed to fetch activity feed' };
  }
}

/**
 * Fetch activity log entries for a specific group (last 50, newest first).
 */
export async function getGroupActivity(
  groupId: string
): Promise<ActionResponse<ActivityLogWithUser[]>> {
  try {
    const currentUser = await requireCurrentUser();

    // Verify current user is a member of the group
    const [membership] = await db
      .select()
      .from(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.userId, currentUser.id)
        )
      )
      .limit(1);

    if (!membership) {
      return { success: false, error: 'You are not a member of this group' };
    }

    const logs = await db
      .select()
      .from(activityLog)
      .where(eq(activityLog.groupId, groupId))
      .orderBy(desc(activityLog.createdAt))
      .limit(50);

    if (logs.length === 0) {
      return { success: true, data: [] };
    }

    const userIds = [...new Set(logs.map((l) => l.userId))];

    const [logUsers, [group]] = await Promise.all([
      db.select().from(users).where(inArray(users.id, userIds)),
      db.select().from(groups).where(eq(groups.id, groupId)).limit(1),
    ]);

    const userMap = new Map(logUsers.map((u) => [u.id, u]));

    const result: ActivityLogWithUser[] = [];
    for (const log of logs) {
      const user = userMap.get(log.userId);
      if (!user) continue;
      result.push({ ...log, user, group: group ?? null });
    }

    return { success: true, data: result };
  } catch (error) {
    console.error('[getGroupActivity]', error);
    return { success: false, error: 'Failed to fetch group activity' };
  }
}
