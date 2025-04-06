import mongoose, { Document, Model, Schema } from "mongoose";

// Reminder frequency options
export enum ReminderFrequency {
  ONCE = "once",
  DAILY = "daily",
  TWICE_DAILY = "twice_daily",
  THREE_TIMES_DAILY = "three_times_daily",
  FOUR_TIMES_DAILY = "four_times_daily",
  WEEKLY = "weekly",
  MONTHLY = "monthly",
  AS_NEEDED = "as_needed",
}

// Reminder status
export enum ReminderStatus {
  ACTIVE = "active",
  SNOOZED = "snoozed",
  COMPLETED = "completed",
  MISSED = "missed",
}

// Interface for a single medication reminder
export interface IMedicationReminder {
  _id?: mongoose.Types.ObjectId;
  time: Date;
  status: ReminderStatus;
  snoozeUntil?: Date;
  notes?: string;
}

// Medication reminder schema
const MedicationReminderSchema: Schema = new Schema(
  {
    time: { type: Date, required: true },
    status: {
      type: String,
      enum: Object.values(ReminderStatus),
      default: ReminderStatus.ACTIVE,
    },
    snoozeUntil: { type: Date },
    notes: { type: String },
  },
  { timestamps: true }
);

// Interface for patient medication document
export interface IPatientMedication extends Document {
  patient: mongoose.Types.ObjectId;
  drugId: string;
  brandName: string;
  genericName: string;
  dosage: string;
  frequency: ReminderFrequency;
  startDate: Date;
  endDate?: Date;
  instructions: string;
  active: boolean;
  reminders: IMedicationReminder[] & { id?: (id: any) => any };
  nextReminder?: Date;
  notes?: string;
}

// Patient medication schema
const PatientMedicationSchema: Schema = new Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    drugId: { type: String, required: true },
    brandName: { type: String, required: true },
    genericName: { type: String },
    dosage: { type: String, required: true },
    frequency: {
      type: String,
      enum: Object.values(ReminderFrequency),
      required: true,
    },
    startDate: { type: Date, required: true, default: Date.now },
    endDate: { type: Date },
    instructions: { type: String, default: "" },
    active: { type: Boolean, default: true },
    reminders: [MedicationReminderSchema],
    nextReminder: { type: Date },
    notes: { type: String },
  },
  {
    timestamps: true,
  }
);

// Create indexes for faster queries
PatientMedicationSchema.index({ patient: 1 });
PatientMedicationSchema.index({ active: 1, nextReminder: 1 });

// Patient medication model
const PatientMedication: Model<IPatientMedication> =
  mongoose.model<IPatientMedication>(
    "PatientMedication",
    PatientMedicationSchema
  );

export default PatientMedication;
