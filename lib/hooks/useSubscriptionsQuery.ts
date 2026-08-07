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

export type SubscriptionStatus = 'active' | 'paused' | 'cancelled';

/**
 * Pause / resume / cancel a subscription.
 *
 * This used to accept verbs ('pause' | 'resume' | 'cancel') and map them to
 * statuses, but callers were already passing the target status itself. Only
 * 'active' happened to be translated; 'paused' and 'cancelled' fell through the
 * lookup as `undefined`, so the request body serialised to `{}` and the API
 * rejected it with "Nothing to update. Provide status or intervalDays."
 * Taking the status directly removes the mismatch entirely.
 */
export function useSubscriptionActionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      subscriptionId,
      status,
    }: {
      subscriptionId: string;
      status: SubscriptionStatus;
    }) => {
      const res = await axiosClient.patch(`/api/subscriptions/${subscriptionId}`, { status });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
  });
}
