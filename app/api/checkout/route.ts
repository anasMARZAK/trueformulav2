import { NextRequest, NextResponse } from 'next/server';
import { getPaymentAdapter } from '@/lib/payment';
import { MOCK_PRODUCTS } from '@/lib/db/mock-data';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { checkoutPayloadSchema } from '@/lib/validations/schemas';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parseResult = checkoutPayloadSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', errors: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { userId: payloadUserId, email, userEmail, shippingAddress, items, paymentMethod, language } = parseResult.data;
    const targetEmail = userEmail || email || shippingAddress.email;

    // Verify token if available
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    const supabase = createServerSupabaseClient();
    let verifiedUserId = payloadUserId;

    if (token) {
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) verifiedUserId = user.id;
    }

    const userId = verifiedUserId || payloadUserId || 'user_customer_01';

    // Server-Side Price Verification & Recalculation
    // 1. Fetch live products from Supabase DB or mock dataset
    let liveProducts = MOCK_PRODUCTS;
    try {
      const { data } = await supabase.from('products').select('*');
      if (data && data.length > 0) {
        liveProducts = data.map((item) => ({
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
          isFeatured: item.is_featured ?? false,
          createdAt: item.created_at ? new Date(item.created_at) : new Date(),
        }));
      }
    } catch (_) {}

    const productsMap = new Map(liveProducts.map((p) => [p.id, p]));

    // 2. Re-calculate verified unit prices server-side
    const verifiedItems = items.map((item) => {
      // Extract clean product ID if client sent composite key
      let cleanProductId = item.productId;
      if (!productsMap.has(cleanProductId)) {
        for (const knownId of productsMap.keys()) {
          if (cleanProductId.startsWith(knownId)) {
            cleanProductId = knownId;
            break;
          }
        }
      }

      const prod = productsMap.get(cleanProductId);
      const basePrice = prod ? parseFloat(prod.price) : 39.99;
      const verifiedUnitPrice =
        item.purchaseType === 'subscription'
          ? Math.round(basePrice * 0.8 * 100) / 100
          : basePrice;

      return {
        ...item,
        productId: cleanProductId,
        nameEn: prod?.nameEn || item.nameEn || cleanProductId,
        nameFr: prod?.nameFr || item.nameFr || cleanProductId,
        unitPrice: verifiedUnitPrice,
      };
    });

    const adapter = getPaymentAdapter();
    const result = await adapter.processCheckout({
      userId,
      userEmail: targetEmail,
      shippingAddress,
      items: verifiedItems,
      paymentMethod,
      language: language || 'en',
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.errorMessage || 'Payment processing failed.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      orderId: result.orderId,
      totalAmount: result.totalAmount,
      createdSubscriptionIds: result.createdSubscriptionIds || [],
      transactionId: result.transactionId,
    });
  } catch (error: any) {
    console.error('[CHECKOUT API ERROR]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error during checkout.' },
      { status: 500 }
    );
  }
}

