export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export interface SentEmailLog {
  id: string;
  timestamp: Date;
  to: string;
  subject: string;
  html: string;
  type: 'order_confirmation' | 'subscription_renewal' | 'test';
  isMock: boolean;
}

const sentEmailLogs: SentEmailLog[] = [];

export function getSentEmailLogs(): SentEmailLog[] {
  return [...sentEmailLogs];
}

export function clearSentEmailLogs(): void {
  sentEmailLogs.length = 0;
}

/**
 * Sends email using Resend API if RESEND_API_KEY exists,
 * otherwise falls back to a clean mock logger.
 */
export async function sendEmail(payload: EmailPayload, type: 'order_confirmation' | 'subscription_renewal' | 'test'): Promise<{ success: boolean; id?: string; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromAddress = payload.from || process.env.RESEND_FROM_EMAIL || 'TRUE FORMULA <orders@trueformula.com>';
  const logId = `EMAIL-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

  if (apiKey) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [payload.to],
          subject: payload.subject,
          html: payload.html,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        console.error('[RESEND API ERROR]', data);
        return { success: false, error: data.message || 'Failed to send email via Resend' };
      }

      const sentLog: SentEmailLog = {
        id: data.id || logId,
        timestamp: new Date(),
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        type,
        isMock: false,
      };
      sentEmailLogs.push(sentLog);

      console.log(`[RESEND API SUCCESS] Sent email to ${payload.to} (ID: ${data.id})`);
      return { success: true, id: data.id };
    } catch (err: any) {
      console.error('[RESEND FETCH EXCEPTION]', err);
      return { success: false, error: err.message || 'Resend network error' };
    }
  } else {
    // Mock Logger Fallback
    const mockLog: SentEmailLog = {
      id: logId,
      timestamp: new Date(),
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      type,
      isMock: true,
    };
    sentEmailLogs.push(mockLog);

    console.log(`[MOCK EMAIL SERVICE] Email dispatched successfully (Fallback Logger):`);
    console.log(`  - Log ID: ${logId}`);
    console.log(`  - Type: ${type}`);
    console.log(`  - To: ${payload.to}`);
    console.log(`  - Subject: ${payload.subject}`);

    return { success: true, id: logId };
  }
}

/**
 * Localized Order Confirmation Email
 */
export async function sendOrderConfirmationEmail(params: {
  to: string;
  orderId: string;
  items: Array<{ nameEn: string; nameFr: string; quantity: number; unitPrice: number; purchaseType: string }>;
  totalAmount: number;
  shippingAddress: { fullName: string; address: string; city: string; postalCode: string; country: string };
  language?: 'en' | 'fr';
}): Promise<{ success: boolean; id?: string }> {
  const isFr = params.language === 'fr';

  const subject = isFr
    ? `Confirmation de commande #${params.orderId} — ProteinShop`
    : `Order Confirmation #${params.orderId} — ProteinShop`;

  const itemsHtml = params.items
    .map((item) => {
      const name = isFr ? item.nameFr : item.nameEn;
      const total = (item.unitPrice * item.quantity).toFixed(2);
      const subBadge = item.purchaseType === 'subscription'
        ? `<span style="background:#EAF2ED; color:#2E5A44; padding:2px 6px; font-size:10px; font-weight:bold; border-radius:4px; margin-left:6px;">${isFr ? 'Abonnement -20%' : 'Subscription -20%'}</span>`
        : '';
      return `
        <tr style="border-bottom: 1px solid #EAF2ED;">
          <td style="padding: 10px 0; font-size: 14px; color: #111827;">
            <strong>${name}</strong> x ${item.quantity} ${subBadge}
          </td>
          <td style="padding: 10px 0; text-align: right; font-size: 14px; font-weight: bold; color: #2E5A44;">
            $${total}
          </td>
        </tr>
      `;
    })
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #FDFBF7; color: #111827; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #EAF2ED; border-radius: 16px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
          .header { text-align: center; padding-bottom: 24px; border-bottom: 2px solid #2E5A44; }
          .title { font-size: 22px; font-weight: bold; color: #111827; margin-top: 10px; }
          .subtitle { font-size: 12px; color: #2E5A44; text-transform: uppercase; tracking: 2px; font-weight: bold; }
          .section { margin-top: 24px; }
          .total-box { background: #EAF2ED; border-radius: 8px; padding: 16px; margin-top: 20px; display: flex; justify-content: space-between; font-weight: bold; color: #2E5A44; font-size: 16px; }
          .footer { font-size: 11px; color: #6B7280; text-align: center; margin-top: 32px; border-top: 1px solid #EAF2ED; padding-top: 16px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="subtitle">ProteinShop • Editorial Apothecary</div>
            <div class="title">${isFr ? 'Merci pour votre commande !' : 'Thank You For Your Order!'}</div>
            <p style="font-size: 14px; color: #4B5563; margin-top: 6px;">
              ${isFr ? 'Numéro de commande :' : 'Order Reference:'} <strong>#${params.orderId}</strong>
            </p>
          </div>

          <div class="section">
            <h3 style="font-size: 14px; text-transform: uppercase; color: #2E5A44; font-weight: bold; margin-bottom: 12px;">
              ${isFr ? 'Articles commandés' : 'Order Summary'}
            </h3>
            <table style="width: 100%; border-collapse: collapse;">
              ${itemsHtml}
            </table>
          </div>

          <div class="total-box">
            <span>${isFr ? 'Montant Total Régler :' : 'Total Amount Paid:'}</span>
            <span>$${params.totalAmount.toFixed(2)} USD</span>
          </div>

          <div class="section" style="background: #FDFBF7; padding: 16px; border-radius: 8px; border: 1px solid #EAF2ED; margin-top: 20px;">
            <h4 style="font-size: 12px; text-transform: uppercase; color: #111827; margin: 0 0 8px 0;">
              ${isFr ? 'Adresse de Livraison' : 'Shipping Address'}
            </h4>
            <p style="font-size: 13px; color: #4B5563; margin: 0; line-height: 1.5;">
              <strong>${params.shippingAddress.fullName}</strong><br/>
              ${params.shippingAddress.address}<br/>
              ${params.shippingAddress.city}, ${params.shippingAddress.postalCode}<br/>
              ${params.shippingAddress.country}
            </p>
          </div>

          <div class="footer">
            ${isFr
              ? 'Si vous avez des questions concernant votre commande, contactez notre équipe support.'
              : 'If you have any questions regarding your order, contact our apothecary support team.'}<br/>
            © 2026 ProteinShop Bio-Luxe. All rights reserved.
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({ to: params.to, subject, html }, 'order_confirmation');
}

/**
 * Localized Subscription Renewal Confirmation Email
 */
export async function sendSubscriptionRenewalEmail(params: {
  to: string;
  subscriptionId: string;
  orderId: string;
  productNameEn: string;
  productNameFr: string;
  amount: number;
  nextBillingDate: Date;
  shippingAddress: { fullName: string; address: string; city: string; postalCode: string; country: string };
  language?: 'en' | 'fr';
}): Promise<{ success: boolean; id?: string }> {
  const isFr = params.language === 'fr';
  const productName = isFr ? params.productNameFr : params.productNameEn;
  const formattedNextDate = params.nextBillingDate.toLocaleDateString(isFr ? 'fr-FR' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const subject = isFr
    ? `Renouvellement d’Abonnement — Commande #${params.orderId}`
    : `Subscription Renewal Confirmed — Order #${params.orderId}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #FDFBF7; color: #111827; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #EAF2ED; border-radius: 16px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
          .header { text-align: center; padding-bottom: 20px; border-bottom: 2px solid #2E5A44; }
          .badge { background: #2E5A44; color: #ffffff; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; padding: 4px 12px; border-radius: 12px; display: inline-block; margin-bottom: 8px; }
          .title { font-size: 20px; font-weight: bold; color: #111827; }
          .details { margin-top: 20px; background: #FDFBF7; padding: 20px; border-radius: 12px; border: 1px solid #EAF2ED; }
          .footer { font-size: 11px; color: #6B7280; text-align: center; margin-top: 32px; border-top: 1px solid #EAF2ED; padding-top: 16px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <span class="badge">${isFr ? 'Abonnement Récurrent 20% OFF' : 'Recurring Subscription 20% OFF'}</span>
            <div class="title">${isFr ? 'Votre abonnement s’est renouvelé avec succès' : 'Your Subscription Has Successfully Renewed'}</div>
          </div>

          <div style="margin-top: 20px; font-size: 14px; color: #374151;">
            ${isFr
              ? `Bonjour <strong>${params.shippingAddress.fullName}</strong>, votre recharge mensuelle pour <strong>${productName}</strong> a été traitée.`
              : `Hello <strong>${params.shippingAddress.fullName}</strong>, your monthly refill for <strong>${productName}</strong> has been processed.`}
          </div>

          <div class="details">
            <table style="width: 100%; font-size: 13px; color: #111827;">
              <tr>
                <td style="padding: 6px 0; color: #6B7280;">${isFr ? 'ID Abonnement' : 'Subscription ID'}:</td>
                <td style="padding: 6px 0; text-align: right; font-weight: bold;">${params.subscriptionId}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #6B7280;">${isFr ? 'ID Nouvelle Commande' : 'New Order ID'}:</td>
                <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #2E5A44;">#${params.orderId}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #6B7280;">${isFr ? 'Montant Prélevé' : 'Billed Amount'}:</td>
                <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #2E5A44;">$${params.amount.toFixed(2)} USD</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #6B7280;">${isFr ? 'Prochaine Date de Facturation' : 'Next Billing Date'}:</td>
                <td style="padding: 6px 0; text-align: right; font-weight: bold;">${formattedNextDate}</td>
              </tr>
            </table>
          </div>

          <div style="margin-top: 20px; font-size: 13px; color: #4B5563; background: #EAF2ED; padding: 12px 16px; border-radius: 8px;">
            <strong>${isFr ? 'Adresse de livraison confirmée :' : 'Shipping Address:'}</strong><br/>
            ${params.shippingAddress.address}, ${params.shippingAddress.city}, ${params.shippingAddress.postalCode}, ${params.shippingAddress.country}
          </div>

          <div class="footer">
            ${isFr
              ? 'Vous pouvez gérer ou suspendre votre abonnement à tout moment sur votre portail client.'
              : 'You can manage or pause your active subscription anytime in your member portal.'}<br/>
            © 2026 ProteinShop Bio-Luxe.
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({ to: params.to, subject, html }, 'subscription_renewal');
}

/**
 * Send Test Email for Developer Toolbar
 */
export async function sendTestEmail(to: string = 'customer@example.com', language: 'en' | 'fr' = 'en'): Promise<{ success: boolean; id?: string; error?: string }> {
  const isFr = language === 'fr';
  const subject = isFr
    ? '[TEST] Email de vérification — ProteinShop Developer Toolbar'
    : '[TEST] Verification Email — ProteinShop Developer Toolbar';

  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: sans-serif; padding: 20px; background: #FDFBF7;">
        <div style="max-width: 500px; margin: 0 auto; background: white; border: 1px solid #2E5A44; border-radius: 12px; padding: 24px;">
          <h2 style="color: #2E5A44; font-size: 18px; margin-top: 0;">🧪 ProteinShop DevToolbar Test Email</h2>
          <p style="font-size: 14px; color: #374151;">
            ${isFr
              ? 'Ceci est un e-mail de test généré par la barre d’outils développeur ProteinShop.'
              : 'This is a test email triggered from the ProteinShop Developer Toolbar.'}
          </p>
          <div style="background: #EAF2ED; padding: 12px; border-radius: 8px; font-size: 12px; color: #2E5A44; margin-top: 16px;">
            <strong>Status:</strong> ${process.env.RESEND_API_KEY ? 'Live Resend API Mode' : 'Mock Fallback Logger Mode'}<br/>
            <strong>Timestamp:</strong> ${new Date().toISOString()}<br/>
            <strong>Recipient:</strong> ${to}
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({ to, subject, html }, 'test');
}
