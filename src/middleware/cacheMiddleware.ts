import { Request, Response, NextFunction } from "express";
import {
  getCachedData,
  setCachedData,
  generateCacheKey,
  CachePrefix,
} from "../services/cacheService";

/**
 * Middleware that checks cache before proceeding to controller
 * If cache hit, sends cached response
 * If cache miss, continues to controller and caches the response
 *
 * @param cachePrefix The cache prefix to use for this request type
 * @param paramExtractor Function to extract unique parameters for cache key
 * @param ttl Optional TTL override in seconds
 * @returns Express middleware function
 */
export function cachingMiddleware(
  cachePrefix: CachePrefix,
  paramExtractor: (req: Request) => Record<string, any>,
  ttl?: number
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Get cache key based on request parameters
    const params = paramExtractor(req);
    const cacheKey = generateCacheKey(cachePrefix, params);

    // Check cache for existing response
    const cachedData = getCachedData<any>(cacheKey);

    if (cachedData) {
      // Cache hit - return cached response
      console.log(`Cache hit: ${cacheKey}`);
      res.json(cachedData);
      return;
    }

    // Cache miss - store original res.json function
    const originalJson = res.json;

    // Override res.json to cache response before sending
    res.json = function (body: any): Response {
      // Restore original json function
      res.json = originalJson;

      // Don't cache error responses
      if (res.statusCode >= 200 && res.statusCode < 400) {
        // Cache the response
        setCachedData(cacheKey, body, ttl);
        console.log(`Cache set: ${cacheKey}`);
      }

      // Call the original json function
      return originalJson.call(this, body);
    };

    // Continue to controller
    next();
  };
}

/**
 * Parameter extractors for different drug route types
 */
export const drugParamExtractors = {
  // Get all drugs
  allDrugs: (req: Request) => ({
    limit: req.query.limit,
    skip: req.query.skip,
  }),

  // Get drug by ID
  drugById: (req: Request) => ({
    id: req.params.id,
  }),

  // Search drugs by brand name
  drugsByBrandName: (req: Request) => ({
    brandName: req.query.brandName,
  }),
};

export default cachingMiddleware;
