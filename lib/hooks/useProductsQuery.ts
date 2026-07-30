import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosClient } from '@/lib/api/axiosClient';
import { type Product } from '@/lib/db/schema';
import { fetchProductsFromSupabase } from '@/lib/db/supabase-products';

export function useProductsQuery() {
  return useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      try {
        const res = await axiosClient.get<{ success: boolean; products: Product[] }>('/api/products');
        if (res.data.success && Array.isArray(res.data.products)) {
          return res.data.products;
        }
      } catch (_) {
        // Fallback to direct client query
      }
      return fetchProductsFromSupabase();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useProductMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productData: Partial<Product>) => {
      const res = await axiosClient.post('/api/admin/products', productData);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
