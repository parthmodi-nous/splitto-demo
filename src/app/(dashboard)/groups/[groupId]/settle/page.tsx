import { notFound } from 'next/navigation';
import { getSimplifiedDebts } from '@/actions/settlements';
import { getGroupWithMembers } from '@/actions/groups';
import { PageHeader } from '@/components/shared/page-header';
import { SettlementPlan } from '@/components/settlements/settlement-plan';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface SettlePageProps {
  params: Promise<{ groupId: string }>;
}

export default async function SettlePage({ params }: SettlePageProps) {
  const { groupId } = await params;

  const [groupResult, debtsResult] = await Promise.all([
    getGroupWithMembers(groupId),
    getSimplifiedDebts(groupId),
  ]);

  if (!groupResult.success) {
    notFound();
  }

  const group = groupResult.data;
  const simplifiedDebts = debtsResult.success ? debtsResult.data : [];

  const debtItems = simplifiedDebts.map((d) => ({
    from: d.fromUser,
    to: d.toUser,
    amount: d.amount,
    currency: d.currency,
  }));

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto w-full space-y-6">
      <PageHeader
        title="Settle Up"
        description={`Record payments in ${group.name}`}
        breadcrumbs={[
          { label: 'Groups', href: '/groups' },
          { label: group.name, href: `/groups/${groupId}` },
          { label: 'Settle Up' },
        ]}
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Outstanding Payments</CardTitle>
          <CardDescription>
            {debtItems.length === 0
              ? 'Everyone is settled up.'
              : `${debtItems.length} payment${debtItems.length === 1 ? '' : 's'} needed to settle all debts.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {debtsResult.success ? (
            <SettlementPlan debts={debtItems} groupId={groupId} />
          ) : (
            <p className="text-sm text-muted-foreground">{debtsResult.error}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
