import { Router, RequestHandler } from "express";
import {
  getOrCreateConversation,
  sendMessage,
  getMessages,
  markAsRead,
  getConversations,
  listPharmacies,
  getOnlineStatus,
} from "../controller/chat";
import authMiddleware from "../middleware/auth";
import { isPatient, isPharmacy } from "../middleware/roleAuth";

const router = Router();

// All chat routes require authentication
router.use(authMiddleware);

// Get all conversations for the current user (patient or pharmacy)
router.get("/conversations", getConversations as unknown as RequestHandler);

// Get all pharmacies for a patient to start a conversation with (patient only)
router.get(
  "/pharmacies",
  isPatient as unknown as RequestHandler,
  listPharmacies as unknown as RequestHandler
);

// Create or get a conversation with a pharmacy (patient only)
router.get(
  "/conversation/pharmacy/:pharmacyId",
  isPatient as unknown as RequestHandler,
  getOrCreateConversation as unknown as RequestHandler
);

// Get messages in a conversation
router.get(
  "/conversation/:conversationId/messages",
  getMessages as unknown as RequestHandler
);

// Send a message in a conversation
router.post(
  "/conversation/:conversationId/message",
  sendMessage as unknown as RequestHandler
);

// Mark messages as read in a conversation
router.put(
  "/conversation/:conversationId/read",
  markAsRead as unknown as RequestHandler
);

// Get online status for users
router.post("/online-status", getOnlineStatus as unknown as RequestHandler);

export default router;
