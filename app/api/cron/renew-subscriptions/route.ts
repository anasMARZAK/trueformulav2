import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { mockDb } from '@/lib/db';
import { getPaymentAdapter } from '@/lib/payment';

export async function GET(req: NextRequest) {
  return handleRenewalCron(req);
}

export async function POST(req: NextRequest) {
  return handleRenewalCron(req);
}

async function handleRenewalCron(req: NextRequest) {
  try {
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
