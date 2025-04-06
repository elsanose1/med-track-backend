import { Router } from "express";
import {
  getDrugsByBrandName,
  getDrugById,
  getAllDrugs,
} from "../controller/drugController";
import {
  cachingMiddleware,
  drugParamExtractors,
} from "../middleware/cacheMiddleware";
import { CachePrefix } from "../services/cacheService";

const router = Router();

// Get all drugs with pagination (cache for 1 hour)
router.get(
  "/",
  cachingMiddleware(
    CachePrefix.ALL_DRUGS,
    drugParamExtractors.allDrugs,
    60 * 60 // 1 hour TTL
  ),
  getAllDrugs
);

// Get drugs by brand name (cache for 2 hours)
router.get(
  "/search",
  cachingMiddleware(
    CachePrefix.DRUGS_BY_BRAND,
    drugParamExtractors.drugsByBrandName,
    2 * 60 * 60 // 2 hours TTL
  ),
  getDrugsByBrandName
);

// Get specific drug by ID (cache for 6 hours)
router.get(
  "/:id",
  cachingMiddleware(
    CachePrefix.DRUG_BY_ID,
    drugParamExtractors.drugById,
    6 * 60 * 60 // 6 hours TTL
  ),
  getDrugById
);

export default router;
