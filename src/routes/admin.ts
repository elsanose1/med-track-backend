import { Router, RequestHandler } from "express";
import {
  createPharmacyAccount,
  createAdminAccount,
  getPendingPharmacies,
  verifyPharmacy,
  deverifyPharmacy,
  getAllPatients,
  getAllPharmacies,
  getAllAdmins,
  getAllUsersCount,
  getAllPatientsCount,
  getAllPharmaciesCount,
  getAllAdminsCount,
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

// Deverify a pharmacy account (admin only)
router.put(
  "/pharmacies/:pharmacyId/deverify",
  deverifyPharmacy as unknown as RequestHandler
);

// Retrieve all patients (admin only)
router.get("/patients", getAllPatients as unknown as RequestHandler);

// Retrieve all pharmacies (admin only)
router.get("/pharmacies/all", getAllPharmacies as unknown as RequestHandler);

// Retrieve all admins (admin only)
router.get("/admins/all", getAllAdmins as unknown as RequestHandler);

// Retrieve all users count (admin only)
router.get("/users/count", getAllUsersCount as unknown as RequestHandler);

// Retrieve all patients count (admin only)
router.get("/patients/count", getAllPatientsCount as unknown as RequestHandler);

// Retrieve all pharmacies count (admin only)
router.get(
  "/pharmacies/count",
  getAllPharmaciesCount as unknown as RequestHandler
);

// Retrieve all admins count (admin only)
router.get("/admins/count", getAllAdminsCount as unknown as RequestHandler);

export default router;
