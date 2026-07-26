import { supabase } from '@/lib/supabase/client';
import { MOCK_PRODUCTS } from '@/lib/db/mock-data';
import { type Product } from '@/lib/db/schema';

export async function fetchProductsFromSupabase(): Promise<Product[]> {
  try {
    const { data, error } = await supabase.from('products').select('*');

    if (error || !data || data.length === 0) {
      console.warn('Supabase fetch returned empty or error, falling back to local dataset:', error?.message);
      return MOCK_PRODUCTS;
    }

    return data.map((item) => ({
      id: item.id,
      nameEn: item.name_en || item.nameEn,
      nameFr: item.name_fr || item.nameFr,
      descriptionEn: item.description_en || item.descriptionEn,
      descriptionFr: item.description_fr || item.descriptionFr,
      price: item.price.toString(),
      imageUrl: item.image_url || item.imageUrl,
      category: item.category,
      flavors: (item.flavors as string[]) || ['Default'],
      sizes: (item.sizes as string[]) || ['Standard'],
      stock: item.stock ?? 100,
      isFeatured: item.is_featured ?? item.isFeatured ?? false,
      createdAt: item.created_at ? new Date(item.created_at) : new Date(),
    }));
  } catch (err) {
    console.error('Error querying Supabase products:', err);
    return MOCK_PRODUCTS;
  }
}
