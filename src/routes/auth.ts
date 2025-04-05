import { Router, RequestHandler } from "express";
import {
  loginHandler,
  registerHandler,
  changePasswordHandler,
} from "../controller/auth";
import authMiddleware from "../middleware/auth";

const router = Router();

// Register a new user
router.post("/register", registerHandler as unknown as RequestHandler);

// Login user
router.post("/login", loginHandler as unknown as RequestHandler);

// Change password (protected route)
router.post(
  "/change-password",
  authMiddleware,
  changePasswordHandler as unknown as RequestHandler
);

export default router;
