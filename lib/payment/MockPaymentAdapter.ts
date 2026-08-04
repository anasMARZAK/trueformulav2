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
      const orderId = crypto.randomUUID();

      // 3. Calculate Financials
      let subtotal = 0;
      request.items.forEach((item) => {
        subtotal += item.unitPrice * item.quantity;
      });

      const freeShippingThreshold = 50;
      const isFreeShipping = subtotal >= freeShippingThreshold;
      const shippingCost = isFreeShipping ? 0 : 9.99;
      const totalAmount = subtotal + shippingCost;

      const userId = request.userId || '00000000-0000-4000-a000-000000000001';

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
        id: crypto.randomUUID(),
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
        const subId = crypto.randomUUID();
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
      const { createServerSupabaseClient } = await import('@/lib/supabase/server');
      const supabase = createServerSupabaseClient();

      // Check for existing active subscriptions for the same user and product to enforce re-subscribe rule (Task 3.4)
      if (subscriptionItems.length > 0) {
        for (const subItem of subscriptionItems) {
          const { data: existingActiveSub } = await supabase
            .from('subscriptions')
            .select('id')
            .eq('user_id', userId)
            .eq('product_id', subItem.productId)
            .eq('status', 'active')
            .maybeSingle();

          if (existingActiveSub) {
            return {
              success: false,
              errorMessage: request.language === 'fr'
                ? 'Vous avez déjà un abonnement actif pour ce produit. Gérez-le dans votre espace membre.'
                : 'You already have an active subscription for this product. Manage it in your account portal.',
            };
          }
        }
      }

      // Insert Order
      const { error: orderErr } = await supabase.from('orders').insert([
        {
          id: orderId,
          user_id: userId,
          customer_email: request.userEmail || request.shippingAddress.email,
          customer_name: request.shippingAddress.fullName,
          total_amount: totalAmount,
          total_cents: Math.round(totalAmount * 100),
          subtotal_cents: Math.round(subtotal * 100),
          shipping_cents: Math.round(shippingCost * 100),
          status: 'completed',
          shipping_address: request.shippingAddress,
        },
      ]);

      if (orderErr) {
        console.error('[MOCK PAYMENT ADAPTER] Supabase order insert error:', orderErr);
        return {
          success: false,
          errorMessage: `Database error creating order: ${orderErr.message}`,
        };
      }

      // Insert Order Items
      if (createdOrderItems.length > 0) {
        const itemsPayload = createdOrderItems.map((item) => ({
          order_id: orderId,
          product_id: item.productId,
          name_en: item.productId,
          name_fr: item.productId,
          unit_price: parseFloat(item.unitPrice),
          unit_price_cents: Math.round(parseFloat(item.unitPrice) * 100),
          quantity: item.quantity,
          selected_flavor: item.selectedFlavor || 'Default',
          selected_size: item.selectedSize || 'Standard',
          purchase_type: item.purchaseType,
        }));
        const { error: itemsErr } = await supabase.from('order_items').insert(itemsPayload);

        if (itemsErr) {
          console.error('[MOCK PAYMENT ADAPTER] Supabase order_items insert error:', itemsErr);
          // Compensating delete
          await supabase.from('orders').delete().eq('id', orderId);
          return {
            success: false,
            errorMessage: `Database error creating order items: ${itemsErr.message}`,
          };
        }
      }

      // Insert Subscriptions to Supabase
      if (newSubscriptions.length > 0) {
        const subsPayload = newSubscriptions.map((sub) => ({
          id: sub.id,
          user_id: sub.userId,
          product_id: sub.productId,
          status: sub.status,
          discount_percentage: sub.discountPercent,
          price_per_cycle_cents: Math.round(parseFloat(sub.pricePerBilling) * 100),
          interval_days: 30,
          next_billing_date: sub.nextBillingDate.toISOString(),
          selected_flavor: sub.selectedFlavor,
          selected_size: sub.selectedSize,
          shipping_address: sub.shippingAddress,
          created_at: sub.createdAt.toISOString(),
          updated_at: sub.updatedAt.toISOString(),
        }));
        const { error: subErr } = await supabase.from('subscriptions').insert(subsPayload);

        if (subErr) {
          console.error('[MOCK PAYMENT ADAPTER] Supabase subscriptions insert error:', subErr);
          // Compensating deletes for atomic rollback
          await supabase.from('order_items').delete().eq('order_id', orderId);
          await supabase.from('orders').delete().eq('id', orderId);
          return {
            success: false,
            errorMessage: `Database error creating subscription: ${subErr.message}`,
          };
        }
      }

      // Decrement product stock and increment popularity score in Supabase & memory (Task 5.2)
      for (const item of createdOrderItems) {
        try {
          const { data: prod } = await supabase.from('products').select('stock, popularity_score').eq('id', item.productId).single();
          if (prod) {
            const updates: Record<string, any> = {};
            if (typeof prod.stock === 'number') {
              updates.stock = Math.max(0, prod.stock - item.quantity);
            }
            const currentPop = typeof prod.popularity_score === 'number' ? prod.popularity_score : 50;
            updates.popularity_score = currentPop + item.quantity;

            await supabase.from('products').update(updates).eq('id', item.productId);
          }
        } catch (_) {}
        if (process.env.NODE_ENV !== 'production') {
          await mockDb.decrementStock(item.productId, item.quantity);
        }
      }

      if (process.env.NODE_ENV !== 'production') {
        await mockDb.createOrder(newOrder as any, createdOrderItems as any);
        for (const sub of newSubscriptions) {
          await mockDb.createSubscription(sub as any);
        }
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

      if (process.env.NODE_ENV !== 'production') {
        await mockDb.createSubscription(newSub as any);
      }

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

    try {
      const { createServerSupabaseClient } = await import('@/lib/supabase/server');
      const supabase = createServerSupabaseClient();

      // Query Supabase strictly for active subscriptions due for renewal (Task 3.1)
      const { data: dueSubs, error: subsErr } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('status', 'active')
        .lte('next_billing_date', now.toISOString());

      if (subsErr) {
        console.error('[MOCK PAYMENT ADAPTER] Error fetching due subscriptions from Supabase:', subsErr);
        return {
          success: false,
          processedCount: 0,
          renewedSubscriptionIds: [],
          orderIds: [],
          errors: [subsErr.message],
        };
      }

      const activeDueSubs = dueSubs || [];
      console.log(`[MOCK PAYMENT ADAPTER] Found ${activeDueSubs.length} active subscriptions due for renewal in Supabase.`);

      // Fetch products map for name lookup
      const { data: prods } = await supabase.from('products').select('*');
      const prodsMap = new Map((prods || []).map((p) => [p.id, p]));

      for (const sub of activeDueSubs) {
        try {
          const orderId = crypto.randomUUID();
          const priceCents = sub.price_per_cycle_cents || Math.round(parseFloat(sub.price_per_billing || '0') * 100);
          const priceAmount = (priceCents / 100).toFixed(2);
          const prod = prodsMap.get(sub.product_id);
          const requiredQty = sub.quantity || 1;

          // Renewal Stock Verification (Task 6.2)
          if (prod && typeof prod.stock === 'number' && prod.stock < requiredQty) {
            console.error(`[RENEWAL SKIPPED] Out of stock for product ${sub.product_id} (Required: ${requiredQty}, Stock: ${prod.stock})`);
            errors.push(`Sub ${sub.id}: Product ${sub.product_id} out of stock.`);
            continue;
          }

          const prodEn = prod?.name_en || prod?.nameEn || sub.product_id;
          const prodFr = prod?.name_fr || prod?.nameFr || sub.product_id;

          const idempotencyKey = `RENEW-${sub.id}-${now.toISOString().substring(0, 10)}`;

          // 1. Create recurring order in Supabase
          const { error: orderErr } = await supabase.from('orders').insert([
            {
              id: orderId,
              user_id: sub.user_id,
              customer_email: sub.shipping_address?.email || 'customer@example.com',
              customer_name: sub.shipping_address?.fullName || 'Customer',
              status: 'completed',
              total_amount: parseFloat(priceAmount),
              total_cents: priceCents,
              subtotal_cents: priceCents,
              shipping_cents: 0,
              idempotency_key: idempotencyKey,
              currency: 'USD',
              shipping_address: sub.shipping_address,
              payment_method: 'recurring_subscription',
              created_at: now.toISOString(),
            },
          ]);

          if (orderErr) {
            // Idempotency check: if order already created today, skip (Task 3.2)
            if (orderErr.code === '23505' || orderErr.message.includes('unique constraint')) {
              console.warn(`[RENEWAL SKIPPED] Idempotency constraint triggered for sub ${sub.id}`);
              continue;
            }
            throw new Error(`Failed to create renewal order: ${orderErr.message}`);
          }

          // 2. Create renewal order_item in Supabase
          const { error: itemErr } = await supabase.from('order_items').insert([
            {
              order_id: orderId,
              product_id: sub.product_id,
              name_en: prodEn,
              name_fr: prodFr,
              unit_price: parseFloat(priceAmount),
              unit_price_cents: priceCents,
              quantity: sub.quantity || 1,
              selected_flavor: sub.selected_flavor || sub.flavor || 'Default',
              selected_size: sub.selected_size || sub.size || 'Standard',
              purchase_type: 'subscription',
            },
          ]);

          if (itemErr) {
            await supabase.from('orders').delete().eq('id', orderId);
            throw new Error(`Failed to create renewal order item: ${itemErr.message}`);
          }

          // 3. Advance next_billing_date (+30 days or interval_days)
          const intervalDays = sub.interval_days || 30;
          const nextBillingDate = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);

          const { error: subUpdateErr } = await supabase
            .from('subscriptions')
            .update({
              next_billing_date: nextBillingDate.toISOString(),
              updated_at: now.toISOString(),
            })
            .eq('id', sub.id);

          if (subUpdateErr) {
            console.error(`[RENEWAL NOTICE] Failed to advance next_billing_date for sub ${sub.id}:`, subUpdateErr);
          }

          // 4. Update dev mode memory store
          if (process.env.NODE_ENV !== 'production') {
            await mockDb.updateNextBillingDate(sub.id, nextBillingDate);
          }

          // 5. Send renewal email notification
          const userEmail = sub.shipping_address?.email || 'customer@example.com';
          sendSubscriptionRenewalEmail({
            to: userEmail,
            subscriptionId: sub.id,
            orderId: orderId,
            productNameEn: prodEn,
            productNameFr: prodFr,
            amount: parseFloat(priceAmount),
            nextBillingDate,
            shippingAddress: sub.shipping_address,
            language: 'en',
          }).catch((err) => console.error('[RENEWAL EMAIL ERROR]', err));

          renewedSubscriptionIds.push(sub.id);
          orderIds.push(orderId);
        } catch (subErr: any) {
          console.error(`[RENEWAL ERROR] Failed for sub ${sub.id}:`, subErr);
          errors.push(`Sub ${sub.id}: ${subErr.message}`);
        }
      }
    } catch (err: any) {
      console.error('[RENEWAL EXECUTION ERROR]', err);
      errors.push(err.message);
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
