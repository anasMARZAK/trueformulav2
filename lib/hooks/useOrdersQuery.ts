import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosClient } from '@/lib/api/axiosClient';

export function useOrdersQuery(userId?: string) {
  return useQuery({
    queryKey: ['orders', userId || 'all'],
    queryFn: async () => {
      const endpoint = userId ? `/api/user/orders?userId=${userId}` : '/api/admin/orders';
      const res = await axiosClient.get(endpoint);
      return res.data?.orders || [];
    },
    enabled: true,
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
