import mongoose, { Document, Schema } from "mongoose";
import { UserType } from "./User";

// Interface for Chat Message document
export interface IChatMessage extends Document {
  sender: mongoose.Types.ObjectId;
  receiver: mongoose.Types.ObjectId;
  message: string;
  read: boolean;
  createdAt: Date;
}

// Interface for Chat Conversation document
export interface IChatConversation extends Document {
  patient: mongoose.Types.ObjectId;
  pharmacy: mongoose.Types.ObjectId;
  lastMessage: string;
  lastMessageDate: Date;
  unreadPatient: number;
  unreadPharmacy: number;
  messages: mongoose.Types.ObjectId[];
}

// Chat Message schema
const ChatMessageSchema: Schema = new Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

// Chat Conversation schema
const ChatConversationSchema: Schema = new Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    pharmacy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lastMessage: { type: String, default: "" },
    lastMessageDate: { type: Date, default: Date.now },
    unreadPatient: { type: Number, default: 0 },
    unreadPharmacy: { type: Number, default: 0 },
    messages: [{ type: mongoose.Schema.Types.ObjectId, ref: "ChatMessage" }],
  },
  {
    timestamps: true,
  }
);

// Create indexes for faster queries
ChatConversationSchema.index({ patient: 1, pharmacy: 1 }, { unique: true });
ChatConversationSchema.index({ patient: 1 });
ChatConversationSchema.index({ pharmacy: 1 });

// Models
export const ChatMessage = mongoose.model<IChatMessage>(
  "ChatMessage",
  ChatMessageSchema
);
export const ChatConversation = mongoose.model<IChatConversation>(
  "ChatConversation",
  ChatConversationSchema
);
