import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { getGroupWithMembers } from '@/actions/groups';
import { PageHeader } from '@/components/shared/page-header';
import { ExpenseForm } from '@/components/expenses/expense-form';

interface NewExpensePageProps {
  params: Promise<{ groupId: string }>;
}

export default async function NewExpensePage({ params }: NewExpensePageProps) {
  const { groupId } = await params;

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect('/');
  }

  const groupResult = await getGroupWithMembers(groupId);
  if (!groupResult.success) {
    notFound();
  }

  const group = groupResult.data;
  const members = group.members.map((m) => ({
    id: m.user.id,
    name: m.user.name,
    avatarColor: m.user.avatarColor,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add Expense"
        breadcrumbs={[
          { label: 'Groups', href: '/' },
          { label: group.name, href: `/groups/${groupId}` },
          { label: 'Add Expense' },
        ]}
        action={
          <Link
            href={`/groups/${groupId}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        }
      />

      <div className="max-w-xl">
        <ExpenseForm
          groupId={groupId}
          members={members}
          currentUserId={currentUser.id}
        />
      </div>
    </div>
  );
}
