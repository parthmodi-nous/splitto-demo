'use client';

// TODO: Replace with real auth

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getAvatarColorClasses } from '@/lib/constants';
import { getInitials, cn } from '@/lib/utils';
import { getAllUsers, switchUser, getCurrentUserProfile } from '@/actions/users';
import type { User } from '@/types';

export function UserSwitcher() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    void getAllUsers().then((res) => {
      if (res.success) setUsers(res.data);
    });
    void getCurrentUserProfile().then((res) => {
      if (res.success) setCurrentUser(res.data);
    });
  }, []);

  function handleSwitch(userId: string) {
    startTransition(async () => {
      await switchUser(userId);
      const updated = await getCurrentUserProfile();
      if (updated.success) setCurrentUser(updated.data);
      router.refresh();
    });
  }

  const displayUser = currentUser ?? users[0] ?? null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors',
          'hover:bg-accent hover:text-accent-foreground outline-none',
          isPending && 'opacity-60 pointer-events-none',
        )}
        disabled={isPending}
      >
        {displayUser ? (
          <>
            <UserAvatar user={displayUser} size="sm" />
            <span className="hidden sm:block font-medium max-w-[120px] truncate">
              {displayUser.name}
            </span>
          </>
        ) : (
          <div className="w-7 h-7 rounded-full bg-muted animate-pulse" />
        )}
        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Switch User (Demo)</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {users.map((user) => {
          const isSelected = currentUser?.id === user.id;
          return (
            <DropdownMenuItem
              key={user.id}
              onSelect={() => handleSwitch(user.id)}
              className="flex items-center gap-3 cursor-pointer"
            >
              <UserAvatar user={user} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
              {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface UserAvatarProps {
  user: User;
  size?: 'sm' | 'md';
}

function UserAvatar({ user, size = 'md' }: UserAvatarProps) {
  const { bg, text } = getAvatarColorClasses(user.avatarColor);
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full font-semibold shrink-0 select-none',
        size === 'sm' ? 'w-7 h-7 text-xs' : 'w-8 h-8 text-sm',
        bg,
        text,
      )}
    >
      {getInitials(user.name)}
    </div>
  );
}
