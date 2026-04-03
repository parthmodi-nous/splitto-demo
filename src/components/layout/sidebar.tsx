'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Activity,
  Settings,
  ReceiptText,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Group {
  id: string;
  name: string;
}

interface SidebarProps {
  groups?: Group[];
}

const navItems = [
  { label: 'Home', href: '/', icon: LayoutDashboard },
  { label: 'Groups', href: '/groups', icon: Users },
  { label: 'Activity', href: '/activity', icon: Activity },
  { label: 'Settings', href: '/settings', icon: Settings },
];

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + '…' : str;
}

export function Sidebar({ groups = [] }: SidebarProps) {
  const pathname = usePathname();

  function isActive(href: string): boolean {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  return (
    <aside className="hidden lg:flex flex-col w-64 fixed inset-y-0 left-0 z-30 border-r border-border bg-card">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-border">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground">
          <ReceiptText className="w-4 h-4" />
        </div>
        <span className="text-base font-bold tracking-tight text-foreground">SplitLedger</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
              isActive(href)
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </Link>
        ))}

        {/* Your Groups */}
        {groups.length > 0 && (
          <div className="pt-4">
            <p className="px-3 pb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Your Groups
            </p>
            <div className="space-y-0.5">
              {groups.map((group) => (
                <Link
                  key={group.id}
                  href={`/groups/${group.id}`}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                    pathname.startsWith(`/groups/${group.id}`)
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  )}
                >
                  <span className="truncate">{truncate(group.name, 22)}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Bottom spacer / user placeholder */}
      <div className="px-3 py-4 border-t border-border">
        <div className="h-9" />
      </div>
    </aside>
  );
}
