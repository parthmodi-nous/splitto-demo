'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Loader2, UserMinus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { removeMember } from '@/actions/groups';
import { getAvatarColorClasses, MEMBER_ROLES } from '@/lib/constants';
import { getInitials, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { GroupMemberWithUser } from '@/types';

interface MemberListProps {
  members: GroupMemberWithUser[];
  currentUserId: string;
  isAdmin: boolean;
  groupId: string;
  onRemoveMember?: (userId: string) => void;
}

const roleBadgeVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  owner: 'default',
  admin: 'secondary',
  member: 'outline',
};

function getRoleLabel(role: string): string {
  return MEMBER_ROLES.find((r) => r.value === role)?.label ?? role;
}

interface RemoveConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberName: string;
  onConfirm: () => void;
  isPending: boolean;
}

function RemoveConfirmDialog({
  open,
  onOpenChange,
  memberName,
  onConfirm,
  isPending,
}: RemoveConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove {memberName}?</AlertDialogTitle>
          <AlertDialogDescription>
            This will remove {memberName} from the group. They will lose access to all group
            expenses and data. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Remove
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function MemberList({
  members,
  currentUserId,
  isAdmin,
  groupId,
  onRemoveMember,
}: MemberListProps) {
  const router = useRouter();
  const [confirmUserId, setConfirmUserId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const confirmMember = members.find((m) => m.userId === confirmUserId);

  const handleRemove = () => {
    if (!confirmUserId) return;

    startTransition(async () => {
      const result = await removeMember(groupId, confirmUserId);
      if (result.success) {
        toast.success('Member removed');
        onRemoveMember?.(confirmUserId);
        setConfirmUserId(null);
        router.refresh();
      } else {
        toast.error(result.error ?? 'Failed to remove member');
      }
    });
  };

  return (
    <>
      <ul className="divide-y divide-border">
        {members.map((member) => {
          const { bg, text } = getAvatarColorClasses(member.user.avatarColor);
          const isCurrentUser = member.userId === currentUserId;
          const isOwner = member.role === 'owner';

          // Show remove button if admin/owner, not for self, and not for owners (unless current user is owner)
          const canRemove =
            isAdmin &&
            !isCurrentUser &&
            !(isOwner && members.find((m) => m.userId === currentUserId)?.role !== 'owner');

          return (
            <li key={member.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              {/* Avatar */}
              <div
                className={cn(
                  'flex items-center justify-center w-9 h-9 rounded-full text-xs font-semibold select-none shrink-0',
                  bg,
                  text,
                )}
              >
                {getInitials(member.user.name)}
              </div>

              {/* Name + email */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-foreground truncate">
                    {member.user.name}
                    {isCurrentUser && (
                      <span className="ml-1 text-xs text-muted-foreground">(you)</span>
                    )}
                  </span>
                  <Badge variant={roleBadgeVariant[member.role] ?? 'outline'} className="text-xs">
                    {getRoleLabel(member.role)}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate">{member.user.email}</p>
              </div>

              {/* Remove button */}
              {canRemove && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => setConfirmUserId(member.userId)}
                  disabled={isPending}
                  title={`Remove ${member.user.name}`}
                >
                  <UserMinus className="w-4 h-4" />
                </Button>
              )}
            </li>
          );
        })}
      </ul>

      {confirmMember && (
        <RemoveConfirmDialog
          open={confirmUserId !== null}
          onOpenChange={(open) => {
            if (!open) setConfirmUserId(null);
          }}
          memberName={confirmMember.user.name}
          onConfirm={handleRemove}
          isPending={isPending}
        />
      )}
    </>
  );
}
