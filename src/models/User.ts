import mongoose, { CallbackError, Document, Model, Schema } from "mongoose";
import bcrypt from "bcryptjs";

// Define the user types as an enum
export enum UserType {
  PATIENT = "patient",
  PHARMACY = "pharmacy",
  ADMIN = "admin",
}

// Interface for User document
interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: Date;
  userType: UserType;
  phoneNumber?: string;
  address?: string;
  // Fields specific to different user types
  medicalHistory?: string; // For patients
  allergies?: string[]; // For patients
  licenseNumber?: string; // For pharmacies
  pharmacyName?: string; // For pharmacies
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// User schema
const UserSchema: Schema<IUser> = new Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    dateOfBirth: { type: Date },
    userType: {
      type: String,
      required: true,
      enum: Object.values(UserType),
      default: UserType.PATIENT,
    },
    phoneNumber: { type: String },
    address: { type: String },
    // Fields specific to different user types
    medicalHistory: { type: String },
    allergies: [{ type: String }],
    licenseNumber: { type: String },
    pharmacyName: { type: String },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to hash password
UserSchema.pre<IUser>("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err as CallbackError);
  }
});

// Method to compare passwords
UserSchema.methods.comparePassword = function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// User model
const User: Model<IUser> = mongoose.model<IUser>("User", UserSchema);

export default User;
