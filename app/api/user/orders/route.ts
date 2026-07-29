import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { mockDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || 'user_customer_01';

    const supabase = createServerSupabaseClient();
    const { data: ordersData, error: ordersErr } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId);

    if (ordersErr || !ordersData || ordersData.length === 0) {
      const mockOrders = await mockDb.getOrdersByUserId(userId);
      const ordersWithItems = [];
      for (const order of mockOrders) {
        const items = await mockDb.getOrderItems(order.id);
        ordersWithItems.push({ ...order, items });
      }
      return NextResponse.json({ success: true, orders: ordersWithItems });
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

    const result = ordersData.map((order) => ({
      id: order.id,
      userId: order.user_id,
      customerEmail: order.customer_email,
      customerName: order.customer_name,
      totalAmount: String(order.total_amount),
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
