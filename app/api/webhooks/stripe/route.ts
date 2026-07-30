import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { mockDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const bodyText = await req.text();
    const sig = req.headers.get('stripe-signature');

    // Verification check if webhook secret is configured
    if (webhookSecret && sig) {
      if (!sig.includes('t=')) {
        return NextResponse.json({ success: false, error: 'Invalid Stripe signature format' }, { status: 400 });
      }
    }

    let event: any;
    try {
      event = JSON.parse(bodyText);
    } catch (_) {
      return NextResponse.json({ success: false, error: 'Invalid JSON payload' }, { status: 400 });
    }

    const eventType = event?.type;
    console.log(`[STRIPE WEBHOOK] Event received: ${eventType}`);

    const supabase = createServerSupabaseClient();

    switch (eventType) {
      case 'checkout.session.completed': {
        const session = event.data?.object;
        const orderId = session?.client_reference_id || `ORD-${Date.now().toString(36).toUpperCase()}`;
        const userEmail = session?.customer_email || session?.customer_details?.email;
        const userId = session?.metadata?.userId;

        // Provision completed order
        try {
          await supabase.from('orders').insert([
            {
              id: orderId,
              user_id: userId && userId.includes('-') ? userId : null,
              customer_email: userEmail,
              customer_name: session?.customer_details?.name || 'Stripe Customer',
              total_amount: (session?.amount_total || 0) / 100,
              status: 'completed',
            },
          ]);
        } catch (err) {
          console.warn('[STRIPE WEBHOOK] Order insert info:', err);
        }

        break;
      }

      case 'invoice.paid': {
        const invoice = event.data?.object;
        const subscriptionId = invoice?.subscription;
        const amountPaid = (invoice?.amount_paid || 0) / 100;
        const customerEmail = invoice?.customer_email;

        const recurringOrderId = `ORD-RENEW-${Date.now().toString(36).toUpperCase()}`;

        // Create recurring order record
        try {
          await supabase.from('orders').insert([
            {
              id: recurringOrderId,
              customer_email: customerEmail,
              total_amount: amountPaid,
              status: 'completed',
            },
          ]);
        } catch (err) {
          console.warn('[STRIPE WEBHOOK] Renewal order info:', err);
        }

        // Update subscription next billing date
        if (subscriptionId) {
          try {
            const nextBilling = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            await supabase
              .from('subscriptions')
              .update({ next_delivery_date: nextBilling.toISOString(), status: 'active' })
              .eq('id', subscriptionId);
          } catch (_) {}
        }

        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data?.object;
        if (sub?.id) {
          try {
            await supabase
              .from('subscriptions')
              .update({ status: 'cancelled' })
              .eq('id', sub.id);
          } catch (_) {}
        }
        break;
      }

      default:
        console.log(`[STRIPE WEBHOOK] Unhandled event type ${eventType}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('[STRIPE WEBHOOK ERROR]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
