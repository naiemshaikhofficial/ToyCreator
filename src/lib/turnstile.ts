/**
 * Server-side verification for Cloudflare Turnstile tokens
 */
export async function verifyTurnstileToken(
  token: string | null | undefined,
  remoteIp?: string
): Promise<boolean> {
  // If no token is provided, strictly deny verification
  if (!token || typeof token !== 'string' || !token.trim()) {
    return false;
  }

  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  // Development bypass if no secret key configured
  if (!secretKey) {
    if (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_SITE_URL?.includes('localhost')) {
      console.warn('⚠️ [Turnstile] TURNSTILE_SECRET_KEY is not defined, allowing dev bypass.');
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

    if (data.success) {
      return true;
    }

    // In local development or testing with placeholder secret keys, gracefully allow verified client tokens
    if (
      process.env.NODE_ENV === 'development' ||
      secretKey.startsWith('1x') ||
      process.env.NEXT_PUBLIC_SITE_URL?.includes('localhost')
    ) {
      console.warn('⚠️ [Turnstile] Localhost/Dev bypass for Turnstile:', data['error-codes']);
      return true;
    }

    return false;
  } catch (error) {
    console.error('❌ [Turnstile] Verification fetch error:', error);
    // In dev, network/fetch issues shouldn't lock developer out
    if (process.env.NODE_ENV === 'development') {
      return true;
    }
    return false;
  }
}
