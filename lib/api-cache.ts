/**
 * Simple request cache for deduplicating API calls
 * Prevents multiple identical requests from being made simultaneously
 */

interface CacheEntry {
  promise: Promise<any>;
  timestamp: number;
}

class APICache {
  private cache = new Map<string, CacheEntry>();
  private defaultTTL = 5000; // 5 seconds default TTL

  /**
   * Cached fetch that deduplicates identical requests
   * @param url - The URL to fetch
   * @param options - Fetch options
   * @param ttl - Time to live in milliseconds (default: 5000ms)
   */
  async fetch(
    url: string,
    options?: RequestInit,
    ttl = this.defaultTTL,
  ): Promise<Response> {
    const key = this.getCacheKey(url, options);
    const now = Date.now();

    // Check if we have a valid cached request
    const cached = this.cache.get(key);
    if (cached && now - cached.timestamp < ttl) {
      return cached.promise;
    }

    // Create new request
    const promise = fetch(url, options);
    this.cache.set(key, { promise, timestamp: now });

    // Clear cache after TTL
    setTimeout(() => {
      this.cache.delete(key);
    }, ttl);

    return promise;
  }

  /**
   * Generate cache key from URL and options
   */
  private getCacheKey(url: string, options?: RequestInit): string {
    const method = options?.method || "GET";
    const body = options?.body ? JSON.stringify(options.body) : "";
    return `${method}:${url}:${body}`;
  }

  /**
   * Clear all cached requests
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clear specific cached request
   */
  clearKey(url: string, options?: RequestInit): void {
    const key = this.getCacheKey(url, options);
    this.cache.delete(key);
  }
}

// Export singleton instance
export const apiCache = new APICache();

/**
 * Cached fetch function for easy use
 * @example
 * const response = await cachedFetch('/api/data', { method: 'GET' });
 */
export async function cachedFetch(
  url: string,
  options?: RequestInit,
  ttl?: number,
): Promise<Response> {
  return apiCache.fetch(url, options, ttl);
}
