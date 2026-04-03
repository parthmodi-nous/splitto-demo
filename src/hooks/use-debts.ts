'use client';

import { useQuery } from '@tanstack/react-query';
import { getSimplifiedDebts, getGroupBalances } from '@/actions/settlements';
import type { MemberBalance } from '@/types';
import type { DebtTransaction } from '@/lib/algorithms/simplify-debts';
import type { User } from '@/types';

export type DebtWithUsers = DebtTransaction & { fromUser: User; toUser: User };

export function useGroupDebts(groupId: string) {
  return useQuery({
    queryKey: ['group-debts', groupId],
    queryFn: async () => {
      const result = await getSimplifiedDebts(groupId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data as DebtWithUsers[];
    },
    enabled: Boolean(groupId),
  });
}

export function useGroupBalances(groupId: string) {
  return useQuery<MemberBalance[]>({
    queryKey: ['group-balances', groupId],
    queryFn: async () => {
      const result = await getGroupBalances(groupId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: Boolean(groupId),
  });
}
