import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { mockDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    const supabase = createServerSupabaseClient();
    let authenticatedUserId: string | null = null;

    if (token) {
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) authenticatedUserId = user.id;
    }

    const { searchParams } = new URL(req.url);
    const requestedUserId = searchParams.get('userId') || 'user_customer_01';

    const userId = authenticatedUserId || requestedUserId;
    if (authenticatedUserId && authenticatedUserId !== requestedUserId && !authenticatedUserId.includes('admin')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: You cannot access another user subscriptions.' },
        { status: 403 }
      );
    }

    const { data: subsData, error: subsErr } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId);

    if (subsErr || !subsData || subsData.length === 0) {
      const mockSubs = await mockDb.getSubscriptionsByUserId(userId);
      const allProds = await mockDb.getProducts();
      const prodsMap = new Map(allProds.map((p) => [p.id, p]));

      const enrichedMock = mockSubs.map((sub) => {
        const prod = prodsMap.get(sub.productId);
        return {
          ...sub,
          productNameEn: prod?.nameEn || sub.productId,
          productNameFr: prod?.nameFr || sub.productId,
          imageUrl: prod?.imageUrl || '/images/true-formula-bar.jpg',
        };
      });

      return NextResponse.json({ success: true, subscriptions: enrichedMock });
    }

    const { data: prodsData } = await supabase.from('products').select('*');
    const prodsMap = new Map((prodsData || []).map((p) => [p.id, p]));

    const enriched = subsData.map((sub) => {
      const prod = prodsMap.get(sub.product_id);
      const nextDate = sub.next_delivery_date ? new Date(sub.next_delivery_date) : new Date();
      const priceStr = String(sub.price_per_cycle);
      return {
        id: sub.id,
        userId: sub.user_id,
        productId: sub.product_id,
        status: sub.status,
        flavor: sub.flavor,
        size: sub.size,
        selectedFlavor: sub.flavor,
        selectedSize: sub.size,
        intervalDays: sub.interval_days,
        interval: `${sub.interval_days || 30} days`,
        nextDeliveryDate: nextDate,
        nextBillingDate: nextDate,
        discountPercentage: sub.discount_percentage,
        pricePerCycle: priceStr,
        pricePerBilling: priceStr,
        createdAt: sub.created_at ? new Date(sub.created_at) : new Date(),
        productNameEn: prod?.name_en || sub.product_id,
        productNameFr: prod?.name_fr || sub.product_id,
        imageUrl: prod?.image_url || '/images/true-formula-bar.jpg',
      };
    });

    return NextResponse.json({ success: true, subscriptions: enriched });
  } catch (error: any) {
    console.error('[API USER SUBSCRIPTIONS GET ERROR]', error);
    return NextResponse.json({ success: true, subscriptions: [] });
  }
}
