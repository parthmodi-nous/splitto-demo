'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { eq, and, desc, inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  expenses,
  expenseSplits,
  groupMembers,
  users,
  groups,
  activityLog,
} from '@/lib/db/schema';
import { requireCurrentUser } from '@/lib/auth';
import {
  createExpenseSchema,
  updateExpenseSchema,
  getGroupExpensesSchema,
} from '@/lib/validators/expense';
import type { ActionResponse } from '@/types';
import type { Expense, ExpenseWithDetails } from '@/types';

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

export async function createExpense(
  data: z.infer<typeof createExpenseSchema>
): Promise<ActionResponse<Expense>> {
  try {
    const currentUser = await requireCurrentUser();

    const parsed = createExpenseSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
    }

    await assertGroupMember(parsed.data.groupId, currentUser.id);

    const [expense] = await db
      .insert(expenses)
      .values({
        groupId: parsed.data.groupId,
        description: parsed.data.description,
        amount: String(parsed.data.amount),
        currency: parsed.data.currency,
        category: parsed.data.category,
        paidBy: parsed.data.paidBy,
        splitType: parsed.data.splitType,
        date: parsed.data.date,
        notes: parsed.data.notes,
        receiptUrl: parsed.data.receiptUrl || null,
        isSettlement: false,
        createdBy: currentUser.id,
      })
      .returning();

    if (!expense) {
      return { success: false, error: 'Failed to create expense' };
    }

    if (parsed.data.splits.length > 0) {
      await db.insert(expenseSplits).values(
        parsed.data.splits.map((split) => ({
          expenseId: expense.id,
          userId: split.userId,
          amount: String(split.amount),
          percentage: split.percentage !== undefined ? String(split.percentage) : null,
          shares: split.shares ?? null,
        }))
      );
    }

    await db.insert(activityLog).values({
      groupId: parsed.data.groupId,
      userId: currentUser.id,
      action: 'expense_created',
      metadata: {
        expenseId: expense.id,
        description: expense.description,
        amount: expense.amount,
        currency: expense.currency,
      },
    });

    revalidatePath(`/groups/${parsed.data.groupId}`);
    revalidatePath(`/groups/${parsed.data.groupId}/expenses`);
    return { success: true, data: expense };
  } catch (error) {
    console.error('[createExpense]', error);
    if (error instanceof Error && error.message === 'You are not a member of this group') {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to create expense' };
  }
}

export async function updateExpense(
  expenseId: string,
  data: z.infer<typeof updateExpenseSchema>
): Promise<ActionResponse<Expense>> {
  try {
    const currentUser = await requireCurrentUser();

    const idParsed = uuidSchema.safeParse(expenseId);
    if (!idParsed.success) {
      return { success: false, error: 'Invalid expense ID' };
    }

    const parsed = updateExpenseSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
    }

    const [existingExpense] = await db
      .select()
      .from(expenses)
      .where(eq(expenses.id, expenseId))
      .limit(1);

    if (!existingExpense) {
      return { success: false, error: 'Expense not found' };
    }

    await assertGroupMember(existingExpense.groupId, currentUser.id);

    const updateValues: Partial<typeof expenses.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (parsed.data.description !== undefined) updateValues.description = parsed.data.description;
    if (parsed.data.amount !== undefined) updateValues.amount = String(parsed.data.amount);
    if (parsed.data.currency !== undefined) updateValues.currency = parsed.data.currency;
    if (parsed.data.category !== undefined) updateValues.category = parsed.data.category;
    if (parsed.data.paidBy !== undefined) updateValues.paidBy = parsed.data.paidBy;
    if (parsed.data.splitType !== undefined) updateValues.splitType = parsed.data.splitType;
    if (parsed.data.date !== undefined) updateValues.date = parsed.data.date;
    if (parsed.data.notes !== undefined) updateValues.notes = parsed.data.notes;
    if (parsed.data.receiptUrl !== undefined) {
      updateValues.receiptUrl = parsed.data.receiptUrl || null;
    }

    const [updatedExpense] = await db
      .update(expenses)
      .set(updateValues)
      .where(eq(expenses.id, expenseId))
      .returning();

    if (!updatedExpense) {
      return { success: false, error: 'Failed to update expense' };
    }

    if (parsed.data.splits !== undefined) {
      await db.delete(expenseSplits).where(eq(expenseSplits.expenseId, expenseId));
      await db.insert(expenseSplits).values(
        parsed.data.splits.map((split) => ({
          expenseId,
          userId: split.userId,
          amount: String(split.amount),
          percentage: split.percentage !== undefined ? String(split.percentage) : null,
          shares: split.shares ?? null,
        }))
      );
    }

    await db.insert(activityLog).values({
      groupId: existingExpense.groupId,
      userId: currentUser.id,
      action: 'expense_updated',
      metadata: {
        expenseId,
        description: updatedExpense.description,
      },
    });

    revalidatePath(`/groups/${existingExpense.groupId}`);
    revalidatePath(`/groups/${existingExpense.groupId}/expenses`);
    revalidatePath(`/groups/${existingExpense.groupId}/expenses/${expenseId}`);
    return { success: true, data: updatedExpense };
  } catch (error) {
    console.error('[updateExpense]', error);
    if (error instanceof Error && error.message === 'You are not a member of this group') {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to update expense' };
  }
}

export async function deleteExpense(expenseId: string): Promise<ActionResponse<void>> {
  try {
    const currentUser = await requireCurrentUser();

    const idParsed = uuidSchema.safeParse(expenseId);
    if (!idParsed.success) {
      return { success: false, error: 'Invalid expense ID' };
    }

    const [existingExpense] = await db
      .select()
      .from(expenses)
      .where(eq(expenses.id, expenseId))
      .limit(1);

    if (!existingExpense) {
      return { success: false, error: 'Expense not found' };
    }

    await assertGroupMember(existingExpense.groupId, currentUser.id);

    await db.delete(expenses).where(eq(expenses.id, expenseId));

    await db.insert(activityLog).values({
      groupId: existingExpense.groupId,
      userId: currentUser.id,
      action: 'expense_deleted',
      metadata: {
        expenseId,
        description: existingExpense.description,
        amount: existingExpense.amount,
        currency: existingExpense.currency,
      },
    });

    revalidatePath(`/groups/${existingExpense.groupId}`);
    revalidatePath(`/groups/${existingExpense.groupId}/expenses`);
    return { success: true, data: undefined };
  } catch (error) {
    console.error('[deleteExpense]', error);
    if (error instanceof Error && error.message === 'You are not a member of this group') {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to delete expense' };
  }
}

export async function getGroupExpenses(
  groupId: string,
  filters?: {
    category?: z.infer<typeof getGroupExpensesSchema>['category'];
    paidBy?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }
): Promise<ActionResponse<{ expenses: ExpenseWithDetails[]; total: number; page: number; limit: number }>> {
  try {
    const currentUser = await requireCurrentUser();

    const parsed = getGroupExpensesSchema.safeParse({ groupId, ...filters });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
    }

    await assertGroupMember(groupId, currentUser.id);

    // Fetch expenses for the group ordered by date DESC
    const allExpenses = await db
      .select()
      .from(expenses)
      .where(eq(expenses.groupId, groupId))
      .orderBy(desc(expenses.date));

    // Apply filters in-memory for simplicity and type safety
    let filtered = allExpenses;

    if (parsed.data.category) {
      filtered = filtered.filter((e) => e.category === parsed.data.category);
    }
    if (parsed.data.paidBy) {
      filtered = filtered.filter((e) => e.paidBy === parsed.data.paidBy);
    }
    if (parsed.data.from) {
      filtered = filtered.filter((e) => e.date >= parsed.data.from!);
    }
    if (parsed.data.to) {
      filtered = filtered.filter((e) => e.date <= parsed.data.to!);
    }

    const total = filtered.length;
    const page = parsed.data.page;
    const limit = parsed.data.limit;
    const offset = (page - 1) * limit;
    const paginated = filtered.slice(offset, offset + limit);

    if (paginated.length === 0) {
      return { success: true, data: { expenses: [], total, page, limit } };
    }

    const expenseIds = paginated.map((e) => e.id);
    const paidByIds = [...new Set(paginated.map((e) => e.paidBy))];

    // Fetch splits and users in bulk
    const splits = await db
      .select({
        id: expenseSplits.id,
        expenseId: expenseSplits.expenseId,
        userId: expenseSplits.userId,
        amount: expenseSplits.amount,
        percentage: expenseSplits.percentage,
        shares: expenseSplits.shares,
        user: users,
      })
      .from(expenseSplits)
      .innerJoin(users, eq(expenseSplits.userId, users.id))
      .where(inArray(expenseSplits.expenseId, expenseIds));

    const paidByUsers = await db
      .select()
      .from(users)
      .where(inArray(users.id, paidByIds));

    const paidByMap = new Map(paidByUsers.map((u) => [u.id, u]));

    const splitsByExpense = splits.reduce<Record<string, typeof splits>>((acc, s) => {
      if (!acc[s.expenseId]) acc[s.expenseId] = [];
      acc[s.expenseId]!.push(s);
      return acc;
    }, {});

    // Fetch the group record once
    const [group] = await db.select().from(groups).where(eq(groups.id, groupId)).limit(1);
    if (!group) {
      return { success: false, error: 'Group not found' };
    }

    const result: ExpenseWithDetails[] = paginated.map((expense) => ({
      ...expense,
      paidByUser: paidByMap.get(expense.paidBy)!,
      splits: splitsByExpense[expense.id] ?? [],
      group,
    }));

    return { success: true, data: { expenses: result, total, page, limit } };
  } catch (error) {
    console.error('[getGroupExpenses]', error);
    if (error instanceof Error && error.message === 'You are not a member of this group') {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to fetch expenses' };
  }
}

export async function getExpenseById(
  expenseId: string
): Promise<ActionResponse<ExpenseWithDetails>> {
  try {
    const currentUser = await requireCurrentUser();

    const idParsed = uuidSchema.safeParse(expenseId);
    if (!idParsed.success) {
      return { success: false, error: 'Invalid expense ID' };
    }

    const [expense] = await db
      .select()
      .from(expenses)
      .where(eq(expenses.id, expenseId))
      .limit(1);

    if (!expense) {
      return { success: false, error: 'Expense not found' };
    }

    await assertGroupMember(expense.groupId, currentUser.id);

    const splits = await db
      .select({
        id: expenseSplits.id,
        expenseId: expenseSplits.expenseId,
        userId: expenseSplits.userId,
        amount: expenseSplits.amount,
        percentage: expenseSplits.percentage,
        shares: expenseSplits.shares,
        user: users,
      })
      .from(expenseSplits)
      .innerJoin(users, eq(expenseSplits.userId, users.id))
      .where(eq(expenseSplits.expenseId, expenseId));

    const [paidByUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, expense.paidBy))
      .limit(1);

    const [group] = await db
      .select()
      .from(groups)
      .where(eq(groups.id, expense.groupId))
      .limit(1);

    if (!paidByUser || !group) {
      return { success: false, error: 'Associated data not found' };
    }

    return {
      success: true,
      data: {
        ...expense,
        paidByUser,
        splits,
        group,
      },
    };
  } catch (error) {
    console.error('[getExpenseById]', error);
    if (error instanceof Error && error.message === 'You are not a member of this group') {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to fetch expense' };
  }
}
