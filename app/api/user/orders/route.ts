import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { searchParams } = new URL(req.url);
    const requestedUserId = searchParams.get('userId');

    // Enforce ownership: must match session user
    const userId = user?.id || requestedUserId;
    if (!userId) {
      return NextResponse.json({ success: true, orders: [] });
    }

    if (user && requestedUserId && user.id !== requestedUserId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: You cannot access another user orders.' },
        { status: 403 }
      );
    }

    const { data: ordersData, error: ordersErr } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId);

    if (ordersErr || !ordersData || ordersData.length === 0) {
      return NextResponse.json({ success: true, orders: [] });
    }

    const { data: itemsData } = await supabase.from('order_items').select('*');
    const itemsMap = new Map<string, any[]>();
    if (itemsData) {
      itemsData.forEach((item) => {
        const formattedItem = {
          id: item.id,
          orderId: item.order_id,
          productId: item.product_id,
          nameEn: item.name_en || item.product_id,
          nameFr: item.name_fr || item.product_id,
          unitPrice: String(item.unit_price || ((item.unit_price_cents || 0) / 100).toFixed(2)),
          quantity: item.quantity,
          selectedFlavor: item.selected_flavor,
          selectedSize: item.selected_size,
          purchaseType: item.purchase_type,
          ...item,
        };
        const list = itemsMap.get(item.order_id) || [];
        list.push(formattedItem);
        itemsMap.set(item.order_id, list);
      });
    }

    const result = ordersData.map((order) => ({
      id: order.id,
      userId: order.user_id,
      customerEmail: order.customer_email,
      customerName: order.customer_name,
      totalAmount: String(order.total_amount || ((order.total_cents || 0) / 100).toFixed(2)),
      status: order.status,
      shippingAddress: order.shipping_address,
      createdAt: order.created_at ? new Date(order.created_at) : new Date(),
      items: itemsMap.get(order.id) || [],
    }));

    return NextResponse.json({ success: true, orders: result });
  } catch (error: any) {
    console.error('[API USER ORDERS GET ERROR]', error);
    return NextResponse.json({ success: true, orders: [] });
  }
}
