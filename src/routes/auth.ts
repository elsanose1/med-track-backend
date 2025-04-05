import { Router } from "express";
import {
  loginHandler,
  registerHandler,
  changePasswordHandler,
} from "../controller/auth";
import authMiddleware from "../middleware/auth";

const router = Router();

// Register a new user
router.post("/register", registerHandler);

// Login user
router.post("/login", loginHandler);

// Change password (protected route)
router.post("/change-password", authMiddleware, changePasswordHandler);

export default router;
