'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { Loader2, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { acceptInvite } from '@/actions/invites';
import { Button } from '@/components/ui/button';

interface AcceptInviteButtonProps {
  token: string;
  groupId: string;
  disabled?: boolean;
}

export function AcceptInviteButton({ token, groupId, disabled }: AcceptInviteButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleJoin = () => {
    startTransition(async () => {
      const result = await acceptInvite(token);
      if (result.success) {
        toast.success('You have joined the group!');
        router.push(`/groups/${groupId}`);
      } else {
        toast.error(result.error ?? 'Failed to join group');
      }
    });
  };

  return (
    <Button
      onClick={handleJoin}
      disabled={isPending || disabled}
      className="w-full"
      size="lg"
    >
      {isPending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <UserPlus className="w-4 h-4" />
      )}
      Join Group
    </Button>
  );
}
