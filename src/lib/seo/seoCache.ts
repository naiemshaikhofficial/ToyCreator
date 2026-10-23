/**
 * Persistent & In-Memory Hybrid SEO Research Cache
 * 
 * Stores Google Ads Keyword Planner data and public product page analyses.
 * Backed by Supabase `seo_research_cache` table with in-memory LRU fallback.
 * Prevents duplicate in-flight requests and avoids repetitive API calls during chat sessions.
 */

import { getAdminClient } from '@/lib/supabase/admin';

// In-memory fallback & in-flight request lock
const memoryCache = new Map<string, { data: any; expiresAt: number }>();
const inFlightRequests = new Map<string, Promise<any>>();

/**
 * Normalizes keyword seeds or search queries for uniform cache key matching
 */
export function normalizeQueryKey(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Executes a fetcher with an in-flight deduplication lock
 */
export async function withInFlightLock<T>(
  lockKey: string,
  fetcher: () => Promise<T>
): Promise<T> {
  const existing = inFlightRequests.get(lockKey);
  if (existing) {
    return existing as Promise<T>;
  }

  const promise = fetcher().finally(() => {
    inFlightRequests.delete(lockKey);
  });

  inFlightRequests.set(lockKey, promise);
  return promise;
}

/**
 * Retrieve cached research data from memory or Supabase
 */
export async function getCachedResearch<T = any>(
  cacheKey: string
): Promise<{ data: T; isFromCache: true } | null> {
  const now = Date.now();

  // 1. Check in-memory cache first (instant)
  const mem = memoryCache.get(cacheKey);
  if (mem && mem.expiresAt > now) {
    return { data: mem.data, isFromCache: true };
  }

  // 2. Check Supabase persistent table
  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('seo_research_cache')
      .select('data, expires_at')
      .eq('cache_key', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (!error && data?.data) {
      // Re-populate in-memory cache
      const expiresAt = new Date(data.expires_at).getTime();
      memoryCache.set(cacheKey, { data: data.data, expiresAt });
      return { data: data.data, isFromCache: true };
    }
  } catch (err) {
    // Fail silently to memory cache if DB is unreachable
    console.warn('[SEO Cache] Supabase lookup error (using memory cache):', err);
  }

  return null;
}

/**
 * Store research data into Supabase and memory cache
 */
export async function setCachedResearch(params: {
  cacheKey: string;
  query: string;
  normalizedQuery: string;
  provider: 'google_ads' | 'competitor_page' | 'ai_domain';
  status: string;
  data: any;
  ttlDays?: number;
}): Promise<void> {
  const {
    cacheKey,
    query,
    normalizedQuery,
    provider,
    status,
    data,
    ttlDays = 14,
  } = params;

  const expiresDate = new Date();
  expiresDate.setDate(expiresDate.getDate() + ttlDays);
  const expiresAtMs = expiresDate.getTime();

  // 1. Save in-memory
  memoryCache.set(cacheKey, { data, expiresAt: expiresAtMs });

  // Keep memory cache bounded to 200 items
  if (memoryCache.size > 200) {
    const firstKey = memoryCache.keys().next().value;
    if (firstKey) memoryCache.delete(firstKey);
  }

  // 2. Persist in Supabase
  try {
    const supabase = getAdminClient();
    await supabase
      .from('seo_research_cache')
      .upsert(
        {
          cache_key: cacheKey,
          query,
          normalized_query: normalizedQuery,
          provider,
          status,
          data,
          retrieved_at: new Date().toISOString(),
          expires_at: expiresDate.toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'cache_key' }
      );
  } catch (err) {
    console.warn('[SEO Cache] Supabase write error (stored in memory):', err);
  }
}
