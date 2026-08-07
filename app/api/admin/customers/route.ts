import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { verifyAdminServerSession } from '@/lib/auth/verifyAdmin';

export const dynamic = 'force-dynamic';

export interface AdminCustomer {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
  createdAt: string | null;
  orderCount: number;
  lifetimeSpend: number;
  pendingOrders: number;
  failedOrders: number;
  activeSubscriptions: number;
  pausedSubscriptions: number;
  cancelledSubscriptions: number;
  monthlyRecurring: number;
  lastOrderAt: string | null;
  firstOrderAt: string | null;
  /** Settled spend divided by settled orders. */
  averageOrderValue: number;
  /** Product names the account has actually bought, most recent first. */
  purchasedProducts: string[];
  /** Derived standing, used for the segment badge in the dashboard. */
  segment: 'subscriber' | 'repeat' | 'one_time' | 'registered_no_orders';
  city: string | null;
  country: string | null;
}

/**
 * The registered-account roster the dashboard reads. Everything is derived from
 * `profiles` joined against real order and subscription rows — there is no
 * placeholder or generated data in this response.
 */
export async function GET() {
  const adminCheck = await verifyAdminServerSession();
  if (!adminCheck.authorized) return adminCheck.errorResponse!;

  try {
    const supabase = createAdminSupabaseClient();

    const [profilesRes, ordersRes, subsRes, itemsRes, productsRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
      supabase.from('subscriptions').select('*'),
      supabase.from('order_items').select('*'),
      supabase.from('products').select('id, name_en'),
    ]);

    const profiles = profilesRes.data || [];
    const orders = ordersRes.data || [];
    const subscriptions = subsRes.data || [];
    const orderItems = itemsRes.data || [];
    const productNames = new Map(
      (productsRes.data || []).map((p) => [p.id, p.name_en as string])
    );

    // order id -> the product names on that order, for the purchase summary.
    const itemsByOrder = new Map<string, string[]>();
    orderItems.forEach((item) => {
      const label = productNames.get(item.product_id) || item.product_id;
      const list = itemsByOrder.get(item.order_id) || [];
      list.push(label);
      itemsByOrder.set(item.order_id, list);
    });

    // Index orders and subscriptions by both user id and email so guest
    // checkouts still attach to the account that later registered.
    const byUser = new Map<string, AdminCustomer>();

    const customers: AdminCustomer[] = profiles.map((profile) => {
      const record: AdminCustomer = {
        id: profile.id,
        email: profile.email,
        fullName: profile.full_name ?? null,
        role: profile.role || 'customer',
        createdAt: profile.created_at ?? null,
        orderCount: 0,
        lifetimeSpend: 0,
        pendingOrders: 0,
        failedOrders: 0,
        activeSubscriptions: 0,
        pausedSubscriptions: 0,
        cancelledSubscriptions: 0,
        monthlyRecurring: 0,
        lastOrderAt: null,
        firstOrderAt: null,
        averageOrderValue: 0,
        purchasedProducts: [],
        segment: 'registered_no_orders',
        city: null,
        country: null,
      };
      byUser.set(profile.id, record);
      return record;
    });

    const byEmail = new Map<string, AdminCustomer>();
    customers.forEach((customer) => {
      if (customer.email) byEmail.set(customer.email.toLowerCase(), customer);
    });

    const resolve = (userId?: string | null, email?: string | null) =>
      (userId ? byUser.get(userId) : undefined) ||
      (email ? byEmail.get(email.toLowerCase()) : undefined);

    // Settled order count per customer, needed for the average-order-value math.
    const settledCounts = new Map<string, number>();

    orders.forEach((order) => {
      const customer = resolve(order.user_id, order.customer_email);
      if (!customer) return;

      customer.orderCount += 1;

      const amount = parseFloat(String(order.total_amount ?? '0'));
      // Only settled orders count toward lifetime spend, matching how the
      // dashboard's revenue KPI is calculated.
      if (order.status === 'completed' && !Number.isNaN(amount)) {
        customer.lifetimeSpend += amount;
        settledCounts.set(customer.id, (settledCounts.get(customer.id) || 0) + 1);
      }
      if (order.status === 'pending') customer.pendingOrders += 1;
      if (order.status === 'failed') customer.failedOrders += 1;

      const createdAt = order.created_at ? String(order.created_at) : null;
      if (createdAt) {
        if (!customer.lastOrderAt || createdAt > customer.lastOrderAt) {
          customer.lastOrderAt = createdAt;
        }
        if (!customer.firstOrderAt || createdAt < customer.firstOrderAt) {
          customer.firstOrderAt = createdAt;
        }
      }

      // Shipping destination from the most recent order (orders are sorted
      // newest first, so only fill this once).
      const shipping = (order.shipping_address || {}) as Record<string, any>;
      if (!customer.city && shipping.city) customer.city = shipping.city;
      if (!customer.country && shipping.country) customer.country = shipping.country;

      // Distinct product names, capped so the payload stays small.
      (itemsByOrder.get(order.id) || []).forEach((name) => {
        if (customer.purchasedProducts.length < 8 && !customer.purchasedProducts.includes(name)) {
          customer.purchasedProducts.push(name);
        }
      });
    });

    subscriptions.forEach((sub) => {
      const customer = resolve(sub.user_id, (sub.shipping_address as any)?.email);
      if (!customer) return;

      if (sub.status === 'paused') customer.pausedSubscriptions += 1;
      if (sub.status === 'cancelled') customer.cancelledSubscriptions += 1;
      if (sub.status !== 'active') return;

      customer.activeSubscriptions += 1;
      const cyclePrice =
        parseFloat(String(sub.price_per_billing ?? sub.price_per_cycle ?? '0')) ||
        (sub.price_per_cycle_cents ? sub.price_per_cycle_cents / 100 : 0);
      customer.monthlyRecurring += cyclePrice;
    });

    customers.forEach((customer) => {
      const settled = settledCounts.get(customer.id) || 0;
      customer.averageOrderValue = settled > 0 ? customer.lifetimeSpend / settled : 0;

      customer.segment =
        customer.activeSubscriptions > 0
          ? 'subscriber'
          : customer.orderCount > 1
          ? 'repeat'
          : customer.orderCount === 1
          ? 'one_time'
          : 'registered_no_orders';
    });

    return NextResponse.json({ success: true, customers });
  } catch (error: any) {
    console.error('[API ADMIN CUSTOMERS GET ERROR]', error);
    return NextResponse.json({ success: false, error: error.message, customers: [] }, { status: 500 });
  }
}
