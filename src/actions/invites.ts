'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { db } from '@/lib/db';
import {
  groupInvites,
  groupMembers,
  activityLog,
  users,
} from '@/lib/db/schema';
import { requireCurrentUser } from '@/lib/auth';
import type { ActionResponse } from '@/types';
import type { GroupInvite } from '@/types';

const uuidSchema = z.string().uuid('Invalid ID format');

const createInviteLinkSchema = z.object({
  groupId: z.string().uuid(),
  maxUses: z.number().int().positive().optional(),
  expiresInDays: z.number().int().positive().default(7),
});

const acceptInviteSchema = z.object({
  token: z.string().min(1, 'Token is required').max(64),
});

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

export async function createInviteLink(
  groupId: string,
  options?: { maxUses?: number; expiresInDays?: number }
): Promise<ActionResponse<GroupInvite>> {
  try {
    const currentUser = await requireCurrentUser();

    const parsed = createInviteLinkSchema.safeParse({
      groupId,
      maxUses: options?.maxUses,
      expiresInDays: options?.expiresInDays ?? 7,
    });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
    }

    const member = await assertGroupMember(parsed.data.groupId, currentUser.id);
    if (member.role !== 'owner' && member.role !== 'admin') {
      return { success: false, error: 'Only owners and admins can create invite links' };
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + parsed.data.expiresInDays);

    const [invite] = await db
      .insert(groupInvites)
      .values({
        groupId: parsed.data.groupId,
        token,
        createdBy: currentUser.id,
        expiresAt,
        maxUses: parsed.data.maxUses ?? null,
        useCount: 0,
      })
      .returning();

    if (!invite) {
      return { success: false, error: 'Failed to create invite link' };
    }

    return { success: true, data: invite };
  } catch (error) {
    console.error('[createInviteLink]', error);
    if (error instanceof Error && error.message === 'You are not a member of this group') {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to create invite link' };
  }
}

export async function acceptInvite(token: string): Promise<ActionResponse<{ groupId: string }>> {
  try {
    const currentUser = await requireCurrentUser();

    const parsed = acceptInviteSchema.safeParse({ token });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid token' };
    }

    const [invite] = await db
      .select()
      .from(groupInvites)
      .where(eq(groupInvites.token, parsed.data.token))
      .limit(1);

    if (!invite) {
      return { success: false, error: 'Invite not found or invalid' };
    }

    // Check if expired
    if (invite.expiresAt < new Date()) {
      return { success: false, error: 'This invite link has expired' };
    }

    // Check if maxUses reached
    if (invite.maxUses !== null && invite.useCount >= invite.maxUses) {
      return { success: false, error: 'This invite link has reached its maximum number of uses' };
    }

    // Check if user is already a member
    const [existingMember] = await db
      .select()
      .from(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, invite.groupId),
          eq(groupMembers.userId, currentUser.id)
        )
      )
      .limit(1);

    if (existingMember) {
      return { success: false, error: 'You are already a member of this group' };
    }

    // Add user to group
    await db.insert(groupMembers).values({
      groupId: invite.groupId,
      userId: currentUser.id,
      role: 'member',
    });

    // Increment useCount
    await db
      .update(groupInvites)
      .set({ useCount: invite.useCount + 1 })
      .where(eq(groupInvites.id, invite.id));

    // Log activity
    await db.insert(activityLog).values({
      groupId: invite.groupId,
      userId: currentUser.id,
      action: 'member_joined',
      metadata: { inviteToken: token, inviteId: invite.id },
    });

    revalidatePath('/groups');
    revalidatePath(`/groups/${invite.groupId}`);
    return { success: true, data: { groupId: invite.groupId } };
  } catch (error) {
    console.error('[acceptInvite]', error);
    return { success: false, error: 'Failed to accept invite' };
  }
}

export async function revokeInvite(inviteId: string): Promise<ActionResponse<void>> {
  try {
    const currentUser = await requireCurrentUser();

    const idParsed = uuidSchema.safeParse(inviteId);
    if (!idParsed.success) {
      return { success: false, error: 'Invalid invite ID' };
    }

    const [invite] = await db
      .select()
      .from(groupInvites)
      .where(eq(groupInvites.id, inviteId))
      .limit(1);

    if (!invite) {
      return { success: false, error: 'Invite not found' };
    }

    const member = await assertGroupMember(invite.groupId, currentUser.id);
    if (member.role !== 'owner' && member.role !== 'admin') {
      return { success: false, error: 'Only owners and admins can revoke invites' };
    }

    await db.delete(groupInvites).where(eq(groupInvites.id, inviteId));

    revalidatePath(`/groups/${invite.groupId}`);
    return { success: true, data: undefined };
  } catch (error) {
    console.error('[revokeInvite]', error);
    if (error instanceof Error && error.message === 'You are not a member of this group') {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to revoke invite' };
  }
}

export async function getGroupInvites(
  groupId: string
): Promise<ActionResponse<GroupInvite[]>> {
  try {
    const currentUser = await requireCurrentUser();

    const idParsed = uuidSchema.safeParse(groupId);
    if (!idParsed.success) {
      return { success: false, error: 'Invalid group ID' };
    }

    await assertGroupMember(groupId, currentUser.id);

    const invites = await db
      .select()
      .from(groupInvites)
      .where(eq(groupInvites.groupId, groupId));

    return { success: true, data: invites };
  } catch (error) {
    console.error('[getGroupInvites]', error);
    if (error instanceof Error && error.message === 'You are not a member of this group') {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to fetch invites' };
  }
}
