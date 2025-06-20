import { getSocketIOInstance, isUserOnline } from "./socketService";
import { CronJob } from "cron";
import mongoose from "mongoose";
import PatientMedication, {
  ReminderStatus,
  IPatientMedication,
} from "../models/PatientMedication";

// Check for medication reminders every minute
const REMINDER_CHECK_FREQUENCY = "*/1 * * * *";

// Time window for reminder checks (in minutes)
const REMINDER_WINDOW_MINUTES = 15;

// Keep track of reminders that have been sent to avoid duplicates
const sentReminders = new Set<string>();

/**
 * Initialize the reminder service
 */
export function initializeReminderService(): void {
  console.log("Initializing medication reminder service...");

  // Create a cron job to check for medication reminders
  const reminderJob = new CronJob(
    REMINDER_CHECK_FREQUENCY,
    checkUpcomingMedicationReminders,
    null, // onComplete
    false, // start
    "UTC" // timezone
  );

  // Start the job
  reminderJob.start();
  console.log("Medication reminder service started");
}

/**
 * Check for upcoming medication reminders and send notifications
 */
async function checkUpcomingMedicationReminders(): Promise<void> {
  try {
    const now = new Date();
    const futureWindow = new Date(
      now.getTime() + REMINDER_WINDOW_MINUTES * 60 * 1000
    );

    // Find active medications with reminders in the time window
    const medicationsWithUpcomingReminders = await PatientMedication.find({
      active: true,
      reminders: {
        $elemMatch: {
          time: { $gte: now, $lte: futureWindow },
          status: ReminderStatus.ACTIVE,
        },
      },
    }).populate("patient", "id firstName lastName");

    if (medicationsWithUpcomingReminders.length > 0) {
      console.log(
        `Found ${medicationsWithUpcomingReminders.length} medications with upcoming reminders`
      );

      // Process each medication with upcoming reminders
      for (const medication of medicationsWithUpcomingReminders) {
        const patientId = medication.patient._id.toString();

        // Get upcoming reminders in the time window
        const upcomingReminders = medication.reminders.filter(
          (reminder) =>
            reminder.time >= now &&
            reminder.time <= futureWindow &&
            reminder.status === ReminderStatus.ACTIVE &&
            !sentReminders.has(`${medication._id}_${reminder._id}`)
        );

        // Send notifications for each reminder
        for (const reminder of upcomingReminders) {
          // Add to sent reminders to avoid duplicates
          const reminderId = `${medication._id}_${reminder._id}`;
          sentReminders.add(reminderId);

          // Prepare reminder notification data
          const reminderData = {
            id: reminder._id,
            medicationId: medication._id,
            medicationName: medication.brandName,
            dosage: medication.dosage,
            time: reminder.time,
            instructions: medication.instructions,
            notes: reminder.notes || medication.notes,
          };

          // Send notification via Socket.IO if user is online
          if (isUserOnline(patientId)) {
            const io = getSocketIOInstance();
            if (io) {
              io.to(`user:${patientId}`).emit(
                "medication_reminder",
                reminderData
              );
              console.log(
                `Sent reminder notification to patient ${patientId} for medication ${medication.brandName}`
              );
            }
          }

          // TODO: Could also send push notifications or SMS if needed
          // This would require additional services/integrations
        }

        // Clean up sent reminders set periodically
        // Only keep reminders from the last hour to prevent memory leaks
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        for (const reminder of medication.reminders) {
          if (reminder.time < oneHourAgo) {
            sentReminders.delete(`${medication._id}_${reminder._id}`);
          }
        }
      }
    }
  } catch (error) {
    console.error("Error checking medication reminders:", error);
  }
}

/**
 * Mark a reminder as completed
 */
export async function markReminderAsCompleted(
  medicationId: string,
  reminderId: string
): Promise<boolean> {
  try {
    const medication = await PatientMedication.findById(medicationId);

    if (!medication) {
      return false;
    }

    // Find the reminder by converting the string ID to ObjectId
    const reminder = medication.reminders.find(
      (r) => r._id && r._id.toString() === reminderId
    );

    if (!reminder) {
      return false;
    }

    reminder.status = ReminderStatus.COMPLETED;
    await medication.save();

    // Update next reminder
    await updateNextReminder(medicationId);

    return true;
  } catch (error) {
    console.error("Error marking reminder as completed:", error);
    return false;
  }
}

/**
 * Snooze a reminder
 */
export async function snoozeReminder(
  medicationId: string,
  reminderId: string,
  snoozeMinutes: number = 15
): Promise<boolean> {
  try {
    const medication = await PatientMedication.findById(medicationId);

    if (!medication) {
      return false;
    }

    // Find the reminder by converting the string ID to ObjectId
    const reminder = medication.reminders.find(
      (r) => r._id && r._id.toString() === reminderId
    );

    if (!reminder) {
      return false;
    }

    reminder.status = ReminderStatus.SNOOZED;
    reminder.snoozeUntil = new Date(Date.now() + snoozeMinutes * 60 * 1000);
    await medication.save();

    // Update next reminder
    await updateNextReminder(medicationId);

    return true;
  } catch (error) {
    console.error("Error snoozing reminder:", error);
    return false;
  }
}

/**
 * Mark a reminder as missed
 */
export async function markReminderAsMissed(
  medicationId: string,
  reminderId: string
): Promise<boolean> {
  try {
    const medication = await PatientMedication.findById(medicationId);

    if (!medication) {
      return false;
    }

    // Find the reminder by converting the string ID to ObjectId
    const reminder = medication.reminders.find(
      (r) => r._id && r._id.toString() === reminderId
    );

    if (!reminder) {
      return false;
    }

    reminder.status = ReminderStatus.MISSED;
    await medication.save();

    // Update next reminder
    await updateNextReminder(medicationId);

    return true;
  } catch (error) {
    console.error("Error marking reminder as missed:", error);
    return false;
  }
}

/**
 * Update the next reminder for a medication
 */
async function updateNextReminder(medicationId: string): Promise<void> {
  try {
    const medication = await PatientMedication.findById(medicationId);

    if (!medication) {
      return;
    }

    const now = new Date();

    // Find the next active reminder
    const futureReminders = medication.reminders
      .filter(
        (r) =>
          r.time > now &&
          (r.status === ReminderStatus.ACTIVE ||
            (r.status === ReminderStatus.SNOOZED &&
              r.snoozeUntil &&
              r.snoozeUntil <= now))
      )
      .sort((a, b) => a.time.getTime() - b.time.getTime());

    if (futureReminders.length > 0) {
      medication.nextReminder = futureReminders[0].time;
    } else {
      medication.nextReminder = undefined;
    }

    await medication.save();
  } catch (error) {
    console.error("Error updating next reminder:", error);
  }
}

/**
 * Manually trigger a reminder for a specific medication (for testing)
 */
export async function triggerReminderForTesting(
  medicationId: string,
  reminderId?: string
): Promise<{ success: boolean; message: string; data?: any }> {
  try {
    // Find the medication
    const medication = await PatientMedication.findById(medicationId).populate(
      "patient",
      "id firstName lastName"
    );

    if (!medication) {
      return {
        success: false,
        message: "Medication not found",
      };
    }

    const patientId = medication.patient._id.toString();
    let reminderData;

    // If a specific reminder ID is provided, trigger only that reminder
    if (reminderId) {
      const reminder = medication.reminders.find(
        (r) => r._id && r._id.toString() === reminderId
      );

      if (!reminder) {
        return {
          success: false,
          message: "Reminder not found",
        };
      }

      // Create reminder notification data
      reminderData = {
        id: reminder._id,
        medicationId: medication._id,
        medicationName: medication.brandName,
        genericName: medication.genericName || "",
        dosage: medication.dosage,
        time: reminder.time,
        instructions: medication.instructions,
        notes: reminder.notes || medication.notes,
        isTestReminder: true,
      };
    } else {
      // If no specific reminder ID is provided, create a test reminder with current time
      reminderData = {
        id: "test-reminder",
        medicationId: medication._id,
        medicationName: medication.brandName,
        genericName: medication.genericName || "",
        dosage: medication.dosage,
        time: new Date(),
        instructions: medication.instructions,
        notes: medication.notes,
        isTestReminder: true,
      };
    }

    // Send notification via Socket.IO if user is online
    if (isUserOnline(patientId)) {
      const io = getSocketIOInstance();
      if (io) {
        io.to(`user:${patientId}`).emit("medication_reminder", reminderData);
        return {
          success: true,
          message: `Test reminder sent to patient ${patientId} for medication ${medication.brandName}`,
          data: reminderData,
        };
      } else {
        return {
          success: false,
          message: "Socket.IO instance not available",
        };
      }
    } else {
      return {
        success: false,
        message: `Patient ${patientId} is not online. Cannot send test reminder.`,
      };
    }
  } catch (error) {
    console.error("Error triggering test reminder:", error);
    return {
      success: false,
      message: "Error triggering test reminder",
    };
  }
}
