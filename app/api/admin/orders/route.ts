import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { verifyAdminServerSession } from '@/lib/auth/verifyAdmin';

export async function GET() {
  const adminCheck = await verifyAdminServerSession();
  if (!adminCheck.authorized) return adminCheck.errorResponse!;

  try {
    const supabase = createAdminSupabaseClient();
    const { data: ordersData, error: ordersErr } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (ordersErr || !ordersData) {
      return NextResponse.json({ success: true, orders: [] });
    }

    // Resolve the account behind each order. Without this the table fell back to
    // rendering the raw user_id UUID whenever an order carried no denormalised
    // customer_email, which read as a meaningless string of characters.
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, created_at');
    const profilesMap = new Map(
      (profilesData || []).map((profile) => [profile.id, profile])
    );

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
          unitPrice: String(item.unit_price),
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

    const result = ordersData.map((order) => {
      const profile = profilesMap.get(order.user_id);
      const shipping = (order.shipping_address || {}) as Record<string, any>;

      // The linked account is the source of truth: `customer_email` is a
      // denormalised copy taken at checkout and goes stale when an address
      // changes. Guest orders have no profile, so the recorded values remain the
      // fallback. The raw user_id is never shown as an identity.
      const customerEmail =
        profile?.email || order.customer_email || shipping.email || null;
      const customerName =
        profile?.full_name || order.customer_name || shipping.fullName || null;

      return {
        id: order.id,
        userId: order.user_id,
        customerEmail,
        customerName,
        customerRole: profile?.role || null,
        isRegistered: Boolean(profile),
        totalAmount: String(order.total_amount),
        status: order.status,
        paymentMethod: order.payment_method || 'mock_card',
        shippingAddress: order.shipping_address,
        createdAt: order.created_at ? new Date(order.created_at) : new Date(),
        items: itemsMap.get(order.id) || [],
      };
    });

    return NextResponse.json({ success: true, orders: result });
  } catch (error: any) {
    console.error('[API ADMIN ORDERS GET ERROR]', error);
    return NextResponse.json({ success: true, orders: [] });
  }
}

export async function PATCH(req: NextRequest) {
  const adminCheck = await verifyAdminServerSession();
  if (!adminCheck.authorized) return adminCheck.errorResponse!;

  try {
    const body = await req.json();
    const { orderId, status } = body;

    // Mirrors the order_status enum exactly. 'cancelled' was accepted here but
    // is not a member of the enum, so it produced an opaque database error.
    const ORDER_STATUSES = ['pending', 'completed', 'failed', 'refunded'];
    if (!orderId || !status || !ORDER_STATUSES.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid orderId, or status must be one of: ${ORDER_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabaseClient();
    const { data: updatedOrder, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
