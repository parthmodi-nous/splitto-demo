import { getActivityFeed } from '@/actions/activity';
import { PageHeader } from '@/components/shared/page-header';
import { getInitials } from '@/lib/utils';
import { getAvatarColorClasses } from '@/lib/constants';
import { formatCurrency } from '@/lib/currencies';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import type { ActivityLogWithUser } from '@/types';

type ActivityMetadata = {
  description?: string;
  amount?: string | number;
  currency?: string;
  groupName?: string;
  expenseId?: string;
  settlementId?: string;
  paidBy?: string;
  paidTo?: string;
};

function parseMetadata(raw: unknown): ActivityMetadata {
  if (raw !== null && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as ActivityMetadata;
  }
  return {};
}

function buildDescription(entry: ActivityLogWithUser): string {
  const meta = parseMetadata(entry.metadata);
  const userName = entry.user.name;

  switch (entry.action) {
    case 'expense_created': {
      const desc = meta.description ?? 'an expense';
      const amount =
        meta.amount && meta.currency
          ? ` (${formatCurrency(parseFloat(String(meta.amount)), meta.currency)})`
          : '';
      const groupName = entry.group?.name ?? meta.groupName;
      const inGroup = groupName ? ` in ${groupName}` : '';
      return `${userName} added '${desc}'${amount}${inGroup}`;
    }
    case 'expense_updated': {
      const desc = meta.description ?? 'an expense';
      return `${userName} updated '${desc}'`;
    }
    case 'expense_deleted': {
      const desc = meta.description ?? 'an expense';
      return `${userName} deleted '${desc}'`;
    }
    case 'settlement_made': {
      const amount =
        meta.amount && meta.currency
          ? formatCurrency(parseFloat(String(meta.amount)), meta.currency)
          : 'a payment';
      return `${userName} recorded a settlement of ${amount}`;
    }
    case 'member_joined':
      return `${userName} joined the group`;
    case 'member_left':
      return `${userName} left the group`;
    case 'group_created': {
      const name = entry.group?.name ?? meta.groupName ?? 'a group';
      return `${userName} created '${name}'`;
    }
    case 'group_updated': {
      const name = entry.group?.name ?? meta.groupName ?? 'the group';
      return `${userName} updated '${name}'`;
    }
    default:
      return `${userName} performed an action`;
  }
}

function formatRelativeTimestamp(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return format(date, 'MMM d, h:mm a');
}

function groupByDate(
  entries: ActivityLogWithUser[]
): Array<{ label: string; items: ActivityLogWithUser[] }> {
  const groups = new Map<string, ActivityLogWithUser[]>();

  for (const entry of entries) {
    const d = new Date(entry.createdAt);
    let label: string;
    if (isToday(d)) {
      label = 'Today';
    } else if (isYesterday(d)) {
      label = 'Yesterday';
    } else {
      label = format(d, 'MMMM d, yyyy');
    }

    const existing = groups.get(label);
    if (existing) {
      existing.push(entry);
    } else {
      groups.set(label, [entry]);
    }
  }

  return Array.from(groups.entries()).map(([label, items]) => ({ label, items }));
}

function ActivityItem({ entry }: { entry: ActivityLogWithUser }) {
  const avatarClasses = getAvatarColorClasses(entry.user.avatarColor);
  const initials = getInitials(entry.user.name);
  const description = buildDescription(entry);
  const timestamp = formatRelativeTimestamp(new Date(entry.createdAt));
  const groupName = entry.group?.name;

  return (
    <div className="flex items-start gap-3 py-3">
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${avatarClasses.bg} ${avatarClasses.text}`}
      >
        {initials}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground leading-snug">{description}</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {groupName && (
            <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
              {groupName}
            </span>
          )}
          <span className="text-xs text-muted-foreground">{timestamp}</span>
        </div>
      </div>
    </div>
  );
}

export default async function ActivityPage() {
  const result = await getActivityFeed();

  const entries = result.success ? result.data : [];
  const grouped = groupByDate(entries);

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto w-full space-y-6">
      <PageHeader
        title="Activity"
        description="Recent actions across all your groups"
      />

      {!result.success && (
        <p className="text-sm text-destructive">{result.error}</p>
      )}

      {entries.length === 0 && result.success && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center rounded-xl border border-dashed border-border">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-lg">
            📋
          </div>
          <p className="font-medium text-foreground">No activity yet</p>
          <p className="text-sm text-muted-foreground">
            Activity from your groups will appear here.
          </p>
        </div>
      )}

      {grouped.map(({ label, items }) => (
        <div key={label} className="space-y-1">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-0 pb-1 border-b border-border">
            {label}
          </h2>
          <div className="divide-y divide-border">
            {items.map((entry) => (
              <ActivityItem key={entry.id} entry={entry} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
