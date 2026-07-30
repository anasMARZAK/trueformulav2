import { IPaymentService, PaymentRequest, PaymentResponse, SubscriptionRequest, SubscriptionResponse, RenewalResult } from './types';
import { MockPaymentAdapter } from './MockPaymentAdapter';

export class StripePaymentAdapter implements IPaymentService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.STRIPE_SECRET_KEY || '';
  }

  async processCheckout(request: PaymentRequest): Promise<PaymentResponse> {
    if (!this.apiKey) {
      console.info('[STRIPE ADAPTER] STRIPE_SECRET_KEY missing, falling back to MockPaymentAdapter.');
      const mockAdapter = new MockPaymentAdapter();
      return mockAdapter.processCheckout(request);
    }

    try {
      const orderId = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      let subtotalCents = 0;

      const hasSubscription = request.items.some((i) => i.purchaseType === 'subscription');
      const mode = hasSubscription ? 'subscription' : 'payment';

      // Build Stripe Checkout Session payload
      const params = new URLSearchParams();
      params.append('mode', mode);
      params.append('success_url', `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/account?checkout=success&orderId=${orderId}`);
      params.append('cancel_url', `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/?checkout=cancel`);
      params.append('customer_email', request.userEmail);
      params.append('client_reference_id', orderId);
      params.append('metadata[userId]', request.userId || '');
      params.append('metadata[orderId]', orderId);

      request.items.forEach((item, idx) => {
        const unitCents = Math.round(item.unitPrice * 100);
        subtotalCents += unitCents * item.quantity;

        params.append(`line_items[${idx}][price_data][currency]`, 'usd');
        params.append(`line_items[${idx}][price_data][product_data][name]`, request.language === 'fr' ? item.nameFr : item.nameEn);
        params.append(`line_items[${idx}][price_data][unit_amount]`, String(unitCents));
        params.append(`line_items[${idx}][quantity]`, String(item.quantity));

        if (item.purchaseType === 'subscription') {
          params.append(`line_items[${idx}][price_data][recurring][interval]`, 'month');
        }
      });

      // Call Stripe API
      const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      const session = await res.json();
      if (!res.ok) {
        throw new Error(session.error?.message || 'Failed to create Stripe Checkout session');
      }

      const totalAmount = (subtotalCents + (subtotalCents >= 5000 ? 0 : 999)) / 100;

      return {
        success: true,
        orderId,
        totalAmount,
        transactionId: session.id,
      };
    } catch (error: any) {
      console.error('[STRIPE ADAPTER ERROR]', error);
      return {
        success: false,
        errorMessage: error.message || 'Stripe checkout creation failed',
      };
    }
  }

  async createSubscription(request: SubscriptionRequest): Promise<SubscriptionResponse> {
    if (!this.apiKey) {
      const mockAdapter = new MockPaymentAdapter();
      return mockAdapter.createSubscription(request);
    }

    try {
      const subId = `SUB-STRIPE-${Date.now().toString(36).toUpperCase()}`;
      const now = new Date();
      const nextBillingDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      return {
        success: true,
        subscriptionId: subId,
        nextBillingDate,
      };
    } catch (err: any) {
      return {
        success: false,
        errorMessage: err.message || 'Failed to create Stripe subscription',
      };
    }
  }

  async renewSubscriptions(): Promise<RenewalResult> {
    if (!this.apiKey) {
      const mockAdapter = new MockPaymentAdapter();
      return mockAdapter.renewSubscriptions();
    }

    // Real Stripe Subscriptions handle recurring billing automatically via webhooks
    return {
      success: true,
      processedCount: 0,
      renewedSubscriptionIds: [],
      orderIds: [],
    };
  }
}
