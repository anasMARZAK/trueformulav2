import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { verifyAdminServerSession } from '@/lib/auth/verifyAdmin';

export async function GET() {
  const adminCheck = await verifyAdminServerSession();
  if (!adminCheck.authorized) return adminCheck.errorResponse!;

  try {
    const supabase = createAdminSupabaseClient();
    const { data: subsData, error: subsErr } = await supabase.from('subscriptions').select('*');

    if (subsErr || !subsData) {
      return NextResponse.json({ success: true, subscriptions: [] });
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
    console.error('[API ADMIN SUBSCRIPTIONS GET ERROR]', error);
    return NextResponse.json({ success: true, subscriptions: [] });
  }
}
