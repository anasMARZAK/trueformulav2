import { NextRequest, NextResponse } from 'next/server';
import { db, mockDb } from '@/lib/db';
import { subscriptions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST() {
  try {
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago
    let updatedCount = 0;

    if (db) {
      try {
        const result = await db
          .update(subscriptions)
          .set({ nextBillingDate: pastDate, updatedAt: new Date() })
          .where(eq(subscriptions.status, 'active'));
      } catch (dbErr) {
        console.warn('[DEV FAST-FORWARD] Drizzle update failed:', dbErr);
      }
    }

    updatedCount = await mockDb.fastForwardSubscriptions();

    return NextResponse.json({
      success: true,
      updatedCount,
      message: `Fast-forwarded ${updatedCount} active subscription(s) to past date.`,
    });
  } catch (error: any) {
    console.error('[DEV FAST-FORWARD ERROR]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Fast forward failed' },
      { status: 500 }
    );
  }
}
