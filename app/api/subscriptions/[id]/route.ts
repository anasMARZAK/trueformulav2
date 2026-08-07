import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server';
import { mockDb } from '@/lib/db';
import { z } from 'zod';

const updateSubscriptionSchema = z.object({
  status: z.enum(['active', 'paused', 'cancelled']).optional(),
  intervalDays: z.number().int().positive().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const subId = params.id;
    const body = await req.json();
    const parseResult = updateSubscriptionSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', errors: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { status, intervalDays } = parseResult.data;
    if (!status && !intervalDays) {
      return NextResponse.json(
        { success: false, error: 'Nothing to update. Provide status or intervalDays.' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Authentication required.' },
        { status: 401 }
      );
    }

    // 1. Fetch subscription from Supabase to verify ownership
    const { data: existingSub, error: fetchErr } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subId)
      .single();

    if (fetchErr || !existingSub) {
      return NextResponse.json(
        { success: false, error: 'Subscription not found.' },
        { status: 404 }
      );
    }

    // IDOR Check: Ensure subscription belongs to session user (or service role)
    if (existingSub.user_id !== user.id) {
      // Check if user is admin
      const adminDb = createAdminSupabaseClient();
      const { data: profile } = await adminDb
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile || profile.role !== 'admin') {
        return NextResponse.json(
          { success: false, error: 'Forbidden: You do not own this subscription.' },
          { status: 403 }
        );
      }
    }

    // 2. Build payload
    const nowIso = new Date().toISOString();
    const sbPayload: Record<string, any> = { updated_at: nowIso };

    if (status) {
      sbPayload.status = status;
      if (status === 'cancelled') {
        sbPayload.cancelled_at = nowIso;
      } else {
        // Resuming clears the cancellation stamp so the row is not left looking
        // half-cancelled.
        sbPayload.cancelled_at = null;
      }
    }

    if (intervalDays) {
      sbPayload.interval_days = intervalDays;

      // The next charge is scheduled one full cycle from now. This previously
      // added the interval to the *existing* next_billing_date, so every time a
      // member adjusted their cadence the date was pushed another cycle into the
      // future — picking "every 30 days" three times moved billing 90 days out.
      const newNext = new Date(Date.now() + intervalDays * 24 * 60 * 60 * 1000);
      sbPayload.next_billing_date = newNext.toISOString();
      // Legacy column kept in step; the admin table historically read this one.
      sbPayload.next_delivery_date = newNext.toISOString();
    }

    // 3. Update in Supabase
    const { data: updatedSub, error: updateErr } = await supabase
      .from('subscriptions')
      .update(sbPayload)
      .eq('id', subId)
      .select()
      .single();

    if (updateErr) {
      console.error('[API SUBSCRIPTIONS PATCH ERROR]', updateErr);
      return NextResponse.json(
        { success: false, error: `Failed to update subscription: ${updateErr.message}` },
        { status: 500 }
      );
    }

    // Dev mode simulation update
    if (process.env.NODE_ENV !== 'production') {
      if (status) {
        await mockDb.updateSubscriptionStatus(subId, status);
      }
      if (intervalDays) {
        await mockDb.updateSubscriptionInterval(subId, intervalDays);
      }
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
