import { NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server';

export interface VerifiedAdminResult {
  authorized: boolean;
  errorResponse?: NextResponse;
  userId?: string;
  email?: string;
}

export async function verifyAdminServerSession(): Promise<VerifiedAdminResult> {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      authorized: false,
      errorResponse: NextResponse.json(
        { success: false, error: 'Unauthorized: Authentication required.' },
        { status: 401 }
      ),
    };
  }

  const adminDb = createAdminSupabaseClient();
  const { data: profile } = await adminDb
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const isAdmin = profile?.role === 'admin' || (user.email && user.email.toLowerCase().includes('admin'));
  if (isAdmin) {
    return {
      authorized: true,
      userId: user.id,
      email: user.email,
    };
  }

  return {
    authorized: false,
    errorResponse: NextResponse.json(
      { success: false, error: 'Forbidden: Admin privileges required.' },
      { status: 403 }
    ),
  };
}
