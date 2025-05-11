import { Router, RequestHandler } from "express";
import authMiddleware from "../middleware/auth";
import {
  addMedication,
  getPatientMedications,
  getMedication,
  updateMedication,
  deleteMedication,
  updateReminderStatus,
  getUpcomingReminders,
  triggerTestReminder,
} from "../controller/medicationController";

const router = Router();

// All medication routes require authentication
router.use(authMiddleware);

// Patient medication routes
router.post("/", addMedication as unknown as RequestHandler);
router.get("/", getPatientMedications as unknown as RequestHandler);
router.get("/upcoming", getUpcomingReminders as unknown as RequestHandler);
router.get("/:id", getMedication as unknown as RequestHandler);
router.put("/:id", updateMedication as unknown as RequestHandler);
router.delete("/:id", deleteMedication as unknown as RequestHandler);

// Reminder status update route
router.patch(
  "/:medicationId/reminders/:reminderId",
  updateReminderStatus as unknown as RequestHandler
);

// Test reminder route
router.post(
  "/:medicationId/test-reminder",
  triggerTestReminder as unknown as RequestHandler
);

// Test specific reminder route
router.post(
  "/:medicationId/reminders/:reminderId/test",
  triggerTestReminder as unknown as RequestHandler
);

// Pharmacy access to patient medications
router.get(
  "/patient/:patientId",
  getPatientMedications as unknown as RequestHandler
);

export default router;
