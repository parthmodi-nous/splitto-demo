'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import { AvatarGroup } from '@/components/shared/avatar-group';
import { formatCurrency } from '@/lib/currencies';
import { cn } from '@/lib/utils';

interface GroupCardMember {
  name: string;
  avatarColor: string;
}

interface GroupCardProps {
  group: {
    id: string;
    name: string;
    description?: string;
    memberCount: number;
    members: GroupCardMember[];
    userBalance?: number;
    currency?: string;
  };
}

export function GroupCard({ group }: GroupCardProps) {
  const currency = group.currency ?? 'USD';
  const balance = group.userBalance ?? 0;
  const hasBalance = balance !== 0;

  return (
    <motion.div whileHover={{ scale: 1.02 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }}>
      <Link
        href={`/groups/${group.id}`}
        className="block rounded-xl border border-border bg-card p-5 hover:shadow-md transition-shadow"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground truncate text-base leading-snug">{group.name}</h3>
            {group.description && (
              <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{group.description}</p>
            )}
          </div>
        </div>

        {/* Members */}
        <div className="flex items-center gap-2 mb-4">
          {group.members.length > 0 ? (
            <AvatarGroup users={group.members} max={4} size="sm" />
          ) : (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="w-4 h-4" />
            </div>
          )}
          <span className="text-sm text-muted-foreground">
            {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
          </span>
        </div>

        {/* Balance */}
        {hasBalance ? (
          <div
            className={cn(
              'text-sm font-medium',
              balance > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400',
            )}
          >
            {balance > 0
              ? `You are owed ${formatCurrency(balance, currency)}`
              : `You owe ${formatCurrency(Math.abs(balance), currency)}`}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">All settled up</div>
        )}
      </Link>
    </motion.div>
  );
}
