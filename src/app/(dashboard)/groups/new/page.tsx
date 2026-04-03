'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { z } from 'zod';
import { ChevronLeft } from 'lucide-react';
import { createGroup } from '@/actions/groups';
import { CURRENCY_LIST } from '@/lib/currencies';
import { PageHeader } from '@/components/shared/page-header';

const schema = z.object({
  name: z.string().min(1, 'Group name is required').max(255, 'Name is too long'),
  description: z.string().max(1000, 'Description is too long').optional(),
  defaultCurrency: z.string().length(3),
  simplifyDebts: z.boolean(),
});

type FormErrors = Partial<Record<keyof z.infer<typeof schema>, string>>;

export default function NewGroupPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const [values, setValues] = useState({
    name: '',
    description: '',
    defaultCurrency: 'USD',
    simplifyDebts: true,
  });

  function setValue<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const parsed = schema.safeParse({
      ...values,
      description: values.description || undefined,
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
    <div className="p-4 sm:p-6 max-w-2xl mx-auto w-full space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href="/groups"
          className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Groups
        </Link>
      </div>

      <PageHeader title="Create a New Group" description="Set up a group to split expenses with others." />

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name */}
        <div className="space-y-1.5">
          <label htmlFor="name" className="block text-sm font-medium text-foreground">
            Group Name <span className="text-destructive">*</span>
          </label>
          <input
            id="name"
            type="text"
            value={values.name}
            onChange={(e) => setValue('name', e.target.value)}
            placeholder="e.g. Trip to Japan"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isSubmitting}
            autoFocus
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label htmlFor="description" className="block text-sm font-medium text-foreground">
            Description <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <textarea
            id="description"
            value={values.description}
            onChange={(e) => setValue('description', e.target.value)}
            placeholder="What is this group for?"
            rows={3}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            disabled={isSubmitting}
          />
          {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
        </div>

        {/* Default Currency */}
        <div className="space-y-1.5">
          <label htmlFor="defaultCurrency" className="block text-sm font-medium text-foreground">
            Default Currency
          </label>
          <select
            id="defaultCurrency"
            value={values.defaultCurrency}
            onChange={(e) => setValue('defaultCurrency', e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isSubmitting}
          >
            {CURRENCY_LIST.map((currency) => (
              <option key={currency.code} value={currency.code}>
                {currency.symbol} {currency.name} ({currency.code})
              </option>
            ))}
          </select>
        </div>

        {/* Simplify Debts */}
        <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
          <button
            type="button"
            role="switch"
            aria-checked={values.simplifyDebts}
            onClick={() => setValue('simplifyDebts', !values.simplifyDebts)}
            disabled={isSubmitting}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-0.5 ${
              values.simplifyDebts ? 'bg-primary' : 'bg-input'
            }`}
          >
            <span
              className={`pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform ${
                values.simplifyDebts ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
          <div>
            <p className="text-sm font-medium text-foreground">Simplify Debts</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Automatically minimize the number of transactions needed to settle all balances.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <Link
            href="/groups"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
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
