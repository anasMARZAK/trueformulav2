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

    return data.map((item) => {
      const priceStr = item.price ? String(item.price) : '39.99';
      const priceCentsVal = item.price_cents ?? Math.round(parseFloat(priceStr) * 100);
      return {
        id: item.id,
        nameEn: item.name_en || item.nameEn,
        nameFr: item.name_fr || item.nameFr,
        descriptionEn: item.description_en || item.descriptionEn,
        descriptionFr: item.description_fr || item.descriptionFr,
        price: priceStr,
        priceCents: priceCentsVal,
        imageUrl: item.image_url || item.imageUrl,
        category: item.category,
        flavors: (item.flavors as string[]) || ['Default'],
        sizes: (item.sizes as string[]) || ['Standard'],
        stock: item.stock ?? 100,
        popularityScore: item.popularity_score ?? item.popularityScore ?? 50,
        isFeatured: item.is_featured ?? item.isFeatured ?? false,
        createdAt: item.created_at ? new Date(item.created_at) : new Date(),
      };
    });
  } catch (err) {
    console.error('Error querying Supabase products:', err);
    return MOCK_PRODUCTS;
  }
}
