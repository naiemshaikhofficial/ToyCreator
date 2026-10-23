import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be defined.');
  }

  const isProd = typeof window !== 'undefined' && window.location.hostname.includes('producertoy.com');

  return createBrowserClient(url, key, {
    cookieOptions: isProd
      ? {
          domain: '.producertoy.com',
          path: '/',
          sameSite: 'lax',
          secure: true,
        }
      : undefined,
  });
}

export function getSupabaseBrowserClient() {
  return createClient();
}
