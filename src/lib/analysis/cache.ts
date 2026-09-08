import type { SentenceAnalysis } from "@common/types";

// Cache for memoizing API responses
export interface CacheEntry {
  data: SentenceAnalysis;
  timestamp: number;
}

export const responseCache = new Map<string, CacheEntry>();
export const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

/**
 * Clean up expired cache entries
 */
export function cleanExpiredCache() {
  const now = Date.now();
  for (const [key, entry] of responseCache.entries()) {
    if (now - entry.timestamp > CACHE_DURATION_MS) {
      responseCache.delete(key);
    }
  }
}

/**
 * Get cached response if available and not expired
 */
export function getCachedResponse(cacheKey: string): SentenceAnalysis | null {
  const cached = responseCache.get(cacheKey);
  if (cached) {
    const now = Date.now();
    const hasWordTranslations = cached.data.words.every(
      (word) =>
        typeof word.translation === "string" &&
        word.translation.trim().length > 0,
    );
    if (now - cached.timestamp <= CACHE_DURATION_MS && hasWordTranslations) {
      return cached.data;
    }
    // Discard expired entries and analyses without word translations.
    responseCache.delete(cacheKey);
  }
  return null;
}

/**
 * Store response in cache
 */
export function setCachedResponse(cacheKey: string, data: SentenceAnalysis) {
  responseCache.set(cacheKey, {
    data,
    timestamp: Date.now(),
  });

  // Periodically clean up expired entries
  if (responseCache.size > 100) {
    cleanExpiredCache();
  }
}
