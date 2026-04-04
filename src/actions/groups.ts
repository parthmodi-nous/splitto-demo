'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { eq, and, inArray } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { db } from '@/lib/db';
import {
  groups,
  groupMembers,
  users,
  activityLog,
} from '@/lib/db/schema';
import { requireCurrentUser } from '@/lib/auth';
import { createGroupSchema, updateGroupSchema } from '@/lib/validators/group';
import { AVATAR_COLORS } from '@/lib/constants';
import type { ActionResponse } from '@/types';
import type { Group, GroupWithMembers, GroupMemberWithUser } from '@/types';

const uuidSchema = z.string().uuid('Invalid ID format');

// Helper: verify currentUser is a member of a group, return their member record
async function assertGroupMember(groupId: string, userId: string) {
  const [member] = await db
    .select()
    .from(groupMembers)
    .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)))
    .limit(1);

  if (!member) {
    throw new Error('You are not a member of this group');
  }
  return member;
}

export async function createGroup(
  data: z.infer<typeof createGroupSchema>
): Promise<ActionResponse<Group>> {
  try {
    const currentUser = await requireCurrentUser();

    const parsed = createGroupSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
    }

    const [group] = await db
      .insert(groups)
      .values({
        name: parsed.data.name,
        description: parsed.data.description,
        defaultCurrency: parsed.data.defaultCurrency,
        simplifyDebts: parsed.data.simplifyDebts,
        createdBy: currentUser.id,
      })
      .returning();

    if (!group) {
      return { success: false, error: 'Failed to create group' };
    }

    await db.insert(groupMembers).values({
      groupId: group.id,
      userId: currentUser.id,
      role: 'owner',
    });

    // Add guest members by name
    if (parsed.data.memberNames && parsed.data.memberNames.length > 0) {
      const colors = AVATAR_COLORS.map((c) => c.value);
      for (let i = 0; i < parsed.data.memberNames.length; i++) {
        const memberName = parsed.data.memberNames[i];
        if (!memberName) continue;
        const guestId = randomUUID();
        const avatarColor = colors[i % colors.length] ?? 'emerald';
        const [guestUser] = await db
          .insert(users)
          .values({
            id: guestId,
            name: memberName,
            email: `guest-${guestId}@splitto.guest`,
            avatarColor,
          })
          .returning();
        if (guestUser) {
          await db.insert(groupMembers).values({
            groupId: group.id,
            userId: guestUser.id,
            role: 'member',
          });
        }
      }
    }

    await db.insert(activityLog).values({
      groupId: group.id,
      userId: currentUser.id,
      action: 'group_created',
      metadata: { groupName: group.name },
    });

    revalidatePath('/groups');
    return { success: true, data: group };
  } catch (error) {
    console.error('[createGroup]', error);
    return { success: false, error: 'Failed to create group' };
  }
}

export async function updateGroup(
  groupId: string,
  data: z.infer<typeof updateGroupSchema>
): Promise<ActionResponse<Group>> {
  try {
    const currentUser = await requireCurrentUser();

    const idParsed = uuidSchema.safeParse(groupId);
    if (!idParsed.success) {
      return { success: false, error: 'Invalid group ID' };
    }

    const parsed = updateGroupSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
    }

    const member = await assertGroupMember(groupId, currentUser.id);
    if (member.role !== 'owner' && member.role !== 'admin') {
      return { success: false, error: 'Only owners and admins can update groups' };
    }

    const [updatedGroup] = await db
      .update(groups)
      .set({
        ...parsed.data,
        updatedAt: new Date(),
      })
      .where(eq(groups.id, groupId))
      .returning();

    if (!updatedGroup) {
      return { success: false, error: 'Group not found' };
    }

    await db.insert(activityLog).values({
      groupId,
      userId: currentUser.id,
      action: 'group_updated',
      metadata: { groupName: updatedGroup.name },
    });

    revalidatePath(`/groups/${groupId}`);
    revalidatePath('/groups');
    return { success: true, data: updatedGroup };
  } catch (error) {
    console.error('[updateGroup]', error);
    if (error instanceof Error && error.message === 'You are not a member of this group') {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to update group' };
  }
}

export async function deleteGroup(groupId: string): Promise<ActionResponse<void>> {
  try {
    const currentUser = await requireCurrentUser();

    const idParsed = uuidSchema.safeParse(groupId);
    if (!idParsed.success) {
      return { success: false, error: 'Invalid group ID' };
    }

    const member = await assertGroupMember(groupId, currentUser.id);
    if (member.role !== 'owner') {
      return { success: false, error: 'Only the owner can delete a group' };
    }

    await db.delete(groups).where(eq(groups.id, groupId));

    revalidatePath('/groups');
    return { success: true, data: undefined };
  } catch (error) {
    console.error('[deleteGroup]', error);
    if (error instanceof Error && error.message === 'You are not a member of this group') {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to delete group' };
  }
}

export async function leaveGroup(groupId: string): Promise<ActionResponse<void>> {
  try {
    const currentUser = await requireCurrentUser();

    const idParsed = uuidSchema.safeParse(groupId);
    if (!idParsed.success) {
      return { success: false, error: 'Invalid group ID' };
    }

    await assertGroupMember(groupId, currentUser.id);

    await db
      .delete(groupMembers)
      .where(
        and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, currentUser.id))
      );

    await db.insert(activityLog).values({
      groupId,
      userId: currentUser.id,
      action: 'member_left',
      metadata: {},
    });

    revalidatePath('/groups');
    return { success: true, data: undefined };
  } catch (error) {
    console.error('[leaveGroup]', error);
    if (error instanceof Error && error.message === 'You are not a member of this group') {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to leave group' };
  }
}

export async function removeMember(
  groupId: string,
  userId: string
): Promise<ActionResponse<void>> {
  try {
    const currentUser = await requireCurrentUser();

    const groupIdParsed = uuidSchema.safeParse(groupId);
    const userIdParsed = uuidSchema.safeParse(userId);
    if (!groupIdParsed.success || !userIdParsed.success) {
      return { success: false, error: 'Invalid ID format' };
    }

    const currentMember = await assertGroupMember(groupId, currentUser.id);
    if (currentMember.role !== 'owner' && currentMember.role !== 'admin') {
      return { success: false, error: 'Only owners and admins can remove members' };
    }

    if (userId === currentUser.id) {
      return { success: false, error: 'Use leaveGroup to remove yourself' };
    }

    await db
      .delete(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)));

    revalidatePath(`/groups/${groupId}`);
    return { success: true, data: undefined };
  } catch (error) {
    console.error('[removeMember]', error);
    if (error instanceof Error && error.message === 'You are not a member of this group') {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to remove member' };
  }
}

export async function getGroupWithMembers(
  groupId: string
): Promise<ActionResponse<GroupWithMembers>> {
  try {
    const currentUser = await requireCurrentUser();

    const idParsed = uuidSchema.safeParse(groupId);
    if (!idParsed.success) {
      return { success: false, error: 'Invalid group ID' };
    }

    await assertGroupMember(groupId, currentUser.id);

    const [group] = await db.select().from(groups).where(eq(groups.id, groupId)).limit(1);
    if (!group) {
      return { success: false, error: 'Group not found' };
    }

    const members = await db
      .select({
        id: groupMembers.id,
        groupId: groupMembers.groupId,
        userId: groupMembers.userId,
        role: groupMembers.role,
        joinedAt: groupMembers.joinedAt,
        user: users,
      })
      .from(groupMembers)
      .innerJoin(users, eq(groupMembers.userId, users.id))
      .where(eq(groupMembers.groupId, groupId));

    const [creator] = await db
      .select()
      .from(users)
      .where(eq(users.id, group.createdBy))
      .limit(1);

    if (!creator) {
      return { success: false, error: 'Group creator not found' };
    }

    return {
      success: true,
      data: {
        ...group,
        members,
        creator,
      },
    };
  } catch (error) {
    console.error('[getGroupWithMembers]', error);
    if (error instanceof Error && error.message === 'You are not a member of this group') {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to fetch group' };
  }
}

export async function getUserGroups(): Promise<
  ActionResponse<Array<Group & { memberCount: number; userRole: string }>>
> {
  try {
    const currentUser = await requireCurrentUser();

    // Get all group IDs for the current user
    const userMemberships = await db
      .select()
      .from(groupMembers)
      .where(eq(groupMembers.userId, currentUser.id));

    if (userMemberships.length === 0) {
      return { success: true, data: [] };
    }

    const groupIds = userMemberships.map((m) => m.groupId);

    const userGroups = await db
      .select()
      .from(groups)
      .where(inArray(groups.id, groupIds));

    // Get member counts for all groups
    const allMembers = await db
      .select()
      .from(groupMembers)
      .where(inArray(groupMembers.groupId, groupIds));

    const memberCountByGroup = allMembers.reduce<Record<string, number>>((acc, m) => {
      acc[m.groupId] = (acc[m.groupId] ?? 0) + 1;
      return acc;
    }, {});

    const roleByGroup = userMemberships.reduce<Record<string, string>>((acc, m) => {
      acc[m.groupId] = m.role;
      return acc;
    }, {});

    const result = userGroups.map((group) => ({
      ...group,
      memberCount: memberCountByGroup[group.id] ?? 0,
      userRole: roleByGroup[group.id] ?? 'member',
    }));

    return { success: true, data: result };
  } catch (error) {
    console.error('[getUserGroups]', error);
    return { success: false, error: 'Failed to fetch groups' };
  }
}

export async function addMemberByUserId(
  groupId: string,
  userId: string
): Promise<ActionResponse<GroupMemberWithUser>> {
  try {
    const currentUser = await requireCurrentUser();

    const groupIdParsed = uuidSchema.safeParse(groupId);
    const userIdParsed = uuidSchema.safeParse(userId);
    if (!groupIdParsed.success || !userIdParsed.success) {
      return { success: false, error: 'Invalid ID format' };
    }

    const currentMember = await assertGroupMember(groupId, currentUser.id);
    if (currentMember.role !== 'owner' && currentMember.role !== 'admin') {
      return { success: false, error: 'Only owners and admins can add members' };
    }

    // Check if user exists
    const [targetUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!targetUser) {
      return { success: false, error: 'User not found' };
    }

    // Check if already a member
    const existing = await db
      .select()
      .from(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)))
      .limit(1);

    if (existing.length > 0) {
      return { success: false, error: 'User is already a member of this group' };
    }

    const [newMember] = await db
      .insert(groupMembers)
      .values({
        groupId,
        userId,
        role: 'member',
      })
      .returning();

    if (!newMember) {
      return { success: false, error: 'Failed to add member' };
    }

    await db.insert(activityLog).values({
      groupId,
      userId,
      action: 'member_joined',
      metadata: { addedBy: currentUser.id },
    });

    revalidatePath(`/groups/${groupId}`);
    return { success: true, data: { ...newMember, user: targetUser } };
  } catch (error) {
    console.error('[addMemberByUserId]', error);
    if (error instanceof Error && error.message === 'You are not a member of this group') {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to add member' };
  }
}
