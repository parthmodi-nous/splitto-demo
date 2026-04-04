'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Users, ArrowRight } from 'lucide-react';
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

const gradients = [
  'gradient-violet',
  'gradient-emerald',
  'gradient-rose',
  'gradient-amber',
  'gradient-blue',
  'gradient-purple',
  'gradient-teal',
  'gradient-pink',
];

function pickGradient(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return gradients[hash % gradients.length] ?? 'gradient-violet';
}

export function GroupCard({ group }: GroupCardProps) {
  const currency = group.currency ?? 'INR';
  const balance = group.userBalance ?? 0;
  const hasBalance = balance !== 0;
  const grad = pickGradient(group.id);

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    >
      <Link
        href={`/groups/${group.id}`}
        className="block rounded-2xl bg-card border border-border card-elevated overflow-hidden"
      >
        {/* Gradient accent strip */}
        <div className={cn('h-1.5 w-full', grad)} />

        <div className="p-4">
          {/* Title */}
          <div className="mb-3">
            <h3 className="font-bold text-foreground text-base leading-snug truncate">
              {group.name}
            </h3>
            {group.description ? (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                {group.description}
              </p>
            ) : null}
          </div>

          {/* Members */}
          <div className="flex items-center gap-2 mb-4">
            {group.members.length > 0 ? (
              <AvatarGroup users={group.members} max={4} size="sm" />
            ) : (
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted">
                <Users className="w-3 h-3 text-muted-foreground" />
              </div>
            )}
            <span className="text-xs text-muted-foreground">
              {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
            </span>
          </div>

          {/* Balance chip + arrow */}
          <div className="flex items-center justify-between">
            {hasBalance ? (
              <span className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
                balance > 0
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
              )}>
                {balance > 0 ? '💰' : '💸'}
                {balance > 0
                  ? `+${formatCurrency(balance, currency)}`
                  : formatCurrency(balance, currency)}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium bg-muted text-muted-foreground">
                ✓ Settled
              </span>
            )}
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
