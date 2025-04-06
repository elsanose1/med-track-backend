import { Router, RequestHandler } from "express";
import {
  createPharmacyAccount,
  createAdminAccount,
  getPendingPharmacies,
  verifyPharmacy,
} from "../controller/admin";
import authMiddleware from "../middleware/auth";
import { isAdmin } from "../middleware/roleAuth";

const router = Router();

// All admin routes require authentication and admin role
router.use(authMiddleware);
router.use(isAdmin as unknown as RequestHandler);

// Create a pharmacy account (admin only)
router.post("/pharmacies", createPharmacyAccount as unknown as RequestHandler);

// Create an admin account (admin only)
router.post("/admins", createAdminAccount as unknown as RequestHandler);

// Get all pharmacy accounts pending verification (admin only)
router.get(
  "/pharmacies/pending",
  getPendingPharmacies as unknown as RequestHandler
);

// Verify or reject a pharmacy account (admin only)
router.put(
  "/pharmacies/:pharmacyId/verify",
  verifyPharmacy as unknown as RequestHandler
);

export default router;
