import { notFound } from 'next/navigation';
import { getGroupBalances, getSimplifiedDebts } from '@/actions/settlements';
import { getGroupWithMembers } from '@/actions/groups';
import { PageHeader } from '@/components/shared/page-header';
import { DebtGraph } from '@/components/settlements/debt-graph';
import { SettlementPlan } from '@/components/settlements/settlement-plan';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface BalancesPageProps {
  params: Promise<{ groupId: string }>;
}

export default async function BalancesPage({ params }: BalancesPageProps) {
  const { groupId } = await params;

  const [groupResult, balancesResult, debtsResult] = await Promise.all([
    getGroupWithMembers(groupId),
    getGroupBalances(groupId),
    getSimplifiedDebts(groupId),
  ]);

  if (!groupResult.success) {
    notFound();
  }

  const group = groupResult.data;
  const balances = balancesResult.success ? balancesResult.data : [];
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
        title="Balances"
        description={`Who owes what in ${group.name}`}
        breadcrumbs={[
          { label: 'Groups', href: '/groups' },
          { label: group.name, href: `/groups/${groupId}` },
          { label: 'Balances' },
        ]}
      />

      {/* Balance bars */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Member Balances</CardTitle>
        </CardHeader>
        <CardContent>
          {balancesResult.success ? (
            <DebtGraph balances={balances} currency={group.defaultCurrency} />
          ) : (
            <p className="text-sm text-muted-foreground">{balancesResult.error}</p>
          )}
        </CardContent>
      </Card>

      {/* Settlement plan */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            {group.simplifyDebts ? 'Simplified Settlement Plan' : 'Settlement Plan'}
          </CardTitle>
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
