'use server';

import { getAdminClient } from '@/lib/supabase/admin';

export interface UserStatusResult {
  exists: boolean;
  isConfirmed: boolean;
}

/**
 * Fast server action to check if an account exists and whether email is confirmed.
 */
export async function checkUserStatusAction(email: string): Promise<UserStatusResult> {
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return { exists: false, isConfirmed: false };
  }

  const cleanEmail = email.trim().toLowerCase();
  const admin = getAdminClient();

  try {
    const { data: prof } = await admin
      .from('profiles')
      .select('id, email')
      .ilike('email', cleanEmail)
      .limit(1)
      .maybeSingle();

    if (prof) {
      return { exists: true, isConfirmed: true };
    }

    const { data: listData, error } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 100,
    });

    if (!error && listData?.users) {
      const matched = (listData.users as any[]).find(
        (u: any) => u.email?.toLowerCase() === cleanEmail
      );

      if (matched) {
        const isConfirmed = Boolean(matched.email_confirmed_at || matched.confirmed_at);
        return { exists: true, isConfirmed };
      }
    }

    return { exists: false, isConfirmed: false };
  } catch (err) {
    console.warn('checkUserStatusAction note:', err);
    return { exists: false, isConfirmed: false };
  }
}

/**
 * Validates Cloudflare Turnstile token on the server
 */
export async function validateTurnstileAction(token: string): Promise<{ success: boolean; error?: string }> {
  if (!token || typeof token !== 'string' || !token.trim()) {
    return { success: false, error: 'Security verification required. Please complete Cloudflare Turnstile.' };
  }
  const { verifyTurnstileToken } = await import('@/lib/turnstile');
  const isValid = await verifyTurnstileToken(token);
  if (!isValid) {
    return { success: false, error: 'Security verification failed. Please try again.' };
  }
  return { success: true };
}
