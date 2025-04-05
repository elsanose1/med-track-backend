import { Router, RequestHandler } from "express";
import { createPharmacyAccount, createAdminAccount } from "../controller/admin";
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

export default router;
