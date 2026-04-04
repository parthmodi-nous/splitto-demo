'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Activity, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const tabs = [
  { label: 'Home',     href: '/',         icon: LayoutDashboard },
  { label: 'Groups',   href: '/groups',   icon: Users },
  { label: 'Activity', href: '/activity', icon: Activity },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();

  function isActive(href: string): boolean {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 glass border-t border-border">
      <div className="flex items-stretch h-16">
        {tabs.map(({ label, href, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'relative flex flex-1 flex-col items-center justify-center gap-1 transition-colors select-none',
                active ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              {active && (
                <motion.div
                  layoutId="mobile-nav-pill"
                  className="absolute top-2 inset-x-2 h-10 rounded-xl bg-primary/10"
                  transition={{ type: 'spring', stiffness: 480, damping: 36 }}
                />
              )}
              <Icon
                className="w-5 h-5 relative z-10"
                strokeWidth={active ? 2.2 : 1.8}
              />
              <span className={cn('text-[10px] relative z-10', active ? 'font-semibold' : 'font-medium')}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
