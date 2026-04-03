import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  decimal,
  integer,
  date,
  jsonb,
  pgEnum,
  unique,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const memberRoleEnum = pgEnum('member_role', ['owner', 'admin', 'member']);
export const expenseCategoryEnum = pgEnum('expense_category', [
  'food',
  'transport',
  'accommodation',
  'entertainment',
  'shopping',
  'utilities',
  'health',
  'education',
  'travel',
  'other',
]);
export const splitTypeEnum = pgEnum('split_type', [
  'equal',
  'exact',
  'percentage',
  'shares',
  'adjustment',
]);
export const activityActionEnum = pgEnum('activity_action', [
  'expense_created',
  'expense_updated',
  'expense_deleted',
  'settlement_made',
  'member_joined',
  'member_left',
  'group_created',
  'group_updated',
]);

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  image: text('image'),
  avatarColor: varchar('avatar_color', { length: 20 }).notNull(),
  defaultCurrency: varchar('default_currency', { length: 3 }).default('USD').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Groups table
export const groups = pgTable('groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  image: text('image'),
  defaultCurrency: varchar('default_currency', { length: 3 }).default('USD').notNull(),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),
  simplifyDebts: boolean('simplify_debts').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Group members table
export const groupMembers = pgTable(
  'group_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    groupId: uuid('group_id')
      .notNull()
      .references(() => groups.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    role: memberRoleEnum('role').default('member').notNull(),
    joinedAt: timestamp('joined_at').defaultNow().notNull(),
  },
  (t) => [
    unique().on(t.groupId, t.userId),
    index('group_members_group_id_idx').on(t.groupId),
    index('group_members_user_id_idx').on(t.userId),
  ]
);

// Expenses table
export const expenses = pgTable(
  'expenses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    groupId: uuid('group_id')
      .notNull()
      .references(() => groups.id, { onDelete: 'cascade' }),
    description: varchar('description', { length: 500 }).notNull(),
    amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
    currency: varchar('currency', { length: 3 }).notNull(),
    category: expenseCategoryEnum('category').default('other').notNull(),
    paidBy: uuid('paid_by')
      .notNull()
      .references(() => users.id),
    splitType: splitTypeEnum('split_type').default('equal').notNull(),
    date: date('date').notNull(),
    notes: text('notes'),
    receiptUrl: text('receipt_url'),
    isSettlement: boolean('is_settlement').default(false).notNull(),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('expenses_group_id_date_idx').on(t.groupId, t.date),
    index('expenses_paid_by_idx').on(t.paidBy),
  ]
);

// Expense splits table
export const expenseSplits = pgTable(
  'expense_splits',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    expenseId: uuid('expense_id')
      .notNull()
      .references(() => expenses.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
    percentage: decimal('percentage', { precision: 5, scale: 2 }),
    shares: integer('shares'),
  },
  (t) => [
    index('expense_splits_expense_id_idx').on(t.expenseId),
    index('expense_splits_user_id_idx').on(t.userId),
  ]
);

// Settlements table
export const settlements = pgTable(
  'settlements',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    groupId: uuid('group_id')
      .notNull()
      .references(() => groups.id),
    paidBy: uuid('paid_by')
      .notNull()
      .references(() => users.id),
    paidTo: uuid('paid_to')
      .notNull()
      .references(() => users.id),
    amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
    currency: varchar('currency', { length: 3 }).notNull(),
    note: text('note'),
    settledAt: timestamp('settled_at').defaultNow().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    index('settlements_group_id_idx').on(t.groupId),
    index('settlements_paid_by_idx').on(t.paidBy),
    index('settlements_paid_to_idx').on(t.paidTo),
  ]
);

// Group invites table
export const groupInvites = pgTable(
  'group_invites',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    groupId: uuid('group_id')
      .notNull()
      .references(() => groups.id, { onDelete: 'cascade' }),
    token: varchar('token', { length: 64 }).unique().notNull(),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id),
    expiresAt: timestamp('expires_at').notNull(),
    maxUses: integer('max_uses'),
    useCount: integer('use_count').default(0).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [index('group_invites_token_idx').on(t.token)]
);

// Activity log table
export const activityLog = pgTable(
  'activity_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    groupId: uuid('group_id').references(() => groups.id),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    action: activityActionEnum('action').notNull(),
    metadata: jsonb('metadata').notNull().default({}),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [index('activity_log_group_id_created_at_idx').on(t.groupId, t.createdAt)]
);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  groupMembers: many(groupMembers),
  expensesPaid: many(expenses, { relationName: 'paidBy' }),
  expensesCreated: many(expenses, { relationName: 'createdBy' }),
  expenseSplits: many(expenseSplits),
  settlementsPaid: many(settlements, { relationName: 'paidBy' }),
  settlementsReceived: many(settlements, { relationName: 'paidTo' }),
  activityLogs: many(activityLog),
}));

export const groupsRelations = relations(groups, ({ one, many }) => ({
  creator: one(users, { fields: [groups.createdBy], references: [users.id] }),
  members: many(groupMembers),
  expenses: many(expenses),
  settlements: many(settlements),
  invites: many(groupInvites),
  activityLogs: many(activityLog),
}));

export const groupMembersRelations = relations(groupMembers, ({ one }) => ({
  group: one(groups, { fields: [groupMembers.groupId], references: [groups.id] }),
  user: one(users, { fields: [groupMembers.userId], references: [users.id] }),
}));

export const expensesRelations = relations(expenses, ({ one, many }) => ({
  group: one(groups, { fields: [expenses.groupId], references: [groups.id] }),
  paidByUser: one(users, { fields: [expenses.paidBy], references: [users.id], relationName: 'paidBy' }),
  createdByUser: one(users, { fields: [expenses.createdBy], references: [users.id], relationName: 'createdBy' }),
  splits: many(expenseSplits),
}));

export const expenseSplitsRelations = relations(expenseSplits, ({ one }) => ({
  expense: one(expenses, { fields: [expenseSplits.expenseId], references: [expenses.id] }),
  user: one(users, { fields: [expenseSplits.userId], references: [users.id] }),
}));

export const settlementsRelations = relations(settlements, ({ one }) => ({
  group: one(groups, { fields: [settlements.groupId], references: [groups.id] }),
  paidByUser: one(users, { fields: [settlements.paidBy], references: [users.id], relationName: 'paidBy' }),
  paidToUser: one(users, { fields: [settlements.paidTo], references: [users.id], relationName: 'paidTo' }),
}));

export const groupInvitesRelations = relations(groupInvites, ({ one }) => ({
  group: one(groups, { fields: [groupInvites.groupId], references: [groups.id] }),
  createdByUser: one(users, { fields: [groupInvites.createdBy], references: [users.id] }),
}));

export const activityLogRelations = relations(activityLog, ({ one }) => ({
  group: one(groups, { fields: [activityLog.groupId], references: [groups.id] }),
  user: one(users, { fields: [activityLog.userId], references: [users.id] }),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Group = typeof groups.$inferSelect;
export type NewGroup = typeof groups.$inferInsert;
export type GroupMember = typeof groupMembers.$inferSelect;
export type NewGroupMember = typeof groupMembers.$inferInsert;
export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;
export type ExpenseSplit = typeof expenseSplits.$inferSelect;
export type NewExpenseSplit = typeof expenseSplits.$inferInsert;
export type Settlement = typeof settlements.$inferSelect;
export type NewSettlement = typeof settlements.$inferInsert;
export type GroupInvite = typeof groupInvites.$inferSelect;
export type NewGroupInvite = typeof groupInvites.$inferInsert;
export type ActivityLog = typeof activityLog.$inferSelect;
export type NewActivityLog = typeof activityLog.$inferInsert;
