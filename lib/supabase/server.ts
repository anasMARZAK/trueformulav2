import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export function createServerSupabaseClient() {
  const cookieStore = cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
        }
      },
    },
  });
}

/** True when the service role key is configured. */
export function hasServiceRoleKey(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export const SERVICE_ROLE_MISSING_MESSAGE =
  'SUPABASE_SERVICE_ROLE_KEY is not set. Admin writes (products, media uploads, order status) run under row-level security as an anonymous user and will be rejected. Add the service role key from the Supabase dashboard (Project Settings → API) to .env.local and restart the dev server.';

export function createAdminSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';

  // Falling back to the anon key keeps reads working, but every write is then
  // subject to RLS — which denies anon on products, orders, and storage. That
  // used to surface as an opaque "new row violates row-level security policy",
  // so the misconfiguration is called out explicitly here instead.
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    console.warn(`[SUPABASE ADMIN] ${SERVICE_ROLE_MISSING_MESSAGE}`);
  }

  return createClient(
    supabaseUrl,
    serviceRoleKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key',
    {
      auth: {
        persistSession: false,
      },
    }
  );
}
