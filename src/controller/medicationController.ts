import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import PatientMedication, {
  ReminderFrequency,
  ReminderStatus,
  IPatientMedication,
} from "../models/PatientMedication";
import { UserType } from "../models/User";
import { getSocketIOInstance } from "../services/socketService";
import { getOnlineUsers } from "../services/socketService";
import { triggerReminderForTesting } from "../services/reminderService";

// Helper function to generate reminder times based on frequency
const generateReminderTimes = (
  startDate: Date,
  endDate: Date | null,
  frequency: ReminderFrequency,
  firstDoseTime?: Date
): Date[] => {
  const reminders: Date[] = [];
  const currentDate = new Date(startDate);
  const endDateTime = endDate ? new Date(endDate).getTime() : null;

  // Set time for the first dose if provided
  if (firstDoseTime) {
    currentDate.setHours(
      firstDoseTime.getHours(),
      firstDoseTime.getMinutes(),
      0,
      0
    );
  }

  // Generate reminders based on frequency
  switch (frequency) {
    case ReminderFrequency.ONCE:
      reminders.push(new Date(currentDate));
      break;

    case ReminderFrequency.DAILY:
      while (!endDateTime || currentDate.getTime() <= endDateTime) {
        reminders.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);

        // Limit to 90 days of reminders for ongoing medications
        if (reminders.length >= 90 && !endDateTime) break;
      }
      break;

    case ReminderFrequency.TWICE_DAILY:
      while (!endDateTime || currentDate.getTime() <= endDateTime) {
        // Morning dose
        const morningDose = new Date(currentDate);
        morningDose.setHours(9, 0, 0, 0);
        reminders.push(new Date(morningDose));

        // Evening dose
        const eveningDose = new Date(currentDate);
        eveningDose.setHours(21, 0, 0, 0);
        reminders.push(new Date(eveningDose));

        currentDate.setDate(currentDate.getDate() + 1);

        // Limit to 90 days of reminders for ongoing medications
        if (reminders.length >= 180 && !endDateTime) break;
      }
      break;

    case ReminderFrequency.THREE_TIMES_DAILY:
      while (!endDateTime || currentDate.getTime() <= endDateTime) {
        // Morning dose
        const morningDose = new Date(currentDate);
        morningDose.setHours(8, 0, 0, 0);
        reminders.push(new Date(morningDose));

        // Afternoon dose
        const afternoonDose = new Date(currentDate);
        afternoonDose.setHours(14, 0, 0, 0);
        reminders.push(new Date(afternoonDose));

        // Evening dose
        const eveningDose = new Date(currentDate);
        eveningDose.setHours(20, 0, 0, 0);
        reminders.push(new Date(eveningDose));

        currentDate.setDate(currentDate.getDate() + 1);

        // Limit to 90 days of reminders for ongoing medications
        if (reminders.length >= 270 && !endDateTime) break;
      }
      break;

    case ReminderFrequency.FOUR_TIMES_DAILY:
      while (!endDateTime || currentDate.getTime() <= endDateTime) {
        // Four doses throughout the day
        [8, 12, 16, 20].forEach((hour) => {
          const dose = new Date(currentDate);
          dose.setHours(hour, 0, 0, 0);
          reminders.push(new Date(dose));
        });

        currentDate.setDate(currentDate.getDate() + 1);

        // Limit to 90 days of reminders for ongoing medications
        if (reminders.length >= 360 && !endDateTime) break;
      }
      break;

    case ReminderFrequency.WEEKLY:
      while (!endDateTime || currentDate.getTime() <= endDateTime) {
        reminders.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 7);

        // Limit to about a year of reminders for ongoing medications
        if (reminders.length >= 52 && !endDateTime) break;
      }
      break;

    case ReminderFrequency.MONTHLY:
      while (!endDateTime || currentDate.getTime() <= endDateTime) {
        reminders.push(new Date(currentDate));
        currentDate.setMonth(currentDate.getMonth() + 1);

        // Limit to about a year of reminders for ongoing medications
        if (reminders.length >= 12 && !endDateTime) break;
      }
      break;

    case ReminderFrequency.AS_NEEDED:
      // No automatic reminders for as-needed medications
      break;
  }

  return reminders;
};

// Add a new medication with reminders
export async function addMedication(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const userType = req.user?.userType;

    // Only patients can add medications
    if (userType !== UserType.PATIENT) {
      return res.status(403).json({
        message: "Only patients can add medications to their list",
      });
    }

    // Extract data from request body
    const {
      drugId,
      brandName,
      genericName,
      dosage,
      frequency,
      startDate = new Date(),
      endDate,
      instructions,
      notes,
      firstDoseTime,
    } = req.body;

    // Validate required fields
    if (!drugId || !brandName || !dosage || !frequency) {
      return res.status(400).json({
        message:
          "Missing required fields: drugId, brandName, dosage, and frequency are required",
      });
    }

    // Create new medication entry
    const newMedication = new PatientMedication({
      patient: userId,
      drugId,
      brandName,
      genericName,
      dosage,
      frequency,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      instructions,
      notes,
      active: true,
      reminders: [],
    });

    // Generate reminders
    if (frequency !== ReminderFrequency.AS_NEEDED) {
      const reminderTimes = generateReminderTimes(
        new Date(startDate),
        endDate ? new Date(endDate) : null,
        frequency,
        firstDoseTime ? new Date(firstDoseTime) : undefined
      );

      // Add reminders to the medication
      newMedication.reminders = reminderTimes.map((time) => ({
        time,
        status: ReminderStatus.ACTIVE,
      }));

      // Set next reminder
      if (reminderTimes.length > 0) {
        // Sort reminders and find the next one
        const futureReminders = reminderTimes
          .filter((time) => time.getTime() > Date.now())
          .sort((a, b) => a.getTime() - b.getTime());

        if (futureReminders.length > 0) {
          newMedication.nextReminder = futureReminders[0];
        }
      }
    }

    // Save medication to database
    await newMedication.save();

    res.status(201).json({
      message: "Medication added successfully",
      medication: newMedication,
    });
  } catch (err) {
    console.error("Error adding medication:", err);
    res.status(500).json({
      message: "Error adding medication",
      error: err,
    });
  }
}

// Get all medications for a patient
export async function getPatientMedications(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const userId = req.user?.id;
    const userType = req.user?.userType;

    // Allow patients to view their own medications or pharmacies to view their patients' medications
    let patientId = userId;

    if (userType === UserType.PHARMACY) {
      // Pharmacy can view a specific patient's medications
      patientId = req.params.patientId;
    } else if (userType !== UserType.PATIENT) {
      return res.status(403).json({
        message: "Unauthorized to view medications",
      });
    }

    // Query parameters for filtering
    const { active, upcoming } = req.query;
    const query: any = { patient: patientId };

    // Filter by active status if specified
    if (active !== undefined) {
      query.active = active === "true";
    }

    // Filter for upcoming reminders if specified
    if (upcoming === "true") {
      const now = new Date();
      query.nextReminder = { $gte: now };
    }

    // Find medications
    const medications = await PatientMedication.find(query)
      .sort({ nextReminder: 1 })
      .lean();

    res.json(medications);
  } catch (err) {
    console.error("Error getting medications:", err);
    res.status(500).json({
      message: "Error retrieving medications",
      error: err,
    });
  }
}

// Get a single medication
export async function getMedication(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const userType = req.user?.userType;
    const medicationId = req.params.id;

    // Find the medication
    const medication = await PatientMedication.findById(medicationId);

    if (!medication) {
      return res.status(404).json({
        message: "Medication not found",
      });
    }

    // Check authorization
    if (
      userType !== UserType.ADMIN &&
      medication.patient.toString() !== userId &&
      userType !== UserType.PHARMACY
    ) {
      return res.status(403).json({
        message: "Not authorized to view this medication",
      });
    }

    res.json(medication);
  } catch (err) {
    console.error("Error getting medication details:", err);
    res.status(500).json({
      message: "Error retrieving medication details",
      error: err,
    });
  }
}

// Update a medication
export async function updateMedication(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const userId = req.user?.id;
    const userType = req.user?.userType;
    const medicationId = req.params.id;

    // Find the medication
    const medication = await PatientMedication.findById(medicationId);

    if (!medication) {
      return res.status(404).json({
        message: "Medication not found",
      });
    }

    // Check authorization (only patient or pharmacy can update)
    if (
      userType !== UserType.ADMIN &&
      medication.patient.toString() !== userId &&
      userType !== UserType.PHARMACY
    ) {
      return res.status(403).json({
        message: "Not authorized to update this medication",
      });
    }

    // Extract updateable fields
    const {
      dosage,
      frequency,
      endDate,
      instructions,
      active,
      notes,
      regenerateReminders,
    } = req.body;

    // Update fields
    if (dosage) medication.dosage = dosage;
    if (frequency) medication.frequency = frequency;
    if (endDate !== undefined)
      medication.endDate = endDate ? new Date(endDate) : undefined;
    if (instructions !== undefined) medication.instructions = instructions;
    if (active !== undefined) medication.active = active;
    if (notes !== undefined) medication.notes = notes;

    // Regenerate reminders if requested
    if (
      regenerateReminders === true &&
      frequency !== ReminderFrequency.AS_NEEDED
    ) {
      const startDate =
        new Date() > medication.startDate ? new Date() : medication.startDate;
      const reminderTimes = generateReminderTimes(
        startDate,
        medication.endDate || null,
        medication.frequency
      );

      // Clear old future reminders and add new ones
      medication.reminders = medication.reminders.filter(
        (reminder) => reminder.time.getTime() <= Date.now()
      );

      // Add new reminders
      const newReminders = reminderTimes.map((time) => ({
        time,
        status: ReminderStatus.ACTIVE,
      }));

      medication.reminders.push(...newReminders);

      // Update next reminder
      const futureReminders = medication.reminders
        .filter(
          (r) =>
            r.time.getTime() > Date.now() && r.status === ReminderStatus.ACTIVE
        )
        .sort((a, b) => a.time.getTime() - b.time.getTime());

      if (futureReminders.length > 0) {
        medication.nextReminder = futureReminders[0].time;
      } else {
        medication.nextReminder = undefined;
      }
    }

    // Save updated medication
    await medication.save();

    res.json({
      message: "Medication updated successfully",
      medication,
    });
  } catch (err) {
    console.error("Error updating medication:", err);
    res.status(500).json({
      message: "Error updating medication",
      error: err,
    });
  }
}

// Delete a medication
export async function deleteMedication(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const userId = req.user?.id;
    const userType = req.user?.userType;
    const medicationId = req.params.id;

    // Find the medication
    const medication = await PatientMedication.findById(medicationId);

    if (!medication) {
      return res.status(404).json({
        message: "Medication not found",
      });
    }

    // Check authorization (only patient or admin can delete)
    if (
      userType !== UserType.ADMIN &&
      medication.patient.toString() !== userId
    ) {
      return res.status(403).json({
        message: "Not authorized to delete this medication",
      });
    }

    // Delete the medication
    await PatientMedication.findByIdAndDelete(medicationId);

    res.json({
      message: "Medication deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting medication:", err);
    res.status(500).json({
      message: "Error deleting medication",
      error: err,
    });
  }
}

// Update reminder status
export async function updateReminderStatus(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const userId = req.user?.id;
    const userType = req.user?.userType;
    const { medicationId, reminderId } = req.params;
    const { status, snoozeUntil, notes } = req.body;

    // Find the medication
    const medication = await PatientMedication.findById(medicationId);

    if (!medication) {
      return res.status(404).json({
        message: "Medication not found",
      });
    }

    // Check authorization (only the patient can update their reminders)
    if (medication.patient.toString() !== userId) {
      return res.status(403).json({
        message: "Not authorized to update this reminder",
      });
    }

    // Find the reminder
    const reminder = medication.reminders.find(
      (r) => r._id && r._id.toString() === reminderId
    );

    if (!reminder) {
      return res.status(404).json({
        message: "Reminder not found",
      });
    }

    // Update reminder fields
    if (status) reminder.status = status;
    if (snoozeUntil) reminder.snoozeUntil = new Date(snoozeUntil);
    if (notes !== undefined) reminder.notes = notes;

    // Update the next reminder
    const futureReminders = medication.reminders
      .filter(
        (r) =>
          r.time.getTime() > Date.now() &&
          (r.status === ReminderStatus.ACTIVE ||
            (r.status === ReminderStatus.SNOOZED &&
              r.snoozeUntil &&
              r.snoozeUntil.getTime() <= Date.now()))
      )
      .sort((a, b) => a.time.getTime() - b.time.getTime());

    if (futureReminders.length > 0) {
      medication.nextReminder = futureReminders[0].time;
    } else {
      medication.nextReminder = undefined;
    }

    // Save medication
    await medication.save();

    res.json({
      message: "Reminder updated successfully",
      reminder,
    });
  } catch (err) {
    console.error("Error updating reminder:", err);
    res.status(500).json({
      message: "Error updating reminder",
      error: err,
    });
  }
}

// Get upcoming reminders for a patient
export async function getUpcomingReminders(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const userId = req.user?.id;
    const userType = req.user?.userType;

    // Only patients can view their reminders
    if (userType !== UserType.PATIENT) {
      return res.status(403).json({
        message: "Only patients can view their reminders",
      });
    }

    const { hours = 24 } = req.query;
    const hoursAhead = parseInt(hours as string) || 24;

    // Calculate time range
    const now = new Date();
    const endTime = new Date(now);
    endTime.setHours(now.getHours() + hoursAhead);

    // Find medications with reminders in the time range
    const medications = await PatientMedication.find({
      patient: userId,
      active: true,
      reminders: {
        $elemMatch: {
          time: { $gte: now, $lte: endTime },
          status: ReminderStatus.ACTIVE,
        },
      },
    });

    // Extract relevant reminders
    const upcomingReminders = medications.map((med) => {
      const relevantReminders = med.reminders.filter(
        (r) =>
          r.time >= now &&
          r.time <= endTime &&
          r.status === ReminderStatus.ACTIVE
      );

      return {
        medicationId: med._id,
        brandName: med.brandName,
        genericName: med.genericName,
        dosage: med.dosage,
        instructions: med.instructions,
        reminders: relevantReminders,
      };
    });

    res.json(upcomingReminders);
  } catch (err) {
    console.error("Error getting upcoming reminders:", err);
    res.status(500).json({
      message: "Error retrieving upcoming reminders",
      error: err,
    });
  }
}

// Test endpoint to manually trigger a reminder
export async function triggerTestReminder(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const { medicationId, reminderId } = req.params;
    const userId = req.user?.id;
    const userType = req.user?.userType;

    // Only patients can test their own reminders or admins can test any
    if (userType !== UserType.PATIENT && userType !== UserType.ADMIN) {
      return res.status(403).json({
        message: "Unauthorized to trigger test reminders",
      });
    }

    // For patients, verify it's their medication
    if (userType === UserType.PATIENT) {
      const medication = await PatientMedication.findById(medicationId);
      if (!medication) {
        return res.status(404).json({
          message: "Medication not found",
        });
      }

      if (medication.patient.toString() !== userId) {
        return res.status(403).json({
          message: "Not authorized to test reminders for this medication",
        });
      }
    }

    // Trigger the test reminder
    const result = await triggerReminderForTesting(medicationId, reminderId);

    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error("Error triggering test reminder:", error);
    res.status(500).json({
      success: false,
      message: "Error triggering test reminder",
      error,
    });
  }
}
