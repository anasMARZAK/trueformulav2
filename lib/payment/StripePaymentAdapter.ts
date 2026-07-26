import { IPaymentService, PaymentRequest, PaymentResponse, SubscriptionRequest, SubscriptionResponse, RenewalResult } from './types';

export class StripePaymentAdapter implements IPaymentService {
  async processCheckout(request: PaymentRequest): Promise<PaymentResponse> {
    throw new Error('StripePaymentAdapter is a production stub. Please set PAYMENT_PROVIDER=mock to use MockPaymentAdapter for $0 mock engine.');
  }

  async createSubscription(request: SubscriptionRequest): Promise<SubscriptionResponse> {
    throw new Error('StripePaymentAdapter is a production stub. Please set PAYMENT_PROVIDER=mock.');
  }

  async renewSubscriptions(): Promise<RenewalResult> {
    throw new Error('StripePaymentAdapter is a production stub. Please set PAYMENT_PROVIDER=mock.');
  }
}
