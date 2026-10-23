import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { cache } from 'react';

export const createClient = cache(async () => {
  const cookieStore = await cookies();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be defined.');
  }

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, {
              ...options,
              domain: process.env.NODE_ENV === 'production' ? '.producertoy.com' : options?.domain,
            })
          );
        } catch {
          // Server component read-only fallback
        }
      },
    },
  });
});

export const getUser = cache(async () => {
  try {
    const cookieStore = await cookies();
    const hasSessionCookie = cookieStore
      .getAll()
      .some((c) => c.name.startsWith('sb-') || c.name.includes('-auth-token'));
    if (!hasSessionCookie) {
      return { data: { user: null }, error: null };
    }

    const supabase = await createClient();
    return await supabase.auth.getUser();
  } catch (err) {
    return { data: { user: null }, error: err };
  }
});
