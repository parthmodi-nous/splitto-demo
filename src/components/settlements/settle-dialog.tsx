'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { recordSettlement } from '@/actions/settlements';
import { getAvatarColorClasses } from '@/lib/constants';
import { getInitials, cn } from '@/lib/utils';
import { CURRENCY_LIST } from '@/lib/currencies';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { User } from '@/types';

interface SettleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  fromUser: User;
  toUser: User;
  suggestedAmount: number;
  currency: string;
  onSuccess?: () => void;
}

function MiniAvatar({ user }: { user: User }) {
  const { bg, text } = getAvatarColorClasses(user.avatarColor);
  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          'flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold select-none shrink-0',
          bg,
          text,
        )}
      >
        {getInitials(user.name)}
      </div>
      <span className="text-sm font-medium text-foreground">{user.name}</span>
    </div>
  );
}

export function SettleDialog({
  open,
  onOpenChange,
  groupId,
  fromUser,
  toUser,
  suggestedAmount,
  currency,
  onSuccess,
}: SettleDialogProps) {
  const router = useRouter();
  const [amount, setAmount] = useState<string>(suggestedAmount.toFixed(2));
  const [selectedCurrency, setSelectedCurrency] = useState<string>(currency);
  const [note, setNote] = useState<string>('');
  const [amountError, setAmountError] = useState<string>('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAmountError('');

    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      setAmountError('Amount must be a positive number');
      return;
    }

    startTransition(async () => {
      const result = await recordSettlement({
        groupId,
        paidBy: fromUser.id,
        paidTo: toUser.id,
        amount: parsed,
        currency: selectedCurrency,
        note: note.trim() || undefined,
      });

      if (result.success) {
        toast.success('Settlement recorded');
        onSuccess?.();
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(result.error ?? 'Failed to record settlement');
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record Settlement</DialogTitle>
          <DialogDescription>
            Confirm the payment details below to mark this debt as settled.
          </DialogDescription>
        </DialogHeader>

        {/* Who pays whom */}
        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-4 py-3 gap-3">
          <MiniAvatar user={fromUser} />
          <span className="text-xs text-muted-foreground shrink-0">pays</span>
          <MiniAvatar user={toUser} />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount + Currency */}
          <div className="space-y-1.5">
            <Label htmlFor="settle-amount">Amount</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  id="settle-amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setAmountError('');
                  }}
                  className={cn(amountError && 'border-destructive focus-visible:ring-destructive')}
                />
                {amountError && (
                  <p className="mt-1 text-xs text-destructive">{amountError}</p>
                )}
              </div>
              <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCY_LIST.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Note */}
          <div className="space-y-1.5">
            <Label htmlFor="settle-note">Note (optional)</Label>
            <Textarea
              id="settle-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Venmo transfer, cash payment..."
              rows={2}
              className="resize-none"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Record Settlement
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
