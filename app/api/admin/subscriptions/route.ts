import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { verifyAdminServerSession } from '@/lib/auth/verifyAdmin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const adminCheck = await verifyAdminServerSession();
  if (!adminCheck.authorized) return adminCheck.errorResponse!;

  try {
    const supabase = createAdminSupabaseClient();
    const { data: subsData, error: subsErr } = await supabase
      .from('subscriptions')
      .select('*')
      .order('created_at', { ascending: false });

    if (subsErr || !subsData) {
      return NextResponse.json({ success: true, subscriptions: [] });
    }

    const [{ data: prodsData }, { data: profilesData }] = await Promise.all([
      supabase.from('products').select('*'),
      // Resolves the account behind each subscription. Without this the admin
      // table had no email field at all and fell back to printing the raw
      // user_id UUID in the "Customer Email" column.
      supabase.from('profiles').select('id, email, full_name'),
    ]);

    const prodsMap = new Map((prodsData || []).map((p) => [p.id, p]));
    const profilesMap = new Map((profilesData || []).map((p) => [p.id, p]));

    const enriched = subsData.map((sub) => {
      const prod = prodsMap.get(sub.product_id);
      const profile = profilesMap.get(sub.user_id);
      const shipping = (sub.shipping_address || {}) as Record<string, any>;

      // The schema carries both a legacy and a current column for several
      // fields; prefer the current one and fall back so older rows still read.
      const nextDate = sub.next_billing_date
        ? new Date(sub.next_billing_date)
        : sub.next_delivery_date
        ? new Date(sub.next_delivery_date)
        : new Date();

      const priceStr = String(
        sub.price_per_billing ??
          sub.price_per_cycle ??
          (sub.price_per_cycle_cents ? (sub.price_per_cycle_cents / 100).toFixed(2) : '0.00')
      );

      const flavor = sub.selected_flavor || sub.flavor || null;
      const size = sub.selected_size || sub.size || null;

      return {
        id: sub.id,
        userId: sub.user_id,
        productId: sub.product_id,
        status: sub.status,
        // The live account address is authoritative; the shipping snapshot is
        // only a fallback for rows with no linked profile.
        userEmail: profile?.email || shipping.email || null,
        userName: profile?.full_name || shipping.fullName || null,
        isRegistered: Boolean(profile),
        flavor,
        size,
        selectedFlavor: flavor,
        selectedSize: size,
        quantity: sub.quantity ?? 1,
        intervalDays: sub.interval_days ?? 30,
        interval: `${sub.interval_days || 30} days`,
        nextDeliveryDate: nextDate,
        nextBillingDate: nextDate,
        discountPercentage: sub.discount_percentage ?? sub.discount_percent ?? 20,
        pricePerCycle: priceStr,
        pricePerBilling: priceStr,
        createdAt: sub.created_at ? new Date(sub.created_at) : new Date(),
        cancelledAt: sub.cancelled_at ? new Date(sub.cancelled_at) : null,
        shippingAddress: sub.shipping_address,
        productNameEn: prod?.name_en || sub.product_id,
        productNameFr: prod?.name_fr || sub.product_id,
        imageUrl: prod?.image_url || '/images/whey-isolate.svg',
      };
    });

    return NextResponse.json({ success: true, subscriptions: enriched });
  } catch (error: any) {
    console.error('[API ADMIN SUBSCRIPTIONS GET ERROR]', error);
    return NextResponse.json({ success: true, subscriptions: [] });
  }
}
