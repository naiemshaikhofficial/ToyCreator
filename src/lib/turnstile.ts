/**
 * Server-side verification for Cloudflare Turnstile tokens
 */
export async function verifyTurnstileToken(token: string | null | undefined, remoteIp?: string): Promise<boolean> {
  // If no token is provided, strictly deny verification
  if (!token || typeof token !== 'string' || !token.trim()) {
    return false;
  }

  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ [Turnstile] TURNSTILE_SECRET_KEY is not defined in .env.local, allowing dev bypass.');
      return true;
    }
    console.error('❌ [Turnstile] TURNSTILE_SECRET_KEY is missing from environment variables!');
    return false;
  }

  try {
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);
    if (remoteIp) {
      formData.append('remoteip', remoteIp);
    }

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const data = await response.json();
    return !!data.success;
  } catch (error) {
    console.error('❌ [Turnstile] Verification fetch error:', error);
    return false;
  }
}
