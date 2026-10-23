/**
 * Google Ads Keyword Planner Provider (Official Google Ads API REST Service)
 * 
 * Retrieves real keyword ideas, monthly search volumes, advertiser competition levels,
 * and top-of-page bids using the Google Ads API v18 GenerateKeywordIdeas service.
 * 
 * Server-side only: All credentials remain on the server.
 * Completely optional & resilient: If credentials are not configured, it returns a
 * clean structured 'unconfigured' status without failing or inventing fake numbers.
 */

export interface GoogleAdsKeywordMetric {
  keyword: string;
  avgMonthlySearches?: number;
  /** Advertiser competition for paid Google Ads placement (NOT organic SEO difficulty) */
  advertiserCompetition?: 'LOW' | 'MEDIUM' | 'HIGH' | 'UNSPECIFIED';
  advertiserCompetitionIndex?: number; // 0-100
  lowTopOfPageBidUsd?: number;
  highTopOfPageBidUsd?: number;
}

export interface GoogleAdsKeywordPlannerResult {
  status: 'configured' | 'unconfigured' | 'auth_failed' | 'rate_limited' | 'error';
  isConfigured: boolean;
  metrics: GoogleAdsKeywordMetric[];
  message: string;
  missingVariables?: string[];
  rawCount: number;
}

interface GoogleAdsCredentials {
  developerToken: string;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  customerId: string;
  loginCustomerId?: string;
}

/**
 * Validates whether all required Google Ads environment variables are defined
 */
export function getGoogleAdsCredentials(): {
  credentials?: GoogleAdsCredentials;
  missingVars: string[];
} {
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN?.trim() || '';
  const clientId = process.env.GOOGLE_ADS_CLIENT_ID?.trim() || '';
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET?.trim() || '';
  const refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN?.trim() || '';
  const rawCustomerId = process.env.GOOGLE_ADS_CUSTOMER_ID?.trim() || '';
  const customerId = rawCustomerId.replace(/[^0-9]/g, ''); // strip hyphens and formatting
  const rawLoginCustomerId = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID?.trim() || '';
  const loginCustomerId = rawLoginCustomerId.replace(/[^0-9]/g, '');

  const missingVars: string[] = [];
  if (!developerToken || developerToken.includes('placeholder')) missingVars.push('GOOGLE_ADS_DEVELOPER_TOKEN');
  if (!clientId || clientId.includes('placeholder')) missingVars.push('GOOGLE_ADS_CLIENT_ID');
  if (!clientSecret || clientSecret.includes('placeholder')) missingVars.push('GOOGLE_ADS_CLIENT_SECRET');
  if (!refreshToken || refreshToken.includes('placeholder')) missingVars.push('GOOGLE_ADS_REFRESH_TOKEN');
  if (!customerId || customerId.includes('placeholder')) missingVars.push('GOOGLE_ADS_CUSTOMER_ID');

  if (missingVars.length > 0) {
    return { missingVars };
  }

  return {
    credentials: {
      developerToken,
      clientId,
      clientSecret,
      refreshToken,
      customerId,
      ...(loginCustomerId ? { loginCustomerId } : {}),
    },
    missingVars: [],
  };
}

/**
 * Exchanges Google OAuth Refresh Token for a short-lived access token
 */
async function getAccessToken(creds: GoogleAdsCredentials): Promise<{
  accessToken?: string;
  error?: string;
}> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const bodyParams = new URLSearchParams({
      client_id: creds.clientId,
      client_secret: creds.clientSecret,
      refresh_token: creds.refreshToken,
      grant_type: 'refresh_token',
    });

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: bodyParams.toString(),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const errText = await res.text();
      return { error: `OAuth token exchange failed (HTTP ${res.status}): ${errText}` };
    }

    const data = await res.json();
    if (!data.access_token) {
      return { error: 'OAuth response missing access_token.' };
    }

    return { accessToken: data.access_token };
  } catch (err: any) {
    return { error: err?.message || 'OAuth network timeout' };
  }
}

/**
 * Fetch real keyword ideas and historical metrics via Google Ads API v18
 */
export async function fetchGoogleAdsKeywordIdeas(
  seeds: string[],
  options?: {
    geoTargetConstant?: string; // Default: 'geoTargetConstants/2840' (US)
    languageConstant?: string;  // Default: 'languageConstants/1000' (English)
    pageSize?: number;
  }
): Promise<GoogleAdsKeywordPlannerResult> {
  const { credentials, missingVars } = getGoogleAdsCredentials();

  if (!credentials) {
    return {
      status: 'unconfigured',
      isConfigured: false,
      metrics: [],
      rawCount: 0,
      missingVariables: missingVars,
      message:
        'Google Ads API credentials not configured in server environment. Prody is operating with curated audio SEO domain intelligence.',
    };
  }

  const cleanSeeds = seeds
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 1)
    .slice(0, 20);

  if (cleanSeeds.length === 0) {
    return {
      status: 'configured',
      isConfigured: true,
      metrics: [],
      rawCount: 0,
      message: 'No keyword seeds provided for Google Ads API request.',
    };
  }

  // 1. Get OAuth Access Token
  const { accessToken, error: authError } = await getAccessToken(credentials);
  if (!accessToken) {
    console.warn('[Google Ads API] OAuth token acquisition failed:', authError);
    return {
      status: 'auth_failed',
      isConfigured: true,
      metrics: [],
      rawCount: 0,
      message: `Google Ads authentication failed: ${authError}`,
    };
  }

  // 2. Call Google Ads API generateKeywordIdeas endpoint
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const headers: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
      'developer-token': credentials.developerToken,
      'Content-Type': 'application/json',
    };

    if (credentials.loginCustomerId) {
      headers['login-customer-id'] = credentials.loginCustomerId;
    }

    const requestBody: any = {
      keywordPlanNetwork: 'GOOGLE_SEARCH',
      keywordSeed: {
        keywords: cleanSeeds,
      },
      geoTargetConstants: [options?.geoTargetConstant || 'geoTargetConstants/2840'],
      language: options?.languageConstant || 'languageConstants/1000',
      includeAdultKeywords: false,
      pageSize: options?.pageSize || 20,
    };

    const apiVersion = 'v24';
    const res = await fetch(
      `https://googleads.googleapis.com/${apiVersion}/customers/${credentials.customerId}:generateKeywordIdeas`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      }
    );

    clearTimeout(timeout);

    if (res.status === 429) {
      return {
        status: 'rate_limited',
        isConfigured: true,
        metrics: [],
        rawCount: 0,
        message: 'Google Ads API quota or rate limit reached. Using cached/domain knowledge.',
      };
    }

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[Google Ads API] API request failed (HTTP ${res.status}):`, errText);

      if (errText.includes('DEVELOPER_TOKEN_NOT_APPROVED')) {
        return {
          status: 'auth_failed',
          isConfigured: true,
          metrics: [],
          rawCount: 0,
          message:
            'Google Ads Developer Token is currently in Test Access / Pending Review mode. Prody is using curated ProducerToy audio SEO domain taxonomy.',
        };
      }

      return {
        status: 'error',
        isConfigured: true,
        metrics: [],
        rawCount: 0,
        message: `Google Ads API request failed (HTTP ${res.status})`,
      };
    }

    const data = await res.json();
    const results = Array.isArray(data.results) ? data.results : [];

    const metrics: GoogleAdsKeywordMetric[] = results.map((item: any) => {
      const ideaMetrics = item.keywordIdeaMetrics || {};
      const lowBid = ideaMetrics.lowTopOfPageBidMicros
        ? Number(ideaMetrics.lowTopOfPageBidMicros) / 1000000
        : undefined;
      const highBid = ideaMetrics.highTopOfPageBidMicros
        ? Number(ideaMetrics.highTopOfPageBidMicros) / 1000000
        : undefined;

      return {
        keyword: item.text || '',
        avgMonthlySearches: ideaMetrics.avgMonthlySearches ? Number(ideaMetrics.avgMonthlySearches) : undefined,
        advertiserCompetition: ideaMetrics.competition || 'UNSPECIFIED',
        advertiserCompetitionIndex: ideaMetrics.competitionIndex !== undefined ? Number(ideaMetrics.competitionIndex) : undefined,
        lowTopOfPageBidUsd: lowBid ? Math.round(lowBid * 100) / 100 : undefined,
        highTopOfPageBidUsd: highBid ? Math.round(highBid * 100) / 100 : undefined,
      };
    }).filter((m: GoogleAdsKeywordMetric) => Boolean(m.keyword));

    return {
      status: 'configured',
      isConfigured: true,
      metrics,
      rawCount: metrics.length,
      message: `Retrieved ${metrics.length} verified keyword ideas from Google Ads Keyword Planner.`,
    };
  } catch (err: any) {
    console.warn('[Google Ads API] Network or parsing error:', err);
    return {
      status: 'error',
      isConfigured: true,
      metrics: [],
      rawCount: 0,
      message: `Google Ads API network error: ${err.message || 'Timeout'}`,
    };
  }
}
