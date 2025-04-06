import NodeCache from "node-cache";

// Cache configuration
const DEFAULT_TTL = 60 * 60; // 1 hour in seconds
const CHECK_PERIOD = 120; // Check for expired keys every 2 minutes

// Create cache instance with configuration
const cache = new NodeCache({
  stdTTL: DEFAULT_TTL,
  checkperiod: CHECK_PERIOD,
  useClones: false, // For better performance with large objects
});

// Cache keys prefixes for different types of drug requests
export enum CachePrefix {
  ALL_DRUGS = "ALL_DRUGS",
  DRUG_BY_ID = "DRUG_BY_ID",
  DRUGS_BY_BRAND = "DRUGS_BY_BRAND",
}

/**
 * Generate a cache key based on request parameters
 * @param prefix Cache prefix for request type
 * @param params Parameters that make the request unique
 * @returns A unique cache key
 */
export function generateCacheKey(
  prefix: CachePrefix,
  params: Record<string, any>
): string {
  const paramString = Object.entries(params)
    .filter(([_, value]) => value !== undefined)
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([key, value]) => `${key}:${value}`)
    .join("|");

  return `${prefix}:${paramString}`;
}

/**
 * Get data from cache
 * @param key The cache key
 * @returns Cached data or undefined if not found
 */
export function getCachedData<T>(key: string): T | undefined {
  return cache.get<T>(key);
}

/**
 * Set data in cache
 * @param key The cache key
 * @param data Data to cache
 * @param ttl TTL in seconds, defaults to DEFAULT_TTL
 * @returns True if successful
 */
export function setCachedData<T>(
  key: string,
  data: T,
  ttl = DEFAULT_TTL
): boolean {
  return cache.set(key, data, ttl);
}

/**
 * Clear a specific key from cache
 * @param key The cache key to clear
 * @returns True if successful
 */
export function clearCacheKey(key: string): boolean {
  return cache.del(key) > 0;
}

/**
 * Clear all keys with a specific prefix
 * @param prefix The prefix of keys to clear
 * @returns Number of keys removed
 */
export function clearCacheByPrefix(prefix: CachePrefix): number {
  const keys = cache.keys().filter((key) => key.startsWith(prefix));
  return cache.del(keys);
}

/**
 * Get cache statistics
 * @returns Object with cache stats
 */
export function getCacheStats(): {
  keys: number;
  hits: number;
  misses: number;
  ksize: number;
  vsize: number;
} {
  return cache.getStats();
}

/**
 * Flush the entire cache
 */
export function flushCache(): void {
  cache.flushAll();
}

export default {
  generateCacheKey,
  getCachedData,
  setCachedData,
  clearCacheKey,
  clearCacheByPrefix,
  getCacheStats,
  flushCache,
  CachePrefix,
};
