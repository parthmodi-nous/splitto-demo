import { notFound, redirect } from 'next/navigation';
import { getExpenseById } from '@/actions/expenses';
import { getCurrentUser } from '@/lib/auth';
import { PageHeader } from '@/components/shared/page-header';
import { ExpenseForm } from '@/components/expenses/expense-form';
import { getGroupWithMembers } from '@/actions/groups';

interface ExpenseDetailPageProps {
  params: Promise<{ groupId: string; expenseId: string }>;
}

export default async function ExpenseDetailPage({ params }: ExpenseDetailPageProps) {
  const { groupId, expenseId } = await params;
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect('/');

  const [expenseResult, groupResult] = await Promise.all([
    getExpenseById(expenseId),
    getGroupWithMembers(groupId),
  ]);

  if (!expenseResult.success || !groupResult.success) notFound();

  const expense = expenseResult.data;
  const group = groupResult.data;
  const members = group.members.map((m) => ({
    id: m.user.id,
    name: m.user.name,
    avatarColor: m.user.avatarColor,
  }));

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto w-full">
      <PageHeader
        title="Edit Expense"
        breadcrumbs={[
          { label: 'Groups', href: '/groups' },
          { label: group.name, href: `/groups/${groupId}` },
          { label: 'Edit Expense' },
        ]}
      />
      <div className="mt-6">
        <ExpenseForm
          groupId={groupId}
          members={members}
          currentUserId={currentUser.id}
          expense={expense}
        />
      </div>
    </div>
  );
}
