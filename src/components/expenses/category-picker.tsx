'use client';

import { motion } from 'framer-motion';
import { EXPENSE_CATEGORIES } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface CategoryPickerProps {
  value: string;
  onChange: (value: string) => void;
}

export function CategoryPicker({ value, onChange }: CategoryPickerProps) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
      {EXPENSE_CATEGORIES.map((category) => {
        const isSelected = value === category.value;
        return (
          <button
            key={category.value}
            type="button"
            onClick={() => onChange(category.value)}
            className={cn(
              'relative flex flex-col items-center justify-center gap-1.5 rounded-lg border px-2 py-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              isSelected
                ? 'border-primary text-primary'
                : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
            )}
          >
            {isSelected && (
              <motion.div
                layoutId="category-selection"
                className="absolute inset-0 rounded-lg bg-primary/10"
                initial={false}
                transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
              />
            )}
            <span className="relative z-10 text-xl">{category.icon}</span>
            <span className="relative z-10 text-center leading-tight">{category.label}</span>
          </button>
        );
      })}
    </div>
  );
}
