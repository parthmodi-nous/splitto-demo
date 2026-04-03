'use client';

import { getAvatarColorClasses } from '@/lib/constants';
import { getInitials, cn } from '@/lib/utils';

interface User {
  name: string;
  avatarColor: string;
}

interface AvatarGroupProps {
  users: User[];
  max?: number;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'w-6 h-6 text-xs',
  md: 'w-8 h-8 text-sm',
  lg: 'w-10 h-10 text-base',
};

export function AvatarGroup({ users, max = 4, size = 'md' }: AvatarGroupProps) {
  const visible = users.slice(0, max);
  const overflow = users.length - max;

  return (
    <div className="flex items-center">
      {visible.map((user, index) => {
        const { bg, text } = getAvatarColorClasses(user.avatarColor);
        return (
          <div
            key={index}
            title={user.name}
            className={cn(
              'flex items-center justify-center rounded-full border-2 border-background font-semibold select-none',
              sizeClasses[size],
              bg,
              text,
              index > 0 && '-ml-2',
            )}
          >
            {getInitials(user.name)}
          </div>
        );
      })}
      {overflow > 0 && (
        <div
          className={cn(
            'flex items-center justify-center rounded-full border-2 border-background bg-muted text-muted-foreground font-semibold select-none -ml-2',
            sizeClasses[size],
          )}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}
