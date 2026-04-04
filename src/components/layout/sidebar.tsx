'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Activity,
  Settings,
  ReceiptText,
  Hash,
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
  { label: 'Home',     href: '/',         icon: LayoutDashboard },
  { label: 'Groups',   href: '/groups',   icon: Users },
  { label: 'Activity', href: '/activity', icon: Activity },
  { label: 'Settings', href: '/settings', icon: Settings },
];

const groupGradients = [
  'gradient-violet',
  'gradient-emerald',
  'gradient-rose',
  'gradient-amber',
  'gradient-blue',
  'gradient-purple',
  'gradient-teal',
  'gradient-pink',
];

function groupGradient(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return groupGradients[hash % groupGradients.length] ?? 'gradient-violet';
}

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
    <aside className="hidden lg:flex flex-col w-64 fixed inset-y-0 left-0 z-30 bg-card border-r border-border">
      {/* ── Logo ── */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-border shrink-0">
        <div className="flex items-center justify-center w-8 h-8 rounded-xl gradient-violet text-white shadow-sm">
          <ReceiptText className="w-4 h-4" />
        </div>
        <div>
          <span className="text-sm font-bold tracking-tight text-foreground">SplitLedger</span>
          <p className="text-[10px] text-muted-foreground leading-none mt-0.5">Expense Splitter</p>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}

        {/* ── Groups section ── */}
        {groups.length > 0 && (
          <div className="pt-5">
            <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Your Groups
            </p>
            <div className="space-y-0.5">
              {groups.map((group) => {
                const active = pathname.startsWith(`/groups/${group.id}`);
                const grad = groupGradient(group.id);
                return (
                  <Link
                    key={group.id}
                    href={`/groups/${group.id}`}
                    className={cn(
                      'flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-all duration-150',
                      active
                        ? 'bg-accent text-foreground font-medium'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                    )}
                  >
                    <span className={cn('w-5 h-5 rounded-md shrink-0 flex items-center justify-center', grad)}>
                      <Hash className="w-2.5 h-2.5 text-white" />
                    </span>
                    <span className="truncate">{truncate(group.name, 20)}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* ── Bottom ── */}
      <div className="px-4 py-4 border-t border-border shrink-0">
        <div className="rounded-xl bg-primary/8 px-3 py-2.5">
          <p className="text-xs font-medium text-primary">Split smarter 💡</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Track, split & settle with ease.</p>
        </div>
      </div>
    </aside>
  );
}
