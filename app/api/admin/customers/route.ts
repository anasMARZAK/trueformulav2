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
  activeSubscriptions: number;
  monthlyRecurring: number;
  lastOrderAt: string | null;
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

    const [profilesRes, ordersRes, subsRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('orders').select('*'),
      supabase.from('subscriptions').select('*'),
    ]);

    const profiles = profilesRes.data || [];
    const orders = ordersRes.data || [];
    const subscriptions = subsRes.data || [];

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
        activeSubscriptions: 0,
        monthlyRecurring: 0,
        lastOrderAt: null,
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

    orders.forEach((order) => {
      const customer = resolve(order.user_id, order.customer_email);
      if (!customer) return;

      customer.orderCount += 1;

      const amount = parseFloat(String(order.total_amount ?? '0'));
      // Only settled orders count toward lifetime spend, matching how the
      // dashboard's revenue KPI is calculated.
      if (order.status === 'completed' && !Number.isNaN(amount)) {
        customer.lifetimeSpend += amount;
      }
      if (order.status === 'pending') {
        customer.pendingOrders += 1;
      }

      const createdAt = order.created_at ? String(order.created_at) : null;
      if (createdAt && (!customer.lastOrderAt || createdAt > customer.lastOrderAt)) {
        customer.lastOrderAt = createdAt;
      }
    });

    subscriptions.forEach((sub) => {
      const customer = resolve(sub.user_id, (sub.shipping_address as any)?.email);
      if (!customer || sub.status !== 'active') return;

      customer.activeSubscriptions += 1;
      const cyclePrice =
        parseFloat(String(sub.price_per_billing ?? sub.price_per_cycle ?? '0')) ||
        (sub.price_per_cycle_cents ? sub.price_per_cycle_cents / 100 : 0);
      customer.monthlyRecurring += cyclePrice;
    });

    return NextResponse.json({ success: true, customers });
  } catch (error: any) {
    console.error('[API ADMIN CUSTOMERS GET ERROR]', error);
    return NextResponse.json({ success: false, error: error.message, customers: [] }, { status: 500 });
  }
}
