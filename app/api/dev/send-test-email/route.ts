import { NextRequest, NextResponse } from 'next/server';
import { sendTestEmail } from '@/lib/email/resend';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const to = body.to || 'customer@example.com';
    const language = body.language || 'en';

    const result = await sendTestEmail(to, language);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      id: result.id,
      message: `Test email dispatched to ${to}`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to dispatch test email' },
      { status: 500 }
    );
  }
}
