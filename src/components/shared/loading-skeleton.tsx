import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function ExpenseCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-4 p-4 rounded-lg border bg-card', className)}>
      <Skeleton className="shimmer w-10 h-10 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="shimmer h-4 w-2/3" />
        <Skeleton className="shimmer h-3 w-1/3" />
      </div>
      <div className="flex flex-col items-end gap-2">
        <Skeleton className="shimmer h-4 w-16" />
        <Skeleton className="shimmer h-3 w-12" />
      </div>
    </div>
  );
}

export function GroupCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('p-4 rounded-lg border bg-card space-y-3', className)}>
      <div className="flex items-center gap-3">
        <Skeleton className="shimmer w-10 h-10 rounded-lg shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="shimmer h-4 w-1/2" />
          <Skeleton className="shimmer h-3 w-1/3" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="shimmer w-6 h-6 rounded-full" />
        <Skeleton className="shimmer w-6 h-6 rounded-full -ml-2" />
        <Skeleton className="shimmer w-6 h-6 rounded-full -ml-2" />
      </div>
      <div className="flex justify-between items-center pt-1">
        <Skeleton className="shimmer h-3 w-20" />
        <Skeleton className="shimmer h-5 w-16 rounded-full" />
      </div>
    </div>
  );
}

export function BalanceSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-3 py-3', className)}>
      <Skeleton className="shimmer w-8 h-8 rounded-full shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="shimmer h-4 w-32" />
        <Skeleton className="shimmer h-3 w-20" />
      </div>
      <Skeleton className="shimmer h-5 w-16" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="shimmer h-8 w-48" />
        <Skeleton className="shimmer h-4 w-32" />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-4 rounded-lg border bg-card space-y-3">
            <Skeleton className="shimmer h-4 w-24" />
            <Skeleton className="shimmer h-7 w-20" />
            <Skeleton className="shimmer h-3 w-16" />
          </div>
        ))}
      </div>

      {/* Groups */}
      <div className="space-y-3">
        <Skeleton className="shimmer h-5 w-24" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <GroupCardSkeleton key={i} />
          ))}
        </div>
      </div>

      {/* Recent expenses */}
      <div className="space-y-3">
        <Skeleton className="shimmer h-5 w-36" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <ExpenseCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
