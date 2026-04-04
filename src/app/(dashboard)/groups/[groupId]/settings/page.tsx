import { notFound } from 'next/navigation';
import { getGroupWithMembers } from '@/actions/groups';
import { getCurrentUser } from '@/lib/auth';
import { PageHeader } from '@/components/shared/page-header';
import { GroupSettingsForm } from './group-settings-form';
import { GroupMembersSection } from './group-members-section';

interface SettingsPageProps {
  params: Promise<{ groupId: string }>;
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { groupId } = await params;

  const [groupResult, currentUser] = await Promise.all([
    getGroupWithMembers(groupId),
    getCurrentUser(),
  ]);

  if (!groupResult.success || !currentUser) {
    notFound();
  }

  const group = groupResult.data;
  const currentMember = group.members.find((m) => m.userId === currentUser.id);
  const isAdmin =
    currentMember?.role === 'owner' || currentMember?.role === 'admin';
  const isOwner = currentMember?.role === 'owner';

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto w-full space-y-6">
      <PageHeader
        title="Group Settings"
        breadcrumbs={[
          { label: 'Groups', href: '/groups' },
          { label: group.name, href: `/groups/${groupId}` },
          { label: 'Settings' },
        ]}
      />

      {/* Group details form */}
      <GroupSettingsForm group={group} isAdmin={isAdmin} />

      {/* Members management */}
      <GroupMembersSection
        group={group}
        currentUserId={currentUser.id}
        isAdmin={isAdmin}
        isOwner={isOwner}
      />
    </div>
  );
}
