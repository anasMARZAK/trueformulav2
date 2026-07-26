import { NextRequest, NextResponse } from 'next/server';
import { getPaymentAdapter } from '@/lib/payment';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, email, userEmail, shippingAddress, items, paymentMethod, language } = body;

    const targetEmail = userEmail || email || shippingAddress?.email;

    if (!targetEmail) {
      return NextResponse.json(
        { success: false, error: 'Email address is required for checkout.' },
        { status: 400 }
      );
    }

    if (!shippingAddress || !shippingAddress.address || !shippingAddress.fullName) {
      return NextResponse.json(
        { success: false, error: 'Complete shipping address is required.' },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Cart must contain at least one item.' },
        { status: 400 }
      );
    }

    const adapter = getPaymentAdapter();
    const result = await adapter.processCheckout({
      userId,
      userEmail: targetEmail,
      shippingAddress,
      items,
      paymentMethod,
      language: language || 'en',
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.errorMessage || 'Payment processing failed.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      orderId: result.orderId,
      totalAmount: result.totalAmount,
      createdSubscriptionIds: result.createdSubscriptionIds || [],
      transactionId: result.transactionId,
    });
  } catch (error: any) {
    console.error('[CHECKOUT API ERROR]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error during checkout.' },
      { status: 500 }
    );
  }
}
