'use client';

import { useEffect, useCallback } from 'react';
import currency from 'currency.js';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { SPLIT_TYPES } from '@/lib/constants';
import { getAvatarColorClasses } from '@/lib/constants';
import { formatCurrency, getCurrency } from '@/lib/currencies';
import { getInitials, cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';

type SplitType = 'equal' | 'exact' | 'percentage' | 'shares' | 'adjustment';

interface Member {
  id: string;
  name: string;
  avatarColor: string;
}

interface SplitEntry {
  userId: string;
  amount: number;
  percentage?: number;
  shares?: number;
}

interface SplitSelectorProps {
  members: Member[];
  totalAmount: number;
  currency: string;
  paidBy: string;
  splitType: SplitType;
  onSplitTypeChange: (type: SplitType) => void;
  splits: SplitEntry[];
  onSplitsChange: (splits: SplitEntry[]) => void;
  error?: string;
}

function MemberAvatar({ member }: { member: Member }) {
  const { bg, text } = getAvatarColorClasses(member.avatarColor);
  return (
    <div
      className={cn(
        'flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold shrink-0',
        bg,
        text
      )}
    >
      {getInitials(member.name)}
    </div>
  );
}

export function SplitSelector({
  members,
  totalAmount,
  currency: currencyCode,
  paidBy,
  splitType,
  onSplitTypeChange,
  splits,
  onSplitsChange,
  error,
}: SplitSelectorProps) {
  const currencyInfo = getCurrency(currencyCode);
  const precision = currencyInfo.decimalPlaces;

  // ─── Helpers ────────────────────────────────────────────────────────────────

  const getSplit = useCallback(
    (userId: string): SplitEntry => {
      return splits.find((s) => s.userId === userId) ?? { userId, amount: 0 };
    },
    [splits]
  );

  // ─── Auto-recalculate for equal split ────────────────────────────────────

  useEffect(() => {
    if (splitType !== 'equal') return;

    const included = splits.filter((s) => s.amount !== -1).map((s) => s.userId);
    // On initial load or when members change, ensure all are included
    const includedSet = new Set(included.length > 0 ? included : members.map((m) => m.id));

    const includedMembers = members.filter((m) => includedSet.has(m.id));
    if (includedMembers.length === 0) return;

    const base = currency(totalAmount, { precision }).distribute(includedMembers.length);
    // currency.js distribute handles rounding remainder automatically
    // We want the paidBy person to absorb the remainder (last element is the "extra" one)
    // Sort so paidBy is last
    const sorted = [...includedMembers].sort((a, b) =>
      a.id === paidBy ? 1 : b.id === paidBy ? -1 : 0
    );

    const newSplits: SplitEntry[] = members.map((m) => {
      const idx = sorted.findIndex((s) => s.id === m.id);
      if (idx === -1) {
        // excluded member
        return { userId: m.id, amount: 0 };
      }
      return { userId: m.id, amount: base[idx]?.value ?? 0 };
    });

    onSplitsChange(newSplits);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [splitType, totalAmount, paidBy, members.length, precision]);

  // ─── Equal split: toggle inclusion ───────────────────────────────────────

  const isIncludedInEqual = useCallback(
    (userId: string): boolean => {
      const split = getSplit(userId);
      return split.amount > 0 || split.amount === 0;
    },
    [getSplit]
  );

  const handleEqualToggle = useCallback(
    (userId: string, checked: boolean) => {
      const included = members.filter((m) => {
        if (m.id === userId) return checked;
        const s = getSplit(m.id);
        return s.amount > 0 || (s.amount === 0 && m.id !== userId);
      });

      if (included.length === 0) return;

      const base = currency(totalAmount, { precision }).distribute(included.length);
      const sorted = [...included].sort((a, b) =>
        a.id === paidBy ? 1 : b.id === paidBy ? -1 : 0
      );

      const newSplits: SplitEntry[] = members.map((m) => {
        const idx = sorted.findIndex((s) => s.id === m.id);
        if (idx === -1) {
          return { userId: m.id, amount: 0 };
        }
        return { userId: m.id, amount: base[idx]?.value ?? 0 };
      });

      onSplitsChange(newSplits);
    },
    [members, getSplit, totalAmount, precision, paidBy, onSplitsChange]
  );

  // ─── Exact: update individual amount ─────────────────────────────────────

  const handleExactChange = useCallback(
    (userId: string, raw: string) => {
      const val = parseFloat(raw);
      const amount = isNaN(val) ? 0 : Math.max(0, val);
      const newSplits = splits.map((s) =>
        s.userId === userId ? { ...s, amount: currency(amount, { precision }).value } : s
      );
      // Ensure all members are present
      const result = members.map((m) => {
        const existing = newSplits.find((s) => s.userId === m.id);
        return existing ?? { userId: m.id, amount: 0 };
      });
      onSplitsChange(result);
    },
    [splits, members, precision, onSplitsChange]
  );

  // ─── Percentage: update individual percentage ────────────────────────────

  const handlePercentageChange = useCallback(
    (userId: string, raw: string) => {
      const val = parseFloat(raw);
      const pct = isNaN(val) ? 0 : Math.min(100, Math.max(0, val));
      const amount = currency(totalAmount, { precision }).multiply(pct / 100).value;
      const newSplits = members.map((m) => {
        if (m.id === userId) return { userId: m.id, amount, percentage: pct };
        const existing = splits.find((s) => s.userId === m.id);
        return existing ?? { userId: m.id, amount: 0, percentage: 0 };
      });
      onSplitsChange(newSplits);
    },
    [splits, members, totalAmount, precision, onSplitsChange]
  );

  // ─── Shares: update individual shares ────────────────────────────────────

  const handleSharesChange = useCallback(
    (userId: string, raw: string) => {
      const val = parseInt(raw, 10);
      const shares = isNaN(val) ? 0 : Math.max(0, val);

      const updatedShares = members.map((m) => {
        if (m.id === userId) return { userId: m.id, shares };
        const existing = splits.find((s) => s.userId === m.id);
        return { userId: m.id, shares: existing?.shares ?? 1 };
      });

      const totalShares = updatedShares.reduce((sum, s) => sum + (s.shares ?? 0), 0);

      const newSplits: SplitEntry[] = updatedShares.map((s) => ({
        userId: s.userId,
        shares: s.shares,
        amount:
          totalShares > 0
            ? currency(totalAmount, { precision })
                .multiply((s.shares ?? 0) / totalShares)
                .value
            : 0,
      }));

      onSplitsChange(newSplits);
    },
    [splits, members, totalAmount, precision, onSplitsChange]
  );

  // ─── Adjustment: base + per-person adjustment ────────────────────────────

  const getEqualBase = useCallback((): number => {
    if (members.length === 0) return 0;
    return currency(totalAmount, { precision }).distribute(members.length)[0]?.value ?? 0;
  }, [totalAmount, members.length, precision]);

  const handleAdjustmentChange = useCallback(
    (userId: string, raw: string) => {
      const val = parseFloat(raw);
      const adjustment = isNaN(val) ? 0 : val;
      const base = getEqualBase();
      const amount = currency(base, { precision }).add(adjustment).value;

      const newSplits = members.map((m) => {
        if (m.id === userId) {
          return { userId: m.id, amount: Math.max(0, amount), percentage: adjustment };
        }
        const existing = splits.find((s) => s.userId === m.id);
        if (existing) return existing;
        return { userId: m.id, amount: base, percentage: 0 };
      });
      onSplitsChange(newSplits);
    },
    [splits, members, getEqualBase, precision, onSplitsChange]
  );

  // ─── Totals ───────────────────────────────────────────────────────────────

  const splitTotal = splits.reduce(
    (sum, s) => currency(sum, { precision }).add(s.amount).value,
    0
  );

  const remaining = currency(totalAmount, { precision }).subtract(splitTotal).value;
  const hasRoundingError = Math.abs(remaining) > 0.001 && totalAmount > 0;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-3">
      {/* Split type tabs */}
      <div className="flex items-center gap-1 rounded-lg bg-muted p-1 relative overflow-x-auto">
        {SPLIT_TYPES.map((type) => {
          const isActive = splitType === type.value;
          return (
            <button
              key={type.value}
              type="button"
              onClick={() => onSplitTypeChange(type.value as SplitType)}
              className={cn(
                'relative flex-1 min-w-fit px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors z-10',
                isActive
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="split-tab-indicator"
                  className="absolute inset-0 bg-background rounded-md shadow-sm"
                  initial={false}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}
                />
              )}
              <span className="relative z-10">{type.label}</span>
            </button>
          );
        })}
      </div>

      {/* Member rows */}
      <div className="space-y-1.5">
        {members.map((member) => {
          const split = getSplit(member.id);

          return (
            <div
              key={member.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5"
            >
              {/* Avatar + name */}
              <MemberAvatar member={member} />
              <span className="flex-1 min-w-0 text-sm font-medium truncate">
                {member.name}
                {member.id === paidBy && (
                  <span className="ml-1.5 text-xs text-muted-foreground">(paid)</span>
                )}
              </span>

              {/* Input based on split type */}
              {splitType === 'equal' && (
                <>
                  <Checkbox
                    checked={split.amount > 0 || totalAmount === 0}
                    onCheckedChange={(checked) =>
                      handleEqualToggle(member.id, Boolean(checked))
                    }
                  />
                  <span className="text-sm font-medium text-right w-20">
                    {totalAmount > 0
                      ? formatCurrency(split.amount, currencyCode)
                      : formatCurrency(0, currencyCode)}
                  </span>
                </>
              )}

              {splitType === 'exact' && (
                <>
                  <input
                    type="number"
                    min="0"
                    step={precision === 0 ? '1' : '0.01'}
                    value={split.amount > 0 ? split.amount : ''}
                    onChange={(e) => handleExactChange(member.id, e.target.value)}
                    placeholder="0.00"
                    className="w-24 rounded-md border border-input bg-background px-2 py-1 text-sm text-right outline-none focus:ring-2 focus:ring-ring"
                  />
                </>
              )}

              {splitType === 'percentage' && (
                <>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={split.percentage !== undefined ? split.percentage : ''}
                      onChange={(e) => handlePercentageChange(member.id, e.target.value)}
                      placeholder="0"
                      className="w-16 rounded-md border border-input bg-background px-2 py-1 text-sm text-right outline-none focus:ring-2 focus:ring-ring"
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                  <span className="text-sm font-medium text-right w-20">
                    {formatCurrency(split.amount, currencyCode)}
                  </span>
                </>
              )}

              {splitType === 'shares' && (
                <>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={split.shares !== undefined ? split.shares : 1}
                      onChange={(e) => handleSharesChange(member.id, e.target.value)}
                      placeholder="1"
                      className="w-16 rounded-md border border-input bg-background px-2 py-1 text-sm text-right outline-none focus:ring-2 focus:ring-ring"
                    />
                    <span className="text-xs text-muted-foreground">shares</span>
                  </div>
                  <span className="text-sm font-medium text-right w-20">
                    {formatCurrency(split.amount, currencyCode)}
                  </span>
                </>
              )}

              {splitType === 'adjustment' && (() => {
                const base = getEqualBase();
                const adj = split.percentage ?? 0;
                return (
                  <>
                    <div className="flex flex-col items-end gap-0.5">
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">base</span>
                        <span className="text-xs">{formatCurrency(base, currencyCode)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">adj</span>
                        <input
                          type="number"
                          step="0.01"
                          value={adj !== 0 ? adj : ''}
                          onChange={(e) => handleAdjustmentChange(member.id, e.target.value)}
                          placeholder="0"
                          className="w-16 rounded-md border border-input bg-background px-2 py-1 text-xs text-right outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                    </div>
                    <span className="text-sm font-medium text-right w-20">
                      {formatCurrency(split.amount, currencyCode)}
                    </span>
                  </>
                );
              })()}
            </div>
          );
        })}
      </div>

      {/* Footer totals */}
      {totalAmount > 0 && (
        <div
          className={cn(
            'flex items-center justify-between rounded-lg px-3 py-2 text-sm',
            hasRoundingError
              ? 'bg-destructive/10 border border-destructive/30 text-destructive'
              : 'bg-muted text-muted-foreground'
          )}
        >
          <span className="flex items-center gap-1.5">
            {hasRoundingError && <AlertCircle className="w-4 h-4" />}
            {hasRoundingError
              ? `${remaining > 0 ? '' : ''}${formatCurrency(Math.abs(remaining), currencyCode)} ${remaining > 0 ? 'unassigned' : 'over'}`
              : 'Total splits match'}
          </span>
          <span className="font-medium">
            {formatCurrency(splitTotal, currencyCode)} / {formatCurrency(totalAmount, currencyCode)}
          </span>
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
