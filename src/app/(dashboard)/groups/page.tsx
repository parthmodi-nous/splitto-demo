import { Suspense } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { getUserGroups } from '@/actions/groups';
import { PageHeader } from '@/components/shared/page-header';
import { GroupCard } from '@/components/groups/group-card';

function GroupsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="h-1.5 shimmer" />
          <div className="p-4 space-y-3">
            <div className="h-4 w-2/3 rounded-md shimmer" />
            <div className="h-3 w-1/3 rounded-md shimmer" />
            <div className="flex gap-2">
              {[0,1,2].map(j => <div key={j} className="w-7 h-7 rounded-full shimmer" />)}
            </div>
            <div className="h-6 w-24 rounded-full shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
}

async function GroupsList() {
  const result = await getUserGroups();
  const groups = result.success ? result.data : [];

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-5 text-center rounded-2xl border-2 border-dashed border-border">
        <div className="w-16 h-16 rounded-2xl gradient-violet flex items-center justify-center shadow-lg">
          <span className="text-3xl">🗂️</span>
        </div>
        <div>
          <p className="font-bold text-foreground text-lg">No groups yet</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
            Create a group to start splitting expenses with friends and family.
          </p>
        </div>
        <Link
          href="/groups/new"
          className="inline-flex items-center gap-2 rounded-xl gradient-violet text-white px-5 py-2.5 text-sm font-semibold shadow-sm active:scale-95 transition-transform"
        >
          <Plus className="w-4 h-4" />
          Create your first group
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
  );
}

export default function GroupsPage() {
  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto w-full space-y-6">
      <PageHeader
        title="Your Groups"
        description="Manage your expense splitting groups."
        action={
          <Link
            href="/groups/new"
            className="inline-flex items-center gap-2 rounded-xl gradient-violet text-white px-4 py-2 text-sm font-semibold shadow-sm active:scale-95 transition-transform"
          >
            <Plus className="w-4 h-4" />
            New Group
          </Link>
        }
      />
      <Suspense fallback={<GroupsGridSkeleton />}>
        <GroupsList />
      </Suspense>
    </div>
  );
}
