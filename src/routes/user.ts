import { Router, RequestHandler } from "express";
import { getUserProfile, updateUserProfile } from "../controller/user";
import authMiddleware from "../middleware/auth";

const router = Router();

// All user routes require authentication
router.use(authMiddleware);

// Get user profile
router.get("/profile", getUserProfile as unknown as RequestHandler);

// Update user profile
router.put("/profile", updateUserProfile as unknown as RequestHandler);

export default router;
