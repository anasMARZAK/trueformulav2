import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosClient } from '@/lib/api/axiosClient';

/**
 * Member-portal subscriptions. Always hits the user endpoint, which scopes rows
 * to the signed-in session — see useOrdersQuery for why the fallback was wrong.
 */
export function useSubscriptionsQuery(userId?: string) {
  return useQuery({
    queryKey: ['subscriptions', userId ?? 'anonymous'],
    queryFn: async () => {
      const res = await axiosClient.get('/api/user/subscriptions');
      return res.data?.subscriptions || [];
    },
    enabled: Boolean(userId),
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
