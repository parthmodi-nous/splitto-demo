'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  settlements,
  groupMembers,
  expenses,
  expenseSplits,
  users,
  activityLog,
  groups,
} from '@/lib/db/schema';
import { requireCurrentUser } from '@/lib/auth';
import { createSettlementSchema } from '@/lib/validators/settlement';
import { calculateNetBalances, simplifyDebts } from '@/lib/algorithms/simplify-debts';
import { convertCurrency } from '@/lib/currencies';
import type { ActionResponse } from '@/types';
import type { Settlement, MemberBalance, SettlementWithUsers, User } from '@/types';
import type { DebtTransaction } from '@/lib/algorithms/simplify-debts';

const uuidSchema = z.string().uuid('Invalid ID format');

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

export async function recordSettlement(
  data: z.infer<typeof createSettlementSchema>
): Promise<ActionResponse<Settlement>> {
  try {
    const currentUser = await requireCurrentUser();

    const parsed = createSettlementSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
    }

    await assertGroupMember(parsed.data.groupId, currentUser.id);

    const [settlement] = await db
      .insert(settlements)
      .values({
        groupId: parsed.data.groupId,
        paidBy: parsed.data.paidBy,
        paidTo: parsed.data.paidTo,
        amount: String(parsed.data.amount),
        currency: parsed.data.currency,
        note: parsed.data.note,
      })
      .returning();

    if (!settlement) {
      return { success: false, error: 'Failed to record settlement' };
    }

    await db.insert(activityLog).values({
      groupId: parsed.data.groupId,
      userId: currentUser.id,
      action: 'settlement_made',
      metadata: {
        settlementId: settlement.id,
        paidBy: parsed.data.paidBy,
        paidTo: parsed.data.paidTo,
        amount: parsed.data.amount,
        currency: parsed.data.currency,
      },
    });

    revalidatePath(`/groups/${parsed.data.groupId}`);
    revalidatePath(`/groups/${parsed.data.groupId}/balances`);
    return { success: true, data: settlement };
  } catch (error) {
    console.error('[recordSettlement]', error);
    if (error instanceof Error && error.message === 'You are not a member of this group') {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to record settlement' };
  }
}

export async function getGroupBalances(
  groupId: string
): Promise<ActionResponse<MemberBalance[]>> {
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

    // Fetch all expenses with their splits for the group
    const groupExpenses = await db
      .select({
        id: expenses.id,
        paidBy: expenses.paidBy,
        amount: expenses.amount,
        currency: expenses.currency,
      })
      .from(expenses)
      .where(eq(expenses.groupId, groupId));

    const expenseIds = groupExpenses.map((e) => e.id);

    let splits: Array<{ expenseId: string; userId: string; amount: string }> = [];
    if (expenseIds.length > 0) {
      const { inArray } = await import('drizzle-orm');
      splits = await db
        .select({
          expenseId: expenseSplits.expenseId,
          userId: expenseSplits.userId,
          amount: expenseSplits.amount,
        })
        .from(expenseSplits)
        .where(inArray(expenseSplits.expenseId, expenseIds));
    }

    const splitsByExpense = splits.reduce<Record<string, Array<{ userId: string; amount: string }>>>(
      (acc, s) => {
        if (!acc[s.expenseId]) acc[s.expenseId] = [];
        acc[s.expenseId]!.push({ userId: s.userId, amount: s.amount });
        return acc;
      },
      {}
    );

    const expensesWithSplits = groupExpenses.map((e) => ({
      paidBy: e.paidBy,
      amount: e.amount,
      currency: e.currency,
      splits: splitsByExpense[e.id] ?? [],
    }));

    // Fetch all settlements for the group
    const groupSettlements = await db
      .select({
        paidBy: settlements.paidBy,
        paidTo: settlements.paidTo,
        amount: settlements.amount,
      })
      .from(settlements)
      .where(eq(settlements.groupId, groupId));

    const netBalances = calculateNetBalances(
      expensesWithSplits,
      groupSettlements,
      group.defaultCurrency,
      convertCurrency
    );

    // Get all members and their user data
    const members = await db
      .select({
        userId: groupMembers.userId,
        user: users,
      })
      .from(groupMembers)
      .innerJoin(users, eq(groupMembers.userId, users.id))
      .where(eq(groupMembers.groupId, groupId));

    // Build MemberBalance array
    const memberBalances: MemberBalance[] = members.map(({ userId, user }) => {
      const netBalance = netBalances[userId] ?? 0;

      // totalPaid: sum of amounts for expenses paidBy this user (in group currency)
      const totalPaid = expensesWithSplits
        .filter((e) => e.paidBy === userId)
        .reduce(
          (sum, e) =>
            sum + convertCurrency(parseFloat(e.amount), e.currency, group.defaultCurrency),
          0
        );

      // totalOwed: sum of split amounts for this user (in group currency)
      const totalOwed = expensesWithSplits.reduce((sum, e) => {
        const userSplit = e.splits.find((s) => s.userId === userId);
        if (!userSplit) return sum;
        return sum + convertCurrency(parseFloat(userSplit.amount), e.currency, group.defaultCurrency);
      }, 0);

      return {
        user,
        netBalance: Math.round(netBalance * 100) / 100,
        totalPaid: Math.round(totalPaid * 100) / 100,
        totalOwed: Math.round(totalOwed * 100) / 100,
        currency: group.defaultCurrency,
      };
    });

    return { success: true, data: memberBalances };
  } catch (error) {
    console.error('[getGroupBalances]', error);
    if (error instanceof Error && error.message === 'You are not a member of this group') {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to calculate group balances' };
  }
}

export async function getSimplifiedDebts(
  groupId: string
): Promise<ActionResponse<Array<DebtTransaction & { fromUser: User; toUser: User }>>> {
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

    // Fetch expenses with splits
    const groupExpenses = await db
      .select({
        id: expenses.id,
        paidBy: expenses.paidBy,
        amount: expenses.amount,
        currency: expenses.currency,
      })
      .from(expenses)
      .where(eq(expenses.groupId, groupId));

    const expenseIds = groupExpenses.map((e) => e.id);

    let splits: Array<{ expenseId: string; userId: string; amount: string }> = [];
    if (expenseIds.length > 0) {
      const { inArray } = await import('drizzle-orm');
      splits = await db
        .select({
          expenseId: expenseSplits.expenseId,
          userId: expenseSplits.userId,
          amount: expenseSplits.amount,
        })
        .from(expenseSplits)
        .where(inArray(expenseSplits.expenseId, expenseIds));
    }

    const splitsByExpense = splits.reduce<Record<string, Array<{ userId: string; amount: string }>>>(
      (acc, s) => {
        if (!acc[s.expenseId]) acc[s.expenseId] = [];
        acc[s.expenseId]!.push({ userId: s.userId, amount: s.amount });
        return acc;
      },
      {}
    );

    const expensesWithSplits = groupExpenses.map((e) => ({
      paidBy: e.paidBy,
      amount: e.amount,
      currency: e.currency,
      splits: splitsByExpense[e.id] ?? [],
    }));

    const groupSettlements = await db
      .select({
        paidBy: settlements.paidBy,
        paidTo: settlements.paidTo,
        amount: settlements.amount,
      })
      .from(settlements)
      .where(eq(settlements.groupId, groupId));

    const netBalances = calculateNetBalances(
      expensesWithSplits,
      groupSettlements,
      group.defaultCurrency,
      convertCurrency
    );

    const debtTransactions = simplifyDebts(netBalances, group.defaultCurrency);

    // Attach user objects
    const involvedUserIds = [
      ...new Set(debtTransactions.flatMap((d) => [d.from, d.to])),
    ];

    let userMap = new Map<string, User>();
    if (involvedUserIds.length > 0) {
      const { inArray } = await import('drizzle-orm');
      const involvedUsers = await db
        .select()
        .from(users)
        .where(inArray(users.id, involvedUserIds));
      userMap = new Map(involvedUsers.map((u) => [u.id, u]));
    }

    const result = debtTransactions
      .map((debt) => {
        const fromUser = userMap.get(debt.from);
        const toUser = userMap.get(debt.to);
        if (!fromUser || !toUser) return null;
        return { ...debt, fromUser, toUser };
      })
      .filter((d): d is DebtTransaction & { fromUser: User; toUser: User } => d !== null);

    return { success: true, data: result };
  } catch (error) {
    console.error('[getSimplifiedDebts]', error);
    if (error instanceof Error && error.message === 'You are not a member of this group') {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to calculate simplified debts' };
  }
}

export async function getSettlementHistory(
  groupId: string
): Promise<ActionResponse<SettlementWithUsers[]>> {
  try {
    const currentUser = await requireCurrentUser();

    const idParsed = uuidSchema.safeParse(groupId);
    if (!idParsed.success) {
      return { success: false, error: 'Invalid group ID' };
    }

    await assertGroupMember(groupId, currentUser.id);

    const paidByUser = await db
      .select()
      .from(users);

    const allUsers = new Map(paidByUser.map((u) => [u.id, u]));

    const groupSettlements = await db
      .select()
      .from(settlements)
      .where(eq(settlements.groupId, groupId))
      .orderBy(settlements.settledAt);

    const result: SettlementWithUsers[] = groupSettlements
      .map((s) => {
        const pbu = allUsers.get(s.paidBy);
        const ptu = allUsers.get(s.paidTo);
        if (!pbu || !ptu) return null;
        return {
          ...s,
          paidByUser: pbu,
          paidToUser: ptu,
        };
      })
      .filter((s): s is SettlementWithUsers => s !== null);

    return { success: true, data: result };
  } catch (error) {
    console.error('[getSettlementHistory]', error);
    if (error instanceof Error && error.message === 'You are not a member of this group') {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to fetch settlement history' };
  }
}
