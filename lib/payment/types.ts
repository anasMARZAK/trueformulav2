export interface CartItemInput {
  productId: string;
  nameEn: string;
  nameFr: string;
  quantity: number;
  unitPrice: number;
  purchaseType: 'one_time' | 'subscription';
  selectedFlavor?: string;
  selectedSize?: string;
}

export interface ShippingAddress {
  fullName: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface PaymentRequest {
  userId?: string;
  userEmail: string;
  shippingAddress: ShippingAddress;
  items: CartItemInput[];
  paymentMethod?: string;
  language?: 'en' | 'fr';
}

export interface PaymentResponse {
  success: boolean;
  orderId?: string;
  totalAmount?: number;
  createdSubscriptionIds?: string[];
  errorMessage?: string;
  transactionId?: string;
}

export interface SubscriptionRequest {
  userId: string;
  productId: string;
  pricePerBilling: number;
  discountPercent?: number;
  interval?: string;
  shippingAddress: ShippingAddress;
  selectedFlavor?: string;
  selectedSize?: string;
}

export interface SubscriptionResponse {
  success: boolean;
  subscriptionId?: string;
  nextBillingDate?: Date;
  errorMessage?: string;
}

export interface RenewalResult {
  success: boolean;
  processedCount: number;
  renewedSubscriptionIds: string[];
  orderIds: string[];
  errors?: string[];
}

export interface IPaymentService {
  processCheckout(request: PaymentRequest): Promise<PaymentResponse>;
  createSubscription(request: SubscriptionRequest): Promise<SubscriptionResponse>;
  renewSubscriptions(): Promise<RenewalResult>;
}
