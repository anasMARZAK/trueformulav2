import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosClient } from '@/lib/api/axiosClient';

/**
 * Member-portal order history. Always hits the user endpoint, which scopes rows
 * to the signed-in session — passing no id used to silently fall through to the
 * admin endpoint and render another account's orders.
 */
export function useOrdersQuery(userId?: string) {
  return useQuery({
    queryKey: ['orders', userId ?? 'anonymous'],
    queryFn: async () => {
      const res = await axiosClient.get('/api/user/orders');
      return res.data?.orders || [];
    },
    enabled: Boolean(userId),
  });
}

export function useCheckoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: any) => {
      const res = await axiosClient.post('/api/checkout', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
