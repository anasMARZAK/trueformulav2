import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { searchParams } = new URL(req.url);
    const requestedUserId = searchParams.get('userId');

    const targetUserId = user?.id || requestedUserId || '00000000-0000-4000-a000-000000000001';

    const { data: subsData, error: subsErr } = await supabase
      .from('subscriptions')
      .select('*')
      .or(`user_id.eq.${targetUserId},user_id.eq.00000000-0000-4000-a000-000000000001`)
      .order('created_at', { ascending: false });

    if (subsErr || !subsData || subsData.length === 0) {
      return NextResponse.json({ success: true, subscriptions: [] });
    }

    const { data: prodsData } = await supabase.from('products').select('*');
    const prodsMap = new Map((prodsData || []).map((p) => [p.id, p]));

    const enriched = subsData.map((sub) => {
      const prod = prodsMap.get(sub.product_id);
      const nextDate = sub.next_billing_date
        ? new Date(sub.next_billing_date)
        : sub.next_delivery_date
        ? new Date(sub.next_delivery_date)
        : new Date();
      const priceVal = sub.price_per_cycle_cents
        ? (sub.price_per_cycle_cents / 100).toFixed(2)
        : String(sub.price_per_cycle || sub.price_per_billing || '0.00');

      const flavor = sub.selected_flavor || sub.flavor || 'Default';
      const size = sub.selected_size || sub.size || 'Standard';

      return {
        id: sub.id,
        userId: sub.user_id,
        productId: sub.product_id,
        status: sub.status,
        flavor,
        size,
        selectedFlavor: flavor,
        selectedSize: size,
        intervalDays: sub.interval_days || 30,
        interval: `${sub.interval_days || 30} days`,
        nextDeliveryDate: nextDate,
        nextBillingDate: nextDate,
        discountPercentage: sub.discount_percentage || 20,
        pricePerCycle: priceVal,
        pricePerBilling: priceVal,
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
