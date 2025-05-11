import {
  Router,
  RequestHandler,
  Request,
  Response,
  NextFunction,
} from "express";
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
import { isPatient, isVerifiedPharmacy } from "../middleware/roleAuth";
import { AuthenticatedRequest } from "../middleware/auth";
import { UserType } from "../models/User";

const router = Router();

// All chat routes require authentication
router.use(authMiddleware);

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

// For pharmacy users, they need to be verified to access these routes
// The routes themselves will handle the case when the user is a patient
const pharmacyRouteMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (req.user.userType === UserType.PHARMACY) {
    // Call the middleware but don't return its result
    isVerifiedPharmacy(req, res, next);
    // The function will either call next() or send a response
    // We don't need to return anything here
    return;
  }
  next();
};

// Get all conversations for the current user (patient or verified pharmacy)
router.get(
  "/conversations",
  pharmacyRouteMiddleware as unknown as RequestHandler,
  getConversations as unknown as RequestHandler
);

// Get messages for a specific conversation (patient or verified pharmacy)
router.get(
  "/conversation/:conversationId/messages",
  pharmacyRouteMiddleware as unknown as RequestHandler,
  getMessages as unknown as RequestHandler
);

// Mark messages as read in a conversation (patient or verified pharmacy)
router.put(
  "/conversation/:conversationId/read",
  pharmacyRouteMiddleware as unknown as RequestHandler,
  markAsRead as unknown as RequestHandler
);

// Send a message in a conversation (patient or verified pharmacy)
router.post(
  "/conversation/:conversationId/message",
  pharmacyRouteMiddleware as unknown as RequestHandler,
  sendMessage as unknown as RequestHandler
);

// Check if a user is online (patient or verified pharmacy)
router.get(
  "/status/:userId",
  pharmacyRouteMiddleware as unknown as RequestHandler,
  getOnlineStatus as unknown as RequestHandler
);

export default router;
