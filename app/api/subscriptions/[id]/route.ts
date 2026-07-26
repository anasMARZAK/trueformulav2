import { NextRequest, NextResponse } from 'next/server';
import { db, mockDb } from '@/lib/db';
import { subscriptions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const subId = params.id;
    const body = await req.json();
    const { status, intervalDays, interval } = body;

    const days = intervalDays || (interval ? parseInt(String(interval), 10) : undefined);

    if (status && !['active', 'paused', 'cancelled'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status. Must be active, paused, or cancelled.' },
        { status: 400 }
      );
    }

    // 1. Update in Supabase if client available
    try {
      const { createServerSupabaseClient } = await import('@/lib/supabase/server');
      const supabase = createServerSupabaseClient();
      const sbPayload: any = { updated_at: new Date().toISOString() };
      if (status) sbPayload.status = status;
      if (days && !isNaN(days)) sbPayload.interval_days = days;

      await supabase.from('subscriptions').update(sbPayload).eq('id', subId);
    } catch (sbErr) {
      console.warn('[API SUBSCRIPTIONS PATCH] Supabase update notice:', sbErr);
    }

    // 2. Update Drizzle Postgres if connected
    if (db) {
      try {
        const drizzlePayload: any = { updatedAt: new Date() };
        if (status) drizzlePayload.status = status;
        if (days) drizzlePayload.interval = `${days} days`;
        await db
          .update(subscriptions)
          .set(drizzlePayload)
          .where(eq(subscriptions.id, subId));
      } catch (dbErr) {
        console.warn('[API SUBSCRIPTIONS PATCH] DB update failed:', dbErr);
      }
    }

    // 3. Always update in mockDb
    let updatedSub = null;
    if (status) {
      updatedSub = await mockDb.updateSubscriptionStatus(subId, status as any);
    }
    if (days && !isNaN(days)) {
      updatedSub = await mockDb.updateSubscriptionInterval(subId, days);
    }

    return NextResponse.json({
      success: true,
      subscription: updatedSub,
      message: `Subscription ${subId} updated successfully.`,
    });
  } catch (error: any) {
    console.error('[API SUBSCRIPTIONS PATCH ERROR]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error.' },
      { status: 500 }
    );
  }
}
