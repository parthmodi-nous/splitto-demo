import type {
  User,
  Group,
  GroupMember,
  Expense,
  ExpenseSplit,
  Settlement,
  GroupInvite,
  ActivityLog,
} from '@/lib/db/schema';

export type { User, Group, GroupMember, Expense, ExpenseSplit, Settlement, GroupInvite, ActivityLog };

// Extended types with relations
export type GroupWithMembers = Group & {
  members: Array<GroupMember & { user: User }>;
  creator: User;
};

export type ExpenseWithDetails = Expense & {
  paidByUser: User;
  splits: Array<ExpenseSplit & { user: User }>;
  group: Group;
};

export type GroupMemberWithUser = GroupMember & {
  user: User;
};

export type ActivityLogWithUser = ActivityLog & {
  user: User;
  group: Group | null;
};

export type SettlementWithUsers = Settlement & {
  paidByUser: User;
  paidToUser: User;
};

export interface DebtItem {
  from: User;
  to: User;
  amount: number;
  currency: string;
}

export interface MemberBalance {
  user: User;
  netBalance: number;
  totalPaid: number;
  totalOwed: number;
  currency: string;
}

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

// Re-export for convenience
export type ActionSuccess<T = void> = { success: true; data: T };
export type ActionError = { success: false; error: string };
export type ActionResponse<T = void> = ActionSuccess<T> | ActionError;
