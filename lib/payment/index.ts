import { IPaymentService } from './types';
import { MockPaymentAdapter } from './MockPaymentAdapter';
import { StripePaymentAdapter } from './StripePaymentAdapter';

export * from './types';
export * from './simulationState';
export * from './MockPaymentAdapter';
export * from './StripePaymentAdapter';

export function getPaymentAdapter(): IPaymentService {
  const provider = process.env.PAYMENT_PROVIDER || 'mock';
  if (provider === 'stripe' && process.env.STRIPE_SECRET_KEY) {
    return new StripePaymentAdapter();
  }
  return new MockPaymentAdapter();
}
