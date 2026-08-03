import { NextRequest, NextResponse } from 'next/server';
import { getPaymentAdapter } from '@/lib/payment';

export async function GET(req: NextRequest) {
  return handleRenewalCron(req);
}

export async function POST(req: NextRequest) {
  return handleRenewalCron(req);
}

async function handleRenewalCron(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const expectedSecret = process.env.CRON_SECRET;

    // Verify Bearer CRON_SECRET authorization header
    if (expectedSecret) {
      const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
      if (!token || token !== expectedSecret) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized: Invalid or missing CRON_SECRET authorization header.' },
          { status: 401 }
        );
      }
    } else if (process.env.NODE_ENV === 'production') {
      // In production, CRON_SECRET must be configured
      return NextResponse.json(
        { success: false, error: 'Unauthorized: CRON_SECRET is not configured on server.' },
        { status: 401 }
      );
    }

    const adapter = getPaymentAdapter();
    const result = await adapter.renewSubscriptions();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      renewedCount: result.processedCount,
      processedSubscriptionIds: result.renewedSubscriptionIds,
      orderIds: result.orderIds,
      errors: result.errors,
      message: `Processed ${result.processedCount} subscription renewals successfully.`,
    });
  } catch (error: any) {
    console.error('[CRON RENEW SUBSCRIPTIONS ERROR]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error during subscription renewal.' },
      { status: 500 }
    );
  }
}
