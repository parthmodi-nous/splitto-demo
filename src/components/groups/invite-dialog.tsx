'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Copy, Loader2, RefreshCw, Link as LinkIcon } from 'lucide-react';
import { createInviteLink } from '@/actions/invites';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { GroupInvite } from '@/types';

interface InviteDialogProps {
  groupId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EXPIRY_OPTIONS = [
  { label: '1 day', value: '1' },
  { label: '3 days', value: '3' },
  { label: '7 days', value: '7' },
  { label: '14 days', value: '14' },
  { label: '30 days', value: '30' },
];

const MAX_USES_OPTIONS = [
  { label: 'Unlimited', value: '0' },
  { label: '1 use', value: '1' },
  { label: '5 uses', value: '5' },
  { label: '10 uses', value: '10' },
  { label: '25 uses', value: '25' },
];

function getInviteUrl(token: string): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/invite/${token}`;
  }
  return `/invite/${token}`;
}

export function InviteDialog({ groupId, open, onOpenChange }: InviteDialogProps) {
  const [invite, setInvite] = useState<GroupInvite | null>(null);
  const [expiresInDays, setExpiresInDays] = useState<string>('7');
  const [maxUses, setMaxUses] = useState<string>('0');
  const [isPending, startTransition] = useTransition();

  const handleGenerate = () => {
    startTransition(async () => {
      const parsedMaxUses = parseInt(maxUses, 10);
      const result = await createInviteLink(groupId, {
        expiresInDays: parseInt(expiresInDays, 10),
        maxUses: parsedMaxUses > 0 ? parsedMaxUses : undefined,
      });

      if (result.success) {
        setInvite(result.data);
        toast.success('Invite link generated');
      } else {
        toast.error(result.error ?? 'Failed to generate invite link');
      }
    });
  };

  const handleCopy = () => {
    if (!invite) return;
    const url = getInviteUrl(invite.token);
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success('Invite link copied to clipboard'))
      .catch(() => toast.error('Failed to copy to clipboard'));
  };

  const inviteUrl = invite ? getInviteUrl(invite.token) : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite to Group</DialogTitle>
          <DialogDescription>
            Generate a shareable link to invite people to this group.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Existing invite link */}
          {invite && (
            <div className="space-y-2">
              <Label>Invite Link</Label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    readOnly
                    value={inviteUrl}
                    className="pl-9 text-xs font-mono"
                  />
                </div>
                <Button variant="outline" size="icon" onClick={handleCopy} title="Copy link">
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Expires {formatDate(invite.expiresAt)}
                {invite.maxUses !== null
                  ? ` · ${invite.maxUses - invite.useCount} uses remaining`
                  : ' · Unlimited uses'}
              </p>
            </div>
          )}

          {/* Options */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="expiry-select">Expires in</Label>
              <Select value={expiresInDays} onValueChange={setExpiresInDays}>
                <SelectTrigger id="expiry-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPIRY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="max-uses-select">Max uses</Label>
              <Select value={maxUses} onValueChange={setMaxUses}>
                <SelectTrigger id="max-uses-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MAX_USES_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Generate button */}
          <Button onClick={handleGenerate} disabled={isPending} className="w-full">
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {invite ? 'Generate New Link' : 'Generate Invite Link'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
