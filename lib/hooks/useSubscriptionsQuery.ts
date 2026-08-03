import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosClient } from '@/lib/api/axiosClient';

export function useSubscriptionsQuery(userId?: string) {
  return useQuery({
    queryKey: ['subscriptions', userId || 'all'],
    queryFn: async () => {
      const endpoint = userId ? `/api/user/subscriptions?userId=${userId}` : '/api/admin/subscriptions';
      const res = await axiosClient.get(endpoint);
      return res.data?.subscriptions || [];
    },
  });
}

export function useSubscriptionActionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ subscriptionId, action }: { subscriptionId: string; action: 'pause' | 'resume' | 'cancel' }) => {
      const statusMap = {
        pause: 'paused',
        resume: 'active',
        cancel: 'cancelled',
      } as const;
      const status = statusMap[action];
      const res = await axiosClient.patch(`/api/subscriptions/${subscriptionId}`, { status });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
  });
}
