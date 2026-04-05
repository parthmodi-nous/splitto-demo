'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { LogOut, Settings, ChevronDown, Loader2 } from 'lucide-react';
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
import { signOut, useSession } from '@/lib/auth-client';

export function UserMenu() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { data: session, isPending: sessionLoading } = useSession();

  const user = session?.user;

  if (sessionLoading) {
    return <div className="w-7 h-7 rounded-full bg-muted animate-pulse" />;
  }

  if (!user) return null;

  const avatarColor = (user as { avatarColor?: string }).avatarColor ?? 'blue';
  const { bg, text } = getAvatarColorClasses(avatarColor);

  function handleLogout() {
    startTransition(async () => {
      await signOut();
      router.push('/login');
      router.refresh();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors outline-none',
          'hover:bg-accent hover:text-accent-foreground',
          isPending && 'opacity-60 pointer-events-none',
        )}
        disabled={isPending}
      >
        <div
          className={cn(
            'w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 select-none',
            bg,
            text,
          )}
        >
          {getInitials(user.name ?? '')}
        </div>
        <span className="hidden sm:block font-medium max-w-[120px] truncate text-foreground">
          {user.name}
        </span>
        {isPending ? (
          <Loader2 className="w-3.5 h-3.5 text-muted-foreground animate-spin" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onSelect={() => router.push('/settings')}
          className="cursor-pointer gap-2"
        >
          <Settings className="w-4 h-4" />
          Settings
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onSelect={handleLogout}
          className="cursor-pointer gap-2 text-destructive focus:text-destructive"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
