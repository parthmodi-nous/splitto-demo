'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { updateGroup } from '@/actions/groups';
import { CURRENCY_LIST } from '@/lib/currencies';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { GroupWithMembers } from '@/types';

interface GroupSettingsFormProps {
  group: GroupWithMembers;
  isAdmin: boolean;
}

export function GroupSettingsForm({ group, isAdmin }: GroupSettingsFormProps) {
  const router = useRouter();
  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description ?? '');
  const [defaultCurrency, setDefaultCurrency] = useState(group.defaultCurrency);
  const [simplifyDebts, setSimplifyDebts] = useState(group.simplifyDebts);
  const [isPending, startTransition] = useTransition();

  const isDirty =
    name !== group.name ||
    description !== (group.description ?? '') ||
    defaultCurrency !== group.defaultCurrency ||
    simplifyDebts !== group.simplifyDebts;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    startTransition(async () => {
      const result = await updateGroup(group.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        defaultCurrency,
        simplifyDebts,
      });

      if (result.success) {
        toast.success('Group settings saved');
        router.refresh();
      } else {
        toast.error(result.error ?? 'Failed to save settings');
      }
    });
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base">Group Details</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="group-name">Group Name</Label>
            <Input
              id="group-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Trip to Paris"
              disabled={!isAdmin}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="group-description">Description (optional)</Label>
            <Textarea
              id="group-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this group for?"
              rows={3}
              className="resize-none"
              disabled={!isAdmin}
            />
          </div>

          {/* Default currency */}
          <div className="space-y-1.5">
            <Label htmlFor="default-currency">Default Currency</Label>
            <Select
              value={defaultCurrency}
              onValueChange={setDefaultCurrency}
              disabled={!isAdmin}
            >
              <SelectTrigger id="default-currency" className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCY_LIST.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.code} — {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Simplify debts toggle */}
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label htmlFor="simplify-debts" className="text-sm font-medium">
                Simplify Debts
              </Label>
              <p className="text-xs text-muted-foreground">
                Reduce the number of transactions needed to settle all debts.
              </p>
            </div>
            <Switch
              id="simplify-debts"
              checked={simplifyDebts}
              onCheckedChange={setSimplifyDebts}
              disabled={!isAdmin}
            />
          </div>

          {isAdmin && (
            <div className="flex justify-end">
              <Button type="submit" disabled={isPending || !isDirty} size="sm">
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Changes
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
