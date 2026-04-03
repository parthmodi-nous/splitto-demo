'use client';

import React from 'react';
import Link from 'next/link';
import { PackageOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface ActionWithOnClick {
  label: string;
  onClick: () => void;
}

interface ActionWithHref {
  label: string;
  href: string;
}

type Action = ActionWithOnClick | ActionWithHref;

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: Action;
}

function isHrefAction(action: Action): action is ActionWithHref {
  return 'href' in action;
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="flex flex-col items-center justify-center gap-4 py-16 px-6 text-center"
    >
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted text-muted-foreground">
        {icon ?? <PackageOpen className="w-8 h-8" />}
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
        )}
      </div>
      {action && (
        isHrefAction(action) ? (
          <Button asChild>
            <Link href={action.href}>{action.label}</Link>
          </Button>
        ) : (
          <Button onClick={action.onClick}>{action.label}</Button>
        )
      )}
    </motion.div>
  );
}
