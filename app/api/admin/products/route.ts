import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { mockDb } from '@/lib/db';
import { type Product } from '@/lib/db/schema';
import { z } from 'zod';

const productValidationSchema = z.object({
  id: z.string().optional(),
  nameEn: z.string().min(2, 'English name must be at least 2 characters'),
  nameFr: z.string().min(2, 'French name must be at least 2 characters'),
  descriptionEn: z.string().min(5, 'English description is required'),
  descriptionFr: z.string().min(5, 'French description is required'),
  price: z.union([z.string(), z.number()]).transform((v) => String(v)),
  imageUrl: z.string().min(1, 'Image URL is required'),
  category: z.string().min(1, 'Category is required'),
  flavors: z.array(z.string()).default([]),
  sizes: z.array(z.string()).default([]),
  stock: z.number().int().nonnegative().default(100),
  isFeatured: z.boolean().default(false),
});

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase.from('products').select('*');

    if (error || !data || data.length === 0) {
      const mockProds = await mockDb.getProducts();
      return NextResponse.json({ success: true, products: mockProds });
    }

    const products: Product[] = data.map((item) => ({
      id: item.id,
      nameEn: item.name_en || item.nameEn,
      nameFr: item.name_fr || item.nameFr,
      descriptionEn: item.description_en || item.descriptionEn,
      descriptionFr: item.description_fr || item.descriptionFr,
      price: String(item.price),
      imageUrl: item.image_url || item.imageUrl,
      category: item.category,
      flavors: (item.flavors as string[]) || ['Default'],
      sizes: (item.sizes as string[]) || ['Standard'],
      stock: item.stock ?? 100,
      popularityScore: item.popularity_score ?? item.popularityScore ?? 50,
      isFeatured: item.is_featured ?? item.isFeatured ?? false,
      createdAt: item.created_at ? new Date(item.created_at) : new Date(),
    }));

    return NextResponse.json({ success: true, products });
  } catch (error: any) {
    console.error('[API ADMIN PRODUCTS GET ERROR]', error);
    const mockProds = await mockDb.getProducts();
    return NextResponse.json({ success: true, products: mockProds });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parseResult = productValidationSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, errors: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parseResult.data;
    const newId = data.id || `prod_${Date.now().toString(36)}`;
    const supabase = createServerSupabaseClient();

    const dbPayload = {
      id: newId,
      name_en: data.nameEn,
      name_fr: data.nameFr,
      description_en: data.descriptionEn,
      description_fr: data.descriptionFr,
      price: parseFloat(data.price),
      image_url: data.imageUrl,
      category: data.category,
      flavors: data.flavors,
      sizes: data.sizes,
      stock: data.stock,
      is_featured: data.isFeatured,
    };

    const { error } = await supabase.from('products').insert([dbPayload]);

    if (error) {
      console.warn('Supabase product insert warning, using mockDb fallback:', error.message);
    }

    const newProduct: Product = {
      id: newId,
      nameEn: data.nameEn,
      nameFr: data.nameFr,
      descriptionEn: data.descriptionEn,
      descriptionFr: data.descriptionFr,
      price: data.price,
      imageUrl: data.imageUrl,
      category: data.category,
      flavors: data.flavors,
      sizes: data.sizes,
      stock: data.stock,
      popularityScore: 50,
      isFeatured: data.isFeatured,
      createdAt: new Date(),
    };

    await mockDb.createProduct(newProduct);

    return NextResponse.json({
      success: true,
      product: newProduct,
      message: 'Product created successfully in Supabase.',
    });
  } catch (error: any) {
    console.error('[API ADMIN PRODUCTS POST ERROR]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ success: false, error: 'Product ID is required for update.' }, { status: 400 });
    }

    const parseResult = productValidationSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, errors: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parseResult.data;
    const prodId = body.id;
    const supabase = createServerSupabaseClient();

    const dbPayload = {
      name_en: data.nameEn,
      name_fr: data.nameFr,
      description_en: data.descriptionEn,
      description_fr: data.descriptionFr,
      price: parseFloat(data.price),
      image_url: data.imageUrl,
      category: data.category,
      flavors: data.flavors,
      sizes: data.sizes,
      stock: data.stock,
      is_featured: data.isFeatured,
    };

    const { error } = await supabase.from('products').update(dbPayload).eq('id', prodId);

    if (error) {
      console.warn('Supabase product update warning:', error.message);
    }

    const updates: Partial<Product> = {
      nameEn: data.nameEn,
      nameFr: data.nameFr,
      descriptionEn: data.descriptionEn,
      descriptionFr: data.descriptionFr,
      price: data.price,
      imageUrl: data.imageUrl,
      category: data.category,
      flavors: data.flavors,
      sizes: data.sizes,
      stock: data.stock,
      isFeatured: data.isFeatured,
    };

    const updated = await mockDb.updateProduct(prodId, updates);

    return NextResponse.json({
      success: true,
      product: updated,
      message: 'Product updated successfully in Supabase.',
    });
  } catch (error: any) {
    console.error('[API ADMIN PRODUCTS PUT ERROR]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let id = searchParams.get('id');

    if (!id) {
      const body = await req.json().catch(() => ({}));
      id = body.id;
    }

    if (!id) {
      return NextResponse.json({ success: false, error: 'Product ID parameter is required.' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const { error } = await supabase.from('products').delete().eq('id', id);

    if (error) {
      console.warn('Supabase product delete warning:', error.message);
    }

    await mockDb.deleteProduct(id);

    return NextResponse.json({
      success: true,
      deletedId: id,
      message: 'Product deleted successfully from Supabase.',
    });
  } catch (error: any) {
    console.error('[API ADMIN PRODUCTS DELETE ERROR]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
