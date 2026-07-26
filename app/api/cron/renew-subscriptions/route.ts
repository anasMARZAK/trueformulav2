import { NextRequest, NextResponse } from 'next/server';
import { getPaymentAdapter } from '@/lib/payment';

export async function POST(req: NextRequest) {
  try {
    const cronSecret = req.headers.get('x-cron-secret') || req.nextUrl?.searchParams?.get('secret');
    const expectedSecret = process.env.CRON_SECRET || 'dev_cron_secret';
    const isDev = process.env.NODE_ENV !== 'production';

    if (!isDev && cronSecret !== expectedSecret) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Invalid CRON_SECRET token' },
        { status: 401 }
      );
    }

    const adapter = getPaymentAdapter();
    const result = await adapter.renewSubscriptions();

    return NextResponse.json({
      success: true,
      processedCount: result.processedCount,
      renewedSubscriptionIds: result.renewedSubscriptionIds,
      orderIds: result.orderIds,
      errors: result.errors,
    });
  } catch (error: any) {
    console.error('[CRON RENEW SUBSCRIPTIONS ERROR]', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to process subscription renewals',
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
