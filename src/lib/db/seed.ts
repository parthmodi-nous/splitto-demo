import 'dotenv/config';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';
import { eq } from 'drizzle-orm';
import { generateToken } from '../utils';

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const db = drizzle(pool, { schema });

async function seed() {
  console.log('🌱 Seeding database...');

  // Clean existing seed data
  await db.delete(schema.activityLog);
  await db.delete(schema.expenseSplits);
  await db.delete(schema.settlements);
  await db.delete(schema.groupInvites);
  await db.delete(schema.expenses);
  await db.delete(schema.groupMembers);
  await db.delete(schema.groups);
  await db.delete(schema.users);

  // Create 4 demo users
  const [alice, bob, carol, dave] = await db
    .insert(schema.users)
    .values([
      {
        name: 'Alice Johnson',
        email: 'alice@demo.com',
        avatarColor: 'emerald',
        defaultCurrency: 'USD',
      },
      {
        name: 'Bob Smith',
        email: 'bob@demo.com',
        avatarColor: 'blue',
        defaultCurrency: 'USD',
      },
      {
        name: 'Carol Williams',
        email: 'carol@demo.com',
        avatarColor: 'purple',
        defaultCurrency: 'USD',
      },
      {
        name: 'Dave Brown',
        email: 'dave@demo.com',
        avatarColor: 'amber',
        defaultCurrency: 'USD',
      },
    ])
    .returning();

  console.log('✅ Created 4 demo users');

  // Create demo group
  const [group] = await db
    .insert(schema.groups)
    .values({
      name: 'Trip to Japan 🇯🇵',
      description: 'Our amazing trip to Japan! Tracking expenses for the group.',
      defaultCurrency: 'USD',
      createdBy: alice.id,
      simplifyDebts: true,
    })
    .returning();

  console.log('✅ Created demo group: Trip to Japan 🇯🇵');

  // Add all 4 users as members
  await db.insert(schema.groupMembers).values([
    { groupId: group.id, userId: alice.id, role: 'owner' },
    { groupId: group.id, userId: bob.id, role: 'member' },
    { groupId: group.id, userId: carol.id, role: 'member' },
    { groupId: group.id, userId: dave.id, role: 'member' },
  ]);

  console.log('✅ Added all 4 members to group');

  // Create sample expenses
  const today = new Date();
  const daysAgo = (n: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() - n);
    return d.toISOString().split('T')[0];
  };

  // Expense 1: Tokyo hotel - paid by Alice, equal split among all 4
  const [hotelExpense] = await db
    .insert(schema.expenses)
    .values({
      groupId: group.id,
      description: 'Tokyo Hotel - 3 nights',
      amount: '480.00',
      currency: 'USD',
      category: 'accommodation',
      paidBy: alice.id,
      splitType: 'equal',
      date: daysAgo(10),
      notes: 'Stayed at Shinjuku Washington Hotel',
      createdBy: alice.id,
    })
    .returning();

  await db.insert(schema.expenseSplits).values([
    { expenseId: hotelExpense.id, userId: alice.id, amount: '120.00' },
    { expenseId: hotelExpense.id, userId: bob.id, amount: '120.00' },
    { expenseId: hotelExpense.id, userId: carol.id, amount: '120.00' },
    { expenseId: hotelExpense.id, userId: dave.id, amount: '120.00' },
  ]);

  // Expense 2: Sushi dinner - paid by Bob, exact split
  const [sushiExpense] = await db
    .insert(schema.expenses)
    .values({
      groupId: group.id,
      description: 'Sushi dinner at Tsukiji',
      amount: '180.00',
      currency: 'USD',
      category: 'food',
      paidBy: bob.id,
      splitType: 'exact',
      date: daysAgo(9),
      createdBy: bob.id,
    })
    .returning();

  await db.insert(schema.expenseSplits).values([
    { expenseId: sushiExpense.id, userId: alice.id, amount: '50.00' },
    { expenseId: sushiExpense.id, userId: bob.id, amount: '40.00' },
    { expenseId: sushiExpense.id, userId: carol.id, amount: '55.00' },
    { expenseId: sushiExpense.id, userId: dave.id, amount: '35.00' },
  ]);

  // Expense 3: JR Pass - paid by Carol, percentage split
  const [jrPassExpense] = await db
    .insert(schema.expenses)
    .values({
      groupId: group.id,
      description: 'JR Rail Pass (14 days)',
      amount: '560.00',
      currency: 'USD',
      category: 'transport',
      paidBy: carol.id,
      splitType: 'percentage',
      date: daysAgo(8),
      createdBy: carol.id,
    })
    .returning();

  await db.insert(schema.expenseSplits).values([
    { expenseId: jrPassExpense.id, userId: alice.id, amount: '140.00', percentage: '25.00' },
    { expenseId: jrPassExpense.id, userId: bob.id, amount: '140.00', percentage: '25.00' },
    { expenseId: jrPassExpense.id, userId: carol.id, amount: '140.00', percentage: '25.00' },
    { expenseId: jrPassExpense.id, userId: dave.id, amount: '140.00', percentage: '25.00' },
  ]);

  // Expense 4: Tokyo Disneyland - paid by Dave, shares split
  const [disneyExpense] = await db
    .insert(schema.expenses)
    .values({
      groupId: group.id,
      description: 'Tokyo Disneyland Tickets',
      amount: '300.00',
      currency: 'USD',
      category: 'entertainment',
      paidBy: dave.id,
      splitType: 'shares',
      date: daysAgo(7),
      createdBy: dave.id,
    })
    .returning();

  await db.insert(schema.expenseSplits).values([
    { expenseId: disneyExpense.id, userId: alice.id, amount: '75.00', shares: 1 },
    { expenseId: disneyExpense.id, userId: bob.id, amount: '75.00', shares: 1 },
    { expenseId: disneyExpense.id, userId: carol.id, amount: '75.00', shares: 1 },
    { expenseId: disneyExpense.id, userId: dave.id, amount: '75.00', shares: 1 },
  ]);

  // Expense 5: Ramen for lunch - paid by Alice, equal split (only Alice & Bob)
  const [ramenExpense] = await db
    .insert(schema.expenses)
    .values({
      groupId: group.id,
      description: 'Ramen lunch in Shibuya',
      amount: '45.00',
      currency: 'USD',
      category: 'food',
      paidBy: alice.id,
      splitType: 'equal',
      date: daysAgo(6),
      createdBy: alice.id,
    })
    .returning();

  await db.insert(schema.expenseSplits).values([
    { expenseId: ramenExpense.id, userId: alice.id, amount: '22.50' },
    { expenseId: ramenExpense.id, userId: bob.id, amount: '22.50' },
  ]);

  // Expense 6: Shopping at Akihabara - paid by Bob
  const [shoppingExpense] = await db
    .insert(schema.expenses)
    .values({
      groupId: group.id,
      description: 'Electronics shopping at Akihabara',
      amount: '240.00',
      currency: 'JPY',
      category: 'shopping',
      paidBy: bob.id,
      splitType: 'equal',
      date: daysAgo(5),
      createdBy: bob.id,
    })
    .returning();

  // 240 JPY / 4 = 60 JPY each (very small amount, but good for testing currency)
  await db.insert(schema.expenseSplits).values([
    { expenseId: shoppingExpense.id, userId: alice.id, amount: '60.00' },
    { expenseId: shoppingExpense.id, userId: bob.id, amount: '60.00' },
    { expenseId: shoppingExpense.id, userId: carol.id, amount: '60.00' },
    { expenseId: shoppingExpense.id, userId: dave.id, amount: '60.00' },
  ]);

  console.log('✅ Created 6 sample expenses');

  // Create one completed settlement
  await db.insert(schema.settlements).values({
    groupId: group.id,
    paidBy: bob.id,
    paidTo: alice.id,
    amount: '50.00',
    currency: 'USD',
    note: 'Paying back for the hotel deposit',
  });

  console.log('✅ Created 1 sample settlement');

  // Create invite link
  await db.insert(schema.groupInvites).values({
    groupId: group.id,
    token: generateToken(32),
    createdBy: alice.id,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    maxUses: 10,
    useCount: 0,
  });

  // Log activities
  await db.insert(schema.activityLog).values([
    {
      groupId: group.id,
      userId: alice.id,
      action: 'group_created',
      metadata: { groupName: group.name },
    },
    {
      groupId: group.id,
      userId: alice.id,
      action: 'expense_created',
      metadata: { description: 'Tokyo Hotel - 3 nights', amount: '480.00', currency: 'USD' },
    },
    {
      groupId: group.id,
      userId: bob.id,
      action: 'expense_created',
      metadata: { description: 'Sushi dinner at Tsukiji', amount: '180.00', currency: 'USD' },
    },
    {
      groupId: group.id,
      userId: carol.id,
      action: 'expense_created',
      metadata: { description: 'JR Rail Pass (14 days)', amount: '560.00', currency: 'USD' },
    },
    {
      groupId: group.id,
      userId: dave.id,
      action: 'expense_created',
      metadata: { description: 'Tokyo Disneyland Tickets', amount: '300.00', currency: 'USD' },
    },
    {
      groupId: group.id,
      userId: bob.id,
      action: 'settlement_made',
      metadata: { amount: '50.00', currency: 'USD', paidTo: 'Alice Johnson' },
    },
  ]);

  console.log('✅ Created activity log entries');
  console.log('\n🎉 Seed complete!');
  console.log('\nDemo users:');
  console.log(`  Alice Johnson (${alice.id}) — alice@demo.com`);
  console.log(`  Bob Smith    (${bob.id}) — bob@demo.com`);
  console.log(`  Carol Williams (${carol.id}) — carol@demo.com`);
  console.log(`  Dave Brown   (${dave.id}) — dave@demo.com`);
  console.log(`\nDemo group: ${group.name} (${group.id})`);

  await pool.end();
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
