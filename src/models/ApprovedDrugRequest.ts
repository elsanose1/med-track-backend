import mongoose, { Document, Schema } from "mongoose";

export interface IApprovedDrugRequest extends Document {
  patientID: mongoose.Types.ObjectId; // references User (patient)
  pharmacyID: mongoose.Types.ObjectId; // references User (pharmacy)
  drugID: mongoose.Types.ObjectId; // references Drug (assumed model)
  note?: string;
  price: number;
  status: "preparing" | "out_for_delivery" | "delivered" | "canceled ";
}

const ApprovedDrugRequestSchema: Schema = new Schema(
  {
    patientID: { type: Schema.Types.ObjectId, ref: "User", required: true },
    pharmacyID: { type: Schema.Types.ObjectId, ref: "User", required: true },
    drugID: { type: String, required: true },
    note: { type: String },
    price: { type: Number, required: true },
    status: {
      type: String,
      enum: ["preparing", "out_for_delivery", "delivered", "canceled"],
      default: "preparing",
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IApprovedDrugRequest>(
  "ApprovedDrugRequest",
  ApprovedDrugRequestSchema
);
