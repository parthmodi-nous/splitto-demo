import { Suspense } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { getUserGroups } from '@/actions/groups';
import { getTimeOfDayGreeting } from '@/lib/utils';
import { PageHeader } from '@/components/shared/page-header';
import { GroupCard } from '@/components/groups/group-card';

function GroupsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="h-44 rounded-xl border border-border bg-card animate-pulse"
        />
      ))}
    </div>
  );
}

async function DashboardContent() {
  const [currentUser, groupsResult] = await Promise.all([
    getCurrentUser(),
    getUserGroups(),
  ]);

  const greeting = getTimeOfDayGreeting();
  const groups = groupsResult.success ? groupsResult.data : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greeting}, ${currentUser?.name.split(' ')[0] ?? 'there'}`}
        description="Here's an overview of your groups and activity."
        action={
          <Link
            href="/groups/new"
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Group
          </Link>
        }
      />

      {groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center rounded-xl border border-dashed border-border">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <span className="text-xl">🗂️</span>
          </div>
          <div>
            <p className="font-medium text-foreground">No groups yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create a group to start splitting expenses with friends.
            </p>
          </div>
          <Link
            href="/groups/new"
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create your first group
          </Link>
        </div>
      ) : (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">Your Groups</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((group) => (
              <GroupCard
                key={group.id}
                group={{
                  id: group.id,
                  name: group.name,
                  description: group.description ?? undefined,
                  memberCount: group.memberCount,
                  members: [],
                  currency: group.defaultCurrency,
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full">
      <Suspense fallback={<GroupsGridSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}
