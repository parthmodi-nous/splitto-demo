'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { z } from 'zod';
import { ChevronLeft, Plus, X, Users } from 'lucide-react';
import { createGroup } from '@/actions/groups';
import { CURRENCY_LIST } from '@/lib/currencies';
import { AVATAR_COLORS } from '@/lib/constants';
import { getInitials, cn } from '@/lib/utils';

const schema = z.object({
  name: z.string().min(1, 'Group name is required').max(255, 'Name is too long'),
  description: z.string().max(1000, 'Description is too long').optional(),
  defaultCurrency: z.string().length(3),
  simplifyDebts: z.boolean(),
  memberNames: z.array(z.string().min(1).max(255)).optional(),
});

type FormErrors = Partial<Record<keyof z.infer<typeof schema>, string>>;

export default function NewGroupPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [memberInput, setMemberInput] = useState('');
  const [memberNames, setMemberNames] = useState<string[]>([]);
  const memberInputRef = useRef<HTMLInputElement>(null);

  const [values, setValues] = useState({
    name: '',
    description: '',
    defaultCurrency: 'INR',
    simplifyDebts: true,
  });

  function setValue<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  function addMember() {
    const name = memberInput.trim();
    if (!name) return;
    if (memberNames.includes(name)) {
      toast.error('Member already added');
      return;
    }
    setMemberNames((prev) => [...prev, name]);
    setMemberInput('');
    memberInputRef.current?.focus();
  }

  function removeMember(name: string) {
    setMemberNames((prev) => prev.filter((n) => n !== name));
  }

  function handleMemberKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addMember();
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const parsed = schema.safeParse({
      ...values,
      description: values.description || undefined,
      memberNames: memberNames.length > 0 ? memberNames : undefined,
    });

    if (!parsed.success) {
      const fieldErrors: FormErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof FormErrors;
        if (field) fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createGroup(parsed.data);
      if (result.success) {
        toast.success('Group created!');
        router.push(`/groups/${result.data.id}`);
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto w-full">
      {/* Back nav */}
      <div className="mb-6">
        <Link
          href="/groups"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Groups
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Create a New Group</h1>
        <p className="text-sm text-muted-foreground mt-1">Set up a group to split expenses with others.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div className="space-y-1.5">
          <label htmlFor="name" className="block text-sm font-medium">
            Group Name <span className="text-destructive">*</span>
          </label>
          <input
            id="name"
            type="text"
            value={values.name}
            onChange={(e) => setValue('name', e.target.value)}
            placeholder="e.g. Trip to Goa"
            className={cn(
              'w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50',
              errors.name ? 'border-destructive' : 'border-input'
            )}
            disabled={isSubmitting}
            autoFocus
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label htmlFor="description" className="block text-sm font-medium">
            Description <span className="text-muted-foreground font-normal text-xs">(optional)</span>
          </label>
          <textarea
            id="description"
            value={values.description}
            onChange={(e) => setValue('description', e.target.value)}
            placeholder="What is this group for?"
            rows={2}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 resize-none"
            disabled={isSubmitting}
          />
          {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
        </div>

        {/* Currency + Simplify row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label htmlFor="defaultCurrency" className="block text-sm font-medium">
              Currency
            </label>
            <select
              id="defaultCurrency"
              value={values.defaultCurrency}
              onChange={(e) => setValue('defaultCurrency', e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              disabled={isSubmitting}
            >
              {CURRENCY_LIST.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.symbol} {currency.code} — {currency.name}
                </option>
              ))}
            </select>
          </div>

          {/* Simplify Debts */}
          <div className="space-y-1.5">
            <p className="text-sm font-medium">Simplify Debts</p>
            <div
              className="flex items-center gap-3 rounded-md border border-border bg-card px-3 py-2 cursor-pointer h-[38px]"
              onClick={() => !isSubmitting && setValue('simplifyDebts', !values.simplifyDebts)}
            >
              <button
                type="button"
                role="switch"
                aria-checked={values.simplifyDebts}
                disabled={isSubmitting}
                className={cn(
                  'relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50',
                  values.simplifyDebts ? 'bg-primary' : 'bg-input'
                )}
              >
                <span
                  className={cn(
                    'pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform',
                    values.simplifyDebts ? 'translate-x-4' : 'translate-x-0'
                  )}
                />
              </button>
              <span className="text-sm text-muted-foreground">
                {values.simplifyDebts ? 'On' : 'Off'}
              </span>
            </div>
          </div>
        </div>

        {/* Members */}
        <div className="space-y-2 rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Add Members</span>
            <span className="text-xs text-muted-foreground">(optional — you can add more later)</span>
          </div>

          {/* Member input */}
          <div className="flex gap-2">
            <input
              ref={memberInputRef}
              type="text"
              value={memberInput}
              onChange={(e) => setMemberInput(e.target.value)}
              onKeyDown={handleMemberKeyDown}
              placeholder="Enter a name"
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              disabled={isSubmitting}
              maxLength={255}
            />
            <button
              type="button"
              onClick={addMember}
              disabled={!memberInput.trim() || isSubmitting}
              className="inline-flex items-center gap-1 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>

          {/* Member chips */}
          {memberNames.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {memberNames.map((name, i) => {
                const colors = AVATAR_COLORS.map((c) => c.value);
                const colorValue = colors[i % colors.length] ?? 'emerald';
                const colorMap: Record<string, { bg: string; text: string }> = {
                  emerald: { bg: 'bg-emerald-500', text: 'text-white' },
                  blue: { bg: 'bg-blue-500', text: 'text-white' },
                  purple: { bg: 'bg-purple-500', text: 'text-white' },
                  amber: { bg: 'bg-amber-500', text: 'text-white' },
                  rose: { bg: 'bg-rose-500', text: 'text-white' },
                  cyan: { bg: 'bg-cyan-500', text: 'text-white' },
                  orange: { bg: 'bg-orange-500', text: 'text-white' },
                  teal: { bg: 'bg-teal-500', text: 'text-white' },
                };
                const { bg, text } = colorMap[colorValue] ?? { bg: 'bg-slate-500', text: 'text-white' };
                return (
                  <div
                    key={name}
                    className="flex items-center gap-1.5 rounded-full border border-border bg-background pl-1 pr-2 py-1"
                  >
                    <span
                      className={cn(
                        'flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold shrink-0',
                        bg,
                        text
                      )}
                    >
                      {getInitials(name)}
                    </span>
                    <span className="text-sm font-medium">{name}</span>
                    <button
                      type="button"
                      onClick={() => removeMember(name)}
                      disabled={isSubmitting}
                      className="ml-0.5 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={`Remove ${name}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {memberNames.length === 0 && (
            <p className="text-xs text-muted-foreground pt-1">
              No members added yet. Type a name and press Enter or click Add.
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <Link
            href="/groups"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Creating…' : 'Create Group'}
          </button>
        </div>
      </form>
    </div>
  );
}
