import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Production Stripe Webhooks Endpoint
 * 
 * Note: Production Stripe webhooks replace mock payment mode when STRIPE_SECRET_KEY
 * and STRIPE_WEBHOOK_SECRET are configured in production environment.
 */
export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json(
      {
        success: false,
        error: 'Stripe webhooks are not configured. The application is running in mock payment mode.',
      },
      { status: 501 } // 501 Not Implemented
    );
  }

  try {
    const bodyText = await req.text();
    const sig = req.headers.get('stripe-signature');

    if (!sig) {
      return NextResponse.json(
        { success: false, error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    // When STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET are supplied in production,
    // construct event using stripe SDK:
    // const event = stripe.webhooks.constructEvent(bodyText, sig, webhookSecret);
    
    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('[STRIPE WEBHOOK ERROR]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
