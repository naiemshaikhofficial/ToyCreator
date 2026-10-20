import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://voalgeyexfhfitlyorfl.supabase.co';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_AFTgvwUXdDPCgTny9uDIuQ_NGiDyAJD';

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
