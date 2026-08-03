import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { type Product } from '@/lib/db/schema';
import { MOCK_PRODUCTS } from '@/lib/db/mock-data';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const supabase = createServerSupabaseClient();
    let query = supabase.from('products').select('*');

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      let result = MOCK_PRODUCTS;
      if (category && category !== 'all') {
        result = result.filter((p) => p.category === category);
      }
      if (search) {
        const q = search.toLowerCase();
        result = result.filter(
          (p) => p.nameEn.toLowerCase().includes(q) || p.nameFr.toLowerCase().includes(q)
        );
      }
      return NextResponse.json({ success: true, products: result });
    }

    let products: Product[] = data.map((item) => {
      const priceStr = String(item.price);
      return {
        id: item.id,
        nameEn: item.name_en || item.nameEn,
        nameFr: item.name_fr || item.nameFr,
        descriptionEn: item.description_en || item.descriptionEn,
        descriptionFr: item.description_fr || item.descriptionFr,
        price: priceStr,
        priceCents: item.price_cents ?? Math.round(parseFloat(priceStr) * 100),
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

    if (search) {
      const q = search.toLowerCase();
      products = products.filter(
        (p) => p.nameEn.toLowerCase().includes(q) || p.nameFr.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({ success: true, products });
  } catch (error: any) {
    console.error('[API PRODUCTS GET ERROR]', error);
    return NextResponse.json({ success: true, products: [] });
  }
}
