'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Loader2, Link as LinkIcon, LogOut, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { leaveGroup, deleteGroup } from '@/actions/groups';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
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
import { MemberList } from '@/components/groups/member-list';
import { InviteDialog } from '@/components/groups/invite-dialog';
import type { GroupWithMembers } from '@/types';

interface GroupMembersSectionProps {
  group: GroupWithMembers;
  currentUserId: string;
  isAdmin: boolean;
  isOwner: boolean;
}

export function GroupMembersSection({
  group,
  currentUserId,
  isAdmin,
  isOwner,
}: GroupMembersSectionProps) {
  const router = useRouter();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleLeave = () => {
    startTransition(async () => {
      const result = await leaveGroup(group.id);
      if (result.success) {
        toast.success('You have left the group');
        router.push('/groups');
      } else {
        toast.error(result.error ?? 'Failed to leave group');
      }
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteGroup(group.id);
      if (result.success) {
        toast.success('Group deleted');
        router.push('/groups');
      } else {
        toast.error(result.error ?? 'Failed to delete group');
      }
    });
  };

  return (
    <>
      {/* Members card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base">Members ({group.members.length})</CardTitle>
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInviteOpen(true)}
              >
                <LinkIcon className="w-4 h-4" />
                Invite Link
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <MemberList
            members={group.members}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
            groupId={group.id}
          />
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-destructive/40">
        <CardHeader className="pb-4">
          <CardTitle className="text-base text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Leave group */}
          {!isOwner && (
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Leave Group</p>
                <p className="text-xs text-muted-foreground">
                  Remove yourself from this group. You will lose access to all expenses.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-destructive/50 text-destructive hover:bg-destructive/10 shrink-0"
                onClick={() => setLeaveConfirmOpen(true)}
                disabled={isPending}
              >
                <LogOut className="w-4 h-4" />
                Leave
              </Button>
            </div>
          )}

          {!isOwner && isAdmin && <Separator />}

          {/* Delete group (owner only) */}
          {isOwner && (
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Delete Group</p>
                <p className="text-xs text-muted-foreground">
                  Permanently delete this group and all its expenses. This cannot be undone.
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                className="shrink-0"
                onClick={() => setDeleteConfirmOpen(true)}
                disabled={isPending}
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite dialog */}
      <InviteDialog
        groupId={group.id}
        open={inviteOpen}
        onOpenChange={setInviteOpen}
      />

      {/* Leave confirmation */}
      <AlertDialog open={leaveConfirmOpen} onOpenChange={setLeaveConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave {group.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              You will be removed from this group and lose access to all expenses and balances.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLeave}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Leave Group
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {group.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the group, all expenses, and all settlement history.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Delete Group
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
