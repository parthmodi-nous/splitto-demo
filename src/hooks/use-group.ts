'use client';

import { useQuery } from '@tanstack/react-query';
import { getGroupWithMembers } from '@/actions/groups';
import type { GroupWithMembers } from '@/types';

export function useGroup(groupId: string) {
  return useQuery<GroupWithMembers>({
    queryKey: ['group', groupId],
    queryFn: async () => {
      const result = await getGroupWithMembers(groupId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: Boolean(groupId),
  });
}
