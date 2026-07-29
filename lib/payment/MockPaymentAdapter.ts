import { IPaymentService, PaymentRequest, PaymentResponse, SubscriptionRequest, SubscriptionResponse, RenewalResult } from './types';
import { getSimulationMode } from './simulationState';
import { db, mockDb, isMockDb } from '@/lib/db';
import { orders, orderItems, subscriptions, products } from '@/lib/db/schema';
import { eq, and, lte } from 'drizzle-orm';
import { sendOrderConfirmationEmail, sendSubscriptionRenewalEmail } from '@/lib/email/resend';

export class MockPaymentAdapter implements IPaymentService {
  async processCheckout(request: PaymentRequest): Promise<PaymentResponse> {
    // 1. Check simulation mode
    const mode = getSimulationMode();
    if (mode === 'force_failure') {
      console.warn('[MOCK PAYMENT ADAPTER] Processing checkout in FORCE_FAILURE mode.');
      return {
        success: false,
        errorMessage: request.language === 'fr'
          ? 'Échec du paiement : Simulation d’erreur activée'
          : 'Payment Declined: Force Payment Failure mode is active in DevToolbar',
      };
    }

    if (!request.items || request.items.length === 0) {
      return {
        success: false,
        errorMessage: request.language === 'fr' ? 'Le panier est vide' : 'Cart is empty',
      };
    }

    try {
      // 2. Generate unique order ID
      const orderId = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      // 3. Calculate Financials
      let subtotal = 0;
      request.items.forEach((item) => {
        subtotal += item.unitPrice * item.quantity;
      });

      const freeShippingThreshold = 50;
      const isFreeShipping = subtotal >= freeShippingThreshold;
      const shippingCost = isFreeShipping ? 0 : 9.99;
      const totalAmount = subtotal + shippingCost;

      const userId = request.userId || 'user_customer_01';

      // 4. Build Order Record
      const newOrder = {
        id: orderId,
        userId: userId,
        status: 'completed' as const,
        totalAmount: totalAmount.toFixed(2),
        currency: 'USD',
        shippingAddress: request.shippingAddress as any,
        paymentMethod: request.paymentMethod || 'mock_card',
        createdAt: new Date(),
      };

      // 5. Build Order Items
      const createdOrderItems = request.items.map((item, index) => ({
        id: `ITEM-${orderId}-${index + 1}`,
        orderId: orderId,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toFixed(2),
        purchaseType: item.purchaseType as 'one_time' | 'subscription',
        selectedFlavor: item.selectedFlavor || null,
        selectedSize: item.selectedSize || null,
      }));

      // 6. Build Subscriptions for subscription items
      const createdSubscriptionIds: string[] = [];
      const subscriptionItems = request.items.filter((item) => item.purchaseType === 'subscription');
      const now = new Date();
      const nextBillingDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // NOW + 30 days

      const newSubscriptions = subscriptionItems.map((item, index) => {
        const subId = `SUB-${Date.now().toString(36).toUpperCase()}-${index + 1}`;
        createdSubscriptionIds.push(subId);

        return {
          id: subId,
          userId: userId,
          productId: item.productId,
          status: 'active' as const,
          discountPercent: 20,
          pricePerBilling: item.unitPrice.toFixed(2),
          interval: 'monthly',
          nextBillingDate: nextBillingDate,
          shippingAddress: request.shippingAddress as any,
          selectedFlavor: item.selectedFlavor || null,
          selectedSize: item.selectedSize || null,
          createdAt: now,
          updatedAt: now,
        };
      });

      // 7. Persist to DB / Supabase Client / Mock Store
      try {
        const { createServerSupabaseClient } = await import('@/lib/supabase/server');
        const supabase = createServerSupabaseClient();

        await supabase.from('orders').insert([
          {
            id: orderId,
            user_id: userId.includes('-') && userId.length > 20 ? userId : null,
            customer_email: request.userEmail || request.shippingAddress.email,
            customer_name: request.shippingAddress.fullName,
            total_amount: totalAmount,
            status: 'completed',
            shipping_address: request.shippingAddress,
          },
        ]);

        if (createdOrderItems.length > 0) {
          const itemsPayload = createdOrderItems.map((item) => ({
            order_id: orderId,
            product_id: item.productId,
            name_en: item.productId,
            name_fr: item.productId,
            unit_price: parseFloat(item.unitPrice),
            quantity: item.quantity,
            selected_flavor: item.selectedFlavor || 'Default',
            selected_size: item.selectedSize || 'Standard',
            purchase_type: item.purchaseType,
          }));
          await supabase.from('order_items').insert(itemsPayload);
        }

        // Decrement product stock in Supabase & memory
        for (const item of createdOrderItems) {
          try {
            const { data: prod } = await supabase.from('products').select('stock').eq('id', item.productId).single();
            if (prod && typeof prod.stock === 'number') {
              const newStock = Math.max(0, prod.stock - item.quantity);
              await supabase.from('products').update({ stock: newStock }).eq('id', item.productId);
            }
          } catch (_) {}
          await mockDb.decrementStock(item.productId, item.quantity);
        }
      } catch (sbErr) {
        console.warn('[MOCK PAYMENT ADAPTER] Supabase order insertion info:', sbErr);
      }

      // Always update mockDb singleton in memory
      await mockDb.createOrder(newOrder as any, createdOrderItems as any);
      for (const sub of newSubscriptions) {
        await mockDb.createSubscription(sub as any);
      }

      // 8. Dispatch Confirmation Email
      sendOrderConfirmationEmail({
        to: request.userEmail || request.shippingAddress.email,
        orderId,
        items: request.items,
        totalAmount,
        shippingAddress: request.shippingAddress,
        language: request.language || 'en',
      }).catch((emailErr) => console.error('[MOCK PAYMENT ADAPTER] Email error:', emailErr));

      return {
        success: true,
        orderId,
        totalAmount,
        createdSubscriptionIds,
        transactionId: `TX-MOCK-${orderId}`,
      };
    } catch (error: any) {
      console.error('[MOCK PAYMENT ADAPTER] Error during processCheckout:', error);
      return {
        success: false,
        errorMessage: error.message || 'Checkout processing failed',
      };
    }
  }

  async createSubscription(request: SubscriptionRequest): Promise<SubscriptionResponse> {
    try {
      const subId = `SUB-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
      const now = new Date();
      const nextBillingDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const newSub = {
        id: subId,
        userId: request.userId,
        productId: request.productId,
        status: 'active' as const,
        discountPercent: request.discountPercent || 20,
        pricePerBilling: request.pricePerBilling.toFixed(2),
        interval: request.interval || 'monthly',
        nextBillingDate,
        shippingAddress: request.shippingAddress as any,
        selectedFlavor: request.selectedFlavor || null,
        selectedSize: request.selectedSize || null,
        createdAt: now,
        updatedAt: now,
      };

      if (db) {
        try {
          await db.insert(subscriptions).values(newSub as any);
        } catch (dbErr) {
          console.warn('[MOCK PAYMENT ADAPTER] Drizzle insert subscription failed:', dbErr);
        }
      }

      await mockDb.createSubscription(newSub as any);

      return {
        success: true,
        subscriptionId: subId,
        nextBillingDate,
      };
    } catch (err: any) {
      return {
        success: false,
        errorMessage: err.message || 'Failed to create subscription',
      };
    }
  }

  async renewSubscriptions(): Promise<RenewalResult> {
    console.log('[MOCK PAYMENT ADAPTER] Starting subscription renewal execution...');
    const now = new Date();
    const renewedSubscriptionIds: string[] = [];
    const orderIds: string[] = [];
    const errors: string[] = [];

    // Query due active subscriptions
    let dueSubs: any[] = [];

    if (db) {
      try {
        dueSubs = await db
          .select()
          .from(subscriptions)
          .where(and(eq(subscriptions.status, 'active'), lte(subscriptions.nextBillingDate, now)));
      } catch (dbErr) {
        console.warn('[MOCK PAYMENT ADAPTER] DB query for due subscriptions failed, trying mockDb:', dbErr);
        dueSubs = await mockDb.getDueSubscriptions();
      }
    } else {
      dueSubs = await mockDb.getDueSubscriptions();
    }

    console.log(`[MOCK PAYMENT ADAPTER] Found ${dueSubs.length} subscriptions due for renewal.`);

    for (const sub of dueSubs) {
      try {
        const orderId = `ORD-RENEW-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        const pricePerBilling = parseFloat(sub.pricePerBilling || '0');

        // Fetch product details if available
        let prodEn = 'Bio-Luxe Supplement';
        let prodFr = 'Supplément Bio-Luxe';
        if (db) {
          try {
            const p = await db.select().from(products).where(eq(products.id, sub.productId)).limit(1);
            if (p.length > 0) {
              prodEn = p[0].nameEn;
              prodFr = p[0].nameFr;
            }
          } catch (_) {}
        } else {
          const p = await mockDb.getProductById(sub.productId);
          if (p) {
            prodEn = p.nameEn;
            prodFr = p.nameFr;
          }
        }

        // 1. Create recurring order
        const renewalOrder = {
          id: orderId,
          userId: sub.userId,
          status: 'completed' as const,
          totalAmount: pricePerBilling.toFixed(2),
          currency: 'USD',
          shippingAddress: sub.shippingAddress,
          paymentMethod: 'recurring_subscription',
          createdAt: now,
        };

        const renewalItem = {
          id: `ITEM-${orderId}-1`,
          orderId: orderId,
          productId: sub.productId,
          quantity: 1,
          unitPrice: pricePerBilling.toFixed(2),
          purchaseType: 'subscription' as const,
          selectedFlavor: sub.selectedFlavor || null,
          selectedSize: sub.selectedSize || null,
        };

        // Calculate next billing date (+30 days from now)
        const nextBillingDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        // 2. Update Subscription Record in DB / Mock Store
        if (db) {
          try {
            await db.insert(orders).values(renewalOrder as any);
            await db.insert(orderItems).values(renewalItem as any);
            await db
              .update(subscriptions)
              .set({ nextBillingDate, updatedAt: now })
              .where(eq(subscriptions.id, sub.id));
          } catch (dbErr) {
            console.warn('[MOCK PAYMENT ADAPTER] Postgres renewal save failed:', dbErr);
          }
        }

        await mockDb.createOrder(renewalOrder as any, [renewalItem as any]);
        await mockDb.updateNextBillingDate(sub.id, nextBillingDate);

        // 3. Dispatch renewal email notification
        const userEmail = sub.shippingAddress?.email || 'customer@example.com';
        sendSubscriptionRenewalEmail({
          to: userEmail,
          subscriptionId: sub.id,
          orderId: orderId,
          productNameEn: prodEn,
          productNameFr: prodFr,
          amount: pricePerBilling,
          nextBillingDate,
          shippingAddress: sub.shippingAddress,
          language: 'en',
        }).catch((err) => console.error('[RENEWAL EMAIL ERROR]', err));

        renewedSubscriptionIds.push(sub.id);
        orderIds.push(orderId);
      } catch (subErr: any) {
        console.error(`[RENEWAL ERROR] Failed for sub ${sub.id}:`, subErr);
        errors.push(`Sub ${sub.id}: ${subErr.message}`);
      }
    }

    return {
      success: true,
      processedCount: renewedSubscriptionIds.length,
      renewedSubscriptionIds,
      orderIds,
      errors: errors.length > 0 ? errors : undefined,
    };
  }
}
