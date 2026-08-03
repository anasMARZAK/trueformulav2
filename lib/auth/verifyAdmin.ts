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
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return {
      authorized: false,
      errorResponse: NextResponse.json(
        { success: false, error: 'Unauthorized: Authentication required.' },
        { status: 401 }
      ),
    };
  }

  // Query profiles.role from database strictly server-side
  const adminDb = createAdminSupabaseClient();
  const { data: profile, error: profileErr } = await adminDb
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileErr || !profile || profile.role !== 'admin') {
    return {
      authorized: false,
      errorResponse: NextResponse.json(
        { success: false, error: 'Forbidden: Admin access required.' },
        { status: 403 }
      ),
    };
  }

  return {
    authorized: true,
    userId: user.id,
    email: user.email,
  };
}
